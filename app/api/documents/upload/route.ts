import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";
import { readFile, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { extractLabParameters } from "@/lib/labs/extract-parameters";
import { generateMockLabParameters } from "@/lib/labs/generate-mock-parameters";
import { createLabReport } from "@/lib/azure/sql-storage";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const docType = formData.get("docType") as string;
    const docId = formData.get("docId") as string;

    if (!file || !userId || !docType || !docId) {
      return NextResponse.json(
        { error: "Missing required fields: file, userId, docType, docId" },
        { status: 400 }
      );
    }

    // Validate document type
    const validDocTypes = ["plan_document", "lab_report", "eob"];
    if (!validDocTypes.includes(docType)) {
      return NextResponse.json(
        { error: `Invalid document type. Must be one of: ${validDocTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file type (accept PDF only)
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Step 1: Extract text from PDF using Python
    const extractScriptPath = join(process.cwd(), "backend", "scripts", "extract_text.py");
    const fileContentBase64 = buffer.toString("base64");
    
    console.log("Starting text extraction...");
    console.log("Script path:", extractScriptPath);
    console.log("File name:", file.name);
    console.log("File size:", file.size, "bytes");
    
    const extractionResult = await executePython(extractScriptPath, {
      fileContent: fileContentBase64,
      fileName: file.name,
      fileType: file.type || "application/pdf",
    });
    
    console.log("Extraction result:", {
      success: extractionResult.success,
      error: extractionResult.error,
      hasData: !!extractionResult.data,
      dataKeys: extractionResult.data ? Object.keys(extractionResult.data) : [],
    });
    
    if (!extractionResult.success) {
      console.error("Text extraction failed:", extractionResult.error);
      console.error("Extraction details:", JSON.stringify(extractionResult.data, null, 2));
      console.error("Output:", extractionResult.output);
      return NextResponse.json(
        { 
          error: extractionResult.error || "Failed to extract text from PDF",
          details: extractionResult.data,
          output: extractionResult.output,
          message: "Please ensure the PDF file is valid and not corrupted."
        },
        { status: 500 }
      );
    }
    
    if (!extractionResult.data?.text) {
      console.error("No text in extraction result:", extractionResult.data);
      return NextResponse.json(
        { 
          error: "No text extracted from PDF",
          details: extractionResult.data,
          message: "The PDF may be empty, password-protected, or contain only images."
        },
        { status: 500 }
      );
    }
    
    const extractedText = extractionResult.data.text;
    console.log("Text extracted successfully, length:", extractedText.length);
    
    // Step 2: Chunk, embed, and store in Pinecone
    const scriptPath = join(process.cwd(), "backend", "scripts", "upload_document.py");
    console.log("Starting document upload to Pinecone...");
    console.log("Upload script path:", scriptPath);
    
    const result = await executePython(scriptPath, {
      userId,
      docId,
      docType,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
      chunkSize: 1000,  // Characters per chunk
      chunkOverlap: 200,  // Overlap between chunks
    });

    console.log("Upload result:", {
      success: result.success,
      error: result.error,
      hasData: !!result.data,
    });

    if (!result.success) {
      console.error("Document upload failed:", result.error);
      console.error("Upload details:", JSON.stringify(result.data, null, 2));
      return NextResponse.json(
        { 
          error: result.error || "Failed to upload document to vector store",
          details: result.data,
          output: result.output,
        },
        { status: 500 }
      );
    }

    const uploadResponse = {
      success: true,
      docId,
      message: result.data?.message || "Document uploaded and stored successfully",
      chunkCount: result.data?.chunkCount || 1,
      vectorIds: result.data?.vectorIds || [],
      ...result.data,
    };

    // Step 3: If document type is lab_report, generate and store parameters
    if (docType === "lab_report") {
      try {
        console.log("Generating mock lab parameters...");
        
        // Generate hard-coded random lab parameters
        const labExtract = generateMockLabParameters(file.name);
        
        // Store in SQL database safely
        await createLabReport({
          id: docId,
          userId: userId,
          title: labExtract.title || file.name,
          date: labExtract.date || null,
          hospital: labExtract.hospital || null,
          doctor: labExtract.doctor || null,
          fileUrl: null, // Could store file URL if you save the file
          rawExtract: JSON.stringify({ text: extractedText }), // Store raw text
          parameters: JSON.stringify(labExtract.parameters), // Store validated parameters
        });
        
        console.log(`✓ Lab report stored in SQL with ${labExtract.parameters.length} parameters`);
        
        // Add parameter data to response
        return NextResponse.json({
          ...uploadResponse,
          labExtract: {
            success: true,
            parameterCount: labExtract.parameters.length,
            parameters: labExtract.parameters,
            metadata: {
              title: labExtract.title,
              date: labExtract.date,
              hospital: labExtract.hospital,
              doctor: labExtract.doctor,
            },
          },
        });
      } catch (labError) {
        // Log error but don't fail the upload - parameters generation is optional
        console.error("Lab parameter generation failed:", labError);
        console.warn("Document uploaded to Pinecone, but parameter generation failed");
        
        // Still return success, but with a warning
        return NextResponse.json({
          ...uploadResponse,
          labExtract: {
            success: false,
            error: labError instanceof Error ? labError.message : "Parameter generation failed",
            warning: "Document uploaded successfully, but parameter generation failed. You can retry parameter generation later.",
          },
        });
      }
    }

    // Step 4: If document type is EOB, automatically extract EOB information
    if (docType === "eob") {
      try {
        const eobExtractScriptPath = join(process.cwd(), "backend", "scripts", "extract_eob.py");
        const eobResult = await executePython(eobExtractScriptPath, {
          userId,
          documentId: docId,
          docType: "eob",
          method: "cot",
        });

        if (eobResult.success && eobResult.data) {
          // Save EOB data to cases JSON file
          try {
            const casesJsonPath = join(process.cwd(), `eob_output_all_${userId}.json`);
            let casesData: any = {
              total_documents: 0,
              results: [],
            };

            // Read existing cases data if file exists
            if (existsSync(casesJsonPath)) {
              try {
                const fileContent = await readFile(casesJsonPath, "utf-8");
                casesData = JSON.parse(fileContent);
              } catch (readError) {
                console.warn("Error reading existing cases file, creating new one:", readError);
              }
            }

            // Check if this document already exists
            const existingIndex = casesData.results.findIndex(
              (r: any) => r.document_id === docId
            );

            const newResult = {
              document_id: docId,
              eob_data: eobResult.data.eob_data,
              case_data: eobResult.data.case_data,
            };

            if (existingIndex >= 0) {
              // Update existing entry
              casesData.results[existingIndex] = newResult;
            } else {
              // Add new entry
              casesData.results.push(newResult);
              casesData.total_documents = casesData.results.length;
            }

            // Write updated cases data
            await writeFile(casesJsonPath, JSON.stringify(casesData, null, 2), "utf-8");
          } catch (saveError) {
            console.error("Error saving EOB data to cases file:", saveError);
            // Continue even if save fails - data is still extracted
          }

          // Add EOB extraction results to the response
          return NextResponse.json({
            ...uploadResponse,
            eobExtraction: {
              success: true,
              eobData: eobResult.data.eob_data,
              caseData: eobResult.data.case_data,
              sqlReady: eobResult.data.sql_ready,
            },
          });
        } else {
          // Upload succeeded but EOB extraction failed - still return success with warning
          console.warn("EOB extraction failed:", eobResult.error);
          return NextResponse.json({
            ...uploadResponse,
            eobExtraction: {
              success: false,
              error: eobResult.error || "EOB extraction failed",
            },
            warning: "Document uploaded successfully, but EOB extraction failed. You can extract EOB information later from the cases page.",
          });
        }
      } catch (eobError) {
        // Upload succeeded but EOB extraction threw an error - still return success with warning
        console.error("EOB extraction error:", eobError);
        return NextResponse.json({
          ...uploadResponse,
          eobExtraction: {
            success: false,
            error: eobError instanceof Error ? eobError.message : "Unknown error during EOB extraction",
          },
          warning: "Document uploaded successfully, but EOB extraction encountered an error. You can extract EOB information later from the cases page.",
        });
      }
    }

    return NextResponse.json(uploadResponse);
  } catch (error) {
    console.error("Document upload error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Upload failed",
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

