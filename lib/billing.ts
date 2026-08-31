import { ensureSchema, sql, isDbConfigured, setOrgContext } from "./db";
import { getPlan, getPlanByPaddleProductId, type Plan, CREDIT_COSTS, PLANS } from "./plans";
import { Environment } from "@paddle/paddle-node-sdk";

export { getPlanByPaddleProductId, PLANS };
export type { Plan, PlanId } from "./plans";

export interface CreditBalance {
  plan: Plan;
  creditsUsed: number;
  creditsRemaining: number;
  resetDate: Date;
}

export async function getCreditBalance(orgId: string): Promise<CreditBalance> {
  if (!isDbConfigured()) {
    const plan = getPlan("free");
    return {
      plan,
      creditsUsed: 0,
      creditsRemaining: plan.creditsMonthly,
      resetDate: getNextResetDate(),
    };
  }

  await ensureSchema();
  await setOrgContext(orgId);

  const orgResult = await sql`
    select * from organizations where id = ${orgId}::uuid limit 1
  `;
  const org = (orgResult as Array<Record<string, unknown>>)[0];
  if (!org) throw new Error("Organização não encontrada");

  const plan = getPlan((org.plan as string) ?? "free");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usageResult = await sql`
    select coalesce(sum(credits_consumed), 0) as total
    from usage_events
    where organization_id = ${orgId}::uuid
      and event_type = 'generation'
      and created_at >= ${startOfMonth.toISOString()}
  `;
  const creditsUsed = Number((usageResult as Array<Record<string, unknown>>)[0]?.total ?? 0);

  const resetDate = new Date(startOfMonth);
  resetDate.setMonth(resetDate.getMonth() + 1);

  return {
    plan,
    creditsUsed,
    creditsRemaining: Math.max(0, plan.creditsMonthly - creditsUsed),
    resetDate,
  };
}

export async function checkCredits(orgId: string, eventType: keyof typeof CREDIT_COSTS): Promise<{ ok: boolean; balance: CreditBalance; error?: string }> {
  const balance = await getCreditBalance(orgId);
  const cost = CREDIT_COSTS[eventType];

  if (balance.plan.id === "free" && balance.creditsRemaining < cost) {
    return {
      ok: false,
      balance,
      error: `Créditos insuficientes. Plano ${balance.plan.name} tem ${balance.creditsRemaining}/${balance.plan.creditsMonthly} créditos este mês.`,
    };
  }

  if (balance.plan.id !== "free" && balance.creditsRemaining < cost) {
    return {
      ok: false,
      balance,
      error: `Créditos esgotados. Renovação em ${balance.resetDate.toLocaleDateString("pt-BR")}.`,
    };
  }

  return { ok: true, balance };
}

export async function consumeCredits(
  orgId: string,
  userId: string,
  eventType: keyof typeof CREDIT_COSTS,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!isDbConfigured()) return;

  const cost = CREDIT_COSTS[eventType];
  if (cost <= 0) return;

  await ensureSchema();
  await setOrgContext(orgId);

  await sql`
    insert into usage_events (organization_id, user_id, event_type, credits_consumed, metadata)
    values (${orgId}::uuid, ${userId}, ${eventType}, ${cost}, ${JSON.stringify(metadata)})
  `;
}

export async function requireCredits(
  orgId: string,
  userId: string,
  eventType: keyof typeof CREDIT_COSTS,
  metadata?: Record<string, unknown>
): Promise<CreditBalance> {
  const check = await checkCredits(orgId, eventType);
  if (!check.ok) {
    const error = new Error(check.error ?? "Créditos insuficientes");
    (error as any).statusCode = 402;
    (error as any).code = "INSUFFICIENT_CREDITS";
    (error as any).balance = check.balance;
    throw error;
  }
  await consumeCredits(orgId, userId, eventType, metadata);
  return check.balance;
}

function getNextResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

export async function updateOrgPlan(orgId: string, planId: string, paddleSubscriptionId?: string): Promise<void> {
  if (!isDbConfigured()) return;

  await ensureSchema();
  await setOrgContext(orgId);

  await sql`update organizations set plan = ${planId}, updated_at = now() ${paddleSubscriptionId ? sql`, paddle_subscription_id = ${paddleSubscriptionId}` : sql``} where id = ${orgId}::uuid`;
}

async function getPaddleClient() {
  const { Paddle } = await import("@paddle/paddle-node-sdk");
  return new Paddle(process.env.PADDLE_API_KEY!, {
    environment: (process.env.PADDLE_ENV as Environment) ?? Environment.sandbox,
  });
}

export async function createPaddleCheckout(orgId: string, planId: string, userEmail: string): Promise<string> {
  const paddle = await getPaddleClient();
  const plan = getPlan(planId);

  const transaction = await paddle.transactions.create({
    items: [{ priceId: plan.paddleProductId, quantity: 1 }],
    customData: { org_id: orgId, plan_id: planId },
    customerId: userEmail,
    checkout: {
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/configuracao/plano?success=true`,
    },
  });

  if (!transaction.checkout?.url) {
    throw new Error("Falha ao gerar URL de checkout do Paddle");
  }

  return transaction.checkout.url;
}

export async function createPaddlePortalSession(orgId: string): Promise<string> {
  const paddle = await getPaddleClient();

  const orgResult = await sql`
    select paddle_customer_id, paddle_subscription_id from organizations where id = ${orgId}::uuid limit 1
  `;
  const org = (orgResult as Array<Record<string, unknown>>)[0];
  if (!org?.paddle_customer_id) throw new Error("Cliente Paddle não encontrado");

  const session = await paddle.customerPortalSessions.create(
    org.paddle_customer_id as string,
    org.paddle_subscription_id ? [org.paddle_subscription_id as string] : []
  );

  if (!session.urls?.general?.overview) {
    throw new Error("Falha ao gerar URL do portal do cliente");
  }

  return session.urls.general.overview;
}