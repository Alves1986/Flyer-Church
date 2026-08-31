import { NextRequest, NextResponse } from "next/server";
import { META_PROMPT_EXTRACAO } from "@/lib/metaPrompt";
import { callOpenRouterVision, isOpenRouterConfigured } from "@/lib/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ExtractBody {
  imageBase64: string; // sem o prefixo data:...;base64,
  mimeType: string;
  /** "openrouter" (grátis, padrão) ou "anthropic" (precisa de chave). */
  provider?: "openrouter" | "anthropic";
  /** id do modelo da OpenRouter selecionado no formulário (ex: "thinkingmachines/inkling:free"). */
  model?: string;
  /**
   * Chave de API colada pelo próprio usuário no formulário (salva no
   * localStorage do navegador dele). Tem prioridade sobre a variável de
   * ambiente do servidor (OPENROUTER_API_KEY / ANTHROPIC_API_KEY) — assim
   * quem não configurou nada na Vercel ainda consegue usar o app com a
   * própria chave, sem precisar de deploy.
   */
  apiKey?: string;
}

async function extractWithAnthropic(
  imageBase64: string,
  mimeType: string,
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = apiKeyOverride?.trim() || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new NoProviderConfiguredError(
      "Nenhuma chave da Anthropic configurada. Cole sua chave no campo abaixo do seletor de modelo, ou adicione ANTHROPIC_API_KEY nas configurações do projeto na Vercel — ou troque para o provedor OpenRouter (grátis) no seletor de modelo."
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: imageBase64 } },
            { type: "text", text: META_PROMPT_EXTRACAO },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Falha na chamada à Anthropic (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === "text");
  const prompt: string | undefined = textBlock?.text;
  if (!prompt) {
    throw new Error("A resposta do modelo não trouxe texto de prompt.");
  }
  return prompt.trim();
}

class NoProviderConfiguredError extends Error {}

export async function POST(req: NextRequest) {
  let body: ExtractBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.imageBase64 || !body.mimeType) {
    return NextResponse.json(
      { error: "Envie imageBase64 e mimeType da imagem de referência." },
      { status: 400 }
    );
  }

  // Padrão: OpenRouter (grátis). Só usa Anthropic se explicitamente selecionado.
  const provider = body.provider === "anthropic" ? "anthropic" : "openrouter";

  try {
    if (provider === "anthropic") {
      const prompt = await extractWithAnthropic(body.imageBase64, body.mimeType, body.apiKey);
      return NextResponse.json({ prompt });
    }

    if (!isOpenRouterConfigured() && !body.apiKey?.trim()) {
      return NextResponse.json(
        {
          error:
            "Nenhuma chave da OpenRouter configurada. Crie uma chave grátis em openrouter.ai/keys e cole no campo abaixo do seletor de modelo (fica salva só neste navegador) — ou adicione OPENROUTER_API_KEY em Vercel → Project Settings → Environment Variables.",
        },
        { status: 501 }
      );
    }

    const model = body.model?.trim() || "thinkingmachines/inkling:free";
    const prompt = await callOpenRouterVision(
      model,
      body.imageBase64,
      body.mimeType,
      META_PROMPT_EXTRACAO,
      body.apiKey
    );
    return NextResponse.json({ prompt });
  } catch (err) {
    if (err instanceof NoProviderConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 501 });
    }
    return NextResponse.json(
      { error: `Erro inesperado na extração: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
