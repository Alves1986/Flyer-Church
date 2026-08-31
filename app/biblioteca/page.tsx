"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Images, Trash2, UploadCloud } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import { deleteAsset, getAssets, saveAsset } from "@/lib/store";
import { TIPOS_ASSET, assetSrc, rotuloTipoAsset } from "@/lib/tiposAsset";
import { AssetBiblioteca, TipoAsset } from "@/lib/types";

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
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<TipoAsset | "todos">("todos");

  const [novoArquivo, setNovoArquivo] = useState<ImgValue>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<TipoAsset>("logo");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    getAssets()
      .then(setAssets)
      .finally(() => setCarregando(false));
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

  const assetsFiltrados = filtro === "todos" ? assets : assets.filter((a) => a.tipo === filtro);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-10 flex flex-col gap-2 border-b border-gold-500/10 pb-8"
      >
        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
          <Images size={13} /> Estúdio de flyers
        </p>
        <h1 className="font-display text-4xl leading-none tracking-wide text-parchment-100 sm:text-5xl">
          Biblioteca de mídia
        </h1>
        <p className="mt-3 max-w-lg text-sm text-parchment-500">
          Guarde logos, fotos e fundos usados com frequência para reutilizar
          na hora de gerar um flyer, sem precisar enviar o arquivo de novo.
        </p>
      </motion.div>

      <div className="mb-10 grid grid-cols-1 gap-8 rounded-2xl border border-gold-500/10 bg-ink-900/40 p-6 sm:grid-cols-[180px_1fr]">
        <UploadDropzone
          label="Novo item"
          hint="PNG ou JPG"
          aspect="square"
          value={novoArquivo}
          onChange={setNovoArquivo}
        />

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-parchment-100">Nome</label>
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: Logo oficial OBPC, Foto pastor João..."
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-parchment-100">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_ASSET.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setNovoTipo(t.id)}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                    novoTipo === t.id
                      ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                      : "border-gold-500/15 bg-ink-900/60 text-parchment-400 hover:border-gold-500/30"
                  }`}
                >
                  {t.nome}
                </button>
              ))}
            </div>
          </div>

          <motion.button
            type="button"
            disabled={!novoArquivo || !novoNome.trim() || salvando}
            onClick={adicionar}
            whileHover={{ scale: novoArquivo ? 1.01 : 1 }}
            whileTap={{ scale: novoArquivo ? 0.98 : 1 }}
            className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-30"
          >
            <UploadCloud size={15} /> {salvando ? "Salvando…" : "Adicionar à biblioteca"}
          </motion.button>
        </div>
      </div>

      {assets.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFiltro("todos")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              filtro === "todos"
                ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                : "border-gold-500/15 text-parchment-500 hover:border-gold-500/30 hover:text-parchment-300"
            }`}
          >
            Todos
          </button>
          {TIPOS_ASSET.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFiltro(t.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filtro === t.id
                  ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                  : "border-gold-500/15 text-parchment-500 hover:border-gold-500/30 hover:text-parchment-300"
              }`}
            >
              {t.nomePlural}
            </button>
          ))}
        </div>
      )}

      {!carregando && assets.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gold-500/20 py-16 text-center">
          <Images className="mb-3 text-gold-500/50" size={28} />
          <p className="text-parchment-300">Biblioteca vazia.</p>
          <p className="mt-1 text-sm text-parchment-500">
            Adicione um logo, foto ou fundo acima para reutilizar depois.
          </p>
        </div>
      )}

      {assetsFiltrados.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          <AnimatePresence>
            {assetsFiltrados.map((a) => (
              <motion.div
                key={a.id}
                variants={item}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group relative overflow-hidden rounded-2xl border border-gold-500/12 bg-ink-900/60"
              >
                <div className="relative aspect-square overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetSrc(a)} alt={a.nome} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => excluir(a.id)}
                    aria-label="Excluir item"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/80 text-parchment-100 opacity-0 ring-1 ring-red-500/30 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:text-red-300"
                  >
                    <Trash2 size={13} />
                  </button>
                  <span className="absolute left-2 top-2 rounded-full border border-gold-500/20 bg-ink-950/70 px-2 py-0.5 text-[10px] font-medium text-gold-300 backdrop-blur-sm">
                    {rotuloTipoAsset(a.tipo)}
                  </span>
                </div>
                <p className="truncate px-3 py-2.5 text-xs font-medium text-parchment-200">
                  {a.nome}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
