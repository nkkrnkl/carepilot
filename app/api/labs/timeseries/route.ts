import { NextRequest, NextResponse } from "next/server";
import { getLabsStorage } from "@/lib/labs/storage";

/**
 * Labs Time Series API Route
 * 
 * Returns time series data for a specific parameter across all lab reports.
 * Aggregates from structured storage, sorts by date, skips non-numeric values.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parameterName = searchParams.get("name");
    const userId = searchParams.get("userId") || "demo-user";

    if (!parameterName) {
      return NextResponse.json(
        { error: "Missing required parameter 'name'" },
        { status: 400 }
      );
    }

    const storage = getLabsStorage();
    const reports = await storage.listReports(userId);

    // Extract time series for the parameter
    const timeseries: Array<{
      date: string;
      value: number | string;
      unit?: string | null;
      docId: string;
    }> = [];

    for (const report of reports) {
      if (!report.date) continue;

      const param = report.parameters.find(
        (p) => p.name.toLowerCase() === parameterName.toLowerCase()
      );

      if (!param) continue;

      // Skip non-numeric values
      if (typeof param.value === "string") {
        const numValue = parseFloat(param.value);
        if (isNaN(numValue)) continue;
      }

      timeseries.push({
        date: report.date,
        value: param.value,
        unit: param.unit || null,
        docId: report.id,
      });
    }

    // Sort by date (ascending)
    timeseries.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });

    return NextResponse.json({
      success: true,
      parameterName,
      timeseries,
      userId,
    });
  } catch (error) {
    console.error("Labs timeseries error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get time series" },
      { status: 500 }
    );
  }
}

