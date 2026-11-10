"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Plus, LayoutGrid, History, Image, Settings, Users,
  BarChart2, ChevronRight, X, Search, Bell
} from "lucide-react";
import CreditBadge from "@/components/CreditBadge";
import { getCreditBalance } from "@/lib/store";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Visão Geral", icon: LayoutGrid },
  { href: "/templates/novo", label: "Novo Template", icon: Plus },
  { href: "/flyers/novo", label: "Novo Flyer", icon: Plus },
  { href: "/biblioteca", label: "Biblioteca", icon: Image },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/configuracao/marca", label: "Brand DNA", icon: Settings },
  { href: "/configuracao/equipe", label: "Equipe", icon: Users },
  { href: "/configuracao/plano", label: "Plano", icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  
  const user = {
    firstName: "Administrador",
    emailAddresses: [{ emailAddress: "admin@teste.com" }],
    imageUrl: "",
  };
  const org = {
    name: "Igreja de Teste",
    slug: "igreja-teste",
  };
  const userName = user.firstName || user.emailAddresses[0].emailAddress;

  useEffect(() => {
    getCreditBalance().then(setBalance).catch(() => null);
  }, []);

  return (
    <div className="min-h-screen bg-brand-white text-brand-ink font-body">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-brand-ink border-r-2 border-brand-stone transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5 border-b-2 border-brand-stone">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-brand-gold-500 flex items-center justify-center text-brand-ink font-black text-sm">F</div>
            <span className="font-display text-lg tracking-tighter text-white">Flyer Church</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-3 mb-4">Menu Principal</div>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400 hover:bg-brand-gold-500/10 hover:text-brand-gold-500 transition-all group"
            >
              <item.icon size={17} className="text-slate-500 group-hover:text-brand-gold-500 transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-brand-stone">
          {balance ? <CreditBadge initialBalance={balance} /> : <CreditBadge />}
        </div>
      </aside>

      <div className="lg:pl-64 transition-all duration-300">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-white/80 backdrop-blur-md border-b-2 border-brand-stone px-5 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-brand-ink hover:bg-slate-100 transition-colors">
            <LayoutGrid size={19} />
          </button>

          <div className="flex-1 px-2">
            <div className="relative max-w-md hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Buscar templates ou flyers..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border-2 border-brand-stone text-sm text-brand-ink placeholder:text-slate-400 outline-none transition-all focus:border-brand-gold-500 focus:ring-4 focus:ring-brand-gold-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full text-slate-500 hover:text-brand-ink hover:bg-slate-100 transition-colors relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-brand-gold-500 rounded-full border-2 border-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0A0A0A&color=B8860B&size=32&bold=true`}
                  alt={userName}
                  className="h-8 w-8 rounded-full object-cover border-2 border-brand-stone"
                />
                <span className="hidden sm:block text-sm font-bold text-brand-ink mr-1">{userName}</span>
                <ChevronRight size={14} className={`transition-transform text-slate-400 ${userMenuOpen ? "rotate-90" : ""}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-brand-stone bg-white p-1 shadow-premium z-50"
                  >
                    <div className="px-3 py-2.5 mb-1 border-b-2 border-brand-stone">
                      <p className="text-sm font-black text-brand-ink">{org.name}</p>
                      <p className="text-xs text-slate-500">{org.slug}</p>
                    </div>
                    <Link href="/configuracao/plano" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-ink rounded-lg transition-colors">
                      <BarChart2 size={15} /> Plano e faturamento
                    </Link>
                    <Link href="/configuracao/equipe" className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-ink rounded-lg transition-colors">
                      <Users size={15} /> Equipe
                    </Link>
                    <div className="my-1 border-t-2 border-brand-stone" />
                    <button className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <X size={15} /> Sair do sistema
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="p-5 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
