import { NextRequest, NextResponse } from "next/server";
import { ocrRead } from "@/lib/azure/documentIntelligence";
import { toLabReport } from "@/lib/labs/normalize";
import { buildLabsChunks } from "@/lib/labs/chunk";
import { embedTexts } from "@/lib/labs/embed";
import { upsertLabsVectors } from "@/lib/labs/pinecone";
import { getLabsStorage } from "@/lib/labs/storage";

/**
 * Labs Ingest API Route
 * 
 * Azure OCR → ETL → Pinecone pipeline.
 * Mirrors the exact schema and chunking from claims.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string || "demo-user";

    if (!file) {
      return NextResponse.json(
        { error: "Missing required field: file" },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Detect content type
    const contentType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "image/png");

    // Step 1: OCR using Azure Document Intelligence
    const ocrResult = await ocrRead(buffer, contentType);

    // Step 2: Normalize OCR to LabReport
    const report = toLabReport(ocrResult);
    report.userId = userId;

    // Step 3: Build chunks (mirrors claims: 1000/200/sentence)
    const { chunks } = buildLabsChunks(report, 1000, 200);

    // Step 4: Generate embeddings (same as claims)
    const chunkTexts = chunks.map((c) => c.text);
    const embeddings = await embedTexts(chunkTexts);

    // Step 5: Build Pinecone vectors with exact claims metadata schema
    const vectors = chunks.map((chunk, idx) => ({
      chunk,
      embedding: embeddings[idx],
      userId,
      docId: report.id,
      fileName: file.name,
      fileSize: file.size,
      hospital: report.hospital || undefined,
      doctor: report.doctor || undefined,
      date: report.date || undefined,
    }));

    // Step 6: Upsert to Pinecone (private namespace, same as claims)
    const vectorIds = await upsertLabsVectors(vectors);

    // Step 7: Save to structured storage
    const storage = getLabsStorage();
    await storage.saveReport(userId, report);

    return NextResponse.json({
      success: true,
      docId: report.id,
      vectorCount: vectorIds.length,
      vectorIds,
      report,
    });
  } catch (error) {
    console.error("Labs ingest error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Upload failed",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

