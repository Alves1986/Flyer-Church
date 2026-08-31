import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, isDbConfigured, sql } from "@/lib/db";
import { FlyerTemplate, ImageVarKey } from "@/lib/types";

export const runtime = "nodejs";

const DB_DISABLED_MESSAGE =
  "Nenhum banco Postgres conectado a este projeto na Vercel. Este template só existe no localStorage deste navegador.";

interface TemplateRow {
  id: string;
  nome: string;
  prompt_extraido: string;
  thumbnail_url: string | null;
  variaveis_texto: string[];
  variaveis_imagem: string[];
  categoria: string | null;
  criado_em: string;
}

function rowToTemplate(row: TemplateRow): FlyerTemplate {
  return {
    id: row.id,
    nome: row.nome,
    criadoEm: row.criado_em,
    promptExtraido: row.prompt_extraido,
    thumbnailBase64: row.thumbnail_url ?? undefined,
    variaveisTexto: row.variaveis_texto,
    variaveisImagem: row.variaveis_imagem as ImageVarKey[],
    categoria: (row.categoria as FlyerTemplate["categoria"]) ?? undefined,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  try {
    await ensureSchema();
    const rows = (await sql`
      select id, nome, prompt_extraido, thumbnail_url, variaveis_texto, variaveis_imagem, categoria, criado_em
      from templates where id = ${params.id};
    `) as TemplateRow[];
    if (rows.length === 0) {
      return NextResponse.json({ error: "Template não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ template: rowToTemplate(rows[0]) });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao ler template do banco: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  try {
    await ensureSchema();
    await sql`delete from templates where id = ${params.id};`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao excluir template: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
