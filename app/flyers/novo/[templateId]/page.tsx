"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Download, AlertTriangle, RefreshCcw, Star,
  Check, X as XIcon, Send, CircleCheck, AlertCircle
} from "lucide-react";
import UploadDropzone from "@/components/UploadDropzone";
import SmartSuggest from "@/components/SmartSuggest";
import {
  getAssets,
  getBrandDna,
  getTemplate,
  recordGeneratedFlyer,
  updateGeneratedFlyer,
  uploadImage,
} from "@/lib/store";
import { mergePrompt } from "@/lib/promptMerge";
import { TextLayer, ExportFormat } from "@/lib/text-renderer-types";
import { ROTULOS_VARIAVEIS } from "@/lib/metaPrompt";
import {
  FORMATOS_PRESET,
  aplicarFormatoAoPrompt,
  getFormatoPreset,
} from "@/lib/formatos";
import { aplicarBrandDnaAoPrompt } from "@/lib/brandDna";
import { gerarSugestoesAssets, AssetSuggestion } from "@/lib/tiposAsset";
import {
  AssetBiblioteca,
  BrandDna,
  FlyerTemplate,
  FormatoPresetId,
  ImageVarKey,
  StatusFlyer,
  TipoAsset,
} from "@/lib/types";
import { STATUS_FLYER_CORES, STATUS_FLYER_ROTULOS } from "@/lib/statusFlyer";
import { assetSrc } from "@/lib/tiposAsset";

type ImgValue = { previewUrl: string; base64: string; mimeType: string } | null;

const ROTULOS_IMAGEM: Record<ImageVarKey, string> = {
  FOTO_PRELETOR_ANEXADA: "Foto do preletor",
  LOGO_IGREJA_ANEXADO: "Logo da igreja",
};

const TIPO_ASSET_SUGERIDO: Record<ImageVarKey, TipoAsset> = {
  FOTO_PRELETOR_ANEXADA: "foto",
  LOGO_IGREJA_ANEXADO: "logo",
};

async function assetParaImgValue(asset: AssetBiblioteca): Promise<ImgValue> {
  if (asset.base64) {
    return { previewUrl: assetSrc(asset), base64: asset.base64, mimeType: asset.mimeType };
  }
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

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";
const GREEN = "#16A34A";
const ORANGE = "#EA580C";
const BLUE = "#0891B2";

export default function NovoFlyerPage({ params }: { params: { templateId: string } }) {
  const [template, setTemplate] = useState<FlyerTemplate | null | undefined>(undefined);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [imagens, setImagens] = useState<Record<string, ImgValue>>({});
  const [biblioteca, setBiblioteca] = useState<AssetBiblioteca[]>([]);
  const [brandDna, setBrandDna] = useState<BrandDna | null>(null);
  const [formatoId, setFormatoId] = useState<FormatoPresetId>("feed");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [status, setStatus] = useState<"idle" | "gerando" | "pronto" | "erro">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ base64: string; mimeType: string } | null>(null);
  const [flyerId, setFlyerId] = useState<string | null>(null);
  const [statusFlyer, setStatusFlyer] = useState<StatusFlyer>("gerado");
  const [avaliacao, setAvaliacao] = useState<number | null>(null);
  const [mostrarMotivoRejeicao, setMostrarMotivoRejeicao] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [colorValidation, setColorValidation] = useState<{ passed: boolean; deltaE: number } | null>(null);
  const [sugestoesAssets, setSugestoesAssets] = useState<Record<ImageVarKey, AssetSuggestion[]>>({
    FOTO_PRELETOR_ANEXADA: [],
    LOGO_IGREJA_ANEXADO: [],
  });

  useEffect(() => {
    getTemplate(params.templateId).then((t) => setTemplate(t ?? null));
    getAssets().then(setBiblioteca);
    getBrandDna().then((b) => setBrandDna(b?.approvedByHuman ? b : null));
  }, [params.templateId]);

  useEffect(() => {
    if (!template) return;
    const novasSugestoes: Record<ImageVarKey, AssetSuggestion[]> = {
      FOTO_PRELETOR_ANEXADA: [],
      LOGO_IGREJA_ANEXADO: [],
    };
    for (const v of template.variaveisImagem as ImageVarKey[]) {
      const tipo = TIPO_ASSET_SUGERIDO[v];
      if (tipo) {
        novasSugestoes[v] = gerarSugestoesAssets(template.id, tipo, biblioteca, []);
      }
    }
    setSugestoesAssets(novasSugestoes);
  }, [biblioteca, template]);

  async function escolherDaBiblioteca(varImagem: ImageVarKey, asset: AssetBiblioteca) {
    const valor = await assetParaImgValue(asset);
    setImagens((s) => ({ ...s, [varImagem]: valor }));
  }

  if (template === undefined) return null;

  if (template === null) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[BORDER] py-16 text-center text-[MUTED]">
        Template não encontrado.
      </div>
    );
  }

  const formato = getFormatoPreset(formatoId);
  const { promptFinal, textLayers } = mergePrompt(template.promptExtraido, valores);
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
    setColorValidation(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: promptComFormato,
          textLayers: textLayers as TextLayer[],
          textValues: valores,
          formatoId: formato.id,
          exportOptions: { format: exportFormat },
          brandPalette: brandDna ? [...brandDna.palette.primary, ...brandDna.palette.secondary] : undefined,
          validateColors: !!brandDna,
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
      if (data.colorValidation) setColorValidation(data.colorValidation);
      setStatus("pronto");
      setStatusFlyer("gerado");

      const novoFlyerId = crypto.randomUUID();
      setFlyerId(novoFlyerId);

      void (async () => {
        const imagemUrl = await uploadImage(
          `flyers/${template!.id}-${Date.now()}.png`,
          data.imageBase64,
          data.mimeType ?? "image/png",
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
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[GOLD_DARK]">
          {template.nome}
        </p>
        <h1 className="mb-8 font-display text-4xl tracking-wide text-[FG]">
          Preencha o evento
        </h1>

        {/* Formatos de saída */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-[FG]">
            Formato de saída
          </label>
          <div className="flex flex-wrap gap-2">
            {FORMATOS_PRESET.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormatoId(f.id)}
                className={`rounded-full border-2 px-4 py-2 text-xs font-medium transition-colors ${
                  formatoId === f.id
                    ? "border-[GOLD_DARK]/60 bg-[GOLD]/15 text-[GOLD_DARK]"
                    : "border-[BORDER] bg-[SURFACE]/60 text-[MUTED] hover:border-[GOLD]/30"
                }`}
              >
                {f.nome}
              </button>
            ))}
          </div>
        </div>

        {/* Formato de exportação */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-[FG]">
            Formato de exportação
          </label>
          <div className="flex flex-wrap gap-2">
            {(["png", "webp", "jpeg"] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={`rounded-full border-2 px-4 py-2 text-xs font-medium transition-colors ${
                  exportFormat === fmt
                    ? "border-[GOLD_DARK]/60 bg-[GOLD]/15 text-[GOLD_DARK]"
                    : "border-[BORDER] bg-[SURFACE]/60 text-[MUTED] hover:border-[GOLD]/30"
                }`}
              >
                {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Campos de texto */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {template.variaveisTexto.map((v) => (
            <div
              key={v}
              className={v === "FRASE_BIBLICA" || v === "NOME_EVENTO" ? "sm:col-span-2" : ""}
            >
              <label className="mb-2 block text-sm font-medium text-[FG]">
                {ROTULOS_VARIAVEIS[v] ?? v}
              </label>
              <input
                value={valores[v] ?? ""}
                onChange={(e) => setValores((s) => ({ ...s, [v]: e.target.value }))}
                className="w-full rounded-xl border-2 border-[BORDER] bg-[SURFACE]/70 px-4 py-3 text-sm text-[FG] outline-none transition-colors focus:border-[#B8860B]/50 placeholder:text-[MUTED]/40"
              />
            </div>
          ))}
        </div>

        {/* Uploads de imagem */}
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
                {sugestoesAssets[v]?.length > 0 && (
                  <div className="mt-2">
                    <SmartSuggest
                      suggestions={sugestoesAssets[v]}
                      assets={biblioteca}
                      onSelect={escolherDaBiblioteca.bind(null, v)}
                      label="Sugeridos para você"
                      emptyMessage="Nenhuma sugestão baseada em aprovações anteriores."
                    />
                  </div>
                )}
                {opcoes.length > 0 && (
                  <div className="mt-2">
                    <p className="mb-1.5 text-[11px] text-[MUTED]">
                      Ou da biblioteca:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {opcoes.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          title={a.nome}
                          onClick={() => escolherDaBiblioteca(v, a)}
                          className="h-9 w-9 overflow-hidden rounded-lg border-2 border-[BORDER]/20 transition-colors hover:border-[GOLD]/60"
                        >
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

        {/* Gerar botão */}
        <motion.button
          type="button"
          disabled={!podeGerar || status === "gerando"}
          onClick={gerar}
          whileHover={{ scale: podeGerar ? 1.01 : 1 }}
          whileTap={{ scale: podeGerar ? 0.98 : 1 }}
          className="inline-flex items-center gap-2 rounded-full bg-[GOLD] px-6 py-3 text-sm font-bold text-[INK] shadow-[0_0_20px_rgba(184,134,11,0.2)] disabled:cursor-not-allowed disabled:opacity-30 hover:bg-[#DCC177] transition-all"
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
          <p className="mt-3 text-xs text-[MUTED]">
            Brand DNA de{" "}
            <span className="text-[GOLD_DARK]">{brandDna.name}</span>{" "}
            aplicado a esta geração.
          </p>
        )}

        {textLayers && textLayers.length > 0 && (
          <p className="mt-2 text-xs text-[GREEN]/80 flex items-center gap-1">
            <span className="rounded bg-[GREEN]/20 px-1.5 py-0.5 text-[10px]">
              Text Layer
            </span>
            {textLayers.length} camada{textLayers.length > 1 ? "s" : ""} de texto{" "}
            será{textLayers.length > 1 ? "ão" : "á"}{" "}
            renderizada{textLayers.length > 1 ? "s" : ""}{" "}
            sobre a imagem.
          </p>
        )}

        <AnimatePresence>
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-start gap-2 rounded-xl border-2 border-[BORDER]/20 bg-[GOLD]/5 p-3 text-xs text-[#DCC177]"
            >
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{erro}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <details className="mt-8 text-xs text-[MUTED]">
          <summary className="cursor-pointer text-[MUTED]">
            Ver prompt final que será enviado
          </summary>
          <p className="mt-2 whitespace-pre-wrap rounded-xl border-2 border-[BORDER]/10 bg-[SURFACE]/50 p-4 leading-relaxed">
            {promptComFormato}
          </p>
        </details>
      </div>

      {/* Preview sidebar */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div
          className="relative overflow-hidden rounded-2xl border-2 border-[GOLD]/12 bg-[SURFACE]/60"
          style={{ aspectRatio: `${formato.larguraPx} / ${formato.alturaPx}` }}
        >
          {status === "gerando" && (
            <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[GOLD]/6 to-transparent">
              <motion.div
                className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-[GOLD]/15 to-transparent"
                animate={{ y: ["-100%", "300%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          )}

          {resultado ? (
            <img
              src={`data:${resultado.mimeType};base64,${resultado.base64}`}
              alt="Flyer gerado"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-[MUTED]">
              <Sparkles size={20} className="text-[GOLD]/40" />
              <p className="text-xs">O preview do flyer aparece aqui</p>
            </div>
          )}
        </div>

        {resultado && (
          <div className="mt-4 flex flex-col gap-4">
            {/* Botões de ação */}
            <div className="flex gap-2">
              <a
                href={`data:${resultado.mimeType};base64,${resultado.base64}`}
                download={`flyer.${exportFormat}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[GOLD]/25 bg-[GOLD]/10 px-4 py-2.5 text-sm font-medium text-[GOLD_DARK]"
              >
                <Download size={15} /> Baixar
              </a>
              <button
                onClick={gerar}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[BORDER] px-4 py-2.5 text-sm text-[FG]"
              >
                <RefreshCcw size={15} /> Gerar de novo
              </button>
            </div>

            {/* Color validation */}
            {colorValidation && (
              <div
                className={`rounded-xl border-2 p-4 flex items-center gap-3 ${
                  colorValidation.passed
                    ? "border-[GREEN]/30 bg-[GREEN]/5"
                    : "border-[ORANGE]/30 bg-[ORANGE]/5"
                }`}
              >
                {colorValidation.passed ? (
                  <CircleCheck className="text-[GREEN]" size={20} />
                ) : (
                  <AlertCircle className="text-[ORANGE]" size={20} />
                )}
                <div>
                  <p className="text-xs font-medium text-[FG]">
                    {colorValidation.passed
                      ? "Cores alinhadas à marca"
                      : "Atenção: cores fora da paleta"}
                  </p>
                  <p className="text-[11px] text-[MUTED]">
                    Delta E: {colorValidation.deltaE.toFixed(1)} (limiar: 15)
                  </p>
                </div>
              </div>
            )}

            {/* Avaliação */}
            <div className="rounded-xl border-2 border-[BORDER]/10 bg-[SURFACE]/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-[MUTED]">
                  Representa nossa igreja?
                </p>
                <span
                  className={`rounded-full border-2 px-2.5 py-0.5 text-[11px] font-medium ${STATUS_FLYER_CORES[statusFlyer]}`}
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
                          ? "fill-[GOLD] text-[GOLD]"
                          : "text-[MUTED]/40"
                      }
                    />
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => marcarStatus("aprovado")}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[GREEN]/30 bg-[GREEN]/10 px-3 py-1.5 text-xs font-medium text-[GREEN]"
                >
                  <Check size={13} /> Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarMotivoRejeicao((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#DC2626]/30 bg-[#DC2626]/10 px-3 py-1.5 text-xs font-medium text-[#DC2626]"
                >
                  <XIcon size={13} /> Rejeitar
                </button>
                <button
                  type="button"
                  onClick={() => marcarStatus("publicado")}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[BLUE]/30 bg-[BLUE]/10 px-3 py-1.5 text-xs font-medium text-[BLUE]"
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
                      className="flex-1 rounded-lg border-2 border-[BORDER]/15 bg-[SURFACE]/70 px-3 py-2 text-xs text-[FG] outline-none focus:border-[#B8860B]/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        marcarStatus("rejeitado", motivoRejeicao.trim() || undefined);
                        setMostrarMotivoRejeicao(false);
                      }}
                      className="rounded-lg border-2 border-[#DC2626]/30 bg-[#DC2626]/10 px-3 py-2 text-xs text-[#DC2626]"
                    >
                      Confirmar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mt-3 text-[11px] text-[MUTED]">
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
