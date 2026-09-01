import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ensureSchema, sql, isDbConfigured, setOrgContext } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json({ error: "Não autenticado ou sem organização" }, { status: 401 });
  }

  if (!["owner", "admin"].includes(orgRole ?? "")) {
    return NextResponse.json({ error: "Permissão insuficiente" }, { status: 403 });
  }

  let body: { email: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const { email, role = "designer" } = body;

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
      values (${orgId}::uuid, ${userId}, 'member_invited', 'organization_member', ${invitation.id}, ${JSON.stringify({ email, role })})
    `;

    return NextResponse.json({ invitationId: invitation.id, email });
  } catch (err) {
    console.error("[Onboarding Invite] Erro:", err);
    return NextResponse.json({ error: "Erro ao convidar membro" }, { status: 500 });
  }
}