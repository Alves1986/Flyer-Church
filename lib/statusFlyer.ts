import { StatusFlyer } from "./types";

/** Ordem de exibição do ciclo de vida (Fase 1 — docs/product-roadmap.md). */
export const STATUS_FLYER_ORDEM: StatusFlyer[] = [
  "rascunho",
  "gerado",
  "aprovado",
  "rejeitado",
  "publicado",
];

export const STATUS_FLYER_ROTULOS: Record<StatusFlyer, string> = {
  rascunho: "Rascunho",
  gerado: "Gerado",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  publicado: "Publicado",
};

export const STATUS_FLYER_CORES: Record<StatusFlyer, string> = {
  rascunho: "border-parchment-500/30 bg-parchment-500/5 text-parchment-300",
  gerado: "border-gold-500/25 bg-gold-500/5 text-gold-300",
  aprovado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejeitado: "border-red-500/30 bg-red-500/10 text-red-300",
  publicado: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};
