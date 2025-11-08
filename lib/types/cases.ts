/**
 * Type definitions for Case Management feature
 */

export interface ServiceDetail {
  service_description: string;
  service_date: string; // YYYY-MM-DD format
  amount_billed: number;
  not_covered: number;
  covered: number;
  cpt_code?: string | null;
  icd10_code?: string | null;
}

export interface CoverageBreakdown {
  total_billed: number;
  total_not_covered: number;
  total_covered_before_deductions: number;
  total_coinsurance: number;
  total_deductions: number;
  total_benefits_approved: number;
  amount_you_owe: number;
  notes?: string | null;
}

export interface EOBInfo {
  // Required fields
  member_name: string;
  claim_number: string;
  provider_name: string;
  total_billed: number;
  total_benefits_approved: number;
  amount_you_owe: number;
  
  // Optional fields
  member_address?: string | null;
  member_id?: string | null;
  group_number?: string | null;
  claim_date?: string | null; // YYYY-MM-DD format
  provider_npi?: string | null;
  
  // Service Details
  services: ServiceDetail[];
  
  // Coverage Breakdown
  coverage_breakdown?: CoverageBreakdown | null;
  
  // Additional Information
  insurance_provider?: string | null;
  plan_name?: string | null;
  policy_number?: string | null;
  
  // Alerts and Flags
  alerts?: string[];
  discrepancies?: string[];
  
  // Metadata
  extracted_date?: string | null;
  source_document_id?: string | null;
  user_id?: string | null;
}

export interface CaseData {
  id: string;
  type: "EOB" | "Bill" | "Claim";
  status: "Needs Review" | "In Progress" | "Resolved";
  title: string;
  date: string;
  amount: number;
  provider: string | null;
  insurance?: string;
  description?: string;
  alert?: string | null;
  dueDate?: string | null;
  claim_number?: string;
  total_billed?: number;
  total_benefits_approved?: number;
  services_count?: number;
  member_name?: string;
  group_number?: string | null;
  member_id?: string | null;
}

export interface EOBExtractionResult {
  eob_data: EOBInfo;
  case_data: CaseData;
  sql_ready?: any;
}

export interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
}

export interface AuditTrailEntry {
  date: string;
  action: string;
  user: string;
  details?: string;
}

export interface CasesResponse {
  total_documents: number;
  results: Array<{
    document_id: string;
    eob_data: EOBInfo;
    case_data: CaseData;
  }>;
}

