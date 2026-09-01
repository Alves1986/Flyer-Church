import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSchema, sql, isDbConfigured, setOrgContext } from "@/lib/db";

const ROLE_HIERARCHY = ["owner", "admin", "designer", "editor", "viewer"] as const;

function canManage(currentRole: string, targetRole: string): boolean {
  const currentLevel = ROLE_HIERARCHY.indexOf(currentRole as any);
  const targetLevel = ROLE_HIERARCHY.indexOf(targetRole as any);
  return currentLevel !== -1 && targetLevel !== -1 && currentLevel < targetLevel;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Não autenticado ou sem organização" }, { status: 401 });
  }

  if (!["owner", "admin"].includes(orgRole ?? "")) {
    return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
  }

  const memberId = params.id;

  let body: { orgId: string; role: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { role } = body;
  const validRoles = ["owner", "admin", "designer", "editor", "viewer"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Role inválida" }, { status: 400 });
  }

  if (!canManage(orgRole ?? "", role)) {
    return NextResponse.json({ error: "Não pode atribuir role igual ou superior à sua" }, { status: 403 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Banco não configurado" }, { status: 501 });
  }

  try {
    await ensureSchema();
    await setOrgContext(orgId);

    const targetMember = await sql`
      select om.*, o.clerk_org_id
      from organization_members om
      join organizations o on o.id = om.organization_id
      where om.id = ${memberId}::uuid and o.clerk_org_id = ${orgId}
      limit 1
    `;

    if ((targetMember as Array<Record<string, unknown>>).length === 0) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    const target = (targetMember as Array<Record<string, unknown>>)[0];
    const targetUserId = target.user_id as string;
    const targetRole = target.role as string;

    if (!canManage(orgRole ?? "", targetRole)) {
      return NextResponse.json({ error: "Não pode alterar role de membro com role igual ou superior" }, { status: 403 });
    }

    await sql`
      update organization_members set role = ${role} where id = ${memberId}::uuid
    `;

    await sql`
      insert into audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
      values ((select id from organizations where clerk_org_id = ${orgId}), ${userId}, 'member_role_changed', 'organization_member', ${memberId}, ${JSON.stringify({ oldRole: targetRole, newRole: role })})
    `;

    const { createClerkClient } = await import("@clerk/nextjs/server");
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerk.users.updateUserMetadata(targetUserId, { publicMetadata: { role, organizationId: orgId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Equipe PATCH] Erro:", err);
    return NextResponse.json({ error: "Erro ao alterar role" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Não autenticado ou sem organização" }, { status: 401 });
  }

  if (!["owner", "admin"].includes(orgRole ?? "")) {
    return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
  }

  const memberId = params.id;

  let body: { orgId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Banco não configurado" }, { status: 501 });
  }

  try {
    await ensureSchema();
    await setOrgContext(orgId);

    const targetMember = await sql`
      select om.*, o.clerk_org_id
      from organization_members om
      join organizations o on o.id = om.organization_id
      where om.id = ${memberId}::uuid and o.clerk_org_id = ${orgId}
      limit 1
    `;

    if ((targetMember as Array<Record<string, unknown>>).length === 0) {
      return NextResponse.json({ error: "Membro não encontrado" }, { status: 404 });
    }

    const target = (targetMember as Array<Record<string, unknown>>)[0];
    const targetUserId = target.user_id as string;
    const targetRole = target.role as string;

    if (targetRole === "owner") {
      return NextResponse.json({ error: "Não pode remover o proprietário" }, { status: 403 });
    }

    if (!canManage(orgRole ?? "", target.role as string)) {
      return NextResponse.json({ error: "Não pode remover membro com role igual ou superior" }, { status: 403 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ error: "Não pode remover a si mesmo" }, { status: 403 });
    }

    await sql`delete from organization_members where id = ${memberId}::uuid`;

    await sql`
      insert into audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata)
      values ((select id from organizations where clerk_org_id = ${orgId}), ${userId}, 'member_removed', 'organization_member', ${memberId}, ${JSON.stringify({ removedUserId: targetUserId, removedRole: targetRole })})
    `;

    const { createClerkClient } = await import("@clerk/nextjs/server");
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    await clerk.organizations.deleteOrganizationMembership({ organizationId: orgId, userId: targetUserId });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Equipe DELETE] Erro:", err);
    return NextResponse.json({ error: "Erro ao remover membro" }, { status: 500 });
  }
}