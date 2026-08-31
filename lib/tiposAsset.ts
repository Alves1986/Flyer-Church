import { AssetBiblioteca, TipoAsset } from "./types";

/** Tipos de item da biblioteca de mídia (Fase 1 — docs/product-roadmap.md). */
export const TIPOS_ASSET: { id: TipoAsset; nome: string; nomePlural: string }[] = [
  { id: "logo", nome: "Logo", nomePlural: "Logos" },
  { id: "foto", nome: "Foto", nomePlural: "Fotos" },
  { id: "fundo", nome: "Fundo", nomePlural: "Fundos" },
];

export function rotuloTipoAsset(id: TipoAsset): string {
  return TIPOS_ASSET.find((t) => t.id === id)?.nome ?? id;
}

/** Fonte da imagem para exibição: URL do Blob (banco) ou base64 (localStorage). */
export function assetSrc(a: Pick<AssetBiblioteca, "url" | "base64" | "mimeType">): string {
  return a.url ?? `data:${a.mimeType};base64,${a.base64}`;
}
