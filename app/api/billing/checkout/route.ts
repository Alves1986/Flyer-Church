import { NextRequest, NextResponse } from "next/server";
import { getRequestOrgId, getRequestUserId } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { createPaddleCheckout } from "@/lib/billing";
import { PLANS, type PlanId } from "@/lib/plans";

export async function POST(req: NextRequest) {
  const orgId = await getRequestOrgId();
  const userId = await getRequestUserId();

  if (!orgId || !userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { planId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }

  const planId = body.planId as PlanId;
  const plan = PLANS[planId];

  if (!plan || planId === "free") {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user?.emailAddresses?.[0]?.emailAddress) {
    return NextResponse.json({ error: "Email do usuário não encontrado" }, { status: 400 });
  }

  try {
    const url = await createPaddleCheckout(orgId, planId, user.emailAddresses[0].emailAddress);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[Billing Checkout] Erro:", err);
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 });
  }
}