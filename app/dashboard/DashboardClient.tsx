"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, LayoutGrid, History, Image, Settings, Users, BarChart2, ChevronRight, Clock, CheckCircle, XCircle, Star, Download, MoreVertical, Trash2, Copy, X, ArrowRight } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import CreditBadge from "@/components/CreditBadge";
import { getTemplates, getGeneratedFlyers, getCreditBalance } from "@/lib/store";
import { FlyerTemplate, GeneratedFlyer, StatusFlyer } from "@/lib/types";
import { STATUS_FLYER_CORES, STATUS_FLYER_ROTULOS } from "@/lib/statusFlyer";

interface DashboardClientProps {
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
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/templates/novo", label: "Novo template", icon: Plus },
  { href: "/flyers/novo", label: "Novo flyer", icon: Plus },
  { href: "/biblioteca", label: "Biblioteca", icon: Image },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/configuracao/marca", label: "Brand DNA", icon: Settings },
  { href: "/configuracao/equipe", label: "Equipe", icon: Users },
  { href: "/configuracao/plano", label: "Plano", icon: BarChart2 },
];

export default function DashboardClient({ initialOrg, initialUser }: DashboardClientProps) {
  const [org, setOrg] = useState(initialOrg);
  const [user] = useState(initialUser);
  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [recentFlyers, setRecentFlyers] = useState<GeneratedFlyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [org?.id]);

  async function loadData() {
    if (!org?.id) return;
    try {
      const [t, f, b] = await Promise.all([
        getTemplates(),
        getGeneratedFlyers().catch(() => []),
        getCreditBalance(),
      ]);
      setTemplates(t);
      setRecentFlyers(f.slice(0, 5));
    } catch {
    } finally {
      setLoading(false);
    }
  }

  const userName = user?.firstName || user?.emailAddresses[0]?.emailAddress || "Usuário";

  if (!org) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-parchment-400"
        >
          Carregando...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-ink-900/95 border-r border-gold-500/10 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gold-500/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-display text-xl tracking-wide text-parchment-100">FlyerForge</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-parchment-400 hover:text-parchment-100 hover:bg-gold-500/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-parchment-300 hover:bg-gold-500/10 hover:text-gold-200 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gold-500/10">
          <CreditBadge />
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-gold-500/10 bg-ink-900/95 px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-parchment-400 hover:text-parchment-100 hover:bg-gold-500/10"
          >
            <LayoutGrid className="h-6 w-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <CreditBadge />

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-gold-500/10 transition-colors"
              >
                <img
                  src={user?.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1a1a2e&color=bb9e49`}
                  alt={userName}
                  className="h-8 w-8 rounded-full bg-ink-900"
                />
                <span className="hidden sm:block text-sm font-medium text-parchment-100">{userName}</span>
                <ChevronRight className="h-4 w-4 text-parchment-500" />
              </button>

              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-gold-500/15 bg-ink-900/95 py-2 shadow-xl"
                >
                  <div className="px-3 py-2 border-b border-gold-500/10">
                    <p className="text-xs font-medium text-parchment-300">{org.name}</p>
                    <p className="text-[11px] text-parchment-500">{org.slug}</p>
                  </div>
                  <Link
                    href="/configuracao/plano"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-parchment-300 hover:bg-gold-500/10 hover:text-gold-200"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <BarChart2 className="h-4 w-4" />
                    Plano e faturamento
                  </Link>
                  <Link
                    href="/configuracao/equipe"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-parchment-300 hover:bg-gold-500/10 hover:text-gold-200"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Users className="h-4 w-4" />
                    Equipe
                  </Link>
                  <hr className="my-2 border-gold-500/10" />
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Settings className="h-4 w-4" />
                    Sair
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl tracking-wide text-parchment-100">
                Olá, {user?.firstName || "lá"} 👋
              </h1>
              <p className="text-parchment-500">Aqui está o que está acontecendo na {org.name}</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/templates/novo"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-700 px-4 py-2 text-sm font-semibold text-ink-950 shadow-glow hover:from-gold-400 hover:to-gold-600"
              >
                <Plus className="h-4 w-4" />
                Novo template
              </Link>
              <Link
                href="/flyers/novo"
                className="inline-flex items-center gap-2 rounded-xl border border-gold-500/20 bg-gold-500/10 px-4 py-2 text-sm font-medium text-gold-200 hover:bg-gold-500/20"
              >
                <Plus className="h-4 w-4" />
                Novo flyer
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Templates ativos"
              value={templates.length}
              icon={LayoutGrid}
              href="/templates"
              color="gold"
            />
            <StatCard
              title="Flyers este mês"
              value={recentFlyers.length}
              icon={History}
              href="/historico"
              color="emerald"
            />
            <StatCard
              title="Taxa de aprovação"
              value={
                recentFlyers.length > 0
                  ? `${Math.round((recentFlyers.filter((f) => f.status === "aprovado").length / recentFlyers.length) * 100)}%`
                  : "—"
              }
              icon={CheckCircle}
              href="/historico"
              color="blue"
            />
            <StatCard
              title="Última atividade"
              value={
                recentFlyers[0]
                  ? formatDistanceToNowStrict(new Date(recentFlyers[0].criadoEm), { addSuffix: true, locale: ptBR })
                  : "—"
              }
              icon={Clock}
              href="/historico"
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-parchment-100">Templates recentes</h2>
                <Link href="/templates" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-ink-900/50 animate-pulse border border-gold-500/10" />
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-dashed border-gold-500/20 p-8 text-center"
                >
                  <LayoutGrid className="mx-auto mb-4 h-12 w-12 text-gold-500/40" />
                  <p className="text-parchment-400">Nenhum template ainda</p>
                  <Link
                    href="/templates/novo"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300"
                  >
                    Criar primeiro template <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {templates.slice(0, 4).map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-2xl border border-gold-500/15 bg-ink-900/60 p-4 hover:border-gold-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-[0.1em] text-gold-500/80">
                            {template.categoria ?? "Sem categoria"}
                          </p>
                          <h3 className="mt-1 font-medium text-parchment-100 truncate">{template.nome}</h3>
                          <p className="mt-1 text-xs text-parchment-500">
                            {template.variaveisTexto.length} campos · {template.variaveisImagem.length} imagens
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/flyers/novo/${template.id}`}
                            className="p-2 rounded-lg text-parchment-400 hover:text-gold-300 hover:bg-gold-500/10 transition-colors"
                            title="Criar flyer"
                          >
                            <Plus className="h-5 w-5" />
                          </Link>
                          <button className="p-2 rounded-lg text-parchment-400 hover:text-parchment-100 hover:bg-gold-500/10 transition-colors" title="Duplicar">
                            <Copy className="h-5 w-5" />
                          </button>
                          <button className="p-2 rounded-lg text-parchment-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Excluir">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {template.thumbnailBase64 && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-gold-500/10">
                          <img
                            src={`data:image/png;base64,${template.thumbnailBase64}`}
                            alt={template.nome}
                            className="w-full h-32 object-cover"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-parchment-100">Últimos flyers</h2>
                <Link href="/historico" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
                  Ver todos <ChevronRight className="h-4 w-4" />
                </Link>
              </div>

              {recentFlyers.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border-2 border-dashed border-gold-500/20 p-8 text-center"
                >
                  <History className="mx-auto mb-4 h-12 w-12 text-gold-500/40" />
                  <p className="text-parchment-400">Nenhum flyer gerado ainda</p>
                  <Link
                    href="/flyers/novo"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-gold-400 hover:text-gold-300"
                  >
                    Gerar primeiro flyer <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {recentFlyers.map((flyer) => (
                    <motion.div
                      key={flyer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 rounded-xl border border-gold-500/10 bg-ink-900/60 p-3 hover:border-gold-500/20 transition-colors"
                    >
                      <div className="h-12 w-16 flex-shrink-0 rounded-lg overflow-hidden border border-gold-500/10 bg-ink-900">
                        {flyer.imagemBase64 ? (
                          <img src={`data:image/png;base64,${flyer.imagemBase64}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gold-500/40">
                            <Image className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-parchment-100 truncate">
                          {flyer.campos?.NOME_EVENTO || flyer.campos?.NOME_PRELETOR || "Flyer sem título"}
                        </p>
                        <p className="text-xs text-parchment-500 truncate">
                          {flyer.campos?.NOME_IGREJA || org.name} · {formatDistanceToNowStrict(new Date(flyer.criadoEm), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_FLYER_CORES[flyer.status as StatusFlyer] || STATUS_FLYER_CORES.gerado}`}>
                        {STATUS_FLYER_ROTULOS[flyer.status as StatusFlyer] || "Gerado"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, href, color }: { title: string; value: string | number; icon: React.ComponentType<{ className?: string }>; href: string; color: "gold" | "emerald" | "blue" | "purple" }) {
  const colors = {
    gold: "bg-gold-500/10 border-gold-500/20 text-gold-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-sky-500/10 border-sky-500/20 text-sky-400",
    purple: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  };

  return (
    <Link href={href} className={`group rounded-2xl border p-4 transition-colors ${colors[color]} hover:border-opacity-50`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-parchment-500">{title}</p>
          <p className="mt-1 font-display text-2xl font-bold text-parchment-100">{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${colors[color].split(" ")[2]} group-hover:scale-110 transition-transform`} />
      </div>
    </Link>
  );
}