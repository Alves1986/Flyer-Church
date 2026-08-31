import { NextResponse } from "next/server";
import { getRequestOrgId } from "@/lib/auth";
import { createPaddlePortalSession } from "@/lib/billing";

export async function POST() {
  const orgId = await getRequestOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const url = await createPaddlePortalSession(orgId);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("[Billing Portal] Erro:", err);
    return NextResponse.json({ error: "Erro ao abrir portal de faturamento" }, { status: 500 });
  }
}