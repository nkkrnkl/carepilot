import { NextRequest, NextResponse } from "next/server";
import { extractLabDataFromImage } from "@/lib/openai";
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

    // Step 6: Process with Lab Agent (LangGraph-based)
    let agentResult: any = null;
    let useAgentResults = false;
    
    try {
      const agentScriptPath = join(process.cwd(), "backend", "scripts", "process_lab_with_agent.py");
      const fileType = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1]; // "png" or "jpg"
      
      // Generate a docId that will match the database record ID
      // We'll use a pattern that matches Prisma's cuid format
      const tempDocId = `lab-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      agentResult = await executePython(agentScriptPath, {
        userId,
        filePath: savedFilePath, // Absolute path to saved file
        fileType: fileType,
        docId: tempDocId, // Pass a docId that we'll update later with the actual DB ID
      });

      if (agentResult.success && agentResult.data?.workflow_completed) {
        useAgentResults = true;
        console.log("Lab agent processed successfully:", agentResult.data);
      } else {
        console.warn("Lab agent failed, falling back to OpenAI Vision:", agentResult.error);
        // Fall through to use OpenAI Vision results
      }
    } catch (error) {
      console.error("Lab agent error:", error);
      // Fall through to use OpenAI Vision results
    }

    // Step 7: Fallback to OpenAI Vision if agent failed
    if (!useAgentResults) {
      try {
        // Extract data using OpenAI Vision (fallback)
        rawExtract = await extractLabDataFromImage(imageBuffer, mimeType);
        
        // Validate with Zod
        const parseResult = LabExtract.safeParse(rawExtract);
        if (parseResult.success) {
          extract = parseResult.data;
          normalized = normalizeLabExtract(extract);
        } else {
          console.error("Validation error:", parseResult.error);
          throw new Error("Failed to validate extracted data");
        }
      } catch (error) {
        console.error("OpenAI extraction error:", error);
        return NextResponse.json(
          { error: "Couldn't parse this file. Both lab agent and OpenAI Vision failed." },
          { status: 500 }
        );
      }
    }

    // Step 8: Use agent results OR OpenAI Vision results
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
    } else {
      // Fallback to OpenAI Vision results
      finalParameters = normalized.parameters;
      finalMetadata = {
        title: normalized.title,
        date: normalized.date,
        hospital: normalized.hospital,
        doctor: normalized.doctor,
      };
      
      // Save to Pinecone using upload_lab_report.py (fallback)
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
    }

    // Step 9: Parse date for database
    let reportDate: Date;
    const dateStr = finalMetadata.date || (normalized?.date);
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

    // Step 10: Create title
    const title = finalMetadata.title || normalized?.title || `${finalMetadata.hospital || normalized?.hospital || "Lab Report"} — ${reportDate.toLocaleDateString()}`;

    // Step 11: Save to database
    const report = await prisma.labReport.create({
      data: {
        userId,
        title,
        date: reportDate,
        hospital: finalMetadata.hospital || normalized?.hospital || null,
        doctor: finalMetadata.doctor || normalized?.doctor || null,
        fileUrl,
        rawExtract: JSON.stringify(useAgentResults ? agentResult.data : rawExtract),
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

    // Step 12: If agent was used, note that Pinecone was already saved
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
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
