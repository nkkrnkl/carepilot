import { NextRequest, NextResponse } from "next/server";
import { getLabReportById } from "@/lib/azure/sql-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    const report = await getLabReportById(id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Optionally verify userId matches (for security)
    if (userId && report.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Parse JSON strings back to objects
    const parsedReport = {
      ...report,
      rawExtract: report.rawExtract ? JSON.parse(report.rawExtract) : null,
      parameters: report.parameters ? JSON.parse(report.parameters) : null,
    };

    return NextResponse.json({
      success: true,
      report: parsedReport,
    });
  } catch (error) {
    console.error("Get error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to get report" },
      { status: 500 }
    );
  }
}
