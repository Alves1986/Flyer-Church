import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Paddle, Environment } from "@paddle/paddle-node-sdk";
import { ensureSchema, sql, isDbConfigured, setOrgContext } from "@/lib/db";
import { getPlanByPaddleProductId, updateOrgPlan } from "@/lib/billing";

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;

if (!PADDLE_WEBHOOK_SECRET) {
  console.warn("[Paddle Webhook] PADDLE_WEBHOOK_SECRET não configurado");
}

export async function POST(req: Request) {
  if (!PADDLE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook secret não configurado" }, { status: 501 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Banco não configurado" }, { status: 501 });
  }

  const headersList = await headers();
  const signature = headersList.get("paddle-signature");

  if (!signature) {
    return NextResponse.json({ error: "Assinatura Paddle ausente" }, { status: 400 });
  }

  const body = await req.text();

  const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
    environment: (process.env.PADDLE_ENV as Environment) ?? Environment.sandbox,
  });

  let event;
  try {
    event = await paddle.webhooks.unmarshal(body, signature, PADDLE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Paddle Webhook] Falha na verificação:", err);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const eventType = event.eventType;
  const eventData = event.data;

  console.log(`[Paddle Webhook] Evento: ${eventType}`);

  try {
    await ensureSchema();

    switch (eventType) {
      case "subscription.created": {
        const sub = eventData as {
          id: string;
          status: string;
          customerId: string;
          items: Array<{ price: { productId: string } }>;
          customData?: { org_id?: string; plan_id?: string };
        };

        const orgId = sub.customData?.org_id;
        const planId = sub.customData?.plan_id ?? getPlanByPaddleProductId(sub.items[0]?.price?.productId ?? "")?.id;

        if (orgId && planId) {
          await setOrgContext(orgId);
          await updateOrgPlan(orgId, planId, sub.id);

          await sql`
            update organizations set paddle_customer_id = ${sub.customerId}, paddle_subscription_id = ${sub.id}
            where id = ${orgId}::uuid
          `;

          console.log(`[Paddle] Subscription created: org=${orgId} plan=${planId} sub=${sub.id}`);
        }
        break;
      }

      case "subscription.updated": {
        const sub = eventData as {
          id: string;
          status: string;
          customerId: string;
          items: Array<{ price: { productId: string } }>;
          customData?: { org_id?: string; plan_id?: string };
        };

        const orgId = sub.customData?.org_id;
        const planId = sub.customData?.plan_id ?? getPlanByPaddleProductId(sub.items[0]?.price?.productId ?? "")?.id;

        if (orgId && planId) {
          await setOrgContext(orgId);
          await updateOrgPlan(orgId, planId, sub.id);

          if (sub.status === "canceled" || sub.status === "past_due") {
            await updateOrgPlan(orgId, "free");
          }

          console.log(`[Paddle] Subscription updated: org=${orgId} plan=${planId} status=${sub.status}`);
        }
        break;
      }

      case "subscription.canceled": {
        const sub = eventData as { id: string; customData?: { org_id?: string } };
        const orgId = sub.customData?.org_id;
        if (orgId) {
          await setOrgContext(orgId);
          await updateOrgPlan(orgId, "free");
          console.log(`[Paddle] Subscription canceled: org=${orgId} -> free`);
        }
        break;
      }

      case "transaction.completed": {
        const txn = eventData as {
          id: string;
          status: string;
          subscriptionId?: string;
          customData?: { org_id?: string };
        };
        console.log(`[Paddle] Transaction completed: ${txn.id} status=${txn.status}`);
        break;
      }

      case "customer.created": {
        const customer = eventData as { id: string; email: string };
        console.log(`[Paddle] Customer created: ${customer.id} ${customer.email}`);
        break;
      }

      default:
        console.log(`[Paddle Webhook] Evento não tratado: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paddle Webhook] Erro ao processar:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}