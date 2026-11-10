"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Zap, Shield, Users, Cpu, Lock,
  ArrowRight, Loader2, Check, X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, type PlanId } from "@/lib/plans";

const PLAN_FEATURES: Record<PlanId, { icon: React.ReactNode; label: string; included: boolean }[]> = {
  free: [
    { icon: <CreditCard className="h-5 w-5" />, label: "10 gerações/mês", included: true },
    { icon: <Zap className="h-5 w-5" />, label: "1 template salvo", included: true },
    { icon: <Shield className="h-5 w-5" />, label: "Suporte comunitário", included: true },
    { icon: <Users className="h-5 w-5" />, label: "1 usuário", included: true },
    { icon: <Cpu className="h-5 w-5" />, label: "Acesso à API", included: false },
    { icon: <Lock className="h-5 w-5" />, label: "Brand DNA", included: false },
    { icon: <Lock className="h-5 w-5" />, label: "Biblioteca avançada", included: false },
  ],
  pro: [
    { icon: <CreditCard className="h-5 w-5" />, label: "200 gerações/mês", included: true },
    { icon: <Zap className="h-5 w-5" />, label: "Templates ilimitados", included: true },
    { icon: <Shield className="h-5 w-5" />, label: "Suporte prioritário", included: true },
    { icon: <Users className="h-5 w-5" />, label: "Até 3 usuários", included: true },
    { icon: <Cpu className="h-5 w-5" />, label: "Acesso à API", included: false },
    { icon: <Check className="h-5 w-5 text-[#4ADE80]" />, label: "Brand DNA completo", included: true },
    { icon: <Check className="h-5 w-5 text-[#4ADE80]" />, label: "Biblioteca inteligente", included: true },
  ],
  church: [
    { icon: <CreditCard className="h-5 w-5" />, label: "1.000 gerações/mês", included: true },
    { icon: <Zap className="h-5 w-5" />, label: "Templates ilimitados", included: true },
    { icon: <Shield className="h-5 w-5" />, label: "Suporte dedicado", included: true },
    { icon: <Users className="h-5 w-5" />, label: "Até 10 usuários", included: true },
    { icon: <Check className="h-5 w-5 text-[#4ADE80]" />, label: "Acesso à API completo", included: true },
    { icon: <Check className="h-5 w-5 text-[#4ADE80]" />, label: "Brand DNA + Overrides", included: true },
    { icon: <Check className="h-5 w-5 text-[#4ADE80]" />, label: "Biblioteca + Auto-tag IA", included: true },
  ],
};

interface PlanoPageClientProps {
  initialPlan: PlanId;
  initialUserEmail: string;
}

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";
const GREEN = "#16A34A";

export default function PlanoPageClient({ initialPlan, initialUserEmail }: PlanoPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<PlanId>(initialPlan);
  const [balance, setBalance] = useState<{
    creditsRemaining: number;
    creditsMonthly: number;
    resetDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("success")) {
      alert("Plano atualizado com sucesso! Obrigado por apoiar o Flyer Church.");
      router.refresh();
    }
    if (searchParams.get("canceled")) {
      alert("Alteração cancelada. Seu plano atual permanece ativo.");
    }
    fetchBalance();
  }, [router, searchParams]);

  async function fetchBalance() {
    try {
      const res = await fetch("/api/billing/balance", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBalance(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(targetPlan: PlanId) {
    if (targetPlan === "free") return;
    setUpgrading(targetPlan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId: targetPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erro ao criar checkout");
      }
    } catch {
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setUpgrading(null);
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erro ao abrir portal de faturamento");
      }
    } catch {
      alert("Erro de conexão.");
    }
  }

  const plan = PLANS[currentPlan];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[GOLD]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-[FG]">
          Plano e Faturamento
        </h1>
        <p className="mt-2 text-[MUTED]">
          Gerencie sua assinatura, veja uso de créditos e altere de plano quando quiser.
        </p>
      </div>

      {balance && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-2 border-[GOLD]/20 bg-[SURFACE]/60 p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <CreditCard className="h-10 w-10 text-[GOLD]" />
              <div>
                <p className="text-xs uppercase tracking-[0.1em] text-[GOLD]/80">
                  Plano atual
                </p>
                <p className="font-display text-2xl text-[FG]">{plan.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-semibold text-[FG]">
                  {balance.creditsRemaining}/{balance.creditsMonthly}
                </p>
                <p className="text-[MUTED]">Créditos este mês</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-[FG]">
                  {new Date(balance.resetDate).toLocaleDateString("pt-BR")}
                </p>
                <p className="text-[MUTED]">Próxima renovação</p>
              </div>

              <motion.button
                onClick={handleManageBilling}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-xl border-2 border-[GOLD]/30 bg-[GOLD]/10 text-[GOLD_DARK] text-sm font-medium hover:border-[GOLD]/50 transition-all"
              >
                Gerenciar no Paddle
                <ArrowRight className="ml-1.5 h-4 w-4 inline-block" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(["free", "pro", "church"] as PlanId[]).map((planId) => {
          const p = PLANS[planId];
          const isCurrent = planId === currentPlan;
          const features = PLAN_FEATURES[planId];

          return (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: planId === "free" ? 0.1 : planId === "pro" ? 0.2 : 0.3,
              }}
              className={`relative rounded-2xl p-6 transition-all ${
                isCurrent
                  ? "border-2 border-[GOLD_DARK] bg-[GOLD]/5 ring-2 ring-[GOLD]/20"
                  : "border-2 border-[GOLD]/10 bg-[SURFACE]/60 hover:border-[GOLD]/30"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[GOLD] to-[GOLD_DARK] text-xs font-semibold text-[INK]">
                  Atual
                </div>
              )}

              <div className="text-center mb-6">
                <p className="font-display text-xl tracking-wide text-[FG]">
                  {p.name}
                </p>
                <div className="mt-2 flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold text-[FG]">
                    {p.priceMonthly === 0
                      ? "Grátis"
                      : `R$ ${(p.priceMonthly / 100).toFixed(2)}`}
                  </span>
                  {p.priceMonthly > 0 && (
                    <span className="text-[MUTED]">/mês</span>
                  )}
                </div>
              </div>

              <ul className="mb-6 space-y-3">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={`mt-0.5 flex-shrink-0 ${
                      f.included ? "text-[GREEN]" : "text-[MUTED]/40"
                    }`}>
                      {f.included ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                    </span>
                    <span className={`text-sm ${
                      f.included ? "text-[FG]" : "text-[MUTED]"
                    }`}>
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              <motion.button
                disabled={isCurrent || upgrading === planId}
                onClick={() => handleUpgrade(planId)}
                whileHover={{ scale: isCurrent ? 1 : 1.01 }}
                whileTap={{ scale: isCurrent ? 1 : 0.98 }}
                className={`w-full rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-[SURFACE]/50 border-2 border-[GOLD]/20 text-[MUTED] cursor-not-allowed"
                    : p.priceMonthly === 0
                      ? "bg-[GOLD]/10 border-2 border-[GOLD]/30 text-[GOLD_DARK] hover:bg-[GOLD]/20"
                      : "bg-gradient-to-r from-[GOLD] to-[GOLD_DARK] text-[INK] hover:from-[#DCC177] hover:to-[#7A5506] shadow-glow"
                }`}
              >
                {upgrading === planId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecionando...
                  </>
                ) : isCurrent ? (
                  "Plano atual"
                ) : p.priceMonthly === 0 ? (
                  "Downgrade para Grátis"
                ) : (
                  `Assinar por R$ ${(p.priceMonthly / 100).toFixed(2)}/mês`
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border-2 border-[GOLD]/10 bg-[SURFACE]/50 p-6 text-sm text-[MUTED]"
      >
        <h3 className="mb-3 font-medium text-[FG]">Detalhes importantes</h3>
        <ul className="space-y-2">
          <li>• Créditos renovam todo dia 1 do mês. Não acumulam.</li>
          <li>• Extração de templates (OpenRouter) é gratuita e não consome créditos.</li>
          <li>• Geração de flyers (Gemini) consome 1 crédito por imagem.</li>
          <li>• Downgrade para Grátis entra em vigor no próximo ciclo de faturamento.</li>
          <li>• Faturas e histórico de pagamentos disponíveis no portal do Paddle.</li>
          <li>• Cancelamento a qualquer momento — acesso mantido até o fim do período pago.</li>
        </ul>
      </motion.div>
    </div>
  );
}
