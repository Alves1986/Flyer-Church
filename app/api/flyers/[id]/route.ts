import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, isDbConfigured, sql } from "@/lib/db";
import { StatusFlyer } from "@/lib/types";

export const runtime = "nodejs";

const DB_DISABLED_MESSAGE =
  "Nenhum banco Postgres conectado a este projeto na Vercel. O status deste flyer não pôde ser salvo — a avaliação fica só nesta tela.";

const STATUS_VALIDOS: StatusFlyer[] = ["rascunho", "gerado", "aprovado", "rejeitado", "publicado"];

interface UpdateFlyerBody {
  status?: string;
  avaliacao?: number;
  motivoRejeicao?: string;
}

/**
 * Atualiza status/avaliação/motivo de rejeição de um flyer já gerado
 * (Fase 1 — docs/product-roadmap.md). Rota best-effort do ponto de vista do
 * cliente (ver `updateGeneratedFlyer` em lib/store.ts): se não houver banco,
 * responde 501 e a tela mantém a mudança só localmente.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  let body: UpdateFlyerBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (body.status !== undefined && !STATUS_VALIDOS.includes(body.status as StatusFlyer)) {
    return NextResponse.json(
      { error: `Status inválido. Use um de: ${STATUS_VALIDOS.join(", ")}.` },
      { status: 400 }
    );
  }

  if (body.avaliacao !== undefined && (body.avaliacao < 1 || body.avaliacao > 5)) {
    return NextResponse.json({ error: "avaliacao deve ser um número de 1 a 5." }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`
      update flyers_gerados set
        status = coalesce(${body.status ?? null}, status),
        avaliacao = coalesce(${body.avaliacao ?? null}, avaliacao),
        motivo_rejeicao = coalesce(${body.motivoRejeicao ?? null}, motivo_rejeicao)
      where id = ${params.id};
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao atualizar flyer: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
