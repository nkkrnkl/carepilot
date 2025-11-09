import { NextRequest, NextResponse } from "next/server";
import { getLabReportsByUserId } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic'; // Ensure this route is dynamic

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    const labReports = await getLabReportsByUserId(userId);

    // Parse JSON strings back to objects for easier consumption
    const parsedReports = labReports.map((report) => ({
      ...report,
      rawExtract: report.rawExtract ? JSON.parse(report.rawExtract) : null,
      parameters: report.parameters ? JSON.parse(report.parameters) : null,
    }));

    return NextResponse.json({
      success: true,
      reports: parsedReports,
      count: parsedReports.length,
    });
  } catch (error) {
    console.error("Error fetching lab reports:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch lab reports" },
      { status: 500 }
    );
  }
}
