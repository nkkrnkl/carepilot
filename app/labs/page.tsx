"use client";

import { LabCards, LabRow } from "@/components/labs/LabCards";

// Sample data from Comprehensive Metabolic Panel (CMP)
const sample: LabRow[] = [
  { name: "Sodium", value: 139, unit: "mmol/L", refLow: 135, refHigh: 145 },
  { name: "Potassium", value: 4.1, unit: "mmol/L", refLow: 3.5, refHigh: 5.1 },
  { name: "Chloride", value: 103, unit: "mmol/L", refLow: 98, refHigh: 107 },
  { name: "CO2 (Bicarbonate)", value: 25, unit: "mmol/L", refLow: 22, refHigh: 29 },
  { name: "Creatinine", value: 0.9, unit: "mg/dL", refLow: 0.6, refHigh: 1.3 },
  { name: "BUN", value: 14, unit: "mg/dL", refLow: 7, refHigh: 20 },
  { name: "Glucose", value: 92, unit: "mg/dL", refLow: 70, refHigh: 99, note: "fasting" },
  { name: "Calcium", value: 9.3, unit: "mg/dL", refLow: 8.5, refHigh: 10.5 },
];

export default function LabsDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Lab Cards Demo</h1>
        <p className="text-gray-600 mb-8">
          Comprehensive Metabolic Panel (CMP) sample data
        </p>
        
        <LabCards data={sample} />
      </div>
    </div>
  );
}
