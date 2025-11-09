import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @deprecated This route is deprecated. Lab reports are now managed through
 * the document upload system (/api/documents/upload) which stores data in
 * SQL Server and Pinecone. Please update your code to use the new system.
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "demo-user";

    console.warn(
      "⚠️  /api/labs/clear is deprecated. Lab reports are now stored in SQL Server via /api/documents/upload"
    );

    // Return success but no-op - lab reports are now managed through SQL Server
    // TODO: Delete from SQL Server LabReport table if needed
    return NextResponse.json({
      success: true,
      deletedCount: 0,
      message: "Lab reports are now managed through SQL Server. This endpoint is deprecated.",
    });
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clear reports" },
      { status: 500 }
    );
  }
}

// Also support POST for convenience
export async function POST(request: NextRequest) {
  return DELETE(request);
}
