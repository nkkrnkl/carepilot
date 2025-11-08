/**
 * API Route for user documents
 * GET /api/users/documents?userId=... - Get all documents for a user
 * POST /api/users/documents - Create a new document
 * DELETE /api/users/documents?userId=...&documentId=... - Delete a document
 */

import { NextResponse } from "next/server";
import {
  createDocument,
  getUserDocuments,
  deleteDocument,
  type DocumentEntity,
} from "@/lib/azure/table-storage";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const documents = await getUserDocuments(userId);
    return NextResponse.json({ success: true, documents, count: documents.length });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const documentData = await request.json();

    // Validate required fields
    if (!documentData.user_id || !documentData.doc_type || !documentData.doc_name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: user_id, doc_type, doc_name" },
        { status: 400 }
      );
    }

    await createDocument(documentData as Omit<DocumentEntity, "partitionKey" | "rowKey" | "timestamp">);
    return NextResponse.json({ success: true, message: "Document created successfully" });
  } catch (error: any) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const documentId = searchParams.get("documentId");

    if (!userId || !documentId) {
      return NextResponse.json(
        { success: false, error: "userId and documentId are required" },
        { status: 400 }
      );
    }

    await deleteDocument(userId, documentId);
    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete document" },
      { status: 500 }
    );
  }
}

