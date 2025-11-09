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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    console.warn(
      "⚠️  /api/labs/get is deprecated. Lab reports are now stored in SQL Server via /api/documents/upload"
    );

    // Return 404 - lab reports are now managed through SQL Server
    // TODO: Query from SQL Server LabReport table if needed
    return NextResponse.json({ error: "Report not found. Lab reports are now managed through SQL Server." }, { status: 404 });
  } catch (error) {
    console.error("Get error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get report" },
      { status: 500 }
    );
  }
}
