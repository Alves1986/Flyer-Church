"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Zap, ExternalLink, AlertTriangle } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface CreditBadgeProps {
  initialBalance?: {
    creditsRemaining: number;
    creditsMonthly: number;
    planName: string;
    resetDate: string;
  };
}

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";
const ORANGE = "#EA580C";
const GREEN = "#16A34A";

export default function CreditBadge({ initialBalance }: CreditBadgeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [balance, setBalance] = useState<{
    creditsRemaining: number;
    creditsMonthly: number;
    planName: string;
    resetDate: string;
  } | null>(initialBalance ?? null);
  const [loading, setLoading] = useState(!initialBalance);

  useEffect(() => {
    if (initialBalance) return;
    fetchBalance();
  }, [initialBalance, pathname]);

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

  if (loading || !balance) return null;

  const isLow = balance.creditsRemaining <= 3;
  const isEmpty = balance.creditsRemaining === 0;
  const percentage = Math.max(0, (balance.creditsRemaining / balance.creditsMonthly) * 100);

  const iconColor = isEmpty ? "#DC2626" : isLow ? ORANGE : GOLD;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[INK]/80 border-2 border-[GOLD]/20"
    >
      {/* Barra de progresso */}
      <div className="relative hidden sm:block">
        <div className="h-2 w-24 rounded-full bg-[INK] border-2 border-[GOLD]/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[GOLD] to-[#DCC177]"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <CreditCard className={`h-4 w-4`} style={{ color: iconColor }} />

        <span className="text-xs font-medium text-[FG]">
          {balance.creditsRemaining}/{balance.creditsMonthly}
        </span>

        {isLow && (
          <AlertTriangle className="h-3 w-3 animate-pulse" style={{ color: ORANGE }} />
        )}

        <span className="text-[10px] text-[MUTED] hidden md:block">
          {balance.planName}
        </span>
      </div>

      <button
        onClick={() => router.push("/configuracao/plano")}
        className="ml-1 p-1 rounded-lg text-[MUTED] hover:text-[GOLD_DARK] hover:bg-[GOLD]/10 transition-colors"
        title="Gerenciar plano"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
