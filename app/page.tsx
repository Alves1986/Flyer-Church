"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Sparkles, LayoutTemplate, Trash2, Copy } from "lucide-react";
import { deleteTemplate, duplicateTemplate, getTemplates } from "@/lib/store";
import { CATEGORIAS_EVENTO, rotuloCategoria } from "@/lib/categorias";
import { CategoriaEvento, FlyerTemplate } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

export default function DashboardPage() {
  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaEvento | "todas">("todas");

  useEffect(() => {
    getTemplates().then(setTemplates);
  }, []);

  async function excluir(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Excluir este template? Essa ação não pode ser desfeita.")) return;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await deleteTemplate(id);
  }

  async function duplicar(e: React.MouseEvent, t: FlyerTemplate) {
    e.preventDefault();
    e.stopPropagation();
    const copia = await duplicateTemplate(t);
    setTemplates((prev) => [copia, ...prev]);
  }

  const categoriasUsadas = CATEGORIAS_EVENTO.filter((c) =>
    templates.some((t) => t.categoria === c.id)
  );

  const templatesFiltrados =
    filtroCategoria === "todas"
      ? templates
      : templates.filter((t) => t.categoria === filtroCategoria);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-col gap-2 border-b border-gold-500/10 pb-8 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
            <Sparkles size={13} /> Estúdio de flyers
          </p>
          <h1 className="font-display text-4xl leading-none tracking-wide text-parchment-100 sm:text-5xl">
            Seus modelos
          </h1>
          <p className="mt-3 max-w-md text-sm text-parchment-500">
            Extraia a identidade visual de um flyer existente uma única vez e gere
            novas artes para cada culto, evento ou preletor.
          </p>
        </div>

        <Link href="/templates/novo">
          <motion.span
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 px-5 py-3 text-sm font-semibold text-ink-950 shadow-glow"
          >
            <Plus size={16} /> Novo template
          </motion.span>
        </Link>
      </motion.div>

      {templates.length > 0 && categoriasUsadas.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltroCategoria("todas")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filtroCategoria === "todas"
                ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                : "border-gold-500/15 text-parchment-500 hover:border-gold-500/30 hover:text-parchment-300"
            }`}
          >
            Todas
          </button>
          {categoriasUsadas.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFiltroCategoria(c.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filtroCategoria === c.id
                  ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                  : "border-gold-500/15 text-parchment-500 hover:border-gold-500/30 hover:text-parchment-300"
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
      )}

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 py-20 text-center">
          <LayoutTemplate className="mb-3 text-gold-500/50" size={28} />
          <p className="text-parchment-300">Nenhum template ainda.</p>
          <p className="mt-1 text-sm text-parchment-500">
            Envie um flyer de referência para extrair o primeiro estilo.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {templatesFiltrados.map((t) => (
            <motion.div key={t.id} variants={item}>
              <Link
                href={`/flyers/novo/${t.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-gold-500/12 bg-ink-900/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold-500/30 hover:shadow-glow"
              >
                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => duplicar(e, t)}
                    aria-label="Duplicar template"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-parchment-500 hover:bg-gold-500/10 hover:text-gold-300"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => excluir(e, t.id)}
                    aria-label="Excluir template"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-parchment-500 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-gold-500/10 text-gold-300">
                  <LayoutTemplate size={18} />
                </div>
                {t.categoria && (
                  <span className="mb-2 inline-block rounded-full border border-gold-500/20 bg-gold-500/5 px-2.5 py-0.5 text-[11px] text-gold-300">
                    {rotuloCategoria(t.categoria)}
                  </span>
                )}
                <h3 className="mb-1 font-display text-2xl tracking-wide text-parchment-100">
                  {t.nome}
                </h3>
                <p className="mb-4 text-xs text-parchment-500">
                  {t.variaveisTexto.length} variáveis de texto ·{" "}
                  {t.variaveisImagem.length} imagens
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-0.5">
                  Gerar novo flyer →
                </span>
              </Link>
            </motion.div>
          ))}

          <motion.div variants={item}>
            <Link
              href="/templates/novo"
              className="flex h-full min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-gold-500/20 text-parchment-500 transition-colors duration-200 hover:border-gold-400/50 hover:text-gold-300"
            >
              <Plus size={20} />
              <span className="text-sm">Novo template</span>
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
