import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSchema, sql, isDbConfigured, setOrgContext } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Não autenticado ou sem organização" }, { status: 401 });
  }

  if (!["owner", "admin"].includes(orgRole ?? "")) {
    return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Banco não configurado" }, { status: 501 });
  }

  try {
    await ensureSchema();
    await setOrgContext(orgId);

    const membersResult = await sql`
      select om.*, u.email_addresses, u.first_name, u.last_name, u.image_url
      from organization_members om
      left join lateral (
        select email_addresses, first_name, last_name, image_url
        from jsonb_array_elements(
          (select raw_json from clerk_users where user_id = om.user_id limit 1)
        ) as u
      ) u on true
      where om.organization_id = (select id from organizations where clerk_org_id = ${orgId})
    `;

    const members = (membersResult as Array<Record<string, unknown>>).map((m) => {
      const emails = (m.email_addresses as Array<{ email_address: string }>) ?? [];
      return {
        id: m.id,
        userId: m.user_id,
        email: emails[0]?.email_address ?? m.user_id,
        firstName: m.first_name as string | null,
        lastName: m.last_name as string | null,
        imageUrl: m.image_url as string | null,
        role: m.role as "owner" | "admin" | "designer" | "editor" | "viewer",
        status: "active" as const,
        createdAt: m.created_at as string,
      };
    });

    return NextResponse.json({ members });
  } catch (err) {
    console.error("[Equipe GET] Erro:", err);
    return NextResponse.json({ error: "Erro ao buscar membros" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Não autenticado ou sem organização" }, { status: 401 });
  }

  if (!["owner", "admin"].includes(orgRole ?? "")) {
    return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
  }

  let body: { orgId: string; email: string; role: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { email, role } = body;

  if (!email?.trim() || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const validRoles = ["owner", "admin", "designer", "editor", "viewer"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Role inválida" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Banco não configurado" }, { status: 501 });
  }

  try {
    await ensureSchema();
    await setOrgContext(orgId);

    const { createClerkClient } = await import("@clerk/nextjs/server");
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email.trim(),
      publicMetadata: { role, organizationId: orgId },
      redirectUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/sign-up`,
    });

    await sql`
      insert into audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
      values ((select id from organizations where clerk_org_id = ${orgId}), ${userId}, 'member_invited', 'organization_member', ${invitation.id}, ${JSON.stringify({ email, role })})
    `;

    return NextResponse.json({ invitationId: invitation.id, email });
  } catch (err) {
    console.error("[Equipe POST] Erro:", err);
    return NextResponse.json({ error: "Erro ao convidar membro" }, { status: 500 });
  }
}