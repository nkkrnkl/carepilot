/**
 * Service layer for Case Management feature
 * 
 * This service layer abstracts API calls and can be easily updated
 * to use SQL Server directly when ready.
 */

import { CasesResponse, EOBExtractionResult, CaseData } from "@/lib/types/cases";

/**
 * Fetch all cases for a user
 * Returns cases as CaseData[] for easy use in components
 */
export async function getCases(userId: string = "user-123"): Promise<CaseData[]> {
  try {
    const response = await fetch(`/api/cases?userId=${encodeURIComponent(userId)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cases: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle new API format: { success: true, results: [...], count: number }
    if (data.success && data.results && Array.isArray(data.results)) {
      return data.results.map((result: EOBExtractionResult) => result.case_data);
    }
    
    // Fallback: handle old format: { total_documents: number, results: [...] }
    if (data.results && Array.isArray(data.results)) {
      return data.results.map((result: any) => result.case_data);
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching cases:", error);
    // Return empty array on error
    return [];
  }
}

/**
 * Fetch EOB data for a specific document or claim
 * First tries to get from SQL Server, falls back to extraction if not found
 */
export async function getEOBData(
  documentIdOrClaimNumber: string,
  userId: string,
  docType: string = "eob"
): Promise<EOBExtractionResult | null> {
  try {
    // First, try to get from SQL Server by document ID
    let response = await fetch(`/api/eob?userId=${encodeURIComponent(userId)}&documentId=${encodeURIComponent(documentIdOrClaimNumber)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // If not found by document ID, try by claim number
    if (!response.ok || response.status === 404) {
      response = await fetch(`/api/eob?userId=${encodeURIComponent(userId)}&claimNumber=${encodeURIComponent(documentIdOrClaimNumber)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.eobRecord) {
        // Convert EOB record to EOBExtractionResult format
        const eobRecord = data.eobRecord;
        
        // Build case data
        let status: "Needs Review" | "In Progress" | "Resolved" = "Resolved";
        if (eobRecord.amount_you_owe > 0) {
          status = "Needs Review";
        }
        if (eobRecord.discrepancies && eobRecord.discrepancies.length > 0) {
          status = "In Progress";
        }

        let alert: string | null = null;
        if (eobRecord.amount_you_owe > 1000) {
          alert = "High amount";
        } else if (eobRecord.discrepancies && eobRecord.discrepancies.length > 0) {
          alert = "Discrepancy found";
        } else if (eobRecord.alerts && eobRecord.alerts.length > 0) {
          alert = eobRecord.alerts[0];
        }

        const provider_name = eobRecord.provider_name || "Weill Cornell Medicine";
        const insurance_provider = eobRecord.insurance_provider || "Insurance";
        const title = `${insurance_provider} - EOB for ${provider_name}`;
        const claim_date = eobRecord.claim_date || new Date().toISOString().split('T')[0];

        const case_data: CaseData = {
          id: `eob-${eobRecord.claim_number}`,
          type: "EOB",
          title: title,
          amount: eobRecord.amount_you_owe,
          status: status,
          date: claim_date,
          dueDate: null,
          alert: alert,
          provider: provider_name,
          description: `EOB for claim ${eobRecord.claim_number}`,
        };

        return {
          eob_data: {
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
            services: eobRecord.services || [],
            coverage_breakdown: eobRecord.coverage_breakdown || null,
            insurance_provider: eobRecord.insurance_provider || null,
            plan_name: eobRecord.plan_name || null,
            policy_number: eobRecord.policy_number || null,
            alerts: eobRecord.alerts || [],
            discrepancies: eobRecord.discrepancies || [],
            source_document_id: eobRecord.source_document_id || null,
            extracted_date: eobRecord.extracted_date ? new Date(eobRecord.extracted_date).toISOString() : null,
            user_id: eobRecord.user_id,
          },
          case_data: case_data,
          sql_ready: true,
        };
      }
    }

    // Fallback: If not found in SQL, try to extract (for backward compatibility)
    // This would trigger the extraction agent if the EOB wasn't stored yet
    console.warn("EOB record not found in SQL, attempting extraction...");
    const extractResponse = await fetch("/api/eob/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        documentId: documentIdOrClaimNumber,
        docType,
      }),
    });

    if (!extractResponse.ok) {
      throw new Error(`Failed to fetch EOB data: ${extractResponse.statusText}`);
    }

    const extractData = await extractResponse.json();
    if (!extractData.success) {
      throw new Error(extractData.error || "Failed to extract EOB data");
    }

    return {
      eob_data: extractData.eobData,
      case_data: extractData.caseData,
      sql_ready: extractData.sqlReady,
    };
  } catch (error) {
    console.error("Error fetching EOB data:", error);
    return null;
  }
}

