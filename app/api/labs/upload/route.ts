import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * @deprecated This route is deprecated. Please use /api/documents/upload instead.
 * 
 * The new document upload system:
 * - Stores documents in Pinecone vector database
 * - Stores metadata in SQL Server
 * - Supports lab_report, eob, and plan_document types
 * - Uses the same extraction pipeline
 * 
 * Migration: Change your upload endpoint from /api/labs/upload to /api/documents/upload
 * and include docType="lab_report" in the form data.
 */
export async function POST(request: NextRequest) {
      return NextResponse.json(
    {
      error: "This endpoint is deprecated",
      message: "Please use /api/documents/upload instead. Include docType='lab_report' in your form data.",
      migration: {
        oldEndpoint: "/api/labs/upload",
        newEndpoint: "/api/documents/upload",
        requiredFields: ["file", "userId", "docType", "docId"],
        docType: "lab_report",
      },
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
