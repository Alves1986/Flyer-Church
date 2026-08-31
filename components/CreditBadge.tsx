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

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-900/80 border border-gold-500/20"
    >
      <div className="relative hidden sm:block">
        <div className="h-2 w-24 rounded-full bg-ink-950 border border-gold-500/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <CreditCard className={`h-4 w-4 ${isEmpty ? "text-red-400" : isLow ? "text-amber-400" : "text-gold-400"}`} />

        <span className="text-xs font-medium text-parchment-100">
          {balance.creditsRemaining}/{balance.creditsMonthly}
        </span>

        {isLow && (
          <AlertTriangle className="h-3 w-3 text-amber-400 animate-pulse" />
        )}

        <span className="text-[10px] text-parchment-500 hidden md:block">
          {balance.planName}
        </span>
      </div>

      <button
        onClick={() => router.push("/configuracao/plano")}
        className="ml-1 p-1 rounded-lg text-parchment-400 hover:text-gold-300 hover:bg-gold-500/10 transition-colors"
        title="Gerenciar plano"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}