import { LabRow } from "@/components/labs/LabCards";

/**
 * Mock lab data for specific PDF files
 */

// Complete Blood Count (CBC) data for mock_lab_01_CBC.pdf
export const MOCK_CBC_DATA: LabRow[] = [
  { name: "White Blood Cell Count", value: 7.2, unit: "K/µL", refLow: 4.5, refHigh: 11.0 },
  { name: "Red Blood Cell Count", value: 4.8, unit: "M/µL", refLow: 4.2, refHigh: 5.4 },
  { name: "Hemoglobin", value: 14.2, unit: "g/dL", refLow: 12.0, refHigh: 17.5 },
  { name: "Hematocrit", value: 42.5, unit: "%", refLow: 36.0, refHigh: 52.0 },
  { name: "Mean Corpuscular Volume", value: 88, unit: "fL", refLow: 80, refHigh: 100 },
  { name: "Mean Corpuscular Hemoglobin", value: 29.5, unit: "pg", refLow: 27, refHigh: 31 },
  { name: "Mean Corpuscular Hemoglobin Concentration", value: 33.4, unit: "g/dL", refLow: 32, refHigh: 36 },
  { name: "Platelet Count", value: 285, unit: "K/µL", refLow: 150, refHigh: 450 },
  { name: "Neutrophils", value: 58, unit: "%", refLow: 40, refHigh: 70 },
  { name: "Lymphocytes", value: 32, unit: "%", refLow: 20, refHigh: 40 },
  { name: "Monocytes", value: 6, unit: "%", refLow: 2, refHigh: 8 },
  { name: "Eosinophils", value: 3, unit: "%", refLow: 1, refHigh: 4 },
  { name: "Basophils", value: 1, unit: "%", refLow: 0, refHigh: 2 },
  { name: "Glucose", value: 100, unit: "mg/dL", refLow: 70, refHigh: 99 },
  { name: "Hemoglobin A1c", value: 5.5, unit: "%", refLow: 4.5, refHigh: 5.5 },
];

// Comprehensive Metabolic Panel (CMP) data for mock_lab_03_CMP.pdf
export const MOCK_CMP_DATA: LabRow[] = [
  { name: "Sodium", value: 139, unit: "mmol/L", refLow: 135, refHigh: 145 },
  { name: "Potassium", value: 4.1, unit: "mmol/L", refLow: 3.5, refHigh: 5.1 },
  { name: "Chloride", value: 103, unit: "mmol/L", refLow: 98, refHigh: 107 },
  { name: "CO2 (Bicarbonate)", value: 25, unit: "mmol/L", refLow: 22, refHigh: 29 },
  { name: "Creatinine", value: 0.9, unit: "mg/dL", refLow: 0.6, refHigh: 1.3 },
  { name: "BUN", value: 14, unit: "mg/dL", refLow: 7, refHigh: 20 },
  { name: "Glucose", value: 92, unit: "mg/dL", refLow: 70, refHigh: 99, note: "fasting" },
  { name: "Calcium", value: 9.3, unit: "mg/dL", refLow: 8.5, refHigh: 10.5 },
];

/**
 * Get mock data based on filename
 */
export function getMockLabData(filename: string): LabRow[] | null {
  const lowerFilename = filename.toLowerCase();
  
  if (lowerFilename.includes("mock_lab_01_cbc") || lowerFilename.includes("cbc")) {
    return MOCK_CBC_DATA;
  }
  
  if (lowerFilename.includes("mock_lab_03_cmp") || lowerFilename.includes("cmp")) {
    return MOCK_CMP_DATA;
  }
  
  return null;
}

