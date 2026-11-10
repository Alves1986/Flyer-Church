import { describe, it, expect } from "vitest";
import {
  brandDnaVazio,
  mesclarPropostaBrandDna,
  mergeBrandDnaOverride,
  aplicarEventOverride,
  CATEGORIAS_EVENTO,
  labelCategoriaEvento,
} from "../brandDna";
import { BrandDna, CategoriaEvento } from "../types";

describe("brandDna", () => {
  describe("brandDnaVazio", () => {
    it("should return a valid empty BrandDna structure", () => {
      const empty = brandDnaVazio();
      expect(empty.version).toBe(1);
      expect(empty.name).toBe("");
      expect(empty.voice).toEqual([]);
      expect(empty.palette.primary).toEqual([]);
      expect(empty.approvedByHuman).toBe(false);
      expect(empty.confidence).toBe(0);
      expect(empty.eventOverrides).toEqual({});
    });
  });

  describe("mesclarPropostaBrandDna", () => {
    it("should merge proposal over empty brand dna", () => {
      const atual = brandDnaVazio();
      const proposta = {
        name: "Igreja Teste",
        voice: ["acolhedor", "moderno"],
        palette: { primary: ["#BB9E49"], secondary: ["#C9A227"] },
        confidence: 0.8,
      };
      const result = mesclarPropostaBrandDna(atual, proposta);
      expect(result.name).toBe("Igreja Teste");
      expect(result.voice).toEqual(["acolhedor", "moderno"]);
      expect(result.palette.primary).toEqual(["#BB9E49"]);
      expect(result.confidence).toBe(0.8);
      expect(result.approvedByHuman).toBe(false);
    });

    it("should preserve existing values when proposal is partial", () => {
      const atual: BrandDna = {
        ...brandDnaVazio(),
        name: "Existente",
        voice: ["existente"],
        palette: { primary: ["#111"], secondary: [], neutrals: [], avoid: [] },
      };
      const proposta = { voice: ["novo"] };
      const result = mesclarPropostaBrandDna(atual, proposta);
      expect(result.name).toBe("Existente");
      expect(result.voice).toEqual(["novo"]);
      expect(result.palette.primary).toEqual(["#111"]);
    });

    it("should never set approvedByHuman to true automatically", () => {
      const atual = brandDnaVazio();
      const proposta: any = { approvedByHuman: true };
      const result = mesclarPropostaBrandDna(atual, proposta);
      expect(result.approvedByHuman).toBe(false);
    });
  });

  describe("mergeBrandDnaOverride", () => {
    it("should merge override into base", () => {
      const base: Partial<BrandDna> = {
        name: "Base",
        palette: { primary: ["#111"], secondary: ["#222"], neutrals: [], avoid: [] },
        typography: { headline: "Inter", body: "Inter", rules: [] },
      };
      const override: Partial<BrandDna> = {
        palette: { primary: ["#BB9E49"], secondary: [], neutrals: [], avoid: [] },
      };
      const result = mergeBrandDnaOverride(base, override);
      expect(result.name).toBe("Base");
      expect(result.palette?.primary).toEqual(["#BB9E49"]);
      expect(result.palette?.secondary).toEqual(["#222"]);
    });

    it("should handle undefined/null override values by keeping base", () => {
      const base: Partial<BrandDna> = { name: "Base", voice: ["base"] };
      const override: Partial<BrandDna> = { name: undefined, voice: null as any };
      const result = mergeBrandDnaOverride(base, override);
      expect(result.name).toBe("Base");
      expect(result.voice).toEqual(["base"]);
    });

    it("should merge nested objects deeply", () => {
      const base: Partial<BrandDna> = {
        typography: { headline: "Inter", body: "Roboto", rules: ["regra1"] },
      };
      const override: Partial<BrandDna> = {
        typography: { headline: "Playfair", rules: [] },
      };
      const result = mergeBrandDnaOverride(base, override);
      expect(result.typography?.headline).toBe("Playfair");
      expect(result.typography?.body).toBe("Roboto");
      expect(result.typography?.rules).toEqual(["regra1"]);
    });
  });

  describe("aplicarEventOverride", () => {
    it("should return base when no override exists", () => {
      const base = brandDnaVazio();
      base.name = "Base";
      base.palette.primary = ["#111"];
      const result = aplicarEventOverride(base, "culto");
      expect(result).toBe(base);
    });

    it("should merge override when exists", () => {
      const base = brandDnaVazio();
      base.name = "Base";
      base.palette.primary = ["#111"];
      base.palette.secondary = ["#222"];
      base.eventOverrides = {
        culto: { palette: { primary: ["#BB9E49"], secondary: [], neutrals: [], avoid: [] } },
      };
      const result = aplicarEventOverride(base, "culto");
      expect(result.palette.primary).toEqual(["#BB9E49"]);
      expect(result.palette.secondary).toEqual(["#222"]);
    });

    it("should handle partial overrides", () => {
      const base = brandDnaVazio();
      base.palette.primary = ["#111"];
      base.palette.secondary = ["#222"];
      base.typography.headline = "Inter";
      base.typography.rules = [];
      base.eventOverrides = {
        jovens: { typography: { headline: "Montserrat", rules: [] } },
      };
      const result = aplicarEventOverride(base, "jovens");
      expect(result.typography.headline).toBe("Montserrat");
      expect(result.palette.primary).toEqual(["#111"]);
    });
  });

  describe("CATEGORIAS_EVENTO", () => {
    it("should have all 6 categories", () => {
      expect(CATEGORIAS_EVENTO).toHaveLength(6);
      const ids = CATEGORIAS_EVENTO.map((c) => c.id);
      expect(ids).toContain("culto");
      expect(ids).toContain("jovens");
      expect(ids).toContain("ceia");
      expect(ids).toContain("conferencia");
      expect(ids).toContain("vigilia");
      expect(ids).toContain("aviso");
    });

    it("should have label and description for each", () => {
      CATEGORIAS_EVENTO.forEach((cat) => {
        expect(cat.label).toBeTruthy();
        expect(cat.descricao).toBeTruthy();
      });
    });
  });

  describe("labelCategoriaEvento", () => {
    it("should return correct label for each category", () => {
      expect(labelCategoriaEvento("culto")).toBe("Culto semanal");
      expect(labelCategoriaEvento("jovens")).toBe("Jovens");
      expect(labelCategoriaEvento("ceia")).toBe("Ceia");
      expect(labelCategoriaEvento("conferencia")).toBe("Conferência");
      expect(labelCategoriaEvento("vigilia")).toBe("Vigília");
      expect(labelCategoriaEvento("aviso")).toBe("Aviso geral");
    });

    it("should return id for unknown category", () => {
      expect(labelCategoriaEvento("desconhecido" as CategoriaEvento)).toBe("desconhecido");
    });
  });
});