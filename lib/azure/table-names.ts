/**
 * Table Name Detection Utility
 * Automatically detects which table names to use (original or _v2)
 */

import { getConnectionPool } from './sql-storage';

// Cache for table names (detected once per session)
let tableNamesCache: {
  labReport?: string;
  insuranceBenefits?: string;
  eobRecords?: string;
} | null = null;

/**
 * Detect which table names exist in the database
 * Returns object with table names to use
 */
export async function detectTableNames(): Promise<{
  labReport: string;
  insuranceBenefits: string;
  eobRecords: string;
}> {
  // Return cached result if available
  if (tableNamesCache) {
    return tableNamesCache;
  }

  const pool = await getConnectionPool();
  const request = pool.request();

  // Check which tables exist
  const labReportQuery = await request.query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME IN ('LabReport', 'LabReport_v2')
    AND TABLE_TYPE = 'BASE TABLE'
  `);

  const benefitsQuery = await request.query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME IN ('insurance_benefits', 'insurance_benefits_v2')
    AND TABLE_TYPE = 'BASE TABLE'
  `);

  const eobQuery = await request.query(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_NAME IN ('eob_records', 'eob_records_v2')
    AND TABLE_TYPE = 'BASE TABLE'
  `);

  // Determine table names (prefer _v2 if exists, otherwise use original)
  // Always prefer _v2 for new installations
  const labReportTable = 
    labReportQuery.recordset.find((r: any) => r.TABLE_NAME === 'LabReport_v2')?.TABLE_NAME ||
    labReportQuery.recordset.find((r: any) => r.TABLE_NAME === 'LabReport')?.TABLE_NAME ||
    'LabReport_v2'; // Default to _v2 for new installations

  const benefitsTable = 
    benefitsQuery.recordset.find((r: any) => r.TABLE_NAME === 'insurance_benefits_v2')?.TABLE_NAME ||
    benefitsQuery.recordset.find((r: any) => r.TABLE_NAME === 'insurance_benefits')?.TABLE_NAME ||
    'insurance_benefits_v2'; // Default to _v2 for new installations

  const eobTable = 
    eobQuery.recordset.find((r: any) => r.TABLE_NAME === 'eob_records_v2')?.TABLE_NAME ||
    eobQuery.recordset.find((r: any) => r.TABLE_NAME === 'eob_records')?.TABLE_NAME ||
    'eob_records_v2'; // Default to _v2 for new installations

  tableNamesCache = {
    labReport: labReportTable,
    insuranceBenefits: benefitsTable,
    eobRecords: eobTable,
  };

  return tableNamesCache;
}

/**
 * Get table name for lab reports
 */
export async function getLabReportTableName(): Promise<string> {
  const names = await detectTableNames();
  return names.labReport;
}

/**
 * Get table name for insurance benefits
 */
export async function getInsuranceBenefitsTableName(): Promise<string> {
  const names = await detectTableNames();
  return names.insuranceBenefits;
}

/**
 * Get table name for EOB records
 */
export async function getEOBRecordsTableName(): Promise<string> {
  const names = await detectTableNames();
  return names.eobRecords;
}

/**
 * Clear table names cache (useful for testing or after schema changes)
 */
export function clearTableNamesCache(): void {
  tableNamesCache = null;
}

