import { LabExtract, LabParameter } from "./schemas";

export function normalizeLabExtract(extract: LabExtract): LabExtract {
  // Normalize date: try to coerce to ISO (YYYY-MM-DD)
  let normalizedDate: string | null = null;
  if (extract.date) {
    try {
      const parsed = new Date(extract.date);
      if (!isNaN(parsed.getTime())) {
        normalizedDate = parsed.toISOString().split("T")[0];
      }
    } catch {
      // Keep original if parsing fails
      normalizedDate = extract.date;
    }
  }

  // Normalize parameters
  const normalizedParameters: LabParameter[] = extract.parameters.map((param) => {
    // Normalize name: trim, Title Case
    const normalizedName = param.name
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

    // Normalize value: if numeric string, parseFloat; otherwise keep string
    let normalizedValue: string | number = param.value;
    if (typeof param.value === "string") {
      const numValue = parseFloat(param.value);
      if (!isNaN(numValue) && isFinite(numValue)) {
        normalizedValue = numValue;
      }
    }

    return {
      name: normalizedName,
      value: normalizedValue,
      unit: param.unit?.trim() || null,
      referenceRange: param.referenceRange?.trim() || null,
    };
  });

  return {
    hospital: extract.hospital?.trim() || null,
    doctor: extract.doctor?.trim() || null,
    date: normalizedDate,
    title: extract.title?.trim() || null,
    parameters: normalizedParameters,
  };
}

