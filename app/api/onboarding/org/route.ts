import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSchema, sql, isDbConfigured } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { name: string; slug: string; denomination?: string; teamSize?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { name, slug, denomination, teamSize } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 });
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Slug inválido. Use apenas letras minúsculas, números e hífens" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Banco não configurado. Configure DATABASE_URL na Vercel." }, { status: 501 });
  }

  try {
    await ensureSchema();

    const existing = await sql`
      select id from organizations where slug = ${slug} limit 1
    `;
    if ((existing as Array<Record<string, unknown>>).length > 0) {
      return NextResponse.json({ error: "Slug já em uso" }, { status: 409 });
    }

    const result = await sql`
      insert into organizations (clerk_org_id, name, slug, denomination, team_size)
      values (${userId}, ${name.trim()}, ${slug.toLowerCase()}, ${denomination ?? null}, ${teamSize ?? null})
      returning id, clerk_org_id
    `;

    const org = (result as Array<Record<string, unknown>>)[0];

    await sql`
      insert into organization_members (organization_id, user_id, role)
      values (${org.id}, ${userId}, 'owner')
    `;

    await sql`
      insert into audit_logs (organization_id, user_id, action, resource_type, metadata)
      values (${org.id}, ${userId}, 'org_created', 'organization', ${JSON.stringify({ name, slug })})
    `;

    return NextResponse.json({ organization: { id: org.id, clerkOrgId: org.clerk_org_id } });
  } catch (err) {
    console.error("[Onboarding Org] Erro:", err);
    return NextResponse.json({ error: "Erro ao criar organização" }, { status: 500 });
  }
}