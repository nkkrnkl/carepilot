/**
 * API Route for user documents
 * Documents are now stored in the user table as a JSON field
 * GET /api/users/documents?userId=... - Get all documents for a user
 * POST /api/users/documents - Add a document to a user
 * DELETE /api/users/documents?userId=...&documentIndex=... - Remove a document from a user
 */

import { NextResponse } from "next/server";
import {
  getUserByEmail,
  updateUser,
  type Document,
} from "@/lib/azure/sql-storage";

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

    const user = await getUserByEmail(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Parse documents from JSON string
    const documents: Document[] = user.documents ? JSON.parse(user.documents) : [];
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
    if (!documentData.userId || !documentData.doc_type || !documentData.doc_name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: userId, doc_type, doc_name" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(documentData.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get existing documents
    const documents: Document[] = user.documents ? JSON.parse(user.documents) : [];
    
    // Add new document
    const newDocument: Document = {
      doc_type: documentData.doc_type,
      doc_name: documentData.doc_name,
      doc_url: documentData.doc_url,
      doc_size: documentData.doc_size,
      uploaded_at: new Date().toISOString(),
    };
    documents.push(newDocument);

    // Update user with new documents
    await updateUser(documentData.userId, {
      documents: JSON.stringify(documents),
    });

    return NextResponse.json({ success: true, message: "Document added successfully", document: newDocument });
  } catch (error: any) {
    console.error("Error adding document:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const documentIndex = searchParams.get("documentIndex");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get existing documents
    const documents: Document[] = user.documents ? JSON.parse(user.documents) : [];
    
    // Remove document by index
    if (documentIndex !== null) {
      const index = parseInt(documentIndex);
      if (isNaN(index) || index < 0 || index >= documents.length) {
        return NextResponse.json(
          { success: false, error: "Invalid document index" },
          { status: 400 }
        );
      }
      documents.splice(index, 1);
    } else {
      // If no index provided, remove all documents
      documents.length = 0;
    }

    // Update user with updated documents
    await updateUser(userId, {
      documents: JSON.stringify(documents),
    });

    return NextResponse.json({ success: true, message: "Document removed successfully" });
  } catch (error: any) {
    console.error("Error removing document:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove document" },
      { status: 500 }
    );
  }
}
