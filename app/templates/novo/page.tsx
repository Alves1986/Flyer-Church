"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Save, AlertTriangle, ScanLine, Sparkles } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import { saveTemplate } from "@/lib/store";
import { parseTemplateVariables } from "@/lib/promptMerge";
import { ROTULOS_VARIAVEIS } from "@/lib/metaPrompt";
import { OpenRouterModel } from "@/lib/openrouter";
import { CATEGORIAS_EVENTO } from "@/lib/categorias";
import { CategoriaEvento } from "@/lib/types";

type ImgValue = { previewUrl: string; base64: string; mimeType: string } | null;
type Provider = "openrouter" | "anthropic";

const CHAVE_OPENROUTER_LOCAL = "flyerforge.openrouterKey";
const CHAVE_ANTHROPIC_LOCAL = "flyerforge.anthropicKey";

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";

export default function NovoTemplatePage() {
  const router = useRouter();
  const [referencia, setReferencia] = useState<ImgValue>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaEvento | "">("");
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState<"idle" | "extraindo" | "pronto" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);

  const [modelos, setModelos] = useState<OpenRouterModel[]>([]);
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [modelo, setModelo] = useState("");
  const [apiKey, setApiKey] = useState("");

  useEffect(() => {
    fetch("/api/openrouter-models")
      .then((r) => r.json())
      .then((data: { models: OpenRouterModel[] }) => {
        setModelos(data.models ?? []);
        if (data.models?.[0]) setModelo(data.models[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const chaveKey = provider === "openrouter" ? CHAVE_OPENROUTER_LOCAL : CHAVE_ANTHROPIC_LOCAL;
    setApiKey(window.localStorage.getItem(chaveKey) ?? "");
  }, [provider]);

  function atualizarApiKey(valor: string) {
    setApiKey(valor);
    const chaveKey = provider === "openrouter" ? CHAVE_OPENROUTER_LOCAL : CHAVE_ANTHROPIC_LOCAL;
    if (valor.trim()) {
      window.localStorage.setItem(chaveKey, valor.trim());
    } else {
      window.localStorage.removeItem(chaveKey);
    }
  }

  const variaveis = prompt ? parseTemplateVariables(prompt) : null;

  async function extrair() {
    if (!referencia) return;
    setStatus("extraindo");
    setErro(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: referencia.base64,
          mimeType: referencia.mimeType,
          provider,
          model: modelo,
          apiKey: undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha na extração.");
        setStatus("erro");
        return;
      }
      setPrompt(data.prompt);
      setStatus("pronto");
    } catch (e) {
      setErro((e as Error).message);
      setStatus("erro");
    }
  }

  async function salvar() {
    if (!nome.trim() || !prompt.trim()) return;
    const { variaveisTexto, variaveisImagem } = parseTemplateVariables(prompt);
    await saveTemplate({
      id: crypto.randomUUID(),
      nome: nome.trim(),
      criadoEm: new Date().toISOString(),
      promptExtraido: prompt.trim(),
      variaveisTexto,
      variaveisImagem,
      categoria: categoria || undefined,
    });
    router.push("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 bg-[INK] text-[FG] font-body min-h-screen">
      <div className="mb-12">
        <p className="mb-3 text-xs font-black uppercase tracking-[0.3em] text-[GOLD_DARK]">
          Etapa 1 de 1
        </p>
        <h1 className="mb-4 font-display text-5xl tracking-wide text-[FG] sm:text-5xl">
          Extrair novo template
        </h1>
        <p className="max-w-2xl text-lg text-[MUTED] leading-relaxed">
          Envie um flyer de referência. Nossa IA extrai a identidade visual, o layout e a paleta automaticamente para criar a base do seu design.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <UploadDropzone
              label="Flyer de referência"
              hint="PNG ou JPG, formato retrato"
              aspect="portrait"
              value={referencia}
              onChange={(v) => {
                setReferencia(v);
                setStatus("idle");
              }}
            />
          </div>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[FG]">Nome do template</label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Culto de Domingo — OBPC"
                className="w-full rounded-2xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-3 text-sm font-medium text-[FG] outline-none transition-all focus:border-[#B8860B]/50 focus:ring-4 focus:ring-[GOLD]/20 placeholder:text-[MUTED]/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-[FG]">Categoria do evento</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaEvento | "")}
                className="w-full rounded-2xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-3 text-sm font-medium text-[FG] outline-none transition-all focus:border-[#B8860B]/50 focus:ring-4 focus:ring-[GOLD]/20"
              >
                <option value="">Sem categoria</option>
                {CATEGORIAS_EVENTO.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-[SURFACE]/60 border-2 border-[GOLD]/12 shadow-[0_0_20px_rgba(184,134,11,0.1)] space-y-6">
            <label className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[FG]">
              <Sparkles size={18} className="text-[GOLD_DARK]" /> Configuração de Inteligência
            </label>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[MUTED] uppercase">Provedor</span>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  className="w-full rounded-xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#B8860B]/50 transition-all"
                >
                  <option value="openrouter">OpenRouter (grátis)</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[MUTED] uppercase">Modelo de IA</span>
                <select
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="w-full rounded-xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-2.5 text-sm font-medium outline-none focus:border-[#B8860B]/50 transition-all"
                >
                  {modelos.length === 0 && <option value="">Carregando modelos...</option>}
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[MUTED] uppercase">Chave de API</span>
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => atualizarApiKey(e.target.value)}
                placeholder={provider === "openrouter" ? "sk-or-v1-..." : "sk-ant-..."}
                className="w-full rounded-xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-2.5 text-sm font-mono outline-none transition-all focus:border-[#B8860B]/50"
              />
            </div>

            <motion.button
              type="button"
              disabled={!referencia || status === "extraindo"}
              onClick={extrair}
              whileHover={{ scale: referencia ? 1.02 : 1 }}
              whileTap={{ scale: referencia ? 0.98 : 1 }}
              className="w-full inline-flex items-center justify-center gap-3 rounded-2xl bg-[GOLD] px-6 py-4 text-sm font-bold text-[INK] transition-all hover:bg-[GOLD_LIGHT] disabled:opacity-30 shadow-[0_0_20px_rgba(184,134,11,0.2)]"
            >
              {status === "extraindo" ? (
                <><ScanLine size={20} className="animate-spin" /> Analisando Identidade Visual...</>
              ) : (
                <><Wand2 size={20} /> Extrair Identidade Visual</>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-start gap-3 rounded-2xl border-2 border-[#DC2626]/30 bg-[#DC2626]/5 p-4 text-sm text-[#FCA5A5]"
              >
                <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                <span className="font-medium">{erro}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-16 space-y-6">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-[FG] uppercase tracking-widest">
            Prompt de Criação (Editável)
          </label>
          <div className="h-px flex-1 mx-4 bg-[GOLD]/12" />
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={12}
          placeholder="A IA preencherá este campo automaticamente após a extração..."
          className="w-full rounded-3xl border-2 border-[BORDER] bg-[SURFACE]/70 px-6 py-5 text-sm leading-relaxed text-[FG] outline-none transition-all focus:border-[#B8860B]/50 focus:ring-4 focus:ring-[GOLD]/20 placeholder:text-[MUTED]/40 shadow-soft"
        />

        {variaveis && (variaveis.variaveisTexto.length > 0 || variaveis.variaveisImagem.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {variaveis.variaveisTexto.map((v) => (
              <span key={v} className="rounded-full border-2 border-[GOLD]/20 bg-[SURFACE]/70 px-4 py-1.5 text-xs font-bold text-[MUTED] shadow-soft">
                {ROTULOS_VARIAVEIS[v] ?? v}
              </span>
            ))}
            {variaveis.variaveisImagem.map((v) => (
              <span key={v} className="rounded-full border-2 border-[GOLD]/20 bg-[SURFACE]/70 px-4 py-1.5 text-xs font-bold text-[MUTED] shadow-soft">
                FOTO {v === "FOTO_PRELETOR_ANEXADA" ? "do preletor" : "do logo"}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-6">
          <motion.button
            type="button"
            disabled={!nome.trim() || !prompt.trim()}
            onClick={salvar}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 rounded-full bg-[GOLD] px-10 py-4 text-sm font-black text-[INK] shadow-[0_0_20px_rgba(184,134,11,0.2)] hover:bg-[GOLD_LIGHT] transition-all disabled:opacity-30 uppercase tracking-widest"
          >
            <Save size={20} /> Salvar Template
          </motion.button>
        </div>
      </div>
    </div>
  );
}
