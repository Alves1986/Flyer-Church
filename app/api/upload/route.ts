import { NextRequest, NextResponse } from "next/server";
import { isBlobConfigured, uploadBase64ToBlob } from "@/lib/blob";

export const runtime = "nodejs";
export const maxDuration = 30;

interface UploadBody {
  filename: string;
  base64: string;
  mimeType: string;
}

/**
 * Upload opcional para o Vercel Blob. Usado para persistir logos, fotos de
 * preletor e flyers gerados quando você quer manter histórico em banco
 * (ver /api/templates e /api/flyers). Sem BLOB_READ_WRITE_TOKEN configurado
 * (Vercel → Storage → Blob), retorna 501 e o app continua funcionando com
 * as imagens embutidas como base64, como hoje.
 */
export async function POST(req: NextRequest) {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Nenhum Vercel Blob conectado a este projeto. Adicione um Blob store em Vercel → Storage → Blob para persistir imagens.",
      },
      { status: 501 }
    );
  }

  let body: UploadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.base64 || !body.mimeType || !body.filename) {
    return NextResponse.json(
      { error: "Envie filename, base64 e mimeType." },
      { status: 400 }
    );
  }

  try {
    const url = await uploadBase64ToBlob(body.filename, body.base64, body.mimeType);
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Falha no upload para o Blob: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
