/**
 * Normalize lab extract data
 */

import { LabExtract } from "./schemas";

export interface NormalizedLabExtract {
  title: string;
  date: string;
  hospital: string | null;
  doctor: string | null;
  parameters: Array<{
    name: string;
    value: number | string;
    unit?: string | null;
    referenceRange?: string | null;
  }>;
}

export function normalizeLabExtract(extract: LabExtract): NormalizedLabExtract {
  return {
    title: extract.title || "Lab Report",
    date: extract.date || new Date().toISOString().split("T")[0],
    hospital: extract.hospital || null,
    doctor: extract.doctor || null,
    parameters: extract.parameters.map((param) => ({
      name: param.name,
      value: param.value,
      unit: param.unit || null,
      referenceRange: param.referenceRange || null,
    })),
  };
}

