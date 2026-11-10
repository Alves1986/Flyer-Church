import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

interface AutoTagRequest {
  base64: string;
  mimeType: string;
  filename?: string;
}

interface AutoTagResponse {
  tags: string[];
  tipoSugerido: "logo" | "foto" | "fundo";
  confidence: number;
}

/** Heurística simples para auto-tag baseada em nome do arquivo e análise básica de cores.
 *  No futuro, substituir por modelo CLIP real (ex: via transformers.js no edge ou API externa). */
function analisarImagem(base64: string, filename?: string): AutoTagResponse {
  const tags: string[] = [];
  let tipoSugerido: "logo" | "foto" | "fundo" = "foto";
  let confidence = 0.5;

  // Análise do nome do arquivo
  const nomeLower = filename?.toLowerCase() || "";
  
  if (nomeLower.includes("logo") || nomeLower.includes("marca") || nomeLower.includes("brand")) {
    tipoSugerido = "logo";
    tags.push("logo", "marca", "identidade visual");
    confidence = 0.9;
  } else if (nomeLower.includes("fundo") || nomeLower.includes("background") || nomeLower.includes("bg")) {
    tipoSugerido = "fundo";
    tags.push("fundo", "background", "textura");
    confidence = 0.8;
  } else if (nomeLower.includes("preletor") || nomeLower.includes("pastor") || nomeLower.includes("pessoa") || nomeLower.includes("retrato")) {
    tags.push("preletor", "pessoa", "retrato");
    confidence = 0.7;
  } else if (nomeLower.includes("igreja") || nomeLower.includes("templo") || nomeLower.includes("fachada")) {
    tags.push("igreja", "fachada", "arquitetura");
    confidence = 0.6;
  } else if (nomeLower.includes("evento") || nomeLower.includes("culto") || nomeLower.includes("conferencia")) {
    tags.push("evento", "cartaz", "divulgacao");
    confidence = 0.6;
  }

  // Heurísticas baseadas em padrões comuns de nome
  if (nomeLower.match(/\b(frente|frontal|close)\b/)) tags.push("close-up");
  if (nomeLower.match(/\b(horizontal|landscape|paisagem)\b/)) tags.push("horizontal");
  if (nomeLower.match(/\b(vertical|portrait|retrato)\b/)) tags.push("vertical");
  if (nomeLower.match(/\b(escuro|dark|noturno|noite)\b/)) tags.push("escuro", "noturno");
  if (nomeLower.match(/\b(claro|light|brilhante|dia)\b/)) tags.push("claro", "diurno");
  if (nomeLower.match(/\b(colorido|vibrante|cores)\b/)) tags.push("colorido", "vibrante");
  if (nomeLower.match(/\b(preto|branco|pb|bw)\b/)) tags.push("preto e branco");

  // Remover duplicatas
  const uniqueTags = Array.from(new Set(tags));

  return {
    tags: uniqueTags,
    tipoSugerido,
    confidence,
  };
}

export async function POST(req: NextRequest) {
  let body: AutoTagRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.base64 || !body.mimeType) {
    return NextResponse.json({ error: "Envie base64 e mimeType da imagem." }, { status: 400 });
  }

  try {
    const resultado = analisarImagem(body.base64, body.filename);
    return NextResponse.json(resultado);
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao processar imagem: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}