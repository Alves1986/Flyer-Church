"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, Wand2, Save, AlertTriangle, ShieldCheck, ScanLine } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import { getBrandDna, saveBrandDna } from "@/lib/store";
import { brandDnaVazio, mesclarPropostaBrandDna, BrandDnaProposta } from "@/lib/brandDna";
import { BrandDna } from "@/lib/types";
import ColorPicker from "@/components/ColorPicker";
import FontPicker from "@/components/FontPicker";
import EventOverrides from "@/components/EventOverrides";

type ImgValue = { previewUrl: string; base64: string; mimeType: string } | null;

const CHAVE_OPENROUTER_LOCAL = "flyerforge.openrouterKey";

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";

function paraTexto(lista: string[]): string {
  return lista.join("\n");
}
function paraLista(texto: string): string[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function CampoLista({ label, valor, onChange, rows = 3 }: {
  label: string;
  valor: string[];
  onChange: (v: string[]) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[MUTED]">
        {label}
      </label>
      <textarea
        value={paraTexto(valor)}
        onChange={(e) => onChange(paraLista(e.target.value))}
        rows={rows}
        placeholder="Um item por linha"
        className="w-full rounded-xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-2.5 text-sm leading-relaxed text-[FG] outline-none transition-colors placeholder:text-[MUTED]/40 focus:border-[#B8860B]/50"
      />
    </div>
  );
}

function CampoTexto({ label, valor, onChange, placeholder }: {
  label: string;
  valor: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[MUTED]">
        {label}
      </label>
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-3 text-sm text-[FG] outline-none transition-colors placeholder:text-[MUTED]/60 focus:border-[#B8860B]/50"
      />
    </div>
  );
}

function SecaoTitulo({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="mb-6">
      <h3 className="font-display text-xl tracking-wide text-[FG]">
        {titulo}
      </h3>
      {descricao && <p className="mt-1 text-sm text-[MUTED]">{descricao}</p>}
    </div>
  );
}

interface MarcaClientProps {
  initialOrg: {
    id: string;
    name: string;
    slug: string;
  } | null;
  initialUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    emailAddresses: Array<{ emailAddress: string }>;
    imageUrl: string;
  } | null;
  initialBrandDna: BrandDna | null;
}

export default function MarcaClient({ initialOrg, initialUser, initialBrandDna }: MarcaClientProps) {
  const [carregando, setCarregando] = useState(true);
  const [brandDna, setBrandDna] = useState<BrandDna>(brandDnaVazio());
  const [existiaAntes, setExistiaAntes] = useState(false);

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
    if (initialBrandDna) {
      setBrandDna(initialBrandDna);
      setNomeIgreja(initialBrandDna.name);
      setExistiaAntes(true);
      setCarregando(false);
    } else {
      getBrandDna()
        .then((atual) => {
          if (atual) {
            setBrandDna(atual);
            setNomeIgreja(atual.name);
            setExistiaAntes(true);
          }
        })
        .finally(() => setCarregando(false));
    }
    setApiKey(window.localStorage.getItem(CHAVE_OPENROUTER_LOCAL) ?? "");
  }, [initialBrandDna]);

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
          apiKey: undefined,
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

  function atualizarPaleta(campo: keyof BrandDna["palette"], valor: string[]) {
    setBrandDna((atual) => ({ ...atual, palette: { ...atual.palette, [campo]: valor } }));
  }

  function atualizarTypography(campo: keyof BrandDna["typography"], valor: string | string[]) {
    setBrandDna((atual) => ({ ...atual, typography: { ...atual.typography, [campo]: valor } }));
  }

  function atualizarComposition(campo: keyof BrandDna["composition"], valor: string[]) {
    setBrandDna((atual) => ({ ...atual, composition: { ...atual.composition, [campo]: valor } }));
  }

  function atualizarImagery(campo: keyof BrandDna["imagery"], valor: string[]) {
    setBrandDna((atual) => ({ ...atual, imagery: { ...atual.imagery, [campo]: valor } }));
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-[MUTED]"
        >
          Carregando identidade da marca...
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[GOLD_DARK]">
          <Fingerprint size={13} /> Identidade da marca
        </p>
        <h1 className="mb-2 font-display text-4xl tracking-wide text-[FG]">
          Brand DNA da igreja
        </h1>
        <p className="mb-10 max-w-lg text-sm text-[MUTED]">
          Responda algumas perguntas curtas e, se quiser, anexe flyers já
          aprovados. A IA propõe um perfil visual estruturado — paleta,
          tipografia, composição e tom — que você revisa e aprova antes de ele
          passar a influenciar novas gerações.
        </p>

        {brandDna.approvedByHuman && (
          <div className="mb-8 flex items-center gap-2 rounded-xl border border-[#16A34A]/25 bg-[#16A34A]/5 px-4 py-3 text-sm text-[#4ADE80]">
            <ShieldCheck size={16} /> Este Brand DNA está aprovado e é aplicado às novas gerações (versão {brandDna.version}).
          </div>
        )}

        {/* Seção: gerar proposta */}
        <div className="mb-10 grid grid-cols-1 gap-5 rounded-2xl border-2 border-[BORDER] bg-[SURFACE]/40 p-6">
          <SecaoTitulo
            titulo="Gerar proposta com IA"
            descricao="Preencha o básico e a IA analisa referências (se houver) para sugerir paleta, tipografia, composição e tom."
          />

          <div className="grid grid-cols-1 gap-5">
            <CampoTexto
              label="Nome da igreja"
              valor={nomeIgreja}
              onChange={setNomeIgreja}
              placeholder="Ex: Igreja Batista Vida Nova"
            />

            <CampoTexto
              label="Tom de voz desejado"
              valor={tomDeVoz}
              onChange={setTomDeVoz}
              placeholder="Ex: acolhedor, contemporâneo, esperançoso"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CampoTexto
                label="Público-alvo (opcional)"
                valor={publicoAlvo}
                onChange={setPublicoAlvo}
                placeholder="Ex: famílias, jovens adultos"
              />
              <CampoTexto
                label="Paleta desejada (opcional)"
                valor={paletaDesejada}
                onChange={setPaletaDesejada}
                placeholder="Ex: dourado e azul-marinho"
              />
            </div>

            <CampoTexto
              label="Fontes desejadas (opcional)"
              valor={fontesDesejadas}
              onChange={setFontesDesejadas}
              placeholder="Ex: condensada e moderna no título, legível no corpo"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-[FG]">
                Flyers de referência já aprovados (opcional, até 2)
              </label>
              <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
                <UploadDropzone label="Referência 1" aspect="portrait" value={referencia1} onChange={setReferencia1} />
                <UploadDropzone label="Referência 2" aspect="portrait" value={referencia2} onChange={setReferencia2} />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[MUTED]">
                Sua chave de API da OpenRouter (opcional)
              </label>
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full rounded-xl border-2 border-[BORDER] bg-[SURFACE]/70 px-3 py-2.5 text-sm text-[FG] outline-none transition-colors placeholder:text-[MUTED]/40 focus:border-[#B8860B]/50"
              />
              <p className="mt-1.5 text-xs text-[MUTED]">
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
              className="inline-flex w-fit items-center gap-2 rounded-xl border-2 border-[BORDER] bg-[GOLD]/10 px-5 py-3 text-sm font-medium text-[GOLD_DARK] transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:border-[#B8860B]/50"
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
                  className="flex items-start gap-2 rounded-xl border border-[#B8860B]/20 bg-[#B8860B]/5 p-3 text-xs text-[#DCC177]"
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{erro}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Seção: proposta de marca */}
        <SecaoTitulo
          titulo="Proposta (revise e corrija antes de aprovar)"
          descricao="Cada campo de lista aceita um item por linha. Campos vazios são ignorados na geração. Use os seletores visuais para cores e fontes."
        />

        <div className="space-y-8">
          <CampoTexto
            label="Nome / marca"
            valor={brandDna.name}
            onChange={(v) => atualizarCampo("name", v)}
          />

          <CampoLista
            label="Tom de voz (voice)"
            valor={brandDna.voice}
            onChange={(v) => atualizarCampo("voice", v)}
          />

          {/* Paleta */}
          <div className="grid grid-cols-1 gap-5">
            <SecaoTitulo titulo="Paleta" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ColorPicker
                label="Cor primária principal"
                value={brandDna.palette.primary[0] || "#BB9E49"}
                onChange={(c) => atualizarPaleta("primary", [c, ...brandDna.palette.primary.slice(1)])}
              />
              <ColorPicker
                label="Cor secundária principal"
                value={brandDna.palette.secondary[0] || "#C9A227"}
                onChange={(c) => atualizarPaleta("secondary", [c, ...brandDna.palette.secondary.slice(1)])}
              />
            </div>
            <CampoLista
              label="Paleta primária (outros tons)"
              valor={brandDna.palette.primary.slice(1)}
              onChange={(v) => atualizarPaleta("primary", [brandDna.palette.primary[0], ...v])}
            />
            <CampoLista
              label="Paleta secundária (outros tons)"
              valor={brandDna.palette.secondary.slice(1)}
              onChange={(v) => atualizarPaleta("secondary", [brandDna.palette.secondary[0], ...v])}
            />
            <CampoLista
              label="Neutros (fundo/texto)"
              valor={brandDna.palette.neutrals}
              onChange={(v) => atualizarPaleta("neutrals", v)}
            />
            <CampoLista
              label="Cores a evitar"
              valor={brandDna.palette.avoid}
              onChange={(v) => atualizarPaleta("avoid", v)}
            />
          </div>

          {/* Tipografia */}
          <div className="grid grid-cols-1 gap-5">
            <SecaoTitulo titulo="Tipografia" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FontPicker
                label="Fonte de destaque (títulos)"
                value={brandDna.typography.headline || ""}
                onChange={(v) => atualizarTypography("headline", v)}
                placeholder="Buscar fonte..."
              />
              <FontPicker
                label="Fonte de corpo (textos)"
                value={brandDna.typography.body || ""}
                onChange={(v) => atualizarTypography("body", v)}
                placeholder="Buscar fonte..."
              />
            </div>
            <CampoLista
              label="Regras de tipografia"
              valor={brandDna.typography.rules}
              onChange={(v) => atualizarTypography("rules", v)}
            />
          </div>

          {/* Composição */}
          <div className="grid grid-cols-1 gap-5">
            <SecaoTitulo titulo="Composição" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <CampoLista
                label="Composição preferida"
                valor={brandDna.composition.preferred}
                onChange={(v) => atualizarComposition("preferred", v)}
              />
              <CampoLista
                label="Composição a evitar"
                valor={brandDna.composition.avoid}
                onChange={(v) => atualizarComposition("avoid", v)}
              />
              <CampoLista
                label="Áreas seguras p/ texto"
                valor={brandDna.composition.textSafeAreas}
                onChange={(v) => atualizarComposition("textSafeAreas", v)}
              />
            </div>
          </div>

          {/* Imagens */}
          <div className="grid grid-cols-1 gap-5">
            <SecaoTitulo titulo="Imagens / Atmosfera" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <CampoLista
                label="Assuntos de imagem preferidos"
                valor={brandDna.imagery.subjects}
                onChange={(v) => atualizarImagery("subjects", v)}
              />
              <CampoLista
                label="Atmosfera / mood"
                valor={brandDna.imagery.mood}
                onChange={(v) => atualizarImagery("mood", v)}
              />
              <CampoLista
                label="Tratamentos visuais"
                valor={brandDna.imagery.treatments}
                onChange={(v) => atualizarImagery("treatments", v)}
              />
              <CampoLista
                label="Evitar em imagens"
                valor={brandDna.imagery.avoid}
                onChange={(v) => atualizarImagery("avoid", v)}
              />
            </div>
          </div>

          <CampoLista
            label="Motivos gráficos recorrentes"
            valor={brandDna.motifs}
            onChange={(v) => atualizarCampo("motifs", v)}
          />
          <CampoLista
            label="Regras do logotipo"
            valor={brandDna.logoRules}
            onChange={(v) => atualizarCampo("logoRules", v)}
          />
          <CampoLista
            label="Regras de tom para textos/CTAs"
            valor={brandDna.copyRules}
            onChange={(v) => atualizarCampo("copyRules", v)}
          />
          <CampoLista
            label="Restrições (nunca gerar)"
            valor={brandDna.negativeRules}
            onChange={(v) => atualizarCampo("negativeRules", v)}
          />
        </div>
      </div>

      {/* Overrides */}
      <div>
        <EventOverrides brandDna={brandDna} onChange={setBrandDna} />
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <motion.button
          type="button"
          disabled={!brandDna.name.trim() || status === "salvando"}
          onClick={() => salvar(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-full bg-[GOLD] px-6 py-3 text-sm font-bold text-[INK] shadow-[0_0_20px_rgba(184,134,11,0.2)] disabled:cursor-not-allowed disabled:opacity-30 hover:bg-[#DCC177] transition-all"
        >
          <ShieldCheck size={16} /> Aprovar e salvar
        </motion.button>
        <motion.button
          type="button"
          disabled={!brandDna.name.trim() || status === "salvando"}
          onClick={() => salvar(false)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-full border-2 border-[BORDER] px-6 py-3 text-sm font-medium text-[FG] disabled:cursor-not-allowed disabled:opacity-30 hover:border-[#B8860B] hover:text-[GOLD_DARK] transition-all"
        >
          <Save size={16} /> Salvar como rascunho
        </motion.button>
        {salvo && <span className="text-xs text-[MUTED]">Salvo.</span>}
      </div>

      <p className="mt-4 text-[11px] text-[MUTED]">
        Sem banco conectado, isso fica salvo só neste navegador — ver Vercel →
        Storage → Postgres para manter entre sessões e dispositivos.
      </p>
    </>
  );
}
