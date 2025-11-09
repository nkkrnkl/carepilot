/**
 * Lab Reports API Route
 * 
 * Safely retrieves lab reports with parameter data from SQL database
 * for display in dashboard cards.
 */

import { NextRequest, NextResponse } from "next/server";
import { listLabReportsByUser, getLabReportById as getLabReportFromDB, LabReportEntity } from "@/lib/azure/sql-storage";

export const dynamic = "force-dynamic";

/**
 * GET /api/labs/reports
 * List all lab reports for a user
 * 
 * Query params:
 * - userId: User ID (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const id = searchParams.get("id");

    // If ID is provided, return single report
    if (id) {
      return getLabReportById(request);
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      );
    }

    // Get lab reports from SQL database
    const reports = await listLabReportsByUser(userId);

    // Parse JSON fields and format for frontend
    const formattedReports = reports.map((report) => {
      let parameters: any[] = [];
      try {
        if (report.parameters) {
          parameters = JSON.parse(report.parameters);
        }
      } catch (e) {
        console.error("Error parsing parameters JSON:", e);
      }

      return {
        id: report.id,
        title: report.title,
        date: report.date,
        hospital: report.hospital,
        doctor: report.doctor,
        fileUrl: report.fileUrl,
        parameters: parameters.reduce((acc, param) => {
          // Convert array to object keyed by parameter name for dashboard cards
          acc[param.name] = {
            value: param.value,
            unit: param.unit,
            referenceRange: param.referenceRange,
            flag: param.flag,
          };
          return acc;
        }, {} as Record<string, { value: string | number; unit?: string | null; referenceRange?: string | null; flag?: string | null }>),
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      count: formattedReports.length,
    });
  } catch (error) {
    console.error("Error listing lab reports:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list lab reports",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/labs/reports?id=...
 * Get a single lab report by ID
 * 
 * Query params:
 * - id: Report ID (required)
 * - userId: User ID (required for authorization)
 */
async function getLabReportById(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    const report = await getLabReportFromDB(id);

    if (!report) {
      return NextResponse.json(
        { error: "Lab report not found" },
        { status: 404 }
      );
    }

    // Verify user owns this report (security check)
    if (userId && report.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: You don't have access to this report" },
        { status: 403 }
      );
    }

    // Parse parameters JSON
    let parameters: any[] = [];
    try {
      if (report.parameters) {
        parameters = JSON.parse(report.parameters);
      }
    } catch (e) {
      console.error("Error parsing parameters JSON:", e);
    }

    // Format for dashboard cards
    const formattedReport = {
      id: report.id,
      title: report.title,
      date: report.date,
      hospital: report.hospital,
      doctor: report.doctor,
      fileUrl: report.fileUrl,
      parameters: parameters.reduce((acc, param) => {
        acc[param.name] = {
          value: param.value,
          unit: param.unit,
          referenceRange: param.referenceRange,
          flag: param.flag,
        };
        return acc;
      }, {} as Record<string, { value: string | number; unit?: string | null; referenceRange?: string | null; flag?: string | null }>),
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };

    return NextResponse.json({
      success: true,
      report: formattedReport,
    });
  } catch (error) {
    console.error("Error getting lab report:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get lab report",
      },
      { status: 500 }
    );
  }
}

