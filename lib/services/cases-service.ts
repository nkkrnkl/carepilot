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

    const data: CasesResponse = await response.json();
    // Extract case_data from results
    return data.results.map(result => result.case_data);
  } catch (error) {
    console.error("Error fetching cases:", error);
    // Return empty array on error
    return [];
  }
}

/**
 * Fetch EOB data for a specific document
 */
export async function getEOBData(
  documentId: string,
  userId: string = "user-123"
): Promise<EOBExtractionResult | null> {
  try {
    const response = await fetch("/api/eob/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        documentId,
        docType: "eob",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch EOB data: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to extract EOB data");
    }

    return {
      eob_data: data.eobData,
      case_data: data.caseData,
      sql_ready: data.sqlReady,
    };
  } catch (error) {
    console.error("Error fetching EOB data:", error);
    return null;
  }
}
