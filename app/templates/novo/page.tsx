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

  // Carrega a chave salva (por provedor) assim que a página abre ou o
  // provedor selecionado muda — cada chave fica isolada no localStorage
  // deste navegador, nunca é enviada a lugar nenhum além da nossa própria
  // API de extração.
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
          apiKey: apiKey.trim() || undefined,
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
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
        Etapa 1 de 1
      </p>
      <h1 className="mb-2 font-display text-4xl tracking-wide text-parchment-100">
        Extrair novo template
      </h1>
      <p className="mb-10 max-w-lg text-sm text-parchment-500">
        Envie um flyer de referência. A identidade visual, o layout e a paleta
        serão extraídos automaticamente — a pessoa da foto não é copiada, só o
        estilo.
      </p>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-[220px_1fr]">
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

        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-parchment-100">
              Nome do template
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Culto de Domingo — OBPC"
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-parchment-100">
              Categoria do evento (opcional)
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaEvento | "")}
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-3 py-2.5 text-sm text-parchment-100 outline-none transition-colors focus:border-gold-400/50"
            >
              <option value="">Sem categoria</option>
              {CATEGORIAS_EVENTO.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-parchment-100">
              <Sparkles size={14} className="text-gold-400" /> Modelo de IA
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="rounded-xl border border-gold-500/15 bg-ink-900/70 px-3 py-2.5 text-sm text-parchment-100 outline-none transition-colors focus:border-gold-400/50"
              >
                <option value="openrouter">OpenRouter (grátis)</option>
                <option value="anthropic">Anthropic Claude (sua chave)</option>
              </select>

              {provider === "openrouter" && (
                <select
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="flex-1 rounded-xl border border-gold-500/15 bg-ink-900/70 px-3 py-2.5 text-sm text-parchment-100 outline-none transition-colors focus:border-gold-400/50"
                >
                  {modelos.length === 0 && <option value="">Carregando modelos…</option>}
                  {modelos.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {provider === "openrouter" && (
              <p className="mt-1.5 text-xs text-parchment-500">
                Modelos gratuitos da{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-dotted hover:text-gold-300"
                >
                  OpenRouter
                </a>
                . Limite do tier grátis: ~20 req/min e 50/dia.
              </p>
            )}

            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-medium text-parchment-300">
                Sua chave de API {provider === "openrouter" ? "da OpenRouter" : "da Anthropic"}
              </label>
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => atualizarApiKey(e.target.value)}
                placeholder={provider === "openrouter" ? "sk-or-v1-..." : "sk-ant-..."}
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-3 py-2.5 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/40 focus:border-gold-400/50"
              />
              <p className="mt-1.5 text-xs text-parchment-500">
                Fica salva só neste navegador (nunca sai daqui além da nossa
                própria chamada de extração). Se o projeto já tiver a chave
                configurada na Vercel, pode deixar em branco.
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            disabled={!referencia || status === "extraindo"}
            onClick={extrair}
            whileHover={{ scale: referencia ? 1.01 : 1 }}
            whileTap={{ scale: referencia ? 0.98 : 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-gold-500/25 bg-gold-500/10 px-5 py-3 text-sm font-medium text-gold-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status === "extraindo" ? (
              <>
                <ScanLine size={16} className="animate-pulse" />
                Analisando identidade visual…
              </>
            ) : (
              <>
                <Wand2 size={16} />
                Extrair identidade visual
              </>
            )}
          </motion.button>

          <AnimatePresence>
            {erro && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>
                  {erro} Você também pode colar o prompt manualmente no campo
                  abaixo.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-10">
        <label className="mb-2 block text-sm font-medium text-parchment-100">
          Prompt de criação (editável)
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={10}
          placeholder="O prompt extraído aparece aqui — ou cole um prompt já pronto."
          className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm leading-relaxed text-parchment-200 outline-none transition-colors placeholder:text-parchment-500/50 focus:border-gold-400/50"
        />

        {variaveis && (variaveis.variaveisTexto.length > 0 || variaveis.variaveisImagem.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {variaveis.variaveisTexto.map((v) => (
              <span
                key={v}
                className="rounded-full border border-gold-500/20 bg-gold-500/5 px-3 py-1 text-xs text-gold-300"
              >
                {ROTULOS_VARIAVEIS[v] ?? v}
              </span>
            ))}
            {variaveis.variaveisImagem.map((v) => (
              <span
                key={v}
                className="rounded-full border border-parchment-500/20 bg-parchment-500/5 px-3 py-1 text-xs text-parchment-300"
              >
                🖼 {v === "FOTO_PRELETOR_ANEXADA" ? "Foto do preletor" : "Logo da igreja"}
              </span>
            ))}
          </div>
        )}

        <motion.button
          type="button"
          disabled={!nome.trim() || !prompt.trim()}
          onClick={salvar}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Save size={16} /> Salvar template
        </motion.button>
      </div>
    </div>
  );
}
