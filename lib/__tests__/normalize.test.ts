import { normalizeLabExtract } from "../normalize";
import { LabExtract } from "../schemas";

describe("normalizeLabExtract", () => {
  it("should normalize date to ISO format", () => {
    const extract: LabExtract = {
      hospital: "Test Hospital",
      doctor: "Dr. Test",
      date: "2024-01-15",
      parameters: [],
    };

    const normalized = normalizeLabExtract(extract);
    expect(normalized.date).toBe("2024-01-15");
  });

  it("should normalize parameter names to Title Case", () => {
    const extract: LabExtract = {
      hospital: null,
      doctor: null,
      date: null,
      parameters: [
        { name: "hemoglobin", value: 13.2, unit: "g/dL" },
        { name: "WHITE BLOOD CELL COUNT", value: 6.5, unit: "K/µL" },
      ],
    };

    const normalized = normalizeLabExtract(extract);
    expect(normalized.parameters[0].name).toBe("Hemoglobin");
    expect(normalized.parameters[1].name).toBe("White Blood Cell Count");
  });

  it("should parse numeric string values to numbers", () => {
    const extract: LabExtract = {
      hospital: null,
      doctor: null,
      date: null,
      parameters: [
        { name: "Hemoglobin", value: "13.2", unit: "g/dL" },
        { name: "Status", value: "Normal", unit: null },
      ],
    };

    const normalized = normalizeLabExtract(extract);
    expect(normalized.parameters[0].value).toBe(13.2);
    expect(normalized.parameters[1].value).toBe("Normal");
  });

  it("should handle null values", () => {
    const extract: LabExtract = {
      hospital: null,
      doctor: null,
      date: null,
      parameters: [],
    };

    const normalized = normalizeLabExtract(extract);
    expect(normalized.hospital).toBeNull();
    expect(normalized.doctor).toBeNull();
    expect(normalized.date).toBeNull();
  });
});

