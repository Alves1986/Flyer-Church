import { NextResponse } from "next/server";
import { listFreeVisionModels } from "@/lib/openrouter";

export const runtime = "nodejs";

/**
 * Lista pública de modelos gratuitos da OpenRouter com suporte a imagem
 * (usada para popular o seletor de modelo em /templates/novo). Não exige
 * OPENROUTER_API_KEY — o catálogo de modelos é público; a chave só é
 * necessária para de fato chamar o modelo em /api/extract.
 */
export async function GET() {
  const { models, source } = await listFreeVisionModels();
  return NextResponse.json({ models, source });
}
