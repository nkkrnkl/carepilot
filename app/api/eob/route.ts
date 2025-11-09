import { NextRequest, NextResponse } from "next/server";
import { getEOBRecordsByUserId, getEOBRecordByDocumentId, getEOBRecordByClaimNumber } from "@/lib/azure/sql-storage";

export const dynamic = 'force-dynamic'; // Ensure this route is dynamic

/**
 * GET /api/eob?userId=<userId>&documentId=<documentId>
 * Get EOB record by document ID or claim number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const documentId = searchParams.get("documentId");
    const claimNumber = searchParams.get("claimNumber");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    let eobRecord = null;

    if (documentId) {
      // Get by document ID
      eobRecord = await getEOBRecordByDocumentId(documentId, userId);
    } else if (claimNumber) {
      // Get by claim number
      eobRecord = await getEOBRecordByClaimNumber(claimNumber, userId);
    } else {
      // Get all EOB records for user
      const records = await getEOBRecordsByUserId(userId);
      
      // Parse JSON strings back to objects
      const parsedRecords = records.map((record) => ({
        ...record,
        services: record.services ? JSON.parse(record.services) : [],
        coverage_breakdown: record.coverage_breakdown ? JSON.parse(record.coverage_breakdown) : null,
        alerts: record.alerts ? JSON.parse(record.alerts) : [],
        discrepancies: record.discrepancies ? JSON.parse(record.discrepancies) : [],
      }));

      return NextResponse.json({
        success: true,
        records: parsedRecords,
        count: parsedRecords.length,
      });
    }

    if (!eobRecord) {
      return NextResponse.json(
        { success: false, error: "EOB record not found" },
        { status: 404 }
      );
    }

    // Parse JSON strings back to objects
    const parsedRecord = {
      ...eobRecord,
      services: eobRecord.services ? JSON.parse(eobRecord.services) : [],
      coverage_breakdown: eobRecord.coverage_breakdown ? JSON.parse(eobRecord.coverage_breakdown) : null,
      alerts: eobRecord.alerts ? JSON.parse(eobRecord.alerts) : [],
      discrepancies: eobRecord.discrepancies ? JSON.parse(eobRecord.discrepancies) : [],
    };

    return NextResponse.json({
      success: true,
      eobRecord: parsedRecord,
    });
  } catch (error) {
    console.error("Error fetching EOB record:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch EOB record" },
      { status: 500 }
    );
  }
}

