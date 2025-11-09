import { NextRequest, NextResponse } from "next/server";
import { getEOBRecordsByUserId } from "@/lib/azure/sql-storage";
import { EOBExtractionResult, CaseData } from "@/lib/types/cases";

export const dynamic = 'force-dynamic'; // Ensure this route is dynamic

/**
 * GET /api/cases?userId=<userId>
 * Get all cases for a user (converted from EOB records)
 */
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

    // Get all EOB records for the user
    const eobRecords = await getEOBRecordsByUserId(userId);

    // Convert EOB records to case format
    const results: EOBExtractionResult[] = eobRecords.map((record) => {
      // Parse JSON strings back to objects
      const services = record.services ? JSON.parse(record.services) : [];
      const coverage_breakdown = record.coverage_breakdown ? JSON.parse(record.coverage_breakdown) : null;
      const alerts = record.alerts ? JSON.parse(record.alerts) : [];
      const discrepancies = record.discrepancies ? JSON.parse(record.discrepancies) : [];

      // Build EOB data object
      const eob_data = {
        member_name: record.member_name,
        member_address: record.member_address || null,
        member_id: record.member_id || null,
        group_number: record.group_number || null,
        claim_number: record.claim_number,
        claim_date: record.claim_date || null,
        provider_name: record.provider_name,
        provider_npi: record.provider_npi || null,
        total_billed: record.total_billed,
        total_benefits_approved: record.total_benefits_approved,
        amount_you_owe: record.amount_you_owe,
        services: services,
        coverage_breakdown: coverage_breakdown,
        insurance_provider: record.insurance_provider || null,
        plan_name: record.plan_name || null,
        policy_number: record.policy_number || null,
        alerts: alerts,
        discrepancies: discrepancies,
        source_document_id: record.source_document_id || null,
        extracted_date: record.extracted_date ? new Date(record.extracted_date).toISOString() : null,
        user_id: record.user_id,
      };

      // Build case data object
      // Determine status based on amount owed and discrepancies
      let status: "Needs Review" | "In Progress" | "Resolved" = "Resolved";
      if (record.amount_you_owe > 0) {
        status = "Needs Review";
      }
      if (discrepancies.length > 0) {
        status = "In Progress";
      }

      // Determine alert
      let alert: string | null = null;
      if (record.amount_you_owe > 1000) {
        alert = "High amount";
      } else if (discrepancies.length > 0) {
        alert = "Discrepancy found";
      } else if (alerts.length > 0) {
        alert = alerts[0];
      }

      // Build title
      const provider_name = record.provider_name || "Weill Cornell Medicine";
      const insurance_provider = record.insurance_provider || "Insurance";
      const title = `${insurance_provider} - EOB for ${provider_name}`;

      // Use claim date or current date
      const claim_date = record.claim_date || new Date().toISOString().split('T')[0];

      const case_data: CaseData = {
        id: `eob-${record.claim_number}`,
        type: "EOB",
        title: title,
        amount: record.amount_you_owe,
        status: status,
        date: claim_date,
        dueDate: null,
        alert: alert,
        provider: provider_name,
        description: `EOB for claim ${record.claim_number}`,
      };

      return {
        eob_data: eob_data,
        case_data: case_data,
        sql_ready: true,
      };
    });

    return NextResponse.json({
      success: true,
      results: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error fetching cases:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch cases" },
      { status: 500 }
    );
  }
}
