import { getCardColor, hslGradient, getStatus } from "../LabCards";

describe("LabCards Color Functions", () => {
  describe("hslGradient", () => {
    it("should return green color at t=0", () => {
      const color = hslGradient(0);
      expect(color).toMatch(/hsl\(140/);
    });

    it("should return yellow color at t=0.5", () => {
      const color = hslGradient(0.5);
      expect(color).toMatch(/hsl\(55/);
    });

    it("should return red color at t=1", () => {
      const color = hslGradient(1);
      expect(color).toMatch(/hsl\(0/);
    });

    it("should clamp values outside [0,1]", () => {
      const colorNegative = hslGradient(-1);
      const colorPositive = hslGradient(2);
      expect(colorNegative).toMatch(/hsl\(140/); // Should be clamped to 0
      expect(colorPositive).toMatch(/hsl\(0/); // Should be clamped to 1
    });

    it("should interpolate hue monotonically from green to red", () => {
      const t0 = hslGradient(0);
      const t025 = hslGradient(0.25);
      const t05 = hslGradient(0.5);
      const t075 = hslGradient(0.75);
      const t1 = hslGradient(1);

      // Extract hue values
      const extractHue = (hsl: string) => {
        const match = hsl.match(/hsl\((\d+)/);
        return match ? parseInt(match[1]) : 0;
      };

      const h0 = extractHue(t0);
      const h025 = extractHue(t025);
      const h05 = extractHue(t05);
      const h075 = extractHue(t075);
      const h1 = extractHue(t1);

      // Hue should decrease from green (140) to red (0)
      expect(h0).toBeGreaterThan(h025);
      expect(h025).toBeGreaterThan(h05);
      expect(h05).toBeGreaterThan(h075);
      expect(h075).toBeGreaterThan(h1);
    });
  });

  describe("getCardColor", () => {
    it("should return red when value < low", () => {
      const color = getCardColor(5, 10, 20);
      expect(color).toBe("#ef4444");
    });

    it("should return red when value > high", () => {
      const color = getCardColor(25, 10, 20);
      expect(color).toBe("#ef4444");
    });

    it("should return gradient color when value is in range", () => {
      const color = getCardColor(15, 10, 20); // Midpoint
      expect(color).toMatch(/^hsl\(/); // Should be HSL, not hex
    });

    it("should return yellow-ish color at midpoint", () => {
      const color = getCardColor(15, 10, 20); // t = 0.5
      expect(color).toMatch(/hsl\(55/); // Should be near yellow
    });

    it("should handle refHigh == refLow (avoid divide by zero)", () => {
      const color = getCardColor(10, 10, 10);
      expect(color).toMatch(/^hsl\(/); // Should not crash
    });

    it("should return gray for NaN values", () => {
      const color = getCardColor(NaN, 10, 20);
      expect(color).toMatch(/hsl\(0 0% 85%\)/); // Gray
    });

    it("should return gray for Infinity values", () => {
      const color = getCardColor(Infinity, 10, 20);
      expect(color).toMatch(/hsl\(0 0% 85%\)/); // Gray
    });
  });

  describe("getStatus", () => {
    it("should return LOW when value < low", () => {
      expect(getStatus(5, 10, 20)).toBe("LOW");
    });

    it("should return HIGH when value > high", () => {
      expect(getStatus(25, 10, 20)).toBe("HIGH");
    });

    it("should return OK when value is in range", () => {
      expect(getStatus(15, 10, 20)).toBe("OK");
    });

    it("should return OK for NaN values", () => {
      expect(getStatus(NaN, 10, 20)).toBe("OK");
    });

    it("should handle boundary values correctly", () => {
      expect(getStatus(10, 10, 20)).toBe("OK"); // At low boundary
      expect(getStatus(20, 10, 20)).toBe("OK"); // At high boundary
    });
  });
});

