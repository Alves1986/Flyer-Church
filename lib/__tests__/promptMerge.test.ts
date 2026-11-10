import { describe, it, expect } from "vitest";
import {
  mergePrompt,
  parseTemplateVariables,
  tryParseExtractionJson,
  findBracketTokens,
} from "../promptMerge";

describe("promptMerge", () => {
  describe("findBracketTokens", () => {
    it("should find all bracket tokens", () => {
      const text = "Olá [NOME_EVENTO], hoje é [DATA_EVENTO] na [NOME_IGREJA]";
      const tokens = findBracketTokens(text);
      expect(tokens).toEqual(["NOME_EVENTO", "DATA_EVENTO", "NOME_IGREJA"]);
    });

    it("should return unique tokens only", () => {
      const text = "[NOME_EVENTO] e [NOME_EVENTO] novamente";
      const tokens = findBracketTokens(text);
      expect(tokens).toEqual(["NOME_EVENTO"]);
    });

    it("should return empty array for no tokens", () => {
      const text = "Texto sem variáveis";
      const tokens = findBracketTokens(text);
      expect(tokens).toEqual([]);
    });
  });

  describe("tryParseExtractionJson", () => {
    it("should parse valid JSON with prompt and textPositions", () => {
      const json = JSON.stringify({
        prompt: "Crie um flyer com [NOME_EVENTO]",
        textPositions: [
          { variable: "NOME_EVENTO", x: 100, y: 200, maxWidth: 500, fontFamily: "Inter", fontSize: 32, color: "#FFF", align: "center", lineHeight: 1.2 },
        ],
      });
      const result = tryParseExtractionJson(json);
      expect(result).not.toBeNull();
      expect(result?.prompt).toBe("Crie um flyer com [NOME_EVENTO]");
      expect(result?.textPositions).toHaveLength(1);
    });

    it("should return null for plain text (not JSON)", () => {
      const text = "Este é um prompt simples com [NOME_EVENTO]";
      const result = tryParseExtractionJson(text);
      expect(result).toBeNull();
    });

    it("should return null for invalid JSON", () => {
      const text = "{ invalid json";
      const result = tryParseExtractionJson(text);
      expect(result).toBeNull();
    });

    it("should return null for JSON without required fields", () => {
      const json = JSON.stringify({ prompt: "test" });
      const result = tryParseExtractionJson(json);
      expect(result).toBeNull();
    });
  });

  describe("parseTemplateVariables", () => {
    it("should separate text and image variables from plain prompt", () => {
      const prompt = "Flyer para [NOME_EVENTO] em [DATA_EVENTO] com [FOTO_PRELETOR_ANEXADA]";
      const result = parseTemplateVariables(prompt);
      expect(result.variaveisTexto).toEqual(["NOME_EVENTO", "DATA_EVENTO"]);
      expect(result.variaveisImagem).toEqual(["FOTO_PRELETOR_ANEXADA"]);
      expect(result.textLayers).toEqual([]);
    });

    it("should extract textLayers from JSON format", () => {
      const prompt = JSON.stringify({
        prompt: "Flyer para [NOME_EVENTO]",
        textPositions: [{ variable: "NOME_EVENTO", x: 100, y: 200, maxWidth: 500, fontFamily: "Inter", fontSize: 32, color: "#FFF", align: "center", lineHeight: 1.2 }],
      });
      const result = parseTemplateVariables(prompt);
      expect(result.variaveisTexto).toEqual(["NOME_EVENTO"]);
      expect(result.textLayers).toHaveLength(1);
      expect(result.textLayers[0].variable).toBe("NOME_EVENTO");
    });
  });

  describe("mergePrompt", () => {
    it("should replace text variables in plain prompt", () => {
      const prompt = "Evento: [NOME_EVENTO] em [DATA_EVENTO] na [NOME_IGREJA]";
      const values = { NOME_EVENTO: "Culto de Domingo", DATA_EVENTO: "15/01/2025", NOME_IGREJA: "Igreja Central" };
      const result = mergePrompt(prompt, values);
      expect(result.promptFinal).toBe("Evento: Culto de Domingo em 15/01/2025 na Igreja Central");
      expect(result.textLayers).toEqual([]);
    });

    it("should handle missing values by keeping token", () => {
      const prompt = "Evento: [NOME_EVENTO]";
      const values = {};
      const result = mergePrompt(prompt, values);
      expect(result.promptFinal).toBe("Evento: [NOME_EVENTO]");
    });

    it("should replace image variables with descriptions", () => {
      const prompt = "Foto: [FOTO_PRELETOR_ANEXADA] e logo: [LOGO_IGREJA_ANEXADO]";
      const values = {};
      const result = mergePrompt(prompt, values);
      expect(result.promptFinal).toContain("the attached preacher reference photo");
      expect(result.promptFinal).toContain("the attached church logo image");
    });

    it("should work with JSON format prompt", () => {
      const prompt = JSON.stringify({
        prompt: "Evento: [NOME_EVENTO] em [DATA_EVENTO]",
        textPositions: [
          { variable: "NOME_EVENTO", x: 100, y: 200, maxWidth: 500, fontFamily: "Inter", fontSize: 32, color: "#FFF", align: "center", lineHeight: 1.2 },
          { variable: "DATA_EVENTO", x: 100, y: 250, maxWidth: 300, fontFamily: "Inter", fontSize: 24, color: "#FFF", align: "center", lineHeight: 1.2 },
        ],
      });
      const values = { NOME_EVENTO: "Culto", DATA_EVENTO: "15/01" };
      const result = mergePrompt(prompt, values);
      expect(result.promptFinal).toBe("Evento: Culto em 15/01");
      expect(result.textLayers).toHaveLength(2);
      expect(result.textLayers[0].variable).toBe("NOME_EVENTO");
      expect(result.textLayers[1].variable).toBe("DATA_EVENTO");
    });
  });
});