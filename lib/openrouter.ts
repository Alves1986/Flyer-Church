/**
 * Integração com a OpenRouter (openrouter.ai) — usada como alternativa
 * gratuita à Anthropic na etapa de extração (visão) em `/api/extract`.
 *
 * A OpenRouter expõe uma API compatível com o formato da OpenAI
 * (`/api/v1/chat/completions`), incluindo modelos com entrada de imagem.
 * Alguns modelos são gratuitos (id termina em ":free", pricing 0) — é isso
 * que listamos em `/api/openrouter-models` para o seletor no formulário.
 *
 * Ainda é necessária uma chave (`OPENROUTER_API_KEY`, grátis em
 * openrouter.ai/keys) mesmo para os modelos gratuitos — mas nenhum cartão
 * é cobrado neles. Limite do tier grátis: ~20 req/min e 50 req/dia (sobe
 * para 1000/dia depois de adicionar US$10 de crédito, mesmo sem gastá-lo).
 */
export const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
export const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Lista de reserva caso a API pública de modelos da OpenRouter esteja fora do ar. */
export const FALLBACK_FREE_VISION_MODELS: OpenRouterModel[] = [
  {
    id: "thinkingmachines/inkling:free",
    name: "Thinking Machines: Inkling (free)",
    contextLength: 1048576,
  },
  {
    id: "thinkingmachines/inkling-small:free",
    name: "Thinking Machines: Inkling Small (free)",
    contextLength: 1048576,
  },
  {
    id: "dots-studio/dots-3-note-preview:free",
    name: "Dots3-Note Preview (free)",
    contextLength: 512000,
  },
];

export interface OpenRouterModel {
  id: string;
  name: string;
  contextLength: number;
}

interface RawOpenRouterModel {
  id: string;
  name: string;
  context_length?: number;
  architecture?: { input_modalities?: string[] };
  pricing?: { prompt?: string; completion?: string };
}

export function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

/** Busca no catálogo público da OpenRouter os modelos gratuitos com suporte a imagem. */
export async function listFreeVisionModels(): Promise<{
  models: OpenRouterModel[];
  source: "live" | "fallback";
}> {
  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      // catálogo é público — não precisa de chave para listar
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { data: RawOpenRouterModel[] };
    const models = (data.data ?? [])
      .filter(
        (m) =>
          m.id.endsWith(":free") &&
          m.pricing?.prompt === "0" &&
          m.pricing?.completion === "0" &&
          m.architecture?.input_modalities?.includes("image")
      )
      .map((m) => ({
        id: m.id,
        name: m.name,
        contextLength: m.context_length ?? 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (models.length === 0) throw new Error("nenhum modelo grátis com visão encontrado");
    return { models, source: "live" };
  } catch {
    return { models: FALLBACK_FREE_VISION_MODELS, source: "fallback" };
  }
}

/** Chama um modelo de visão da OpenRouter com uma imagem + prompt de texto. */
export async function callOpenRouterVision(
  model: string,
  imageBase64: string,
  mimeType: string,
  promptText: string,
  apiKeyOverride?: string
): Promise<string> {
  // Chave colada pelo usuário no formulário (salva só no navegador dele) tem
  // prioridade sobre a variável de ambiente do servidor.
  const apiKey = apiKeyOverride?.trim() || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      // recomendado pela OpenRouter para identificar a app nos limites de uso
      "http-referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://flyerchurch.vercel.app",
      "x-title": "FlyerForge",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: "text", text: promptText },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha na chamada à OpenRouter (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("A resposta do modelo não trouxe texto de prompt.");
  }
  return content.trim();
}

/** Modelo de texto gratuito usado como padrão para tarefas que não exigem visão (ex: proposta de Brand DNA). */
export const DEFAULT_FREE_TEXT_MODEL = "thinkingmachines/inkling:free";

/**
 * Chama um modelo da OpenRouter com um prompt de texto e, opcionalmente,
 * uma ou mais imagens de referência (usado pela proposta de Brand DNA —
 * Fase 2). Diferente de `callOpenRouterVision`, aceita zero imagens.
 */
export async function callOpenRouterChat(
  model: string,
  promptText: string,
  imagens: { base64: string; mimeType: string }[] = [],
  apiKeyOverride?: string
): Promise<string> {
  const apiKey = apiKeyOverride?.trim() || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY não configurada.");
  }

  const imageParts = imagens.map((img) => ({
    type: "image_url" as const,
    image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
  }));

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "http-referer": process.env.NEXT_PUBLIC_SITE_URL ?? "https://flyerchurch.vercel.app",
      "x-title": "FlyerForge",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [...imageParts, { type: "text", text: promptText }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha na chamada à OpenRouter (${res.status}): ${detail}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("A resposta do modelo não trouxe conteúdo de texto.");
  }
  return content.trim();
}
