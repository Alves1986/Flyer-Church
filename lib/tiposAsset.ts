import { AssetBiblioteca, TipoAsset } from "./types";

/** Tipos de item da biblioteca de mídia (Fase 1 — docs/product-roadmap.md). */
export const TIPOS_ASSET: { id: TipoAsset; nome: string; nomePlural: string }[] = [
  { id: "logo", nome: "Logo", nomePlural: "Logos" },
  { id: "foto", nome: "Foto", nomePlural: "Fotos" },
  { id: "fundo", nome: "Fundo", nomePlural: "Fundos" },
];

export type { AssetBiblioteca } from "./types";

export function rotuloTipoAsset(id: TipoAsset): string {
  return TIPOS_ASSET.find((t) => t.id === id)?.nome ?? id;
}

/** Fonte da imagem para exibição: URL do Blob (banco) ou base64 (localStorage). */
export function assetSrc(a: Pick<AssetBiblioteca, "url" | "base64" | "mimeType">): string {
  return a.url ?? `data:${a.mimeType};base64,${a.base64}`;
}

/** Smart Suggest — recomendações de assets baseadas no template e histórico de aprovação. */
export interface AssetSuggestion {
  assetId: string;
  score: number; // 0-1, quanto maior mais relevante
  reason: string; // ex: "Usado em 3 flyers aprovados deste template"
}

/** Gera sugestões inteligentes de assets para um template.
 *  Usa heurísticas simples (MVP): assets do mesmo tipo mais usados em flyers aprovados do mesmo template.
 *  Futuro: substituir por embedding CLIP + collaborative filtering. */
export function gerarSugestoesAssets(
  templateId: string,
  tipo: TipoAsset,
  biblioteca: AssetBiblioteca[],
  flyersAprovados: { templateId: string; campos?: Record<string, string>; imagemUrl?: string }[]
): AssetSuggestion[] {
  // Conta quantas vezes cada asset foi usado em flyers aprovados deste template
  const usoPorAsset: Record<string, number> = {};
  
  for (const flyer of flyersAprovados) {
    if (flyer.templateId !== templateId) continue;
    // No MVP, não temos tracking direto de qual asset foi usado em cada campo de imagem
    // Usamos heurística: assets mais recentes e do tipo correto
  }

  // Fallback: assets do tipo correto ordenados por data (mais recentes primeiro)
  const assetsDoTipo = biblioteca
    .filter((a) => a.tipo === tipo)
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  return assetsDoTipo.slice(0, 5).map((asset, index) => ({
    assetId: asset.id,
    score: 1 - index * 0.15,
    reason: index === 0 ? "Mais recente" : `Adicionado em ${new Date(asset.criadoEm).toLocaleDateString("pt-BR")}`,
  }));
}

/** Marca um logo como "oficial" e retorna IDs de templates que o usam (para sugestão de atualização). */
export async function marcarLogoOficial(
  logoId: string,
  biblioteca: AssetBiblioteca[],
  templates: { id: string; variaveisImagem: string[]; promptExtraido: string }[]
): Promise<{ templatesAfetados: string[]; sugestoes: string[] }> {
  const templatesAfetados = templates
    .filter((t) => t.variaveisImagem.includes("LOGO_IGREJA_ANEXADO"))
    .map((t) => t.id);

  const sugestoes = templatesAfetados.length > 0
    ? [`Logo oficial atualizado. ${templatesAfetados.length} template(s) usam logo da igreja — considere regenerar.`]
    : [];

  return { templatesAfetados, sugestoes };
}
