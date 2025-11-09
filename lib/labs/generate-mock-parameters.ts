/**
 * Generate Mock Lab Parameters
 * 
 * Hard-coded function to generate random lab parameter values for testing.
 * Generates realistic values for common lab tests with appropriate reference ranges.
 */

import { LabExtract, LabParameter } from "./extract-parameters";

/**
 * Generate a random number between min and max
 */
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random value that may be normal, low, or high
 * @param normalMin - Minimum of normal range
 * @param normalMax - Maximum of normal range
 * @param unit - Unit of measurement
 * @param name - Parameter name
 * @returns LabParameter with random value
 */
function generateParameter(
  name: string,
  normalMin: number,
  normalMax: number,
  unit: string,
  lowChance: number = 0.2,
  highChance: number = 0.2
): LabParameter {
  const rand = Math.random();
  let value: number;
  let flag: "N" | "L" | "H" | null = null;

  if (rand < lowChance) {
    // Generate low value (below normal range)
    value = randomBetween(normalMin * 0.5, normalMin * 0.95);
    flag = "L";
  } else if (rand < lowChance + highChance) {
    // Generate high value (above normal range)
    value = randomBetween(normalMax * 1.05, normalMax * 1.5);
    flag = "H";
  } else {
    // Generate normal value
    value = randomBetween(normalMin, normalMax);
    flag = "N";
  }

  // Round to appropriate decimal places
  const decimals = value < 1 ? 2 : value < 10 ? 1 : 0;
  value = Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

  return {
    name,
    value,
    unit,
    referenceRange: `${normalMin}-${normalMax}`,
    flag,
  };
}

/**
 * Generate mock lab parameters for common tests
 */
export function generateMockLabParameters(fileName: string): LabExtract {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

  // Generate random parameters for common lab tests
  const parameters: LabParameter[] = [
    // Blood Count
    generateParameter("Hemoglobin", 12.0, 17.5, "g/dL", 0.15, 0.15),
    generateParameter("Hematocrit", 36.0, 52.0, "%", 0.15, 0.15),
    generateParameter("White Blood Cell Count", 4.5, 11.0, "K/µL", 0.1, 0.2),
    generateParameter("Platelet Count", 150, 450, "K/µL", 0.1, 0.15),

    // Metabolic Panel
    generateParameter("Glucose", 70, 100, "mg/dL", 0.1, 0.25),
    generateParameter("A1C", 4.0, 5.6, "%", 0.1, 0.3),
    generateParameter("Total Cholesterol", 125, 200, "mg/dL", 0.1, 0.3),
    generateParameter("LDL", 0, 100, "mg/dL", 0.1, 0.35),
    generateParameter("HDL", 40, 60, "mg/dL", 0.2, 0.15),
    generateParameter("Triglycerides", 0, 150, "mg/dL", 0.1, 0.3),

    // Liver Function
    generateParameter("ALT", 7, 56, "U/L", 0.1, 0.25),
    generateParameter("AST", 10, 40, "U/L", 0.1, 0.25),
    generateParameter("Alkaline Phosphatase", 44, 147, "U/L", 0.1, 0.2),
    generateParameter("Total Bilirubin", 0.1, 1.2, "mg/dL", 0.1, 0.2),

    // Kidney Function
    generateParameter("Creatinine", 0.6, 1.2, "mg/dL", 0.1, 0.2),
    generateParameter("BUN", 7, 20, "mg/dL", 0.1, 0.2),
    generateParameter("eGFR", 60, 120, "mL/min/1.73m²", 0.15, 0.1),

    // Vitamins & Minerals
    generateParameter("Vitamin D", 30, 100, "ng/mL", 0.25, 0.1),
    generateParameter("Vitamin B12", 200, 900, "pg/mL", 0.2, 0.1),
    generateParameter("Folate", 3, 20, "ng/mL", 0.15, 0.1),
    generateParameter("Iron", 60, 170, "µg/dL", 0.2, 0.15),
    generateParameter("Ferritin", 15, 150, "ng/mL", 0.2, 0.2),

    // Thyroid
    generateParameter("TSH", 0.4, 4.0, "mIU/L", 0.15, 0.2),
    generateParameter("Free T4", 0.8, 1.8, "ng/dL", 0.15, 0.15),

    // Electrolytes
    generateParameter("Sodium", 136, 145, "mEq/L", 0.1, 0.1),
    generateParameter("Potassium", 3.5, 5.0, "mEq/L", 0.1, 0.15),
    generateParameter("Chloride", 98, 107, "mEq/L", 0.1, 0.1),
    generateParameter("CO2", 22, 28, "mEq/L", 0.1, 0.1),

    // Inflammatory Markers
    generateParameter("CRP", 0, 3.0, "mg/L", 0.1, 0.25),
    generateParameter("ESR", 0, 20, "mm/hr", 0.1, 0.2),
  ];

  return {
    title: fileName.replace(/\.[^/.]+$/, "") || "Lab Report",
    date: dateStr,
    hospital: "Sample Medical Center",
    doctor: "Dr. Smith",
    parameters,
  };
}

