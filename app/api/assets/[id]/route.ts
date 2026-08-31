import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, isDbConfigured, sql } from "@/lib/db";

export const runtime = "nodejs";

const DB_DISABLED_MESSAGE =
  "Nenhum banco Postgres conectado a este projeto na Vercel. Este item só existe no localStorage deste navegador.";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  try {
    await ensureSchema();
    await sql`delete from assets where id = ${params.id};`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao excluir item da biblioteca: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
