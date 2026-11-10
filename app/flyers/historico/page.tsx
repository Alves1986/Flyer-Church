"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { getGeneratedFlyers, getTemplates } from "@/lib/store";
import { getFormatoPreset } from "@/lib/formatos";
import { STATUS_FLYER_CORES, STATUS_FLYER_ORDEM, STATUS_FLYER_ROTULOS } from "@/lib/statusFlyer";
import { FlyerTemplate, GeneratedFlyer, StatusFlyer, CategoriaEvento } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

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

interface HistoricoFilters {
  status: StatusFlyer | "todos";
  categoria: CategoriaEvento | "todos";
  templateId: string | "todos";
  dataInicio: string;
  dataFim: string;
  busca: string;
}

export default function HistoricoPage() {
  const [flyers, setFlyers] = useState<GeneratedFlyer[]>([]);
  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [status, setStatus] = useState<"carregando" | "pronto" | "indisponivel">("carregando");
  const [erro, setErro] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<HistoricoFilters>({
    status: "todos",
    categoria: "todos",
    templateId: "todos",
    dataInicio: "",
    dataFim: "",
    busca: "",
  });
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState<GeneratedFlyer | null>(null);
  const [compareWith, setCompareWith] = useState<GeneratedFlyer | null>(null);
  const [compareIndex, setCompareIndex] = useState(0);

  const openCompare = (flyer: GeneratedFlyer) => {
    setShowCompare(flyer);
    const sameTemplate = flyersFiltrados.filter((f) => f.templateId === flyer.templateId && f.id !== flyer.id);
    setCompareWith(sameTemplate[0] || null);
    setCompareIndex(0);
  };

  const nextCompare = () => {
    const sameTemplate = flyersFiltrados.filter((f) => f.templateId === showCompare?.templateId && f.id !== showCompare?.id);
    if (sameTemplate.length > 0) {
      setCompareIndex((i) => (i + 1) % sameTemplate.length);
      setCompareWith(sameTemplate[(compareIndex + 1) % sameTemplate.length]);
    }
  };

  const prevCompare = () => {
    const sameTemplate = flyersFiltrados.filter((f) => f.templateId === showCompare?.templateId && f.id !== showCompare?.id);
    if (sameTemplate.length > 0) {
      setCompareIndex((i) => (i - 1 + sameTemplate.length) % sameTemplate.length);
      setCompareWith(sameTemplate[(compareIndex - 1 + sameTemplate.length) % sameTemplate.length]);
    }
  };

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

  function nomeTemplate(templateId: string): string {
    return templates.find((t) => t.id === templateId)?.nome ?? "Template removido";
  }

  function categoriaTemplate(templateId: string): CategoriaEvento | undefined {
    return templates.find((t) => t.id === templateId)?.categoria;
  }

  const applyFilters = useCallback((flyersList: GeneratedFlyer[]) => {
    return flyersList.filter((f) => {
      const fStatus = f.status ?? "gerado";
      const fCategoria = categoriaTemplate(f.templateId);
      
      if (filters.status !== "todos" && fStatus !== filters.status) return false;
      if (filters.categoria !== "todos" && fCategoria !== filters.categoria) return false;
      if (filters.templateId !== "todos" && f.templateId !== filters.templateId) return false;
      if (filters.dataInicio && new Date(f.criadoEm) < new Date(filters.dataInicio)) return false;
      if (filters.dataFim && new Date(f.criadoEm) > new Date(filters.dataFim + "T23:59:59")) return false;
      if (filters.busca) {
        const search = filters.busca.toLowerCase();
        const templateNome = nomeTemplate(f.templateId).toLowerCase();
        const camposTexto = Object.values(f.campos ?? {}).join(" ").toLowerCase();
        if (!templateNome.includes(search) && !camposTexto.includes(search)) return false;
      }
      return true;
    });
  }, [filters, templates]);

  const flyersFiltrados = applyFilters(flyers);
  
  const statusUsados = STATUS_FLYER_ORDEM.filter((s) => flyers.some((f) => (f.status ?? "gerado") === s));
  const categoriasUsadas = [...new Set(flyers.map((f) => categoriaTemplate(f.templateId)).filter(Boolean))] as CategoriaEvento[];
  const templatesUsados = [...new Set(flyers.map((f) => f.templateId))];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === flyersFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(flyersFiltrados.map((f) => f.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  async function handleBulkAction(action: "aprovar" | "rejeitar" | "deletar" | "baixar-zip") {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(action);
    
    try {
      if (action === "baixar-zip") {
        const JSZip = (await import("jszip")).default;
        const zip = new JSZip();
        for (const flyer of flyersFiltrados.filter((f) => selectedIds.has(f.id))) {
          if (flyer.imagemUrl) {
            try {
              const res = await fetch(flyer.imagemUrl);
              const blob = await res.blob();
              const arrayBuffer = await blob.arrayBuffer();
              const baseName = `flyer-${flyer.templateId}-${flyer.id.slice(0, 8)}.png`;
              zip.file(baseName, arrayBuffer);
            } catch {
              // skip failed downloads
            }
          }
        }
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flyers-selecionados-${formatarDataCurta(new Date().toISOString())}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        for (const id of selectedIds) {
          const flyer = flyers.find((f) => f.id === id);
          if (!flyer) continue;
          
          let newStatus: StatusFlyer = "gerado";
          let motivo: string | undefined;
          
          if (action === "aprovar") newStatus = "aprovado";
          else if (action === "rejeitar") newStatus = "rejeitado";
          else if (action === "deletar") {
            setFlyers((prev) => prev.filter((f) => f.id !== id));
            continue;
          }
          
          setFlyers((prev) => prev.map((f) => 
            f.id === id ? { ...f, status: newStatus, motivoRejeicao: motivo } : f
          ));
          
          try {
            await fetch(`/api/flyers/${id}`, {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ status: newStatus, motivoRejeicao: motivo }),
            });
          } catch {
            // best-effort
          }
        }
      }
      clearSelection();
    } catch (e) {
      alert(`Erro na ação em lote: ${(e as Error).message}`);
    } finally {
      setBulkActionLoading(null);
    }
  }

  if (status === "carregando") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-parchment-400">Carregando histórico…</div>
      </div>
    );
  }

  if (status === "indisponivel") {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 text-sm text-parchment-400">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-gold-500/70" />
        <span>
          {erro ?? "Histórico indisponível no momento."} Conecte um banco Postgres ao
          projeto na Vercel para acompanhar o histórico entre navegadores.
        </span>
      </div>
    );
  }

  if (flyers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 py-20 text-center">
        <History className="mb-3 text-gold-500/50" size={28} />
        <p className="text-parchment-300">Nenhum flyer gerado ainda.</p>
        <p className="mt-1 text-sm text-parchment-500">
          Gere um flyer a partir de um template para ele aparecer aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-2 border-b border-gold-500/10 pb-8"
      >
        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
          <History size={13} /> Estúdio de flyers
        </p>
        <h1 className="font-display text-4xl leading-none tracking-wide text-parchment-100 sm:text-5xl">
          Histórico de flyers
        </h1>
        <p className="mt-3 max-w-lg text-sm text-parchment-500">
          Toda arte gerada fica registrada aqui, com o status de aprovação e a
          avaliação de quem revisou.
        </p>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-gold-500/10 bg-ink-900/40 p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg tracking-wide text-parchment-100 flex items-center gap-2">
            <Filter size={16} /> Filtros
          </h2>
          {(flyersFiltrados.length !== flyers.length || selectedIds.size > 0) && (
            <button
              onClick={() => {
                setFilters({
                  status: "todos",
                  categoria: "todos",
                  templateId: "todos",
                  dataInicio: "",
                  dataFim: "",
                  busca: "",
                });
                clearSelection();
              }}
              className="text-xs text-gold-400 hover:text-gold-200 flex items-center gap-1"
            >
              <X size={12} /> Limpar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-parchment-300">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-parchment-500" />
              <input
                type="text"
                placeholder="Nome do template, campos..."
                value={filters.busca}
                onChange={(e) => setFilters((p) => ({ ...p, busca: e.target.value }))}
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 pl-10 pr-4 py-2.5 text-sm text-parchment-100 outline-none focus:border-gold-400/50 placeholder:text-parchment-500/40"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-parchment-300">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value as any }))}
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-2.5 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
            >
              <option value="todos">Todos</option>
              {statusUsados.map((s) => (
                <option key={s} value={s}>{STATUS_FLYER_ROTULOS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-parchment-300">Categoria</label>
            <select
              value={filters.categoria}
              onChange={(e) => setFilters((p) => ({ ...p, categoria: e.target.value as any }))}
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-2.5 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
            >
              <option value="todos">Todas</option>
              {categoriasUsadas.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-parchment-300">Template</label>
            <select
              value={filters.templateId}
              onChange={(e) => setFilters((p) => ({ ...p, templateId: e.target.value }))}
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-2.5 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
            >
              <option value="todos">Todos</option>
              {templatesUsados.map((tid) => (
                <option key={tid} value={tid}>{nomeTemplate(tid)}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="mb-1.5 block text-xs font-medium text-parchment-300">Período</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters((p) => ({ ...p, dataInicio: e.target.value }))}
                className="flex-1 rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-2.5 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
              />
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters((p) => ({ ...p, dataFim: e.target.value }))}
                className="flex-1 rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-2.5 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Barra de ações em lote */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-parchment-300 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === flyersFiltrados.length}
                onChange={selectAll}
                className="rounded border-gold-500/30 bg-ink-900/70 text-gold-500 focus:ring-gold-500/50"
              />
              {selectedIds.size === flyersFiltrados.length ? "Desmarcar todos" : "Selecionar todos"}
            </label>
            <span className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-sm font-medium text-gold-200">
              {selectedIds.size} de {flyersFiltrados.length} selecionados
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleBulkAction("aprovar")}
              disabled={bulkActionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckSquare size={14} /> Aprovar
            </button>
            <button
              onClick={() => handleBulkAction("rejeitar")}
              disabled={bulkActionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 border border-red-500/30 px-4 py-2 text-sm font-medium text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={14} /> Rejeitar
            </button>
            <button
              onClick={() => handleBulkAction("baixar-zip")}
              disabled={bulkActionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-gold-500/15 border border-gold-500/30 px-4 py-2 text-sm font-medium text-gold-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={14} /> Baixar ZIP
            </button>
            <button
              onClick={() => handleBulkAction("deletar")}
              disabled={bulkActionLoading !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-ink-900/70 border border-gold-500/15 px-4 py-2 text-sm font-medium text-parchment-300 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} /> Excluir
            </button>
            <button
              onClick={clearSelection}
              className="inline-flex items-center gap-2 rounded-xl bg-ink-900/70 border border-gold-500/15 px-4 py-2 text-sm font-medium text-parchment-400 hover:border-gold-500/30"
            >
              <X size={14} /> Limpar
            </button>
          </div>
        </motion.div>
      )}

      {/* Grid de flyers */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        variants={container}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {flyersFiltrados.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 py-20 text-center">
            <Filter className="mb-3 text-gold-500/50" size={28} />
            <p className="text-parchment-300">Nenhum flyer encontrado com estes filtros.</p>
          </div>
        ) : (
          flyersFiltrados.map((f) => {
            const s = f.status ?? "gerado";
            const formato = f.formatoId ? getFormatoPreset(f.formatoId) : undefined;
            const isSelected = selectedIds.has(f.id);
            return (
              <motion.div key={f.id} variants={item} className="relative">
                <div
                  className={`group relative overflow-hidden rounded-2xl transition-all duration-200 ${
                    isSelected
                      ? "border-2 border-gold-400 ring-2 ring-gold-500/30 bg-gold-500/5"
                      : "border border-gold-500/12 bg-ink-900/60 hover:border-gold-500/30 hover:shadow-glow"
                  }`}
                >
                  <Link
                    href={`/flyers/novo/${f.templateId}`}
                    className="block"
                    onClick={(e) => {
                      if (e.shiftKey || e.metaKey || e.ctrlKey) return;
                    }}
                  >
                    <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-ink-950/60">
                      {f.imagemUrl ? (
                        <img
                          src={f.imagemUrl}
                          alt={nomeTemplate(f.templateId)}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <ImageOff className="text-parchment-500/30" size={28} />
                      )}
                      <span
                        className={`absolute left-2.5 top-2.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_FLYER_CORES[s]}`}
                      >
                        {STATUS_FLYER_ROTULOS[s]}
                      </span>
                      {isSelected && (
                        <div className="absolute inset-0 bg-gold-500/10 flex items-center justify-center">
                          <CheckSquare className="text-gold-400" size={28} />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="mb-1 font-display text-lg tracking-wide text-parchment-100 line-clamp-1">
                        {nomeTemplate(f.templateId)}
                      </h3>
                      <p className="mb-2 text-xs text-parchment-500">
                        {formatarData(f.criadoEm)}
                        {formato ? ` · ${formato.nome}` : ""}
                        {categoriaTemplate(f.templateId) && ` · ${categoriaTemplate(f.templateId)!.charAt(0).toUpperCase() + categoriaTemplate(f.templateId)!.slice(1)}`}
                      </p>

                      {typeof f.avaliacao === "number" && (
                        <div className="mb-1 flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={13}
                              className={
                                n <= f.avaliacao!
                                  ? "fill-gold-400 text-gold-400"
                                  : "text-parchment-500/25"
                              }
                            />
                          ))}
                        </div>
                      )}

                      {f.motivoRejeicao && (
                        <p className="mt-1 text-xs text-red-300/80 line-clamp-1">
                          Motivo: {f.motivoRejeicao}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="absolute right-2 bottom-2 flex gap-1 p-1 bg-ink-950/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleSelect(f.id);
                      }}
                      className={`p-1.5 rounded transition-colors ${
                        isSelected
                          ? "bg-gold-500/20 text-gold-300"
                          : "bg-gold-500/10 text-parchment-500 hover:bg-gold-500/20 hover:text-gold-300"
                      }`}
                      title={isSelected ? "Desselecionar" : "Selecionar"}
                    >
                      {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openCompare(f);
                      }}
                      className="p-1.5 rounded bg-gold-500/10 text-parchment-500 hover:bg-gold-500/20 hover:text-gold-300 transition-colors"
                      title="Comparar A/B"
                    >
                      <GitBranch size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <p className="text-center text-[11px] text-parchment-500">
        Sem banco conectado, o histórico fica salvo só neste navegador — ver
        Vercel → Storage → Postgres para manter entre sessões e dispositivos.
      </p>

      {/* Modal Comparação A/B */}
      <AnimatePresence>
        {showCompare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm"
            onClick={() => setShowCompare(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gold-500/20 bg-ink-900/95 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl tracking-wide text-parchment-100">Comparação A/B</h2>
                <button
                  onClick={() => setShowCompare(null)}
                  className="p-2 rounded-lg text-parchment-500 hover:text-parchment-200 hover:bg-gold-500/10"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {["A", "B"].map((label, idx) => {
                  const flyer = idx === 0 ? showCompare : compareWith;
                  if (!flyer) return null;
                  return (
                    <div key={label} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/30 text-sm font-semibold text-gold-200">
                          Versão {label}
                        </span>
                        <div className="flex items-center gap-2">
                          {idx === 1 && (
                            <>
                              <button
                                onClick={prevCompare}
                                className="p-2 rounded-lg bg-gold-500/10 text-gold-300 hover:bg-gold-500/20"
                                title="Anterior"
                              >
                                <ChevronLeft size={18} />
                              </button>
                              <span className="text-xs text-parchment-500">
                                {compareIndex + 1} / {flyersFiltrados.filter((f) => f.templateId === showCompare?.templateId && f.id !== showCompare?.id).length}
                              </span>
                              <button
                                onClick={nextCompare}
                                className="p-2 rounded-lg bg-gold-500/10 text-gold-300 hover:bg-gold-500/20"
                                title="Próximo"
                              >
                                <ChevronRight size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div
                        className="relative overflow-hidden rounded-xl border border-gold-500/15 bg-ink-900/60 aspect-[4/5]"
                      >
                        {flyer.imagemUrl ? (
                          <img
                            src={flyer.imagemUrl}
                            alt={nomeTemplate(flyer.templateId)}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-parchment-500">
                            <ImageOff size={28} />
                          </div>
                        )}
                        <div className="absolute inset-0 p-4 pointer-events-none">
                          <div className="absolute left-2 top-2">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_FLYER_CORES[flyer.status ?? "gerado"]}`}>
                              {STATUS_FLYER_ROTULOS[flyer.status ?? "gerado"]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-parchment-100">{nomeTemplate(flyer.templateId)}</p>
                        <p className="text-parchment-500">
                          {formatarData(flyer.criadoEm)}
                          {flyer.formatoId && ` · ${getFormatoPreset(flyer.formatoId).nome}`}
                        </p>
                        {flyer.campos && (
                          <div className="text-xs text-parchment-500/80 max-h-24 overflow-y-auto">
                            {Object.entries(flyer.campos).map(([k, v]) => (
                              <p key={k}><span className="font-medium">{k}:</span> {v}</p>
                            ))}
                          </div>
                        )}
                        {typeof flyer.avaliacao === "number" && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                size={13}
                                className={
                                  n <= flyer.avaliacao!
                                    ? "fill-gold-400 text-gold-400"
                                    : "text-parchment-500/25"
                                }
                              />
                            ))}
                          </div>
                        )}
                        {flyer.motivoRejeicao && (
                          <p className="text-red-300/80">Motivo: {flyer.motivoRejeicao}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}