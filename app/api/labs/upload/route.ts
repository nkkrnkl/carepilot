import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Lab processing can take longer due to LLM extraction

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string || "default-user";
    const docId = formData.get("docId") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate docId if not provided
    const finalDocId = docId || `lab-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, PNG, and JPG are allowed." },
        { status: 415 }
      );
    }

    // Limit file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 413 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Step 1: Extract text from document using Python
    const extractScriptPath = join(process.cwd(), "backend", "scripts", "extract_text.py");
    const fileContentBase64 = buffer.toString("base64");
    
    console.log("[lab-upload] Extracting text from document...");
    const extractionResult = await executePython(extractScriptPath, {
      fileContent: fileContentBase64,
      fileName: file.name,
      fileType: file.type,
    });
    
    if (!extractionResult.success || !extractionResult.data?.text) {
      return NextResponse.json(
        { 
          error: extractionResult.error || "Failed to extract text from document",
          details: extractionResult.data 
        },
        { status: 500 }
      );
    }
    
    const extractedText = extractionResult.data.text;
    console.log(`[lab-upload] Extracted ${extractedText.length} characters`);
    
    // Step 2: Process lab report (extract structured data and store in Pinecone)
    const processScriptPath = join(process.cwd(), "backend", "scripts", "process_lab_report.py");
    console.log("[lab-upload] Processing lab report and storing in Pinecone...");
    
    const result = await executePython(processScriptPath, {
      userId,
      docId: finalDocId,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Lab report processing failed" },
        { status: 500 }
      );
    }

    console.log(`[lab-upload] Successfully processed lab report: ${result.data?.resultsCount || 0} results`);

    return NextResponse.json({
      success: true,
      docId: finalDocId,
      message: result.data?.message || "Lab report uploaded successfully",
      resultsCount: result.data?.resultsCount || 0,
      reportMeta: result.data?.reportMeta,
      ...result.data,
    });
  } catch (error) {
    console.error("[lab-upload] Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

