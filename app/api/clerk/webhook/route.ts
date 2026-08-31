import { Webhook } from "svix";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ensureSchema, sql } from "@/lib/db";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.warn("[Clerk Webhook] CLERK_WEBHOOK_SECRET não configurado — webhooks serão ignorados");
}

export async function POST(req: Request) {
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret não configurado" }, { status: 501 });
  }

  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Headers Svix ausentes" }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: { type: string; data: Record<string, unknown> };

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("[Clerk Webhook] Falha na verificação:", err);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const { type, data } = evt;

  try {
    await ensureSchema();

    switch (type) {
      case "organization.created": {
        const org = data as {
          id: string;
          name: string;
          slug: string | null;
          public_metadata?: Record<string, unknown>;
        };
        await sql`
          insert into organizations (clerk_org_id, name, slug, denomination, team_size)
          values (${org.id}, ${org.name}, ${org.slug ?? org.id}, ${org.public_metadata?.denomination ?? null}, ${org.public_metadata?.team_size ?? null})
          on conflict (clerk_org_id) do update set
            name = excluded.name,
            slug = excluded.slug,
            denomination = excluded.denomination,
            team_size = excluded.team_size,
            updated_at = now();
        `;
        break;
      }

      case "organization.updated": {
        const org = data as {
          id: string;
          name: string;
          slug: string | null;
          public_metadata?: Record<string, unknown>;
        };
        await sql`
          update organizations set
            name = ${org.name},
            slug = ${org.slug ?? org.id},
            denomination = ${org.public_metadata?.denomination ?? null},
            team_size = ${org.public_metadata?.team_size ?? null},
            updated_at = now()
          where clerk_org_id = ${org.id};
        `;
        break;
      }

      case "organization.deleted": {
        const org = data as { id: string };
        await sql`delete from organizations where clerk_org_id = ${org.id};`;
        break;
      }

      case "organizationMembership.created": {
        const membership = data as {
          organization_id: string;
          public_user_data?: { user_id: string };
          role: string;
        };
        await sql`
          insert into organization_members (organization_id, user_id, role)
          select id, ${membership.public_user_data?.user_id ?? ""}, ${membership.role}
          from organizations
          where clerk_org_id = ${membership.organization_id}
          on conflict (organization_id, user_id) do update set role = excluded.role;
        `;
        break;
      }

      case "organizationMembership.updated": {
        const membership = data as {
          organization_id: string;
          public_user_data?: { user_id: string };
          role: string;
        };
        await sql`
          update organization_members
          set role = ${membership.role}
          where organization_id = (select id from organizations where clerk_org_id = ${membership.organization_id})
            and user_id = ${membership.public_user_data?.user_id ?? ""};
        `;
        break;
      }

      case "organizationMembership.deleted": {
        const membership = data as {
          organization_id: string;
          public_user_data?: { user_id: string };
        };
        await sql`
          delete from organization_members
          where organization_id = (select id from organizations where clerk_org_id = ${membership.organization_id})
            and user_id = ${membership.public_user_data?.user_id ?? ""};
        `;
        break;
      }

      case "user.created": {
        break;
      }

      case "user.deleted": {
        break;
      }

      default:
        console.log(`[Clerk Webhook] Evento não tratado: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Clerk Webhook] Erro ao processar:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}