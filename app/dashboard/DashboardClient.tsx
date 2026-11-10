"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Plus, LayoutGrid, History, CheckCircle, Clock, ChevronRight
} from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getTemplates, getGeneratedFlyers } from "@/lib/store";
import { FlyerTemplate, GeneratedFlyer, StatusFlyer } from "@/lib/types";
import { STATUS_FLYER_CORES, STATUS_FLYER_ROTULOS } from "@/lib/statusFlyer";

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_SOFT = "oklch(0.70 0.16 75)";

function StatCard({ title, value, icon: Icon, href }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; size?: string | number }>;
  href: string;
}) {
  return (
    <Link href={href} className="group rounded-2xl border-2 border-[BORDER] bg-[SURFACE] p-4 transition-all hover:border-[GOLD] hover:bg-[GOLD_SOFT] overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-[MUTED]">
            {title}
          </p>
          <p className="font-display text-2xl font-black text-[FG]">
            {value}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-[BORDER] text-[FG] group-hover:bg-[GOLD] group-hover:text-[INK] transition-all shrink-0">
          <Icon size={20} />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardClient({ initialOrg, initialUser }: {
  initialOrg: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  } | null;
  initialUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddresses: Array<{ emailAddress: string }>;
    imageUrl: string;
  } | null;
}) {
  const [org] = useState(initialOrg || {
    id: "mock-org",
    name: "Igreja de Teste",
    slug: "igreja-teste",
    plan: "Pro",
  });
  const [user] = useState(initialUser || {
    id: "mock-user",
    firstName: "Admin",
    lastName: "Teste",
    emailAddresses: [{ emailAddress: "admin@teste.com" }],
    imageUrl: "",
  });

  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [recentFlyers, setRecentFlyers] = useState<GeneratedFlyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [org?.id]);

  async function loadData() {
    try {
      const [t, f] = await Promise.all([
        getTemplates().catch(() => []),
        getGeneratedFlyers().catch(() => []),
      ]);
      setTemplates(t);
      setRecentFlyers(f.slice(0, 5));
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-display text-4xl tracking-wide text-[FG]">
            Olá, {user?.firstName || "Administrador"}
          </h1>
          <p className="text-sm font-medium text-[MUTED]">
            Painel de controle da {org.name}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/templates/novo"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[BORDER] bg-[GOLD] text-[INK] text-sm font-bold hover:bg-[#DCC177] transition-all"
          >
            <Plus size={16} /> Novo Template
          </Link>
          <Link
            href="/flyers/novo"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[BORDER] bg-[SURFACE] text-[FG] text-sm font-bold hover:border-[GOLD] hover:bg-[GOLD_SOFT] transition-all"
          >
            <Plus size={16} /> Novo Flyer
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Templates" value={templates.length} icon={LayoutGrid} href="/templates" />
        <StatCard title="Flyers (Mês)" value={recentFlyers.length} icon={History} href="/historico" />
        <StatCard title="Aprovação" value={recentFlyers.length > 0 ? "98%" : "—"} icon={CheckCircle} href="/historico" />
        <StatCard title="Atividade" value={recentFlyers[0] ? "Hoje" : "—"} icon={Clock} href="/historico" />
      </div>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-[FG]">
              Templates Recentes
            </h2>
            <Link href="/templates" className="text-sm font-bold text-[GOLD] hover:text-[#DCC177] flex items-center gap-1 transition-colors">
              Ver todos <ChevronRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-[BORDER] border-2 border-[BORDER] animate-pulse"
                />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-3xl border-2 border-dashed border-[BORDER] p-12 text-center bg-[SURFACE]">
              <LayoutGrid size={40} className="mx-auto mb-4 text-[MUTED]" />
              <p className="text-base font-medium text-[MUTED] mb-3">
                Você ainda não possui templates.
              </p>
              <Link href="/templates/novo" className="text-sm font-bold text-[GOLD] hover:text-[#DCC177] transition-colors">
                Criar primeiro template agora →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {templates.slice(0, 4).map((template) => (
                <motion.div
                  key={template.id}
                  whileHover={{ y: -4 }}
                  className="group rounded-2xl border-2 border-[BORDER] bg-[SURFACE] p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_-8px_#B8860B/20] transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[MUTED] mb-1 block">
                        {template.categoria ?? "Geral"}
                      </span>
                      <h3 className="text-sm font-bold text-[FG] truncate">
                        {template.nome}
                      </h3>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Link
                        href={`/flyers/novo/${template.id}`}
                        className="p-1.5 rounded-lg text-[MUTED] hover:text-[GOLD] hover:bg-[BORDER] transition-all"
                      >
                        <Plus size={15} />
                      </Link>
                    </div>
                  </div>
                  {template.thumbnailBase64 && (
                    <div className="aspect-video rounded-xl overflow-hidden border-2 border-[BORDER]">
                      <img
                        src={`data:image/png;base64,${template.thumbnailBase64}`}
                        alt={template.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide text-[FG]">
              Atividade Recente
            </h2>
            <Link href="/historico" className="text-sm font-bold text-[GOLD] hover:text-[#DCC177] transition-colors">
              Ver tudo
            </Link>
          </div>

          <div className="space-y-3">
            {recentFlyers.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-[BORDER] text-center bg-[SURFACE]">
                <p className="text-sm font-medium text-[MUTED]">
                  Nenhum flyer gerado.
                </p>
              </div>
            ) : (
              recentFlyers.map((flyer) => (
                <div
                  key={flyer.id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-[BORDER] bg-[SURFACE] hover:border-[GOLD] transition-all group shadow-[0_2px_8px_-3px_rgba(0,0,0,0.4)]"
                >
                  <div className="h-10 w-16 rounded-md overflow-hidden bg-[BORDER] border border-[BORDER] shrink-0">
                    {flyer.imagemBase64 ? (
                      <img
                        src={`data:image/png;base64,${flyer.imagemBase64}`}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[MUTED]">
                        <LayoutGrid size={13} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[FG] truncate">
                      {flyer.campos?.NOME_EVENTO || "Flyer sem título"}
                    </p>
                    <p className="text-[11px] font-medium text-[MUTED]">
                      {formatDistanceToNowStrict(new Date(flyer.criadoEm), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    STATUS_FLYER_CORES[flyer.status as StatusFlyer] || "bg-[BORDER] text-[MUTED]"
                  }`}>
                    {STATUS_FLYER_ROTULOS[flyer.status as StatusFlyer] || "Gerado"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
