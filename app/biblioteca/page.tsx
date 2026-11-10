"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images, Trash2, UploadCloud, BadgeCheck, RotateCcw, AlertCircle, Info } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import { deleteAsset, getAssets, saveAsset } from "@/lib/store";
import { TIPOS_ASSET, assetSrc, rotuloTipoAsset, marcarLogoOficial } from "@/lib/tiposAsset";
import { AssetBiblioteca, TipoAsset, FlyerTemplate } from "@/lib/types";
import { getTemplates } from "@/lib/store";

type ImgValue = { previewUrl: string; base64: string; mimeType: string } | null;

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export default function BibliotecaPage() {
  const [assets, setAssets] = useState<AssetBiblioteca[]>([]);
  const [templates, setTemplates] = useState<FlyerTemplate[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<TipoAsset | "todos">("todos");

  const [novoArquivo, setNovoArquivo] = useState<ImgValue>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoAsset>("logo");
  const [salvando, setSalvando] = useState(false);
  const [oficializando, setOficializando] = useState<string | null>(null);
  const [modalOficial, setModalOficial] = useState<{ asset: AssetBiblioteca; templatesAfetados: string[] } | null>(null);

  useEffect(() => {
    getAssets()
      .then(setAssets)
      .finally(() => setCarregando(false));
    getTemplates().then(setTemplates);
  }, []);

  async function adicionar() {
    if (!novoArquivo || !novoNome.trim()) return;
    setSalvando(true);
    const rascunho: AssetBiblioteca = {
      id: crypto.randomUUID(),
      nome: novoNome.trim(),
      tipo: novoTipo,
      criadoEm: new Date().toISOString(),
      base64: novoArquivo.base64,
      mimeType: novoArquivo.mimeType,
    };
    const salvo = await saveAsset(rascunho);
    setAssets((prev) => [salvo, ...prev]);
    setNovoArquivo(null);
    setNovoNome("");
    setSalvando(false);
  }

  async function excluir(id: string) {
    if (!confirm("Excluir este item da biblioteca? Essa ação não pode ser desfeita.")) return;
    setAssets((prev) => prev.filter((a) => a.id !== id));
    await deleteAsset(id);
  }

  async function tornarOficial(asset: AssetBiblioteca) {
    if (asset.tipo !== "logo") return;
    setOficializando(asset.id);
    try {
      const resultado = await marcarLogoOficial(asset.id, assets, templates);
      setModalOficial({ asset, templatesAfetados: resultado.templatesAfetados });
    } finally {
      setOficializando(null);
    }
  }

  const assetsFiltrados = filtro === "todos" ? assets : assets.filter((a) => a.tipo === filtro);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 flex flex-col gap-2 border-b border-brand-stone pb-8"
      >
        <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand-gold-600">
          <Images size={13} /> Estúdio de mídia
        </p>
        <h1 className="font-display text-5xl tracking-tighter text-brand-ink sm:text-6xl">
          Biblioteca de ativos
        </h1>
        <p className="mt-3 max-w-lg text-lg text-slate-600 leading-relaxed">
          Centralize seus logos, fotos e fundos. Reutilize ativos aprovados para manter a consistência visual.
        </p>
      </motion.div>

      <div className="mb-16 grid grid-cols-1 gap-10 lg:grid-cols-[250px_1fr]">
        <div className="sticky top-24 h-fit">
          <div className="bg-white rounded-2xl border-2 border-brand-stone p-5 shadow-soft">
            <p className="mb-2 text-sm font-bold text-brand-ink">Novo ativo</p>
            <p className="text-xs text-slate-500 mb-3">PNG ou JPG</p>
            <UploadDropzone
              label=""
              hint=""
              aspect="square"
              value={novoArquivo}
              onChange={setNovoArquivo}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-ink">Nome do Ativo</label>
              <input
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Logo oficial OBPC..."
                className="w-full rounded-2xl border-2 border-brand-stone bg-white px-4 py-3 text-sm font-medium text-brand-ink outline-none transition-all focus:border-brand-gold-500 focus:ring-4 focus:ring-brand-gold-100 placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-brand-ink">Tipo de Ativo</label>
              <div className="flex flex-wrap gap-2">
                {TIPOS_ASSET.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setNovoTipo(t.id)}
                    className={`rounded-full border-2 px-4 py-2 text-xs font-bold transition-all ${
                      novoTipo === t.id
                        ? "border-brand-gold-500 bg-brand-gold-50 text-brand-gold-700 shadow-soft"
                        : "border-brand-stone bg-white text-slate-500 hover:border-brand-gold-300"
                    }`}
                  >
                    {t.nome}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            disabled={!novoArquivo || !novoNome.trim() || salvando}
            onClick={adicionar}
            whileHover={{ scale: novoArquivo ? 1.02 : 1 }}
            whileTap={{ scale: novoArquivo ? 0.98 : 1 }}
            className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-ink px-6 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-30 shadow-lg"
          >
            <UploadCloud size={20} /> {salvando ? "Salvando…" : "Adicionar à biblioteca"}
          </motion.button>
        </div>
      </div>

      {assets.length > 0 && (
        <div className="mb-10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`rounded-full border-2 px-5 py-2 text-xs font-bold transition-all ${
              filtro === "todos"
                ? "border-brand-gold-500 bg-brand-gold-50 text-brand-gold-700 shadow-soft"
                : "border-brand-stone bg-white text-slate-500 hover:border-brand-gold-300"
            }`}
          >
            Todos
          </button>
          {TIPOS_ASSET.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFiltro(t.id)}
              className={`rounded-full border-2 px-5 py-2 text-xs font-bold transition-all ${
                filtro === t.id
                  ? "border-brand-gold-500 bg-brand-gold-50 text-brand-gold-700 shadow-soft"
                  : "border-brand-stone bg-white text-slate-500 hover:border-brand-gold-300"
              }`}
            >
              {t.nomePlural}
            </button>
          ))}
        </div>
      )}

      {!carregando && assets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-stone py-24 text-center bg-slate-50/50">
          <Images className="mb-4 text-slate-300" size={48} />
          <p className="text-lg font-medium text-slate-600">Sua biblioteca está vazia.</p>
          <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">
            Adicione logos, fotos ou fundos para facilitar a criação dos seus flyers.
          </p>
        </div>
      )}

      {assetsFiltrados.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4"
        >
          <AnimatePresence>
            {assetsFiltrados.map((a) => (
              <motion.div
                key={a.id}
                variants={item}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative overflow-hidden rounded-2xl border-2 border-brand-stone bg-white transition-all hover:border-brand-gold-500 hover:shadow-premium"
              >
                <div className="relative aspect-square overflow-hidden">
                  <img src={assetSrc(a)} alt={a.nome} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <button
                    type="button"
                    onClick={() => excluir(a.id)}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-ink text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                  {a.tipo === "logo" && (
                    <button
                      type="button"
                      onClick={() => tornarOficial(a)}
                      disabled={oficializando === a.id}
                      className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-brand-gold-600 transition-all hover:bg-white"
                      title={a.oficial ? "Logo oficial" : "Marcar como logo oficial"}
                    >
                      <BadgeCheck className={`h-4 w-4 ${a.oficial ? "text-emerald-500" : ""}`} />
                    </button>
                  )}
                  <span className="absolute left-2 bottom-2 rounded-full border border-white/20 bg-brand-ink/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                    {rotuloTipoAsset(a.tipo)}
                    {a.oficial && <span className="ml-1 text-emerald-400">●</span>}
                  </span>
                </div>
                <p className="truncate px-4 py-3 text-sm font-bold text-brand-ink">
                  {a.nome}
                  {a.oficial && <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-500">
                    <BadgeCheck size={10} /> Oficial
                  </span>}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {modalOficial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ink/90 backdrop-blur-md"
            onClick={() => setModalOficial(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md rounded-3xl border-2 border-brand-gold-500 bg-white p-8 shadow-premium"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <BadgeCheck size={32} />
                </div>
                <div>
                  <h3 className="font-display text-2xl tracking-tight text-brand-ink">Logo Oficializado</h3>
                  <p className="text-sm text-slate-500">O ativo "<strong className="text-brand-ink">{modalOficial.asset.nome}</strong>" agora é a identidade oficial.</p>
                </div>
              </div>

              {modalOficial.templatesAfetados.length > 0 && (
                <div className="mb-6 rounded-2xl border border-brand-stone bg-slate-50 p-5">
                  <p className="mb-3 text-sm font-bold text-brand-ink flex items-center gap-2">
                    <Info size={16} /> Templates impactados:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {modalOficial.templatesAfetados.map((tid) => (
                      <li key={tid} className="flex items-center gap-2">
                        <RotateCcw className="h-3 w-3 text-brand-gold-600" />
                        <span>Sugerimos regenerar o template <code className="px-1.5 py-0.5 rounded bg-white border border-brand-stone font-mono text-[10px]">{tid.slice(0, 8)}...</code></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setModalOficial(null)}
                className="w-full rounded-full bg-brand-ink py-3 text-sm font-bold text-white hover:bg-slate-800 transition-all"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
