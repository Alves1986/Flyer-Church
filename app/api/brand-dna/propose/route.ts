import { NextRequest, NextResponse } from "next/server";
import { META_PROMPT_BRAND_DNA } from "@/lib/metaPrompt";
import { callOpenRouterChat, DEFAULT_FREE_TEXT_MODEL, isOpenRouterConfigured } from "@/lib/openrouter";
import { BrandDnaProposta } from "@/lib/brandDna";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RespostasFormulario {
  nomeIgreja: string;
  tomDeVoz: string;
  publicoAlvo?: string;
  paletaDesejada?: string;
  fontesDesejadas?: string;
}

interface ReferenceImage {
  base64: string;
  mimeType: string;
}

interface ProposeBody {
  respostas: RespostasFormulario;
  referencias?: ReferenceImage[];
  /** Chave colada pelo usuário no formulário — mesma prioridade usada em /api/extract. */
  apiKey?: string;
  model?: string;
}

/**
 * Extrai o primeiro objeto JSON de uma string, tolerando cercas de código
 * markdown (```json ... ```) que alguns modelos incluem mesmo quando
 * instruídos a não fazê-lo.
 */
function extrairJson(texto: string): unknown {
  const semCercas = texto.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const inicio = semCercas.indexOf("{");
  const fim = semCercas.lastIndexOf("}");
  if (inicio === -1 || fim === -1 || fim < inicio) {
    throw new Error("A resposta do modelo não contém um objeto JSON.");
  }
  return JSON.parse(semCercas.slice(inicio, fim + 1));
}

export async function POST(req: NextRequest) {
  let body: ProposeBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.respostas?.nomeIgreja?.trim() || !body.respostas?.tomDeVoz?.trim()) {
    return NextResponse.json(
      { error: "Envie ao menos o nome da igreja e o tom de voz desejado." },
      { status: 400 }
    );
  }

  if (!isOpenRouterConfigured() && !body.apiKey?.trim()) {
    return NextResponse.json(
      {
        error:
          "Nenhuma chave da OpenRouter configurada. Crie uma chave grátis em openrouter.ai/keys e cole no campo de chave da tela de Marca (fica salva só neste navegador) — ou adicione OPENROUTER_API_KEY em Vercel → Project Settings → Environment Variables.",
      },
      { status: 501 }
    );
  }

  const contexto = [
    `Nome da igreja: ${body.respostas.nomeIgreja.trim()}`,
    `Tom de voz desejado: ${body.respostas.tomDeVoz.trim()}`,
    body.respostas.publicoAlvo?.trim() ? `Público-alvo: ${body.respostas.publicoAlvo.trim()}` : null,
    body.respostas.paletaDesejada?.trim() ? `Paleta desejada: ${body.respostas.paletaDesejada.trim()}` : null,
    body.respostas.fontesDesejadas?.trim() ? `Fontes desejadas: ${body.respostas.fontesDesejadas.trim()}` : null,
    body.referencias?.length
      ? `${body.referencias.length} flyer(s) de referência aprovados anexado(s) — use-os para inferir paleta, tipografia, composição e tom.`
      : "Nenhum flyer de referência anexado — baseie-se somente nas respostas acima e seja conservador na confiança.",
  ]
    .filter(Boolean)
    .join("\n");

  const promptCompleto = `${META_PROMPT_BRAND_DNA}\n\nRespostas do formulário:\n${contexto}`;

  try {
    const model = body.model?.trim() || DEFAULT_FREE_TEXT_MODEL;
    const resposta = await callOpenRouterChat(model, promptCompleto, body.referencias ?? [], body.apiKey);
    const json = extrairJson(resposta) as BrandDnaProposta;
    return NextResponse.json({ proposta: json });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao gerar proposta de Brand DNA: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
