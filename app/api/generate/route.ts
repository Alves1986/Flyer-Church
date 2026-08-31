import { NextRequest, NextResponse } from "next/server";
import { getRequestOrgId, getRequestUserId } from "@/lib/auth";
import { requireCredits } from "@/lib/billing";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ReferenceImage {
  base64: string;
  mimeType: string;
}

interface GenerateBody {
  prompt: string;
  images: ReferenceImage[];
  templateId?: string;
}

const MODEL = "gemini-2.5-flash-image";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "GOOGLE_API_KEY não configurada no ambiente. Adicione essa variável nas configurações do projeto na Vercel para habilitar a geração.",
      },
      { status: 501 }
    );
  }

  const orgId = await getRequestOrgId();
  const userId = await getRequestUserId();

  if (!orgId || !userId) {
    return NextResponse.json(
      { error: "Não autenticado. Faça login para gerar flyers." },
      { status: 401 }
    );
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "Envie o prompt final." }, { status: 400 });
  }

  try {
    await requireCredits(orgId, userId, "generation", { templateId: body.templateId });
  } catch (err: any) {
    if (err.statusCode === 402) {
      return NextResponse.json(
        {
          error: err.message,
          code: "INSUFFICIENT_CREDITS",
          balance: err.balance,
        },
        { status: 402 }
      );
    }
    throw err;
  }

  const imageParts = (body.images ?? []).map((img) => ({
    inline_data: { mime_type: img.mimeType, data: img.base64 },
  }));

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: body.prompt }, ...imageParts],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();

      const semCotaGratuita =
        response.status === 429 &&
        (detail.includes("RESOURCE_EXHAUSTED") || detail.includes("free_tier"));

      if (semCotaGratuita) {
        return NextResponse.json(
          {
            error:
              "A API do Gemini recusou a chamada por falta de cota gratuita para o modelo gemini-2.5-flash-image (HTTP 429, RESOURCE_EXHAUSTED, limite do tier grátis é 0 para este modelo). Isso não é um problema de chave inválida: é preciso habilitar faturamento (billing) no projeto do Google Cloud vinculado à GOOGLE_API_KEY em console.cloud.google.com ou ai.google.dev/pricing. A extração de template via OpenRouter continua funcionando normalmente sem custo.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: `Falha na chamada de geração (${response.status}): ${detail}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: unknown }) => p.inlineData);

    if (!imagePart) {
      const textPart = parts.find((p: { text?: string }) => p.text);
      return NextResponse.json(
        {
          error:
            textPart?.text ??
            "O modelo não retornou uma imagem. Ajuste o prompt e tente novamente.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType ?? "image/png",
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro inesperado na geração: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}