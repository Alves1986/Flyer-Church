import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, isDbConfigured, sql } from "@/lib/db";
import { AssetBiblioteca, TipoAsset } from "@/lib/types";

export const runtime = "nodejs";

const DB_DISABLED_MESSAGE =
  "Nenhum banco Postgres conectado a este projeto na Vercel. A biblioteca está sendo salva apenas no navegador (localStorage). Para persistir em banco e usar em múltiplos dispositivos, vá em Vercel → Storage → Postgres e conecte um banco ao projeto.";

interface AssetRow {
  id: string;
  nome: string;
  tipo: string;
  url: string;
  mime_type: string | null;
  criado_em: string;
}

function rowToAsset(row: AssetRow): AssetBiblioteca {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo as TipoAsset,
    url: row.url,
    mimeType: row.mime_type ?? "image/png",
    criadoEm: row.criado_em,
  };
}

/**
 * Biblioteca de logos, fotos e fundos (Fase 1 — docs/product-roadmap.md).
 * Assim como /api/templates, esta rota exige banco Postgres conectado: um
 * item da biblioteca só existe em banco depois de já ter sido enviado ao
 * Vercel Blob (ver /api/upload) e ter uma `url`. Sem banco, `lib/store.ts`
 * usa o localStorage guardando a imagem em base64 — essa rota não recebe
 * base64, só a URL já hospedada.
 */
export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  try {
    await ensureSchema();
    const rows = (await sql`
      select id, nome, tipo, url, mime_type, criado_em
      from assets
      order by criado_em desc;
    `) as AssetRow[];
    return NextResponse.json({ assets: rows.map(rowToAsset) });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao ler a biblioteca no banco: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  let body: AssetBiblioteca;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.id || !body.nome || !body.tipo || !body.url) {
    return NextResponse.json(
      { error: "Envie id, nome, tipo e url (já enviada ao Blob) do item." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    await sql`
      insert into assets (id, nome, tipo, url, mime_type, criado_em)
      values (
        ${body.id},
        ${body.nome},
        ${body.tipo},
        ${body.url},
        ${body.mimeType ?? null},
        ${body.criadoEm ?? new Date().toISOString()}
      )
      on conflict (id) do update set
        nome = excluded.nome,
        tipo = excluded.tipo,
        url = excluded.url,
        mime_type = excluded.mime_type;
    `;
    return NextResponse.json({ asset: body }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao salvar item da biblioteca: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
