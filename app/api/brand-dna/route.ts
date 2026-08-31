import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, isDbConfigured, sql } from "@/lib/db";
import { BrandDna } from "@/lib/types";

export const runtime = "nodejs";

const DB_DISABLED_MESSAGE =
  "Nenhum banco Postgres conectado a este projeto na Vercel. O Brand DNA está sendo salvo apenas no navegador (localStorage).";

// Sem multi-tenancy ainda (Fase 3 — organizações), guardamos um único
// perfil por instalação. Quando organizações existirem, este id vira o
// organizationId real e a rota passa a exigir autenticação.
const BRAND_DNA_ID = "default";

interface BrandDnaRow {
  dados: BrandDna;
}

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  try {
    await ensureSchema();
    const rows = (await sql`
      select dados from brand_dna where id = ${BRAND_DNA_ID};
    `) as BrandDnaRow[];
    return NextResponse.json({ brandDna: rows[0]?.dados ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao ler Brand DNA do banco: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  let body: BrandDna;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.name && body.name !== "") {
    return NextResponse.json({ error: "Envie o objeto Brand DNA completo." }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`
      insert into brand_dna (id, dados, atualizado_em)
      values (${BRAND_DNA_ID}, ${JSON.stringify(body)}::jsonb, now())
      on conflict (id) do update set
        dados = excluded.dados,
        atualizado_em = now();
    `;
    return NextResponse.json({ brandDna: body }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao salvar Brand DNA no banco: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
