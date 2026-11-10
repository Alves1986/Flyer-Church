import { describe, it, expect, vi } from "vitest";
import {
  normalizeFontName,
  hexToRgba,
  hexToRgb,
  rgbToLab,
  deltaE,
  wrapText,
  parseTextPositions,
  getFormato,
} from "../text-renderer";

describe("text-renderer utilities", () => {
  describe("normalizeFontName", () => {
    it("should return fallback for known fonts", () => {
      expect(normalizeFontName("Inter")).toContain("system-ui");
      expect(normalizeFontName("Playfair Display")).toContain("Playfair Display");
      expect(normalizeFontName("Montserrat")).toContain("Montserrat");
    });

    it("should return original name for unknown fonts", () => {
      expect(normalizeFontName("Custom Font")).toBe("Custom Font");
    });

    it("should be case insensitive", () => {
      expect(normalizeFontName("INTER")).toContain("system-ui");
      expect(normalizeFontName("playfair display")).toContain("Playfair Display");
    });
  });

  describe("hexToRgba", () => {
    it("should convert hex to rgba", () => {
      expect(hexToRgba("#BB9E49")).toBe("rgba(187, 158, 73, 1)");
      expect(hexToRgba("#BB9E49", 0.5)).toBe("rgba(187, 158, 73, 0.5)");
    });

    it("should handle hex without #", () => {
      expect(hexToRgba("BB9E49")).toBe("rgba(187, 158, 73, 1)");
    });
  });

  describe("hexToRgb", () => {
    it("should parse hex to rgb object", () => {
      const rgb = hexToRgb("#BB9E49");
      expect(rgb).toEqual({ r: 187, g: 158, b: 73 });
    });
  });

  describe("rgbToLab", () => {
    it("should convert rgb to lab", () => {
      const lab = rgbToLab(187, 158, 73);
      expect(lab.L).toBeGreaterThan(0);
      expect(lab.a).toBeDefined();
      expect(lab.b).toBeDefined();
    });

    it("should handle white", () => {
      const lab = rgbToLab(255, 255, 255);
      expect(lab.L).toBeCloseTo(100, 0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it("should handle black", () => {
      const lab = rgbToLab(0, 0, 0);
      expect(lab.L).toBeCloseTo(0, 0);
    });
  });

  describe("deltaE", () => {
    it("should return 0 for identical colors", () => {
      const lab1 = { L: 50, a: 10, b: 20 };
      const lab2 = { L: 50, a: 10, b: 20 };
      expect(deltaE(lab1, lab2)).toBe(0);
    });

    it("should calculate distance correctly", () => {
      const lab1 = { L: 50, a: 0, b: 0 };
      const lab2 = { L: 60, a: 10, b: 10 };
      const dE = deltaE(lab1, lab2);
      expect(dE).toBeGreaterThan(0);
    });
  });

  describe("wrapText", () => {
    it("should wrap text to fit maxWidth", () => {
      const mockCtx = {
        measureText: vi.fn().mockImplementation((text) => ({ width: text.length * 8 })),
      } as any;

      const lines = wrapText(mockCtx, "palavra1 palavra2 palavra3", 100, 1.2, 16);
      expect(lines.length).toBeGreaterThan(0);
    });

    it("should handle single word longer than maxWidth", () => {
      const mockCtx = {
        measureText: vi.fn().mockImplementation((text) => ({ width: text.length * 10 })),
      } as any;

      const lines = wrapText(mockCtx, "palavramuitalonga", 50, 1.2, 16);
      expect(lines).toEqual(["palavramuitalonga"]);
    });
  });

  describe("parseTextPositions", () => {
    it("should parse valid textPositions array", () => {
      const json = {
        textPositions: [
          { variable: "NOME_EVENTO", x: 100, y: 200, maxWidth: 500, fontFamily: "Inter", fontSize: 32, color: "#FFF", align: "center", lineHeight: 1.2 },
          { variable: "DATA_EVENTO", x: 100, y: 250, maxWidth: 300, fontFamily: "Inter", fontSize: 24, color: "#FFF", align: "left", lineHeight: 1.3 },
        ],
      };
      const result = parseTextPositions(json);
      expect(result).toHaveLength(2);
      expect(result[0].variable).toBe("NOME_EVENTO");
      expect(result[0].x).toBe(100);
      expect(result[0].align).toBe("center");
      expect(result[1].variable).toBe("DATA_EVENTO");
      expect(result[1].align).toBe("left");
    });

    it("should default missing values", () => {
      const json = {
        textPositions: [
          { variable: "NOME_EVENTO", x: 100, y: 200 },
        ],
      };
      const result = parseTextPositions(json);
      expect(result[0].maxWidth).toBe(500);
      expect(result[0].fontFamily).toBe("Inter");
      expect(result[0].fontSize).toBe(32);
      expect(result[0].color).toBe("#F5F0E4");
      expect(result[0].align).toBe("center");
      expect(result[0].lineHeight).toBe(1.2);
    });

    it("should return empty array for invalid input", () => {
      expect(parseTextPositions(null)).toEqual([]);
      expect(parseTextPositions({})).toEqual([]);
      expect(parseTextPositions({ textPositions: "not array" })).toEqual([]);
    });

    it("should filter invalid entries", () => {
      const json = {
        textPositions: [
          { variable: "VALID", x: 100, y: 200 },
          { variable: "INVALID", x: "not number", y: 200 },
          { x: 100, y: 200 },
        ],
      };
      const result = parseTextPositions(json);
      expect(result).toHaveLength(1);
      expect(result[0].variable).toBe("VALID");
    });
  });

  describe("getFormato", () => {
    it("should return correct formato for each preset", () => {
      const feed = getFormato("feed");
      expect(feed.larguraPx).toBe(1080);
      expect(feed.alturaPx).toBe(1350);

      const quadrado = getFormato("quadrado");
      expect(quadrado.larguraPx).toBe(1080);
      expect(quadrado.alturaPx).toBe(1080);

      const story = getFormato("story");
      expect(story.larguraPx).toBe(1080);
      expect(story.alturaPx).toBe(1920);
    });

    it("should default to feed for unknown preset", () => {
      const unknown = getFormato("unknown" as any);
      expect(unknown.larguraPx).toBe(1080);
      expect(unknown.alturaPx).toBe(1350);
    });
  });
});