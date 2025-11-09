import { NextRequest, NextResponse } from "next/server";
import { getLabsStorage } from "@/lib/labs/storage";

/**
 * Get single lab report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId") || "demo-user";
    const id = params.id;

    const storage = getLabsStorage();
    const report = await storage.getReport(userId, id);

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Get report error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get report" },
      { status: 500 }
    );
  }
}

