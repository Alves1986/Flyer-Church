import { NextRequest, NextResponse } from "next/server";
import { getRequestOrgId, getRequestUserId } from "@/lib/auth";
import { requireCredits } from "@/lib/billing";
import type { ExportOptions, FormatoPresetId } from "@/lib/text-renderer-types";
import { getFormatoPreset } from "@/lib/formatos";
import type { TextRenderResult } from "@/lib/text-renderer-types";

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
  textLayers?: any[];
  textValues?: Record<string, string>;
  formatoId?: "feed" | "quadrado" | "story" | "whatsapp";
  exportOptions?: ExportOptions;
  brandPalette?: string[];
  validateColors?: boolean;
}

const MODEL = "gemini-2.5-flash-image";

const TEXT_REMOVAL_HINTS = `
IMPORTANTE — NÃO INCLUA TEXTO NA IMAGEM:
- Não desenhe nenhum texto, título, data, nome, versículo ou número na imagem.
- A imagem deve conter APENAS o fundo, cenário, atmosfera, iluminação, composição e elementos gráficos decorativos.
- O texto será adicionado depois por uma camada separada com posicionamento preciso.
- Deixe áreas livres (espaço negativo) onde o texto será posicionado.
`.trim();

async function renderTextLayersIfAvailable(
  baseImageBase64: string,
  textLayers: any[],
  values: Record<string, string>,
  formatoId: "feed" | "quadrado" | "story" | "whatsapp" = "feed",
  exportOptions: ExportOptions = {}
): Promise<{ base64: string; mimeType: string; width: number; height: number; textRendered: boolean } | null> {
  try {
    const textRenderer = await import("@/lib/text-renderer");
    const rendered = await textRenderer.renderTextLayers(baseImageBase64, textLayers, values, formatoId, exportOptions);
    return { ...rendered, textRendered: true };
  } catch (err) {
    console.warn("Text layer rendering not available, skipping:", err);
    return null;
  }
}

async function validateColorsIfRequested(
  baseImageBase64: string,
  brandPalette: string[] | undefined,
  validateColors: boolean | undefined
): Promise<{ passed: boolean; deltaE: number } | null> {
  if (!validateColors || !brandPalette?.length) return null;
  try {
    const textRenderer = await import("@/lib/text-renderer");
    const result = await textRenderer.validateBrandColors(baseImageBase64, brandPalette);
    return { passed: result.passed, deltaE: result.deltaE };
  } catch (err) {
    console.warn("Color validation failed:", err);
    return null;
  }
}

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

  const promptForAI = `${body.prompt}\n\n${TEXT_REMOVAL_HINTS}`;

  // --- Geração via Pollinations.ai (Gratuito e Sem Chave) ---
  try {
    const formato = getFormatoPreset(body.formatoId || "feed");
    const encodedPrompt = encodeURIComponent(promptForAI);
    const width = formato.larguraPx;
    const height = formato.alturaPx;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    const response = await fetch(pollinationsUrl);
    if (!response.ok) throw new Error(`Erro ao buscar imagem do Pollinations: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const baseImageBase64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/png";

    const colorValidation = await validateColorsIfRequested(
      baseImageBase64,
      body.brandPalette,
      body.validateColors
    );

    if (body.textLayers && body.textLayers.length > 0 && body.textValues) {
      const rendered = await renderTextLayersIfAvailable(
        baseImageBase64,
        body.textLayers,
        body.textValues,
        body.formatoId || "feed",
        body.exportOptions
      );
      if (rendered) {
        return NextResponse.json({
          imageBase64: rendered.base64,
          mimeType: rendered.mimeType,
          width: rendered.width,
          height: rendered.height,
          textRendered: true,
          colorValidation,
        });
      }
    }

    return NextResponse.json({
      imageBase64: baseImageBase64,
      mimeType: mimeType as TextRenderResult["mimeType"],
      textRendered: false,
      colorValidation,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro inesperado na geração via Pollinations: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}