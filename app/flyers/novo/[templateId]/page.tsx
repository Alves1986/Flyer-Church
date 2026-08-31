"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, AlertTriangle, RefreshCcw, Star, Check, X as XIcon, Send } from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import { getAssets, getBrandDna, getTemplate, recordGeneratedFlyer, updateGeneratedFlyer, uploadImage } from "@/lib/store";
import { mergePrompt } from "@/lib/promptMerge";
import { ROTULOS_VARIAVEIS } from "@/lib/metaPrompt";
import { FORMATOS_PRESET, aplicarFormatoAoPrompt, getFormatoPreset } from "@/lib/formatos";
import { aplicarBrandDnaAoPrompt } from "@/lib/brandDna";
import { AssetBiblioteca, BrandDna, FlyerTemplate, FormatoPresetId, ImageVarKey, StatusFlyer, TipoAsset } from "@/lib/types";
import { STATUS_FLYER_CORES, STATUS_FLYER_ROTULOS } from "@/lib/statusFlyer";
import { assetSrc } from "@/lib/tiposAsset";

type ImgValue = { previewUrl: string; base64: string; mimeType: string } | null;

const ROTULOS_IMAGEM: Record<ImageVarKey, string> = {
  FOTO_PRELETOR_ANEXADA: "Foto do preletor",
  LOGO_IGREJA_ANEXADO: "Logo da igreja",
};

/** Tipo de item da biblioteca sugerido para cada variável de imagem (Fase 1). */
const TIPO_ASSET_SUGERIDO: Record<ImageVarKey, TipoAsset> = {
  FOTO_PRELETOR_ANEXADA: "foto",
  LOGO_IGREJA_ANEXADO: "logo",
};

/** Converte um item da biblioteca (URL do Blob ou base64 local) em ImgValue, pronto para a geração. */
async function assetParaImgValue(asset: AssetBiblioteca): Promise<ImgValue> {
  if (asset.base64) {
    return { previewUrl: assetSrc(asset), base64: asset.base64, mimeType: asset.mimeType };
  }
  // Item vindo do banco: só tem URL. Baixa e converte para base64, que é o
  // formato exigido por /api/generate.
  const res = await fetch(asset.url!);
  const blob = await res.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("Falha ao carregar imagem da biblioteca"));
    reader.readAsDataURL(blob);
  });
  return { previewUrl: asset.url!, base64, mimeType: asset.mimeType };
}

export default function NovoFlyerPage({
  params,
}: {
  params: { templateId: string };
}) {
  const [template, setTemplate] = useState<FlyerTemplate | null | undefined>(undefined);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [imagens, setImagens] = useState<Record<string, ImgValue>>({});
  const [biblioteca, setBiblioteca] = useState<AssetBiblioteca[]>([]);
  // Brand DNA aprovado (Fase 2 — docs/brand-dna.md). Ausente ou não aprovado
  // não muda nada no fluxo: o prompt do template continua sendo a única
  // fonte de geração, o Brand DNA só acrescenta instruções quando existe e
  // já foi revisado por um humano em /marca.
  const [brandDna, setBrandDna] = useState<BrandDna | null>(null);
  const [formatoId, setFormatoId] = useState<FormatoPresetId>("feed");
  const [status, setStatus] = useState<"idle" | "gerando" | "pronto" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ base64: string; mimeType: string } | null>(null);

  // Id + estado de aprovação do registro no histórico (Fase 1). `flyerId`
  // existe assim que a geração termina, mesmo sem banco — as chamadas de
  // atualização são best-effort (ver lib/store.ts).
  const [flyerId, setFlyerId] = useState<string | null>(null);
  const [statusFlyer, setStatusFlyer] = useState<StatusFlyer>("gerado");
  const [avaliacao, setAvaliacao] = useState<number | null>(null);
  const [mostrarMotivoRejeicao, setMostrarMotivoRejeicao] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");

  useEffect(() => {
    getTemplate(params.templateId).then((t) => setTemplate(t ?? null));
    getAssets().then(setBiblioteca);
    getBrandDna().then((b) => setBrandDna(b?.approvedByHuman ? b : null));
  }, [params.templateId]);

  async function escolherDaBiblioteca(varImagem: ImageVarKey, asset: AssetBiblioteca) {
    const valor = await assetParaImgValue(asset);
    setImagens((s) => ({ ...s, [varImagem]: valor }));
  }

  if (template === undefined) return null;

  if (template === null) {
    return (
      <div className="rounded-2xl border border-dashed border-gold-500/20 py-16 text-center text-parchment-400">
        Template não encontrado.
      </div>
    );
  }

  const formato = getFormatoPreset(formatoId);
  const promptFinal = mergePrompt(template.promptExtraido, valores);
  const promptComMarca = brandDna ? aplicarBrandDnaAoPrompt(promptFinal, brandDna) : promptFinal;
  const promptComFormato = aplicarFormatoAoPrompt(promptComMarca, formato);
  const podeGerar =
    template.variaveisTexto.every((v) => valores[v]?.trim()) &&
    template.variaveisImagem.every((v) => imagens[v]);

  async function gerar() {
    setStatus("gerando");
    setErro(null);
    setResultado(null);
    setFlyerId(null);
    setAvaliacao(null);
    setMostrarMotivoRejeicao(false);
    setMotivoRejeicao("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: promptComFormato,
          images: (template!.variaveisImagem as ImageVarKey[]).map((v) => ({
            base64: imagens[v]!.base64,
            mimeType: imagens[v]!.mimeType,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Falha ao gerar o flyer.");
        setStatus("erro");
        return;
      }
      setResultado({ base64: data.imageBase64, mimeType: data.mimeType });
      setStatus("pronto");
      setStatusFlyer("gerado");

      const novoFlyerId = crypto.randomUUID();
      setFlyerId(novoFlyerId);

      // Histórico best-effort: só persiste algo se houver banco/Blob
      // conectados na Vercel; caso contrário essas chamadas são no-ops.
      void (async () => {
        const imagemUrl = await uploadImage(
          `flyers/${template!.id}-${Date.now()}.png`,
          data.imageBase64,
          data.mimeType ?? "image/png"
        );
        await recordGeneratedFlyer({
          id: novoFlyerId,
          templateId: template!.id,
          promptFinal: promptComFormato,
          campos: valores,
          imagemUrl,
          formatoId: formato.id,
          status: "gerado",
        });
      })();
    } catch (e) {
      setErro((e as Error).message);
      setStatus("erro");
    }
  }

  async function avaliar(nota: number) {
    setAvaliacao(nota);
    if (flyerId) await updateGeneratedFlyer(flyerId, { avaliacao: nota });
  }

  async function marcarStatus(novoStatus: StatusFlyer, motivo?: string) {
    setStatusFlyer(novoStatus);
    if (flyerId) await updateGeneratedFlyer(flyerId, { status: novoStatus, motivoRejeicao: motivo });
  }

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold-500/80">
          {template.nome}
        </p>
        <h1 className="mb-8 font-display text-4xl tracking-wide text-parchment-100">
          Preencha o evento
        </h1>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-parchment-100">
            Formato de saída
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMATOS_PRESET.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormatoId(f.id)}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition-colors ${
                  formatoId === f.id
                    ? "border-gold-400/60 bg-gold-500/15 text-gold-200"
                    : "border-gold-500/15 bg-ink-900/60 text-parchment-400 hover:border-gold-500/30"
                }`}
              >
                {f.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {template.variaveisTexto.map((v) => (
            <div key={v} className={v === "FRASE_BIBLICA" || v === "NOME_EVENTO" ? "sm:col-span-2" : ""}>
              <label className="mb-2 block text-sm font-medium text-parchment-100">
                {ROTULOS_VARIAVEIS[v] ?? v}
              </label>
              <input
                value={valores[v] ?? ""}
                onChange={(e) => setValores((s) => ({ ...s, [v]: e.target.value }))}
                className="w-full rounded-xl border border-gold-500/15 bg-ink-900/70 px-4 py-3 text-sm text-parchment-100 outline-none transition-colors focus:border-gold-400/50"
              />
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-2 gap-5 sm:max-w-md">
          {(template.variaveisImagem as ImageVarKey[]).map((v) => {
            const tipoSugerido = TIPO_ASSET_SUGERIDO[v];
            const opcoes = biblioteca.filter((a) => a.tipo === tipoSugerido);
            return (
              <div key={v}>
                <UploadDropzone
                  label={ROTULOS_IMAGEM[v]}
                  aspect="square"
                  value={imagens[v] ?? null}
                  onChange={(val) => setImagens((s) => ({ ...s, [v]: val }))}
                />
                {opcoes.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1.5 text-[11px] text-parchment-500">Ou da biblioteca:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {opcoes.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          title={a.nome}
                          onClick={() => escolherDaBiblioteca(v, a)}
                          className="h-9 w-9 overflow-hidden rounded-lg border border-gold-500/20 transition-colors hover:border-gold-400/60"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={assetSrc(a)} alt={a.nome} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <motion.button
          type="button"
          disabled={!podeGerar || status === "gerando"}
          onClick={gerar}
          whileHover={{ scale: podeGerar ? 1.01 : 1 }}
          whileTap={{ scale: podeGerar ? 0.98 : 1 }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 px-6 py-3 text-sm font-semibold text-ink-950 shadow-glow disabled:cursor-not-allowed disabled:opacity-30"
        >
          {status === "gerando" ? (
            <>
              <Sparkles size={16} className="animate-pulse" /> Compondo o flyer…
            </>
          ) : (
            <>
              <Sparkles size={16} /> Gerar flyer
            </>
          )}
        </motion.button>

        {brandDna && (
          <p className="mt-3 text-xs text-parchment-500">
            Brand DNA de <span className="text-gold-300">{brandDna.name}</span> aplicado a esta geração.
          </p>
        )}

        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-300"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <details className="mt-8 text-xs text-parchment-500">
          <summary className="cursor-pointer text-parchment-400">
            Ver prompt final que será enviado
          </summary>
          <p className="mt-2 whitespace-pre-wrap rounded-xl border border-gold-500/10 bg-ink-900/50 p-4 leading-relaxed">
            {promptComFormato}
          </p>
        </details>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <div
          className="relative overflow-hidden rounded-2xl border border-gold-500/15 bg-ink-900/60"
          style={{ aspectRatio: `${formato.larguraPx} / ${formato.alturaPx}` }}
        >
          {status === "gerando" && (
            <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-gold-500/[0.06] to-transparent">
              <motion.div
                className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-gold-400/15 to-transparent"
                animate={{ y: ["-100%", "300%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          )}

          {resultado ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:${resultado.mimeType};base64,${resultado.base64}`}
              alt="Flyer gerado"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-parchment-500">
              <Sparkles size={20} className="text-gold-500/40" />
              <p className="text-xs">O preview do flyer aparece aqui</p>
            </div>
          )}
        </div>

        {resultado && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex gap-2">
              <a
                href={`data:${resultado.mimeType};base64,${resultado.base64}`}
                download="flyer.png"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold-500/25 bg-gold-500/10 px-4 py-2.5 text-sm font-medium text-gold-200"
              >
                <Download size={15} /> Baixar
              </a>
              <button
                onClick={gerar}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold-500/15 px-4 py-2.5 text-sm text-parchment-300"
              >
                <RefreshCcw size={15} /> Gerar de novo
              </button>
            </div>

            <div className="rounded-xl border border-gold-500/10 bg-ink-900/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-parchment-300">Representa nossa igreja?</p>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${STATUS_FLYER_CORES[statusFlyer]}`}
                >
                  {STATUS_FLYER_ROTULOS[statusFlyer]}
                </span>
              </div>

              <div className="mb-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => avaliar(n)}
                    aria-label={`Avaliar ${n} de 5`}
                    className="p-0.5"
                  >
                    <Star
                      size={20}
                      className={
                        avaliacao !== null && n <= avaliacao
                          ? "fill-gold-400 text-gold-400"
                          : "text-parchment-500/40"
                      }
                    />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => marcarStatus("aprovado")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300"
                >
                  <Check size={13} /> Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarMotivoRejeicao((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300"
                >
                  <XIcon size={13} /> Rejeitar
                </button>
                <button
                  type="button"
                  onClick={() => marcarStatus("publicado")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-300"
                >
                  <Send size={13} /> Publicado
                </button>
              </div>

              <AnimatePresence>
                {mostrarMotivoRejeicao && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex gap-2"
                  >
                    <input
                      value={motivoRejeicao}
                      onChange={(e) => setMotivoRejeicao(e.target.value)}
                      placeholder="Motivo (opcional): texto errado, cores, foto..."
                      className="flex-1 rounded-lg border border-gold-500/15 bg-ink-900/70 px-3 py-2 text-xs text-parchment-100 outline-none focus:border-gold-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        marcarStatus("rejeitado", motivoRejeicao.trim() || undefined);
                        setMostrarMotivoRejeicao(false);
                      }}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
                    >
                      Confirmar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mt-3 text-[11px] text-parchment-500">
                Sem banco conectado, isso fica salvo só nesta tela — ver
                Vercel → Storage → Postgres para manter histórico entre sessões.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
