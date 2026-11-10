"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  History,
  ImageOff,
  Star,
  Filter,
  X,
  Download,
  CheckSquare,
  Square,
  Calendar,
  Tag,
  User,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  AlertCircle,
  GitBranch,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  FileText,
  Settings,
  DollarSign,
  Target,
} from "lucide-react";
import { getGeneratedFlyers, getTemplates } from "@/lib/store";
import { getFormatoPreset } from "@/lib/formatos";
import { STATUS_FLYER_CORES, STATUS_FLYER_ORDEM, STATUS_FLYER_ROTULOS } from "@/lib/statusFlyer";
import { FlyerTemplate, GeneratedFlyer, StatusFlyer, CategoriaEvento } from "@/lib/types";
import { PLANS, getPlan, CREDIT_COSTS } from "@/lib/plans";

function formatarData(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatarDataCurta(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatarMes(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function agruparPorMes(flyers: GeneratedFlyer[]): Record<string, GeneratedFlyer[]> {
  return flyers.reduce((acc, f) => {
    const mes = formatarMes(f.criadoEm);
    (acc[mes] = acc[mes] || []).push(f);
    return acc;
  }, {} as Record<string, GeneratedFlyer[]>);
}

function agruparPorCategoria(flyers: GeneratedFlyer[], templates: FlyerTemplate[]): Record<string, number> {
  return flyers.reduce((acc, f) => {
    const template = templates.find((t) => t.id === f.templateId);
    const cat = template?.categoria || "sem-categoria";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function agruparPorStatus(flyers: GeneratedFlyer[]): Record<StatusFlyer, number> {
  return flyers.reduce((acc, f) => {
    const s = f.status ?? "gerado";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<StatusFlyer, number>);
}

function calcularTaxaAprovacao(flyers: GeneratedFlyer[]): number {
  const comStatus = flyers.filter((f) => f.status && f.status !== "gerado");
  if (comStatus.length === 0) return 0;
  const aprovados = comStatus.filter((f) => f.status === "aprovado" || f.status === "publicado").length;
  return Math.round((aprovados / comStatus.length) * 100);
}

function calcularMediaAvaliacao(flyers: GeneratedFlyer[]): number {
  const comAvaliacao = flyers.filter((f) => typeof f.avaliacao === "number");
  if (comAvaliacao.length === 0) return 0;
  const soma = comAvaliacao.reduce((acc, f) => acc + (f.avaliacao || 0), 0);
  return Math.round((soma / comAvaliacao.length) * 10) / 10;
}

function obterTemplatesMaisUsados(flyers: GeneratedFlyer[], templates: FlyerTemplate[], top: number = 5): { template: FlyerTemplate; count: number }[] {
  const contagem: Record<string, number> = {};
  for (const f of flyers) {
    contagem[f.templateId] = (contagem[f.templateId] || 0) + 1;
  }
  return Object.entries(contagem)
    .sort(([, a], [, b]) => b - a)
    .slice(0, top)
    .map(([id, count]) => ({ template: templates.find((t) => t.id === id)!, count }))
    .filter((x) => x.template);
}

function obterUsuariosMaisAtivos(flyers: GeneratedFlyer[], top: number = 5): { userId: string; count: number }[] {
  const contagem: Record<string, number> = {};
  for (const f of flyers) {
    if (f.campos?.usuarioId || f.campos?.userId) {
      const uid = f.campos.usuarioId || f.campos.userId || "desconhecido";
      contagem[uid] = (contagem[uid] || 0) + 1;
    }
  }
  return Object.entries(contagem)
    .sort(([, a], [, b]) => b - a)
    .slice(0, top)
    .map(([userId, count]) => ({ userId, count }));
}

export default function AnalyticsPage() {
  const [flyers, setFlyers] = useState<GeneratedFlyer[]>([]);
  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [status, setStatus] = useState<"carregando" | "pronto" | "indisponivel">("carregando");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    getTemplates().then(setTemplates);
    getGeneratedFlyers()
      .then((data) => {
        setFlyers(data);
        setStatus("pronto");
      })
      .catch((e) => {
        setErro((e as Error).message);
        setStatus("indisponivel");
      });
  }, []);

  if (status === "carregando") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-parchment-400">Carregando analytics…</div>
      </div>
    );
  }

  if (status === "indisponivel") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 text-sm text-parchment-400">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-500/70" />
        <span>
          {erro ?? "Analytics indisponível no momento."} Conecte um banco Postgres ao
          projeto na Vercel para acompanhar métricas entre navegadores.
        </span>
      </div>
    );
  }

  if (flyers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 py-20 text-center">
        <BarChart2 className="mb-3 text-gold-500/50" size={28} />
        <p className="text-parchment-300">Nenhum dado para analisar.</p>
        <p className="mt-1 text-sm text-parchment-500">
          Gere alguns flyers para ver métricas aqui.
        </p>
      </div>
    );
  }

  const flyersUltimos30dias = flyers.filter((f) => {
    const data = new Date(f.criadoEm);
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);
    return data >= limite;
  });

  const porMes = useMemo(() => agruparPorMes(flyers), [flyers]);
  const porCategoria = useMemo(() => agruparPorCategoria(flyers, templates), [flyers, templates]);
  const porStatus = useMemo(() => agruparPorStatus(flyers), [flyers]);
  const taxaAprovacao = useMemo(() => calcularTaxaAprovacao(flyers), [flyers]);
  const mediaAvaliacao = useMemo(() => calcularMediaAvaliacao(flyers), [flyers]);
  const templatesTop = useMemo(() => obterTemplatesMaisUsados(flyers, templates), [flyers, templates]);
  const usuariosTop = useMemo(() => obterUsuariosMaisAtivos(flyers), [flyers]);

  const totalGeral = flyers.length;
  const totalMes = flyersUltimos30dias.length;
  const creditosGastos = flyers.reduce((acc, f) => acc + CREDIT_COSTS.generation, 0);

  const coresGrafico = ["#BB9E49", "#C9A227", "#DCC177", "#EAD9A0", "#F5F0E4", "#A69C87"];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2 border-b border-gold-500/10 pb-8"
      >
        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
          <BarChart2 size={13} /> Estúdio de flyers
        </p>
        <h1 className="font-display text-4xl leading-none tracking-wide text-parchment-100 sm:text-5xl">
          Analytics
        </h1>
        <p className="mt-3 max-w-lg text-sm text-parchment-500">
          Métricas de geração, aprovação e uso da plataforma.
        </p>
      </motion.div>

      {/* KPIs Principais */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <KPICard
          titulo="Total Gerado"
          valor={totalGeral}
          Icone={FileText}
          cor="#BB9E49"
          tendencia={totalMes}
          tendenciaLabel="últimos 30 dias"
        />
        <KPICard
          titulo="Taxa Aprovação"
          valor={`${taxaAprovacao}%`}
          Icone={Target}
          cor="#22C55E"
          subtitulo={taxaAprovacao >= 70 ? "Acima da meta" : "Abaixo da meta (70%)"}
        />
        <KPICard
          titulo="Média Avaliação"
          valor={mediaAvaliacao.toFixed(1)}
          Icone={Star}
          cor="#F59E0B"
          subtitulo="de 5.0"
        />
        <KPICard
          titulo="Este Mês"
          valor={totalMes}
          Icone={Calendar}
          cor="#3B82F6"
          tendencia={totalMes > 0 ? "+" : ""}
        />
        <KPICard
          titulo="Créditos Gasto"
          valor={creditosGastos}
          Icone={DollarSign}
          cor="#8B5CF6"
        />
      </motion.div>

      {/* Gráficos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <AreaChartCard
          titulo="Gerações por Mês"
          dados={Object.entries(porMes)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .slice(-12)
            .map(([mes, items]) => ({ label: mes, value: items.length }))}
          cor="#BB9E49"
        />

        <BarChartCard
          titulo="Por Categoria de Evento"
          dados={Object.entries(porCategoria)
            .map(([cat, count]) => ({ label: cat.charAt(0).toUpperCase() + cat.slice(1), value: count }))}
          cores={coresGrafico}
        />

        <StatusFunnelCard
          titulo="Funil de Aprovação"
          status={porStatus}
          total={totalGeral}
        />

        <TopTemplatesCard
          titulo="Templates Mais Usados"
          templates={templatesTop}
        />
      </motion.div>

      {/* Tabelas detalhadas */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <TabelaDetalhada
          titulo="Usuários Mais Ativos"
          colunas={["Usuário", "Flyers"]}
          linhas={usuariosTop.map((u) => [u.userId, u.count.toString()])}
        />

        <TabelaDetalhada
          titulo="Distribuição por Formato"
          colunas={["Formato", "Qtd", "%"]}
          linhas={(() => {
            const porFormato: Record<string, number> = {};
            for (const f of flyers) {
              const fmt = f.formatoId ? getFormatoPreset(f.formatoId).nome : "sem formato";
              porFormato[fmt] = (porFormato[fmt] || 0) + 1;
            }
            return Object.entries(porFormato)
              .map(([fmt, count]) => [fmt, count.toString(), `${Math.round((count / totalGeral) * 100)}%`]);
          })()}
        />
      </motion.div>

      <p className="text-center text-[11px] text-parchment-500">
        Sem banco conectado, métricas ficam salvas só neste navegador — ver
        Vercel → Storage → Postgres para manter entre sessões e dispositivos.
      </p>
    </div>
  );
}

function KPICard({ titulo, valor, Icone, cor, tendencia, tendenciaLabel, subtitulo }: {
  titulo: string;
  valor: string | number;
  Icone: React.ComponentType<{ size?: number | string; className?: string }>;
  cor: string;
  tendencia?: string | number;
  tendenciaLabel?: string;
  subtitulo?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-gold-500/80">{titulo}</p>
          <p className="mt-1 font-display text-3xl text-parchment-100">{valor}</p>
          {subtitulo && <p className="mt-0.5 text-xs text-parchment-500">{subtitulo}</p>}
          {tendencia !== undefined && tendenciaLabel && (
            <p className="mt-1 flex items-center gap-1 text-xs text-parchment-500">
              <TrendingUp className="h-3 w-3" /> {tendencia} {tendenciaLabel}
            </p>
          )}
        </div>
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${cor}20` }}>
          <span style={{ color: cor }}>
            <Icone className="h-6 w-6" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function AreaChartCard({ titulo, dados, cor }: { titulo: string; dados: { label: string; value: number }[]; cor: string }) {
  const maxValue = Math.max(...dados.map((d) => d.value), 1);
  const width = "100%";
  const height = 200;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
    >
      <h3 className="mb-4 font-display text-lg tracking-wide text-parchment-100">{titulo}</h3>
      <div className="h-[200px] relative">
        <svg width={width} height={height} viewBox={`0 0 ${dados.length * 40} ${maxValue * 20}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={cor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={dados
              .map((d, i) => {
                const x = i * 40 + 20;
                const y = (maxValue - d.value) * 20 + 20;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              })
              .join(" ")}
            fill="none"
            stroke={cor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={[
              `M ${20} ${maxValue * 20 + 20}`,
              ...dados.map((d, i) => {
                const x = i * 40 + 20;
                const y = (maxValue - d.value) * 20 + 20;
                return `L ${x} ${y}`;
              }),
              `L ${dados.length * 40 + 20} ${maxValue * 20 + 20}`,
              "Z",
            ].join(" ")}
            fill="url(#area-gradient)"
          />
          {dados.map((d, i) => (
            <circle
              key={i}
              cx={i * 40 + 20}
              cy={(maxValue - d.value) * 20 + 20}
              r="4"
              fill={cor}
              stroke="#0B0A08"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="flex justify-between mt-4 text-xs text-parchment-500">
          {dados.slice(0, 6).map((d, i) => (
            <span key={i} style={{ marginLeft: i === 0 ? 0 : "auto" }}>{d.label}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function BarChartCard({ titulo, dados, cores }: { titulo: string; dados: { label: string; value: number }[]; cores: string[] }) {
  const maxValue = Math.max(...dados.map((d) => d.value), 1);
  const barWidth = 32;
  const gap = 16;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
    >
      <h3 className="mb-4 font-display text-lg tracking-wide text-parchment-100">{titulo}</h3>
      <div className="h-[200px] flex items-end justify-center gap-2 px-4">
        {dados.map((d, i) => (
          <div key={d.label} className="flex flex-col items-center flex-1 min-w-0">
            <div
              className="w-full rounded-t transition-all duration-500"
              style={{
                height: `${(d.value / maxValue) * 140}px`,
                backgroundColor: cores[i % cores.length],
              }}
            />
            <span className="mt-2 text-[10px] text-center text-parchment-500 whitespace-nowrap">
              {d.label}
            </span>
            <span className="text-[10px] text-gold-400 font-medium">{d.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function StatusFunnelCard({ titulo, status, total }: { titulo: string; status: Record<StatusFlyer, number>; total: number }) {
  const ordem = ["gerado", "aprovado", "publicado", "rejeitado", "rascunho"] as StatusFlyer[];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-2"
    >
      <h3 className="mb-4 font-display text-lg tracking-wide text-parchment-100">{titulo}</h3>
      <div className="space-y-3">
        {ordem.map((s) => {
          const count = status[s] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={s} className="flex items-center gap-3">
              <span className="w-20 text-xs font-medium text-parchment-400">{STATUS_FLYER_ROTULOS[s]}</span>
              <div className="flex-1 h-6 bg-ink-900/70 rounded-full overflow-hidden border border-gold-500/10">
                <div
                  className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-medium text-parchment-100"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: STATUS_FLYER_CORES[s].replace("border-", "bg-").replace("text-", "bg-"),
                  }}
                >
                  {pct > 15 && `${pct.toFixed(1)}%`}
                </div>
              </div>
              <span className="w-12 text-right text-sm text-parchment-300 font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function TopTemplatesCard({ titulo, templates }: { titulo: string; templates: { template: FlyerTemplate; count: number }[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5 lg:col-span-2"
    >
      <h3 className="mb-4 font-display text-lg tracking-wide text-parchment-100">{titulo}</h3>
      <div className="space-y-3">
        {templates.map(({ template, count }, i) => (
          <div key={template.id} className="flex items-center gap-4 p-3 rounded-xl bg-ink-900/70 border border-gold-500/10">
            <span className="w-8 text-center text-lg font-display text-gold-400">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-parchment-100 truncate">{template.nome}</p>
              <p className="text-xs text-parchment-500">{template.categoria || "sem categoria"}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-sm font-semibold text-gold-200">
              {count} flyers
            </span>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-center text-parchment-500 py-8">Nenhum template usado ainda</p>
        )}
      </div>
    </motion.div>
  );
}

function TabelaDetalhada({ titulo, colunas, linhas }: { titulo: string; colunas: string[]; linhas: string[][] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gold-500/10 bg-ink-900/60 p-5"
    >
      <h3 className="mb-4 font-display text-lg tracking-wide text-parchment-100">{titulo}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gold-500/10">
              {colunas.map((c) => (
                <th key={c} className="text-left py-2 px-3 font-medium text-parchment-400 uppercase tracking-[0.05em] text-xs">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha, i) => (
              <tr key={i} className="border-b border-gold-500/5 hover:bg-gold-500/5">
                {linha.map((celula, j) => (
                  <td key={j} className="py-2 px-3 text-parchment-200">
                    {celula}
                  </td>
                ))}
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={colunas.length} className="py-8 text-center text-parchment-500">
                  Nenhum dado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}