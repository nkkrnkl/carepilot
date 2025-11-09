import { NextRequest, NextResponse } from "next/server";
import { extractLabDataFromImage, extractLabDataFromText } from "@/lib/openai";
import { LabExtract } from "@/lib/schemas";
import { normalizeLabExtract } from "@/lib/normalize";
import { prisma } from "@/lib/prisma";
import { executePython } from "@/lib/python-bridge";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { convertPdfToImages } from "@/lib/pdf-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = (formData.get("userId") as string) || "demo-user";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, PNG, and JPG are allowed." },
        { status: 415 }
      );
    }

    // Limit file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 413 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Handle PDFs - convert to images (for fallback OpenAI Vision)
    // Note: Lab Agent will handle PDFs directly, but we keep this for fallback
    let imageBuffer: Buffer;
    let mimeType: string;
    let rawExtract: any = null;
    let extract: any = null;
    let normalized: any = null;

    // Prepare fallback extraction (only if lab agent fails)
    if (file.type === "application/pdf") {
      try {
        const pdfImages = await convertPdfToImages(buffer);
        if (pdfImages.length > 0) {
          imageBuffer = pdfImages[0];
          mimeType = "image/png";
        } else {
          imageBuffer = buffer;
          mimeType = file.type;
        }
      } catch (error) {
        console.warn("PDF conversion error (will use lab agent):", error);
        imageBuffer = buffer;
        mimeType = file.type;
      }
    } else {
      imageBuffer = buffer;
      mimeType = file.type;
    }

    // Step 5: Save file first (required for lab agent)
    let fileUrl: string | null = null;
    let savedFilePath: string | null = null;
    try {
      const uploadsDir = join(process.cwd(), "uploads", userId);
      await mkdir(uploadsDir, { recursive: true });
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = join(uploadsDir, fileName);
      await writeFile(filePath, buffer);
      fileUrl = `/uploads/${userId}/${fileName}`;
      savedFilePath = filePath; // Store absolute path for lab agent
    } catch (error) {
      console.warn("Failed to save file:", error);
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 }
      );
    }

    // Step 6: Process with Azure Computer Vision for text extraction (PRIMARY METHOD)
    let azureVisionResult: any = null;
    let useAzureVision = false;
    let extractedText = "";
    let azureVisionError: string | null = null;

    try {
      console.log("🔵 Starting Azure Computer Vision analysis...");
      
      // For PDFs, use the converted image; for images, use the original file
      let imagePathForAnalysis = savedFilePath;
      if (file.type === "application/pdf" && imageBuffer) {
        // Save the converted PDF image for Azure Vision analysis
        const uploadsDir = join(process.cwd(), "uploads", userId);
        await mkdir(uploadsDir, { recursive: true });
        const imageFileName = `${Date.now()}-${file.name.replace('.pdf', '.png')}`;
        const imageFilePath = join(uploadsDir, imageFileName);
        await writeFile(imageFilePath, imageBuffer);
        imagePathForAnalysis = imageFilePath;
        console.log(`📄 Converted PDF to image: ${imageFilePath}`);
      }

      // Use Azure Computer Vision to extract text
      const azureVisionScriptPath = join(process.cwd(), "backend", "scripts", "analyze_lab_with_azure_vision.py");
      console.log(`🔵 Calling Azure Vision script: ${azureVisionScriptPath}`);
      console.log(`🔵 Image path: ${imagePathForAnalysis}`);
      
      azureVisionResult = await executePython(azureVisionScriptPath, {
        image_path: imagePathForAnalysis,
      });

      console.log("🔵 Azure Vision result:", JSON.stringify(azureVisionResult, null, 2));

      if (azureVisionResult.success) {
        if (azureVisionResult.data?.extracted_text) {
          extractedText = azureVisionResult.data.extracted_text;
          if (extractedText.trim().length > 0) {
            useAzureVision = true;
            console.log("✅ Azure Computer Vision extracted text successfully");
            console.log(`✅ Extracted ${extractedText.length} characters`);
          } else {
            azureVisionError = "Azure Vision returned empty text";
            console.warn("⚠️ Azure Computer Vision returned empty text");
          }
        } else {
          azureVisionError = "Azure Vision did not return extracted_text in response";
          console.warn("⚠️ Azure Computer Vision response missing extracted_text:", azureVisionResult.data);
        }
      } else {
        azureVisionError = azureVisionResult.error || "Azure Vision script failed";
        console.error("❌ Azure Computer Vision failed:", azureVisionError);
        console.error("❌ Full error details:", azureVisionResult);
      }
    } catch (error) {
      azureVisionError = error instanceof Error ? error.message : String(error);
      console.error("❌ Azure Computer Vision exception:", azureVisionError);
      console.error("❌ Full error:", error);
      // Log the full stack trace if available
      if (error instanceof Error && error.stack) {
        console.error("❌ Stack trace:", error.stack);
      }
    }
    
    // Log Azure Vision status
    if (!useAzureVision) {
      console.error("❌ Azure Vision was not used. Error:", azureVisionError || "Unknown error");
      console.error("❌ Azure Vision result:", JSON.stringify(azureVisionResult, null, 2));
    }

    // Step 7: Initialize variables for agent results
    let agentResult: any = null;
    let useAgentResults = false;

    // Step 8: Process Azure Vision extracted text (PRIMARY PATH)
    if (useAzureVision && extractedText) {
      console.log("🔵 Processing Azure Vision extracted text with OpenAI...");
      try {
        // Parse the extracted text using OpenAI
        rawExtract = await extractLabDataFromText(extractedText);
        
        // Validate with Zod
        const parseResult = LabExtract.safeParse(rawExtract);
        if (parseResult.success) {
          extract = parseResult.data;
          normalized = normalizeLabExtract(extract);
          console.log("✅ Successfully parsed Azure Vision extracted text");
        } else {
          console.error("❌ Validation error:", parseResult.error);
          // Continue to fallback, but log that we had Azure Vision text
          console.warn("⚠️ Azure Vision text extracted but parsing failed, trying fallback...");
        }
      } catch (error) {
        console.error("❌ OpenAI text parsing error:", error);
        console.warn("⚠️ Azure Vision text extracted but OpenAI parsing failed, trying fallback...");
        // Continue to fallback
      }
    }

    // Step 9: Try Lab Agent if Azure Vision didn't work or parsing failed
    if (!normalized && !useAgentResults) {
      console.log("🔵 Trying Lab Agent as fallback...");
      try {
        const agentScriptPath = join(process.cwd(), "backend", "scripts", "process_lab_with_agent.py");
        const fileType = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
        const tempDocId = `lab-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        
        agentResult = await executePython(agentScriptPath, {
          userId,
          filePath: savedFilePath,
          fileType: fileType,
          docId: tempDocId,
        });

        if (agentResult.success && agentResult.data?.workflow_completed) {
          useAgentResults = true;
          console.log("✅ Lab agent processed successfully");
        } else {
          console.warn("⚠️ Lab agent failed:", agentResult.error);
        }
      } catch (error) {
        console.error("❌ Lab agent error:", error);
      }
    }

    // Step 10: Fallback to OpenAI Vision if Azure Vision and Lab Agent failed
    if (!useAgentResults && !normalized) {
      console.log("🔵 Trying OpenAI Vision as final fallback...");
      console.log("🔵 Azure Vision status:", useAzureVision ? "SUCCESS" : `FAILED - ${azureVisionError || "Unknown"}`);
      console.log("🔵 Lab Agent status:", useAgentResults ? "SUCCESS" : "FAILED");
      
      try {
        // Extract data using OpenAI Vision (fallback)
        rawExtract = await extractLabDataFromImage(imageBuffer, mimeType);
        
        // Validate with Zod
        const parseResult = LabExtract.safeParse(rawExtract);
        if (parseResult.success) {
          extract = parseResult.data;
          normalized = normalizeLabExtract(extract);
          console.log("✅ OpenAI Vision fallback succeeded");
        } else {
          console.error("❌ Validation error:", parseResult.error);
          throw new Error("Failed to validate extracted data");
        }
      } catch (error) {
        console.error("❌ OpenAI Vision extraction error:", error);
        // Build detailed error message with all failure reasons
        let errorMessage = "Couldn't parse this file. ";
        const errors: string[] = [];
        
        // Azure Vision error details
        if (azureVisionError) {
          errors.push(`Azure Vision: ${azureVisionError}`);
        } else if (!useAzureVision && azureVisionResult) {
          errors.push(`Azure Vision: ${azureVisionResult.error || "Failed silently"}`);
        } else if (!useAzureVision) {
          errors.push("Azure Vision: Not attempted or failed to initialize");
        }
        
        // Lab Agent error
        errors.push("Lab Agent: Failed");
        
        // OpenAI Vision error
        const openAIError = error instanceof Error ? error.message : String(error);
        errors.push(`OpenAI Vision: ${openAIError}`);
        
        errorMessage += errors.join("; ");
        
        console.error("❌ FINAL ERROR - All methods failed:");
        console.error("   " + errorMessage);
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: {
              azureVision: {
                attempted: true,
                success: useAzureVision,
                error: azureVisionError || azureVisionResult?.error || "Unknown",
                extractedTextLength: extractedText?.length || 0
              },
              labAgent: {
                attempted: true,
                success: useAgentResults,
                error: agentResult?.error || "Failed"
              },
              openAIVision: {
                attempted: true,
                success: false,
                error: openAIError
              }
            }
          },
          { status: 500 }
        );
      }
    }

    // Step 11: Use agent results OR parsed results
    let finalParameters: any[];
    let finalMetadata: { title?: string; date?: string; hospital?: string; doctor?: string };
    let pineconeSuccess = false;

    if (useAgentResults && agentResult?.data) {
      // Use Lab Agent results
      const agentData = agentResult.data;
      finalParameters = agentData.parameters || [];
      finalMetadata = agentData.lab_metadata || {};
      pineconeSuccess = agentData.pinecone_stored || false;
      
      console.log(`Lab agent extracted ${finalParameters.length} parameters`);
    } else if (normalized) {
      // Use parsed results (from Azure Vision + OpenAI or OpenAI Vision)
      finalParameters = normalized.parameters;
      finalMetadata = {
        title: normalized.title,
        date: normalized.date,
        hospital: normalized.hospital,
        doctor: normalized.doctor,
      };
      
      // Save to Pinecone using upload_lab_report.py
      try {
        const scriptPath = join(process.cwd(), "backend", "scripts", "upload_lab_report.py");
        const pineconeResult = await executePython(scriptPath, {
          userId,
          docId: `temp-${Date.now()}`, // Temporary ID, will be replaced
          title: normalized.title || "Lab Report",
          date: normalized.date || new Date().toISOString().split("T")[0],
          hospital: normalized.hospital,
          doctor: normalized.doctor,
          parameters: normalized.parameters,
          fileName: file.name,
          fileSize: file.size,
        });

        if (pineconeResult.success) {
          pineconeSuccess = true;
        }
      } catch (error) {
        console.error("Pinecone save failed:", error);
      }
    } else {
      // This should not happen, but handle it gracefully
      return NextResponse.json(
        { error: "Failed to extract lab data from file" },
        { status: 500 }
      );
    }

    // Step 12: Parse date for database
    let reportDate: Date;
    const dateStr = finalMetadata.date;
    if (dateStr) {
      try {
        reportDate = new Date(dateStr);
        if (isNaN(reportDate.getTime())) {
          reportDate = new Date();
        }
      } catch {
        reportDate = new Date();
      }
    } else {
      reportDate = new Date();
    }

    // Step 13: Create title
    const title = finalMetadata.title || `${finalMetadata.hospital || "Lab Report"} — ${reportDate.toLocaleDateString()}`;

    // Step 14: Prepare raw extract for database
    let rawExtractForDb: any;
    if (useAgentResults && agentResult?.data) {
      rawExtractForDb = agentResult.data;
    } else if (useAzureVision && azureVisionResult?.data) {
      // Include both Azure Vision results and parsed data
      rawExtractForDb = {
        azure_vision: azureVisionResult.data,
        parsed: rawExtract,
      };
    } else {
      rawExtractForDb = rawExtract;
    }

    // Step 15: Save to database
    const report = await prisma.labReport.create({
      data: {
        userId,
        title,
        date: reportDate,
        hospital: finalMetadata.hospital || null,
        doctor: finalMetadata.doctor || null,
        fileUrl,
        rawExtract: JSON.stringify(rawExtractForDb),
        parameters: JSON.stringify(
          finalParameters.reduce((acc, param: any) => {
            acc[param.name] = {
              value: param.value,
              unit: param.unit || null,
              referenceRange: param.referenceRange || null,
            };
            return acc;
          }, {} as Record<string, any>)
        ),
      },
    });

    // Step 16: If agent was used, note that Pinecone was already saved
    if (useAgentResults && agentResult?.data) {
      // The agent already saved to Pinecone with its docId
      // The database record has its own ID, which is fine - they don't need to match
      pineconeSuccess = agentResult.data.pinecone_stored || true;
      console.log(`Lab agent saved to Pinecone with docId: ${agentResult.data.docId}`);
    }

    return NextResponse.json({
      id: report.id,
      userId: report.userId,
      title: report.title,
      date: report.date.toISOString(),
      hospital: report.hospital,
      doctor: report.doctor,
      parameters: JSON.parse(report.parameters),
      pineconeSaved: pineconeSuccess,
    });
  } catch (error) {
    console.error("❌ Upload error (top level catch):", error);
    console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    // If this is an unexpected error, provide detailed information
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      { 
        error: `Upload failed: ${errorMessage}`,
        hint: "Check server logs for detailed error information. Azure Vision should be attempted first."
      },
      { status: 500 }
    );
  }
}
