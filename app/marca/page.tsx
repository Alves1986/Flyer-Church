"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Wand2, Save, AlertTriangle, ShieldCheck, ScanLine } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import { getBrandDna, saveBrandDna } from "@/lib/store";
import { brandDnaVazio, mesclarPropostaBrandDna, BrandDnaProposta } from "@/lib/brandDna";
import { BrandDna } from "@/lib/types";

type ImgValue = { previewUrl: string; base64: string; mimeType: string } | null;

const CHAVE_OPENROUTER_LOCAL = "flyerforge.openrouterKey";

/** Converte uma lista de string[] em texto (uma por linha) e vice-versa, para textareas simples. */
function paraTexto(lista: string[]): string {
  return lista.join("\n");
}
function paraLista(texto: string): string[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function MarcaPage() {
  const [carregando, setCarregando] = useState(true);
  const [brandDna, setBrandDna] = useState<BrandDna>(brandDnaVazio());
  const [existiaAntes, setExistiaAntes] = useState(false);

  // Formulário curto para a proposta da IA.
  const [nomeIgreja, setNomeIgreja] = useState("");
  const [tomDeVoz, setTomDeVoz] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [paletaDesejada, setPaletaDesejada] = useState("");
  const [fontesDesejadas, setFontesDesejadas] = useState("");
  const [referencia1, setReferencia1] = useState<ImgValue>(null);
  const [referencia2, setReferencia2] = useState<ImgValue>(null);
  const [apiKey, setApiKey] = useState("");

  const [status, setStatus] = useState<"idle" | "propondo" | "salvando" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    getBrandDna()
      .then((atual) => {
        if (atual) {
          setBrandDna(atual);
          setNomeIgreja(atual.name);
          setExistiaAntes(true);
        }
      })
      .finally(() => setCarregando(false));
    setApiKey(window.localStorage.getItem(CHAVE_OPENROUTER_LOCAL) ?? "");
  }, []);

  async function propor() {
    if (!nomeIgreja.trim() || !tomDeVoz.trim()) return;
    setStatus("propondo");
    setErro(null);
    setSalvo(false);
    try {
      const referencias = [referencia1, referencia2]
        .filter((r): r is NonNullable<ImgValue> => r !== null)
        .map((r) => ({ base64: r.base64, mimeType: r.mimeType }));

      const res = await fetch("/api/brand-dna/propose", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          respostas: {
            nomeIgreja: nomeIgreja.trim(),
            tomDeVoz: tomDeVoz.trim(),
            publicoAlvo: publicoAlvo.trim() || undefined,
            paletaDesejada: paletaDesejada.trim() || undefined,
            fontesDesejadas: fontesDesejadas.trim() || undefined,
          },
          referencias,
          apiKey: apiKey.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao gerar a proposta.");
        setStatus("erro");
        return;
      }
      const proposta = data.proposta as BrandDnaProposta;
      setBrandDna((atual) => mesclarPropostaBrandDna(atual, { ...proposta, name: proposta.name || nomeIgreja }));
      setStatus("idle");
    } catch (e) {
      setErro((e as Error).message);
      setStatus("erro");
    }
  }

  async function salvar(aprovar: boolean) {
    setStatus("salvando");
    setSalvo(false);
    const paraSalvar: BrandDna = {
      ...brandDna,
      version: existiaAntes ? brandDna.version + 1 : 1,
      approvedByHuman: aprovar,
    };
    await saveBrandDna(paraSalvar);
    setBrandDna(paraSalvar);
    setExistiaAntes(true);
    setStatus("idle");
    setSalvo(true);
  }

  function atualizarCampo<K extends keyof BrandDna>(campo: K, valor: BrandDna[K]) {
    setBrandDna((atual) => ({ ...atual, [campo]: valor }));
  }

  if (carregando) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
        <Fingerprint size={13} /> Identidade da marca
      </p>
      <h1 className="mb-2 font-display text-4xl tracking-wide text-parchment-100">
        Brand DNA da igreja
      </h1>
      <p className="mb-10 max-w-lg text-sm text-parchment-500">
        Responda algumas perguntas curtas e, se quiser, anexe flyers já
        aprovados. A IA propõe um perfil visual estruturado — paleta,
        tipografia, composição e tom — que você revisa e aprova antes de ele
        passar a influenciar novas gerações.
      </p>

      {brandDna.approvedByHuman && (
        <div className="mb-8 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
          <ShieldCheck size={16} /> Este Brand DNA está aprovado e é aplicado às novas gerações (versão {brandDna.version}).
        </div>
      )}

      <div className="mb-10 grid grid-cols-1 gap-5 rounded-2xl border border-gold-500/10 bg-ink-900/40 p-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-parchment-100">Nome da igreja</label>
          <input
            value={nomeIgreja}
            onChange={(e) => setNomeIgreja(e.target.value)}
            placeholder="Ex: Igreja Batista Vida Nova"
            className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-parchment-100">Tom de voz desejado</label>
          <input
            value={tomDeVoz}
            onChange={(e) => setTomDeVoz(e.target.value)}
            placeholder="Ex: acolhedor, contemporâneo, esperançoso"
            className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-parchment-100">Público-alvo (opcional)</label>
            <input
              value={publicoAlvo}
              onChange={(e) => setPublicoAlvo(e.target.value)}
              placeholder="Ex: famílias, jovens adultos"
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-parchment-100">Paleta desejada (opcional)</label>
            <input
              value={paletaDesejada}
              onChange={(e) => setPaletaDesejada(e.target.value)}
              placeholder="Ex: dourado e azul-marinho"
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-parchment-100">Fontes desejadas (opcional)</label>
          <input
            value={fontesDesejadas}
            onChange={(e) => setFontesDesejadas(e.target.value)}
            placeholder="Ex: condensada e moderna no título, legível no corpo"
            className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/60 focus:border-gold-400/50"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-parchment-100">
            Flyers de referência já aprovados (opcional, até 2)
          </label>
          <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
            <UploadDropzone label="Referência 1" aspect="portrait" value={referencia1} onChange={setReferencia1} />
            <UploadDropzone label="Referência 2" aspect="portrait" value={referencia2} onChange={setReferencia2} />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-parchment-300">
            Sua chave de API da OpenRouter (opcional)
          </label>
          <input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
            className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-3 py-2.5 text-sm text-parchment-100 outline-none transition-colors placeholder:text-parchment-500/40 focus:border-gold-400/50"
          />
          <p className="mt-1.5 text-xs text-parchment-500">
            Mesma chave usada em Novo template. Se o projeto já tiver
            OPENROUTER_API_KEY configurada na Vercel, pode deixar em branco.
          </p>
        </div>

        <motion.button
          type="button"
          disabled={!nomeIgreja.trim() || !tomDeVoz.trim() || status === "propondo"}
          onClick={propor}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/10 px-5 py-3 text-sm font-medium text-gold-200 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          {status === "propondo" ? (
            <>
              <ScanLine size={16} className="animate-pulse" /> Analisando identidade…
            </>
          ) : (
            <>
              <Wand2 size={16} /> Gerar proposta de identidade
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
              <span>{erro}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-8">
        <h2 className="mb-1 font-display text-2xl tracking-wide text-parchment-100">
          Proposta (revise e corrija antes de aprovar)
        </h2>
        <p className="mb-6 text-sm text-parchment-500">
          Cada campo de lista aceita um item por linha. Campos vazios são
          ignorados na geração.
        </p>

        <div className="grid grid-cols-1 gap-5">
          <Campo label="Nome / marca">
            <input
              value={brandDna.name}
              onChange={(e) => atualizarCampo("name", e.target.value)}
              className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
            />
          </Campo>

          <Campo label="Tom de voz (voice)">
            <TextareaLista
              valor={brandDna.voice}
              onChange={(v) => atualizarCampo("voice", v)}
            />
          </Campo>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Paleta primária">
              <TextareaLista valor={brandDna.palette.primary} onChange={(v) => atualizarCampo("palette", { ...brandDna.palette, primary: v })} />
            </Campo>
            <Campo label="Paleta secundária">
              <TextareaLista valor={brandDna.palette.secondary} onChange={(v) => atualizarCampo("palette", { ...brandDna.palette, secondary: v })} />
            </Campo>
            <Campo label="Neutros">
              <TextareaLista valor={brandDna.palette.neutrals} onChange={(v) => atualizarCampo("palette", { ...brandDna.palette, neutrals: v })} />
            </Campo>
            <Campo label="Cores a evitar">
              <TextareaLista valor={brandDna.palette.avoid} onChange={(v) => atualizarCampo("palette", { ...brandDna.palette, avoid: v })} />
            </Campo>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Fonte de destaque">
              <input
                value={brandDna.typography.headline ?? ""}
                onChange={(e) => atualizarCampo("typography", { ...brandDna.typography, headline: e.target.value })}
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
              />
            </Campo>
            <Campo label="Fonte de corpo">
              <input
                value={brandDna.typography.body ?? ""}
                onChange={(e) => atualizarCampo("typography", { ...brandDna.typography, body: e.target.value })}
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none focus:border-gold-400/50"
              />
            </Campo>
          </div>
          <Campo label="Regras de tipografia">
            <TextareaLista valor={brandDna.typography.rules} onChange={(v) => atualizarCampo("typography", { ...brandDna.typography, rules: v })} />
          </Campo>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Campo label="Composição preferida">
              <TextareaLista valor={brandDna.composition.preferred} onChange={(v) => atualizarCampo("composition", { ...brandDna.composition, preferred: v })} />
            </Campo>
            <Campo label="Composição a evitar">
              <TextareaLista valor={brandDna.composition.avoid} onChange={(v) => atualizarCampo("composition", { ...brandDna.composition, avoid: v })} />
            </Campo>
            <Campo label="Áreas seguras p/ texto">
              <TextareaLista valor={brandDna.composition.textSafeAreas} onChange={(v) => atualizarCampo("composition", { ...brandDna.composition, textSafeAreas: v })} />
            </Campo>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label="Assuntos de imagem preferidos">
              <TextareaLista valor={brandDna.imagery.subjects} onChange={(v) => atualizarCampo("imagery", { ...brandDna.imagery, subjects: v })} />
            </Campo>
            <Campo label="Atmosfera / mood">
              <TextareaLista valor={brandDna.imagery.mood} onChange={(v) => atualizarCampo("imagery", { ...brandDna.imagery, mood: v })} />
            </Campo>
            <Campo label="Tratamentos visuais">
              <TextareaLista valor={brandDna.imagery.treatments} onChange={(v) => atualizarCampo("imagery", { ...brandDna.imagery, treatments: v })} />
            </Campo>
            <Campo label="Evitar em imagens">
              <TextareaLista valor={brandDna.imagery.avoid} onChange={(v) => atualizarCampo("imagery", { ...brandDna.imagery, avoid: v })} />
            </Campo>
          </div>

          <Campo label="Motivos gráficos recorrentes">
            <TextareaLista valor={brandDna.motifs} onChange={(v) => atualizarCampo("motifs", v)} />
          </Campo>
          <Campo label="Regras do logotipo">
            <TextareaLista valor={brandDna.logoRules} onChange={(v) => atualizarCampo("logoRules", v)} />
          </Campo>
          <Campo label="Regras de tom para textos/CTAs">
            <TextareaLista valor={brandDna.copyRules} onChange={(v) => atualizarCampo("copyRules", v)} />
          </Campo>
          <Campo label="Nunca gerar (restrições)">
            <TextareaLista valor={brandDna.negativeRules} onChange={(v) => atualizarCampo("negativeRules", v)} />
          </Campo>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          disabled={!brandDna.name.trim() || status === "salvando"}
          onClick={() => salvar(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ShieldCheck size={16} /> Aprovar e salvar
        </motion.button>
        <motion.button
          type="button"
          disabled={!brandDna.name.trim() || status === "salvando"}
          onClick={() => salvar(false)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-full border border-gold-500/20 px-6 py-3 text-sm font-medium text-parchment-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Save size={16} /> Salvar como rascunho
        </motion.button>
        {salvo && <span className="text-xs text-parchment-500">Salvo.</span>}
      </div>

      <p className="mt-4 text-[11px] text-parchment-500">
        Sem banco conectado, isso fica salvo só neste navegador — ver Vercel →
        Storage → Postgres para manter entre sessões e dispositivos.
      </p>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-parchment-300">{label}</label>
      {children}
    </div>
  );
}

function TextareaLista({ valor, onChange }: { valor: string[]; onChange: (v: string[]) => void }) {
  return (
    <textarea
      value={paraTexto(valor)}
      onChange={(e) => onChange(paraLista(e.target.value))}
      rows={3}
      placeholder="Um item por linha"
      className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-2.5 text-sm leading-relaxed text-parchment-200 outline-none transition-colors placeholder:text-parchment-500/40 focus:border-gold-400/50"
    />
  );
}
