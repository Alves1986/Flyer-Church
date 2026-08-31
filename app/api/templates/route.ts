import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, isDbConfigured, sql } from "@/lib/db";
import { FlyerTemplate, ImageVarKey } from "@/lib/types";

export const runtime = "nodejs";

const DB_DISABLED_MESSAGE =
  "Nenhum banco Postgres conectado a este projeto na Vercel. Os templates estão sendo salvos apenas no navegador (localStorage). Para persistir em banco e usar em múltiplos dispositivos, vá em Vercel → Storage → Postgres e conecte um banco ao projeto.";

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

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  try {
    await ensureSchema();
    const rows = (await sql`
      select id, nome, prompt_extraido, thumbnail_url, variaveis_texto, variaveis_imagem, categoria, criado_em
      from templates
      order by criado_em desc;
    `) as TemplateRow[];
    return NextResponse.json({ templates: rows.map(rowToTemplate) });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao ler templates do banco: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  let body: FlyerTemplate;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.id || !body.nome || !body.promptExtraido) {
    return NextResponse.json(
      { error: "Envie id, nome e promptExtraido do template." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    await sql`
      insert into templates (id, nome, prompt_extraido, thumbnail_url, variaveis_texto, variaveis_imagem, categoria, criado_em)
      values (
        ${body.id},
        ${body.nome},
        ${body.promptExtraido},
        ${body.thumbnailBase64 ?? null},
        ${body.variaveisTexto},
        ${body.variaveisImagem},
        ${body.categoria ?? null},
        ${body.criadoEm ?? new Date().toISOString()}
      )
      on conflict (id) do update set
        nome = excluded.nome,
        prompt_extraido = excluded.prompt_extraido,
        thumbnail_url = excluded.thumbnail_url,
        variaveis_texto = excluded.variaveis_texto,
        variaveis_imagem = excluded.variaveis_imagem,
        categoria = excluded.categoria;
    `;
    return NextResponse.json({ template: body }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao salvar template no banco: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
