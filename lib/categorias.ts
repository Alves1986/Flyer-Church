import { CategoriaEvento } from "./types";

/** Categorias de evento (Fase 1 — docs/product-roadmap.md). */
export const CATEGORIAS_EVENTO: { id: CategoriaEvento; nome: string }[] = [
  { id: "culto", nome: "Culto" },
  { id: "jovens", nome: "Jovens" },
  { id: "ceia", nome: "Ceia" },
  { id: "conferencia", nome: "Conferência" },
  { id: "vigilia", nome: "Vigília" },
  { id: "aviso", nome: "Aviso" },
];

export function rotuloCategoria(id?: CategoriaEvento): string | undefined {
  if (!id) return undefined;
  return CATEGORIAS_EVENTO.find((c) => c.id === id)?.nome;
}
