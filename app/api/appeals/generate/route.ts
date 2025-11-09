import { NextRequest, NextResponse } from "next/server";
import { executePython } from "@/lib/python-bridge";
import { join } from "path";
import { getEOBRecordByClaimNumber, getEOBRecordByDocumentId } from "@/lib/azure/sql-storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { eob_data, discrepancy_types, additional_context, case_id, userId, claimNumber, documentId } = body;

    // If eob_data is not provided, try to fetch from SQL Server
    if (!eob_data) {
      if (!userId) {
        return NextResponse.json(
          { error: "Either eob_data or userId (with claimNumber or documentId) is required" },
          { status: 400 }
        );
      }

      console.log("EOB data not provided, fetching from SQL Server...");
      let eobRecord = null;

      if (claimNumber) {
        // Fetch by claim number
        eobRecord = await getEOBRecordByClaimNumber(claimNumber, userId);
      } else if (documentId) {
        // Fetch by document ID
        eobRecord = await getEOBRecordByDocumentId(documentId, userId);
      } else if (case_id) {
        // Extract claim number from case_id (format: "eob-{claim_number}")
        const extractedClaimNumber = case_id.replace("eob-", "");
        eobRecord = await getEOBRecordByClaimNumber(extractedClaimNumber, userId);
      }

      if (!eobRecord) {
        return NextResponse.json(
          { error: "EOB record not found. Please ensure the EOB document has been processed and uploaded." },
          { status: 404 }
        );
      }

      // Convert EOB record to eob_data format
      eob_data = {
        member_name: eobRecord.member_name,
        member_address: eobRecord.member_address || null,
        member_id: eobRecord.member_id || null,
        group_number: eobRecord.group_number || null,
        claim_number: eobRecord.claim_number,
        claim_date: eobRecord.claim_date || null,
        provider_name: eobRecord.provider_name,
        provider_npi: eobRecord.provider_npi || null,
        total_billed: eobRecord.total_billed,
        total_benefits_approved: eobRecord.total_benefits_approved,
        amount_you_owe: eobRecord.amount_you_owe,
        services: eobRecord.services ? JSON.parse(eobRecord.services) : [],
        coverage_breakdown: eobRecord.coverage_breakdown ? JSON.parse(eobRecord.coverage_breakdown) : null,
        insurance_provider: eobRecord.insurance_provider || null,
        plan_name: eobRecord.plan_name || null,
        policy_number: eobRecord.policy_number || null,
        alerts: eobRecord.alerts ? JSON.parse(eobRecord.alerts) : [],
        discrepancies: eobRecord.discrepancies ? JSON.parse(eobRecord.discrepancies) : [],
        source_document_id: eobRecord.source_document_id || null,
        extracted_date: eobRecord.extracted_date ? new Date(eobRecord.extracted_date).toISOString() : null,
        user_id: eobRecord.user_id,
      };

      console.log("EOB data fetched from SQL Server:", {
        claim_number: eob_data.claim_number,
        discrepancies_count: eob_data.discrepancies?.length || 0,
        services_count: eob_data.services?.length || 0,
      });
    }

    // Note: discrepancy_types should be categorized types (e.g., "Duplicate Charges", "Amount Discrepancy")
    // The raw discrepancy messages are already in eob_data.discrepancies
    // If discrepancy_types is not provided, the appeal agent will automatically categorize them
    // So we don't need to pass raw discrepancies as discrepancy_types
    
    // Only use provided discrepancy_types if they are already categorized types
    // Otherwise, let the agent categorize from eob_data.discrepancies
    if (discrepancy_types && Array.isArray(discrepancy_types)) {
      // Check if these look like raw discrepancy messages (long strings) or categorized types (short labels)
      const areCategorizedTypes = discrepancy_types.every(
        (dt: string) => dt.length < 100 && 
        (dt.includes("Charge") || dt.includes("Discrepancy") || dt.includes("Issue") || 
         dt.includes("Denial") || dt.includes("Underpayment") || dt.includes("High Amount"))
      );
      
      if (!areCategorizedTypes) {
        // These are raw discrepancy messages, not categorized types
        // Let the agent categorize them instead
        console.log("Discrepancy types appear to be raw messages, letting agent categorize them");
        discrepancy_types = null;
      }
    }

    // Validate that we have EOB data
    if (!eob_data) {
      return NextResponse.json(
        { error: "eob_data is required" },
        { status: 400 }
      );
    }

    // Ensure discrepancies are included in the data
    if (!eob_data.discrepancies || eob_data.discrepancies.length === 0) {
      console.warn("Warning: No discrepancies found in EOB data. Appeal email will be generated without specific discrepancies.");
    }

    console.log("Generating appeal email with:", {
      claim_number: eob_data.claim_number,
      discrepancy_types: discrepancy_types || [],
      has_discrepancies: eob_data.discrepancies?.length > 0,
    });

    // Generate appeal email using Python script
    const scriptPath = join(process.cwd(), "backend", "scripts", "generate_appeal.py");
    const result = await executePython(scriptPath, {
      eob_data,
      discrepancy_types: discrepancy_types || eob_data.discrepancies || [],
      additional_context: additional_context || null,
    });

    if (!result.success) {
      console.error("Appeal generation failed:", result.error);
      return NextResponse.json(
        { error: result.error || "Failed to generate appeal email" },
        { status: 500 }
      );
    }

    if (!result.data?.appeal_email) {
      console.error("No appeal email in result:", result);
      return NextResponse.json(
        { error: "Failed to generate appeal email: No email data returned" },
        { status: 500 }
      );
    }

    console.log("Appeal email generated successfully");

    return NextResponse.json({
      success: true,
      appeal_email: result.data.appeal_email,
      case_id: case_id,
    });
  } catch (error) {
    console.error("Appeal generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate appeal" },
      { status: 500 }
    );
  }
}

