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
    
    const extractionResult = await executePython(extractScriptPath, {
      fileContent: fileContentBase64,
      fileName: file.name,
      fileType: file.type || "application/pdf",
    });
    
    if (!extractionResult.success) {
      console.error("Text extraction failed:", extractionResult.error);
      console.error("Extraction details:", extractionResult.data);
      return NextResponse.json(
        { 
          error: extractionResult.error || "Failed to extract text from PDF",
          details: extractionResult.data,
          message: "Please ensure the PDF file is valid and not corrupted."
        },
        { status: 500 }
      );
    }
    
    if (!extractionResult.data?.text) {
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
    
    // Step 2: Chunk, embed, and store in Pinecone
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
        { error: result.error || "Failed to upload document to vector store" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      docId,
      message: result.data?.message || "Document uploaded and stored successfully",
      chunkCount: result.data?.chunkCount || 1,
      vectorIds: result.data?.vectorIds || [],
      ...result.data,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}

