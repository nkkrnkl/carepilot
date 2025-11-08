/**
 * Migration Helper Script for CarePilot Database
 * 
 * This script helps migrate data from JSON format to SQL Server tables
 * for insurance_benefits and eob_records tables.
 */

import {
  upsertInsuranceBenefits,
  upsertEOBRecord,
  InsuranceBenefitsEntity,
  EOBRecordEntity
} from '@/lib/azure/sql-storage';

/**
 * Convert benefits JSON data to InsuranceBenefitsEntity
 */
export function convertBenefitsToEntity(
  benefitsData: any,
  userId: string,
  precheckcoverId: string
): Omit<InsuranceBenefitsEntity, 'id' | 'created_at' | 'updated_at'> {
  const benefits = benefitsData.benefits || benefitsData;
  
  return {
    precheckcover_id: precheckcoverId,
    user_id: userId,
    plan_name: benefits.plan_name || 'Unknown Plan',
    plan_type: benefits.plan_type || undefined,
    insurance_provider: benefits.insurance_provider || undefined,
    policy_number: benefits.policy_number || undefined,
    group_number: benefits.group_number || undefined,
    effective_date: benefits.effective_date || undefined,
    expiration_date: benefits.expiration_date || undefined,
    deductibles: JSON.stringify(benefits.deductibles || []),
    copays: JSON.stringify(benefits.copays || []),
    coinsurance: JSON.stringify(benefits.coinsurance || []),
    coverage_limits: JSON.stringify(benefits.coverage_limits || []),
    services: JSON.stringify(benefits.services || []),
    out_of_pocket_max_individual: benefits.out_of_pocket_max_individual || undefined,
    out_of_pocket_max_family: benefits.out_of_pocket_max_family || undefined,
    in_network_providers: benefits.in_network_providers || undefined,
    out_of_network_coverage: benefits.out_of_network_coverage || false,
    network_notes: benefits.network_notes || undefined,
    preauth_required_services: JSON.stringify(benefits.preauth_required_services || []),
    preauth_notes: benefits.preauth_notes || undefined,
    exclusions: JSON.stringify(benefits.exclusions || []),
    exclusion_notes: benefits.exclusion_notes || undefined,
    special_programs: JSON.stringify(benefits.special_programs || []),
    additional_benefits: benefits.additional_benefits || undefined,
    notes: benefits.notes || undefined,
    extracted_date: benefits.extracted_date ? new Date(benefits.extracted_date) : undefined,
    source_document_id: benefits.source_document_id || undefined
  };
}

/**
 * Convert EOB JSON data to EOBRecordEntity
 */
export function convertEOBToEntity(
  eobData: any,
  userId: string
): Omit<EOBRecordEntity, 'id' | 'created_at' | 'updated_at'> {
  const eob = eobData.eob_data || eobData;
  
  return {
    user_id: userId,
    claim_number: eob.claim_number || 'UNKNOWN',
    member_name: eob.member_name || 'Unknown',
    member_address: eob.member_address || undefined,
    member_id: eob.member_id || undefined,
    group_number: eob.group_number || undefined,
    claim_date: eob.claim_date || eob.claimDate || undefined,
    provider_name: eob.provider_name || 'Unknown Provider',
    provider_npi: eob.provider_npi || undefined,
    total_billed: eob.total_billed || 0,
    total_benefits_approved: eob.total_benefits_approved || 0,
    amount_you_owe: eob.amount_you_owe || 0,
    services: JSON.stringify(eob.services || []),
    coverage_breakdown: eob.coverage_breakdown ? JSON.stringify(eob.coverage_breakdown) : undefined,
    insurance_provider: eob.insurance_provider || undefined,
    plan_name: eob.plan_name || undefined,
    policy_number: eob.policy_number || undefined,
    alerts: JSON.stringify(eob.alerts || []),
    discrepancies: JSON.stringify(eob.discrepancies || []),
    source_document_id: eob.source_document_id || undefined,
    extracted_date: eob.extracted_date ? new Date(eob.extracted_date) : undefined
  };
}

/**
 * Migrate benefits data from JSON file to SQL Server
 */
export async function migrateBenefitsFromJSON(
  jsonData: any,
  userId: string
): Promise<number[]> {
  const results: number[] = [];
  
  if (jsonData.results && Array.isArray(jsonData.results)) {
    for (const result of jsonData.results) {
      const documentId = result.document_id || result.source_document_id;
      const precheckcoverId = documentId || `precheck-${Date.now()}-${Math.random()}`;
      
      const entity = convertBenefitsToEntity(result, userId, precheckcoverId);
      const id = await upsertInsuranceBenefits(entity);
      results.push(id);
    }
  } else if (jsonData.benefits) {
    // Single benefits object
    const documentId = jsonData.document_id || jsonData.source_document_id;
    const precheckcoverId = documentId || `precheck-${Date.now()}-${Math.random()}`;
    
    const entity = convertBenefitsToEntity(jsonData, userId, precheckcoverId);
    const id = await upsertInsuranceBenefits(entity);
    results.push(id);
  }
  
  return results;
}

/**
 * Migrate EOB data from JSON file to SQL Server
 */
export async function migrateEOBFromJSON(
  jsonData: any,
  userId: string
): Promise<number[]> {
  const results: number[] = [];
  
  if (jsonData.results && Array.isArray(jsonData.results)) {
    for (const result of jsonData.results) {
      const entity = convertEOBToEntity(result, userId);
      const id = await upsertEOBRecord(entity);
      results.push(id);
    }
  } else if (jsonData.eob_data) {
    // Single EOB object
    const entity = convertEOBToEntity(jsonData, userId);
    const id = await upsertEOBRecord(entity);
    results.push(id);
  }
  
  return results;
}

/**
 * Example usage for migrating benefits data
 */
export async function exampleMigrateBenefits() {
  const userId = 'user-123';
  const jsonData = {
    total_documents: 1,
    results: [{
      document_id: '1762615226647-0.5416249649679099',
      benefits: {
        plan_name: 'Cornell University Student Health Plan (SHP)',
        plan_type: 'PPO',
        insurance_provider: 'Aetna',
        policy_number: '500499-912071-9006387',
        // ... other fields
      }
    }]
  };
  
  const ids = await migrateBenefitsFromJSON(jsonData, userId);
  console.log('Migrated benefits with IDs:', ids);
}

/**
 * Example usage for migrating EOB data
 */
export async function exampleMigrateEOB() {
  const userId = 'user-123';
  const jsonData = {
    total_documents: 2,
    results: [{
      document_id: '1762627976358-0.6153854378421392',
      eob_data: {
        claim_number: 'CLM3750131',
        member_name: 'IAN FOSTER',
        // ... other fields
      }
    }]
  };
  
  const ids = await migrateEOBFromJSON(jsonData, userId);
  console.log('Migrated EOB records with IDs:', ids);
}

