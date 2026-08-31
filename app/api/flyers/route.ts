import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, isDbConfigured, sql } from "@/lib/db";

export const runtime = "nodejs";

const DB_DISABLED_MESSAGE =
  "Nenhum banco Postgres conectado a este projeto na Vercel. O histórico de flyers gerados não está sendo salvo.";

interface SaveFlyerBody {
  id: string;
  templateId: string;
  promptFinal: string;
  campos?: Record<string, string>;
  imagemUrl?: string;
  formatoId?: string;
  status?: string;
  criadoEm?: string;
}

interface FlyerRow {
  id: string;
  template_id: string;
  campos: Record<string, string>;
  prompt_final: string;
  imagem_url: string | null;
  formato_id: string | null;
  status: string;
  avaliacao: number | null;
  motivo_rejeicao: string | null;
  criado_em: string;
}

function rowToFlyer(row: FlyerRow) {
  return {
    id: row.id,
    templateId: row.template_id,
    criadoEm: row.criado_em,
    promptFinal: row.prompt_final,
    imagemUrl: row.imagem_url ?? undefined,
    campos: row.campos ?? {},
    formatoId: row.formato_id ?? undefined,
    status: row.status,
    avaliacao: row.avaliacao ?? undefined,
    motivoRejeicao: row.motivo_rejeicao ?? undefined,
  };
}

/**
 * Registro de histórico opcional (tabela flyers_gerados). Chamado em
 * "fire-and-forget" depois de uma geração bem-sucedida — se não houver
 * banco conectado, essa chamada simplesmente não persiste nada e o app
 * segue funcionando normalmente (o resultado já foi mostrado ao usuário).
 */
export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  let body: SaveFlyerBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  if (!body.id || !body.templateId || !body.promptFinal) {
    return NextResponse.json(
      { error: "Envie id, templateId e promptFinal." },
      { status: 400 }
    );
  }

  try {
    await ensureSchema();
    await sql`
      insert into flyers_gerados (id, template_id, campos, prompt_final, imagem_url, formato_id, status, criado_em)
      values (
        ${body.id},
        ${body.templateId},
        ${JSON.stringify(body.campos ?? {})}::jsonb,
        ${body.promptFinal},
        ${body.imagemUrl ?? null},
        ${body.formatoId ?? null},
        ${body.status ?? "gerado"},
        ${body.criadoEm ?? new Date().toISOString()}
      )
      on conflict (id) do nothing;
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao salvar flyer gerado: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: DB_DISABLED_MESSAGE }, { status: 501 });
  }

  const templateId = req.nextUrl.searchParams.get("templateId");

  try {
    await ensureSchema();
    const rows = (templateId
      ? await sql`
          select id, template_id, campos, prompt_final, imagem_url, formato_id, status, avaliacao, motivo_rejeicao, criado_em
          from flyers_gerados where template_id = ${templateId}
          order by criado_em desc;
        `
      : await sql`
          select id, template_id, campos, prompt_final, imagem_url, formato_id, status, avaliacao, motivo_rejeicao, criado_em
          from flyers_gerados order by criado_em desc limit 50;
        `) as FlyerRow[];
    return NextResponse.json({ flyers: rows.map(rowToFlyer) });
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao ler flyers gerados: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
