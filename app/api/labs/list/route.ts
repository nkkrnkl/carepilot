import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @deprecated This route is deprecated. Lab reports are now managed through
 * the document upload system (/api/documents/upload) which stores data in
 * SQL Server and Pinecone. Please update your code to use the new system.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "demo-user";

    // Return empty array - lab reports are now managed through SQL Server
    // TODO: Query from SQL Server LabReport table if needed
    console.warn(
      "⚠️  /api/labs/list is deprecated. Lab reports are now stored in SQL Server via /api/documents/upload"
    );

    return NextResponse.json([]);
  } catch (error) {
    console.error("List error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list reports" },
      { status: 500 }
    );
  }
}
