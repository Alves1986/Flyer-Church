import { BrandDna, CategoriaEvento } from "./types";

/**
 * Categorias de evento padrão.
 */
export const CATEGORIAS_EVENTO: { id: CategoriaEvento; label: string; descricao: string }[] = [
  { id: "culto", label: "Culto semanal", descricao: "Cultos dominicais e de meio de semana" },
  { id: "jovens", label: "Jovens", descricao: "Encontros, retiros e eventos da juventude" },
  { id: "ceia", label: "Ceia", descricao: "Celebração da Santa Ceia" },
  { id: "conferencia", label: "Conferência", descricao: "Congressos, conferências e eventos especiais" },
  { id: "vigilia", label: "Vigília", descricao: "Vigílias de oração e madrugadas" },
  { id: "aviso", label: "Aviso geral", descricao: "Comunicados, avisos e informativos" },
];

/**
 * Retorna o label amigável de uma categoria.
 */
export function labelCategoriaEvento(id: CategoriaEvento): string {
  return CATEGORIAS_EVENTO.find((c) => c.id === id)?.label ?? id;
}

/**
 * Deep merge de dois objetos BrandDna parciais.
 * O override vazio (undefined/null) mantém o valor base.
 * Arrays: override substitui completamente (não concatena).
 * Objetos aninhados: merge recursivo.
 */
export function mergeBrandDnaOverride(
  base: Partial<BrandDna>,
  override: Partial<BrandDna>
): Partial<BrandDna> {
  const result: Record<string, any> = { ...base };

  for (const key of Object.keys(override) as Array<keyof Partial<BrandDna>>) {
    const overrideValue = override[key];
    const baseValue = base[key];

    if (overrideValue === undefined || overrideValue === null) {
      continue;
    }

    // Skip empty arrays in override (treat as "no override")
    if (Array.isArray(overrideValue) && overrideValue.length === 0) {
      continue;
    }

    if (Array.isArray(overrideValue) && Array.isArray(baseValue)) {
      result[key] = overrideValue;
    } else if (
      typeof overrideValue === "object" &&
      overrideValue !== null &&
      typeof baseValue === "object" &&
      baseValue !== null
    ) {
      result[key] = mergeBrandDnaOverride(
        baseValue as Record<string, any>,
        overrideValue as Record<string, any>
      );
    } else {
      result[key] = overrideValue;
    }
  }

  return result as Partial<BrandDna>;
}

/**
 * Aplica os overrides de uma categoria ao Brand DNA base,
 * retornando o Brand DNA efetivo para essa categoria.
 */
export function aplicarEventOverride(
  brandDna: BrandDna,
  categoria: CategoriaEvento
): BrandDna {
  const override = brandDna.eventOverrides?.[categoria];
  if (!override || Object.keys(override).length === 0) {
    return brandDna;
  }
  return mergeBrandDnaOverride(brandDna, override) as BrandDna;
}

export function brandDnaVazio(): BrandDna {
  return {
    version: 1,
    name: "",
    voice: [],
    palette: { primary: [], secondary: [], neutrals: [], avoid: [] },
    typography: { headline: undefined, body: undefined, rules: [] },
    composition: { preferred: [], avoid: [], textSafeAreas: [] },
    imagery: { subjects: [], mood: [], treatments: [], avoid: [] },
    motifs: [],
    logoRules: [],
    copyRules: [],
    negativeRules: [],
    approvedAssetIds: [],
    eventOverrides: {},
    confidence: 0,
    approvedByHuman: false,
  };
}

/** Formato aceito da proposta da IA — só os campos de conteúdo, sem os campos de controle do app. */
export interface BrandDnaProposta {
  name?: string;
  voice?: string[];
  palette?: Partial<BrandDna["palette"]>;
  typography?: Partial<BrandDna["typography"]>;
  composition?: Partial<BrandDna["composition"]>;
  imagery?: Partial<BrandDna["imagery"]>;
  motifs?: string[];
  logoRules?: string[];
  copyRules?: string[];
  negativeRules?: string[];
  confidence?: number;
}

/**
 * Mescla uma proposta da IA sobre um Brand DNA existente (ou vazio),
 * preservando os campos de controle (version, approvedByHuman, etc). Nunca
 * marca `approvedByHuman: true` automaticamente — aprovação é sempre uma
 * ação humana explícita (ver docs/brand-dna.md, princípio "permitir que um
 * administrador corrija sugestões da IA").
 */
export function mesclarPropostaBrandDna(
  atual: BrandDna,
  proposta: BrandDnaProposta
): BrandDna {
  return {
    ...atual,
    name: proposta.name?.trim() || atual.name,
    voice: proposta.voice?.length ? proposta.voice : atual.voice,
    palette: {
      primary: proposta.palette?.primary ?? atual.palette.primary,
      secondary: proposta.palette?.secondary ?? atual.palette.secondary,
      neutrals: proposta.palette?.neutrals ?? atual.palette.neutrals,
      avoid: proposta.palette?.avoid ?? atual.palette.avoid,
    },
    typography: {
      headline: proposta.typography?.headline ?? atual.typography.headline,
      body: proposta.typography?.body ?? atual.typography.body,
      rules: proposta.typography?.rules ?? atual.typography.rules,
    },
    composition: {
      preferred: proposta.composition?.preferred ?? atual.composition.preferred,
      avoid: proposta.composition?.avoid ?? atual.composition.avoid,
      textSafeAreas: proposta.composition?.textSafeAreas ?? atual.composition.textSafeAreas,
    },
    imagery: {
      subjects: proposta.imagery?.subjects ?? atual.imagery.subjects,
      mood: proposta.imagery?.mood ?? atual.imagery.mood,
      treatments: proposta.imagery?.treatments ?? atual.imagery.treatments,
      avoid: proposta.imagery?.avoid ?? atual.imagery.avoid,
    },
    motifs: proposta.motifs ?? atual.motifs,
    logoRules: proposta.logoRules ?? atual.logoRules,
    copyRules: proposta.copyRules ?? atual.copyRules,
    negativeRules: proposta.negativeRules ?? atual.negativeRules,
    confidence: proposta.confidence ?? atual.confidence,
    approvedByHuman: false,
  };
}

/**
 * Aplica o Brand DNA aprovado como instruções adicionais ao prompt final de
 * geração (Fase 2 — "a geração recebe Brand DNA + categoria + dados +
 * formato + ativos aprovados", docs/brand-dna.md). Só deve ser chamada com
 * um Brand DNA que já tenha `approvedByHuman: true` — a decisão de quando
 * aplicar fica com quem chama (ver app/flyers/novo/[templateId]/page.tsx).
 * É puramente aditiva: nunca substitui ou reescreve o prompt do template.
 */
export function aplicarBrandDnaAoPrompt(promptFinal: string, brandDna: BrandDna): string {
  const linhas: string[] = [];

  if (brandDna.palette.primary.length || brandDna.palette.secondary.length) {
    linhas.push(
      `Paleta da marca: priorize ${[...brandDna.palette.primary, ...brandDna.palette.secondary].join(", ")}${
        brandDna.palette.avoid.length ? `; evite ${brandDna.palette.avoid.join(", ")}` : ""
      }.`
    );
  }
  if (brandDna.typography.rules.length || brandDna.typography.headline || brandDna.typography.body) {
    const estilos = [brandDna.typography.headline, brandDna.typography.body].filter(Boolean).join(" / ");
    linhas.push(
      `Tipografia: ${estilos ? `estilo ${estilos}. ` : ""}${brandDna.typography.rules.join("; ")}`.trim()
    );
  }
  if (brandDna.composition.preferred.length || brandDna.composition.avoid.length) {
    linhas.push(
      `Composição: prefira ${brandDna.composition.preferred.join(", ") || "layout já descrito"}${
        brandDna.composition.avoid.length ? `; evite ${brandDna.composition.avoid.join(", ")}` : ""
      }.`
    );
  }
  if (brandDna.imagery.mood.length || brandDna.imagery.treatments.length) {
    linhas.push(
      `Atmosfera visual: ${[...brandDna.imagery.mood, ...brandDna.imagery.treatments].join(", ")}.`
    );
  }
  if (brandDna.motifs.length) {
    linhas.push(`Motivos gráficos recorrentes da marca: ${brandDna.motifs.join(", ")}.`);
  }
  if (brandDna.negativeRules.length) {
    linhas.push(`Nunca inclua: ${brandDna.negativeRules.join("; ")}.`);
  }

  if (linhas.length === 0) return promptFinal;

  return `${promptFinal}\n\nIdentidade de marca (Brand DNA${brandDna.name ? ` — ${brandDna.name}` : ""}): ${linhas.join(" ")}`;
}
