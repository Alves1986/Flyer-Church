import { NextResponse } from "next/server";
import { getRequestOrgId } from "@/lib/auth";
import { getCreditBalance } from "@/lib/billing";

export async function GET() {
  const orgId = await getRequestOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const balance = await getCreditBalance(orgId);
    return NextResponse.json({
      creditsRemaining: balance.creditsRemaining,
      creditsMonthly: balance.plan.creditsMonthly,
      planName: balance.plan.name,
      resetDate: balance.resetDate.toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao buscar saldo" },
      { status: 500 }
    );
  }
}