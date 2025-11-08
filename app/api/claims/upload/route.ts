import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    const docType = formData.get("docType") as string;
    const docId = formData.get("docId") as string;

    if (!file || !userId || !docType || !docId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Step 1: Extract text from document using Python
    const extractScriptPath = join(process.cwd(), "backend", "scripts", "extract_text.py");
    const fileContentBase64 = buffer.toString("base64");
    
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
    
    // Step 2: Chunk and store in Pinecone
    const scriptPath = join(process.cwd(), "backend", "scripts", "upload_document.py");
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

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Upload failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      docId,
      message: "Document uploaded successfully",
      ...result.data,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

