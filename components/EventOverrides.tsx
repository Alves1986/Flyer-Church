"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Copy, Check, AlertCircle, Zap } from "lucide-react";
import ColorPicker from "@/components/ColorPicker";
import FontPicker from "@/components/FontPicker";
import { BrandDna, CategoriaEvento } from "@/lib/types";
import {
  CATEGORIAS_EVENTO,
  labelCategoriaEvento,
  mergeBrandDnaOverride,
  aplicarEventOverride,
} from "@/lib/brandDna";

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";
const GREEN = "#16A34A";
const GREEN_SOFT = "rgba(22,163,74,0.1)";
const ORANGE = "#EA580C";
const ORANGE_SOFT = "rgba(234,88,12,0.1)";

function CampoLista({ label, valor, onChange, rows = 2, placeholder = "Um item por linha" }: {
  label: string;
  valor: string[];
  onChange: (v: string[]) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[MUTED]">
        {label}
      </label>
      <textarea
        value={valor.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))}
        rows={rows}
        placeholder={placeholder}
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

function OverrideSection({
  label,
  baseValue,
  overrideValue,
  onChangeOverride,
  onClearOverride,
  hasOverride,
  children,
}: {
  label: string;
  baseValue: string | string[] | undefined;
  overrideValue: string | string[] | undefined;
  onChangeOverride: (value: string | string[]) => void;
  onClearOverride: () => void;
  hasOverride: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  const displayBase = Array.isArray(baseValue) ? baseValue.join(", ") : baseValue || "—";
  const displayOverride = Array.isArray(overrideValue) ? overrideValue.join(", ") : overrideValue || "";

  return (
    <div className="rounded-xl border-2 border-[BORDER]/10 bg-[SURFACE]/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[GOLD]/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-medium text-[FG]">{label}</span>
          {hasOverride && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[GREEN_SOFT] px-2 py-0.5 text-[10px] font-medium text-[GREEN] border-2 border-[GREEN]/20">
              <Zap className="h-2.5 w-2.5" /> Override ativo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[MUTED] flex-shrink-0">
            Base: {displayBase || "—"}
          </span>
          {hasOverride && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClearOverride(); }}
              className="p-1.5 rounded-lg text-[MUTED] hover:text-[#DC2626] hover:bg-[#DC2626]/10 transition-colors"
              title="Remover override (usar valor global)"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[MUTED]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[MUTED]" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t-2 border-[BORDER]/10 p-4 space-y-4"
          >
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-1 rounded bg-[SURFACE]/70 border-2 border-[BORDER]/10 text-[MUTED] font-mono text-[11px]">
                Global
              </span>
              <span className="text-[MUTED]">
                {displayBase || "não definido"}
              </span>
              {hasOverride && (
                <>
                  <span className="text-[GOLD]">→</span>
                  <span className="px-2 py-1 rounded bg-[GREEN_SOFT] border-2 border-[GREEN]/20 text-[GREEN] font-mono text-[11px]">
                    Override
                  </span>
                  <span className="text-[FG]">{displayOverride}</span>
                </>
              )}
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EventOverrides({ brandDna, onChange, readOnly }: {
  brandDna: BrandDna;
  onChange: (brandDna: BrandDna) => void;
  readOnly?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState<CategoriaEvento | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string, Partial<BrandDna> | undefined>>({});

  useEffect(() => {
    setLocalOverrides(brandDna.eventOverrides || {});
  }, [brandDna.eventOverrides]);

  const hasOverride = (categoria: CategoriaEvento) => {
    const override = localOverrides[categoria];
    return override && Object.keys(override).length > 0;
  };

  const getOverride = (categoria: CategoriaEvento, path: string): any => {
    const override = localOverrides[categoria];
    if (!override) return undefined;
    return path.split(".").reduce((obj: any, key) => obj?.[key], override);
  };

  const setOverride = (categoria: CategoriaEvento, path: string, value: any) => {
    setLocalOverrides((prev: Record<string, Partial<BrandDna> | undefined>) => {
      const current = prev[categoria] || {};
      const newOverride = { ...current };
      const keys = path.split(".");
      let target: any = newOverride;
      for (let i = 0; i < keys.length - 1; i++) {
        target[keys[i]] = { ...target[keys[i]] };
        target = target[keys[i]];
      }
      target[keys[keys.length - 1]] = value;
      return { ...prev, [categoria]: newOverride };
    });
  };

  const clearOverride = (categoria: CategoriaEvento, path?: string) => {
    setLocalOverrides((prev: Record<string, Partial<BrandDna> | undefined>) => {
      if (!path) {
        const { [categoria]: removed, ...rest } = prev;
        return rest;
      }
      const current = prev[categoria];
      if (!current) return prev;
      const keys = path.split(".");
      const newOverride = { ...current };
      let target: any = newOverride;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) return prev;
        target[keys[i]] = { ...target[keys[i]] };
        target = target[keys[i]];
      }
      delete target[keys[keys.length - 1]];
      const hasKeys = Object.keys(newOverride).length > 0;
      return { ...prev, [categoria]: hasKeys ? newOverride : undefined };
    });
  };

  const handleSave = () => {
    onChange({ ...brandDna, eventOverrides: localOverrides as Record<string, Partial<BrandDna>> });
  };

  const getEffectiveValue = (categoria: CategoriaEvento, path: string) => {
    const effective = aplicarEventOverride(brandDna, categoria);
    return path.split(".").reduce((obj: any, key) => obj?.[key], effective);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-xl tracking-wide text-[FG]">
            Overrides por categoria de evento
          </h3>
          <p className="mt-1 text-sm text-[MUTED]">
            Defina variações da identidade global para cada tipo de evento.
            Campos vazios herdam do global. Override parcial faz merge profundo.
          </p>
        </div>
        <motion.button
          disabled={readOnly}
          onClick={handleSave}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-full bg-[GOLD] px-5 py-2.5 text-sm font-bold text-[INK] shadow-[0_0_20px_rgba(184,134,11,0.2)] disabled:cursor-not-allowed disabled:opacity-30 hover:bg-[#DCC177] transition-all"
        >
          <Check className="h-4 w-4" /> Salvar overrides
        </motion.button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORIAS_EVENTO.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * CATEGORIAS_EVENTO.indexOf(cat) }}
            className={`relative rounded-2xl border-2 transition-all ${
              activeCategory === cat.id
                ? "border-[GOLD_DARK]/50 bg-[GOLD]/5 ring-2 ring-[GOLD]/20"
                : "border-[BORDER]/10 bg-[SURFACE]/40 hover:border-[GOLD]/30"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className="w-full p-4 text-left"
              disabled={readOnly}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-[FG]">{cat.label}</p>
                  <p className="text-xs text-[MUTED] mt-0.5">{cat.descricao}</p>
                </div>
                <div className="flex items-center gap-2">
                  {hasOverride(cat.id) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[GREEN_SOFT] px-2 py-0.5 text-[10px] font-medium text-[GREEN] border-2 border-[GREEN]/20">
                      <Zap className="h-2.5 w-2.5" /> Ativo
                    </span>
                  )}
                  {activeCategory === cat.id ? (
                    <ChevronUp className="h-5 w-5 text-[GOLD]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-[MUTED]" />
                  )}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {activeCategory === cat.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t-2 border-[BORDER]/10 p-4 space-y-4 max-h-[500px] overflow-y-auto"
                >
                  <OverrideSection
                    label="Paleta primária"
                    baseValue={brandDna.palette.primary}
                    overrideValue={getOverride(cat.id, "palette.primary")}
                    onChangeOverride={(v) => setOverride(cat.id, "palette.primary", v)}
                    onClearOverride={() => clearOverride(cat.id, "palette.primary")}
                    hasOverride={!!getOverride(cat.id, "palette.primary")}
                  >
                    <ColorPicker
                      label="Cor principal"
                      value={getOverride(cat.id, "palette.primary")?.[0] || brandDna.palette.primary[0] || "#BB9E49"}
                      onChange={(c) => {
                        const arr = getOverride(cat.id, "palette.primary") || [...brandDna.palette.primary];
                        setOverride(cat.id, "palette.primary", [c, ...arr.slice(1)]);
                      }}
                    />
                    <CampoLista
                      label="Outros tons primários"
                      valor={getOverride(cat.id, "palette.primary")?.slice(1) || brandDna.palette.primary.slice(1)}
                      onChange={(v) => {
                        const main = getOverride(cat.id, "palette.primary")?.[0] || brandDna.palette.primary[0];
                        setOverride(cat.id, "palette.primary", [main, ...v]);
                      }}
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Paleta secundária"
                    baseValue={brandDna.palette.secondary}
                    overrideValue={getOverride(cat.id, "palette.secondary")}
                    onChangeOverride={(v) => setOverride(cat.id, "palette.secondary", v)}
                    onClearOverride={() => clearOverride(cat.id, "palette.secondary")}
                    hasOverride={!!getOverride(cat.id, "palette.secondary")}
                  >
                    <ColorPicker
                      label="Cor principal"
                      value={getOverride(cat.id, "palette.secondary")?.[0] || brandDna.palette.secondary[0] || "#C9A227"}
                      onChange={(c) => {
                        const arr = getOverride(cat.id, "palette.secondary") || [...brandDna.palette.secondary];
                        setOverride(cat.id, "palette.secondary", [c, ...arr.slice(1)]);
                      }}
                    />
                    <CampoLista
                      label="Outros tons secundários"
                      valor={getOverride(cat.id, "palette.secondary")?.slice(1) || brandDna.palette.secondary.slice(1)}
                      onChange={(v) => {
                        const main = getOverride(cat.id, "palette.secondary")?.[0] || brandDna.palette.secondary[0];
                        setOverride(cat.id, "palette.secondary", [main, ...v]);
                      }}
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Fonte de destaque"
                    baseValue={brandDna.typography.headline}
                    overrideValue={getOverride(cat.id, "typography.headline")}
                    onChangeOverride={(v) => setOverride(cat.id, "typography.headline", v)}
                    onClearOverride={() => clearOverride(cat.id, "typography.headline")}
                    hasOverride={!!getOverride(cat.id, "typography.headline")}
                  >
                    <FontPicker
                      value={getOverride(cat.id, "typography.headline") || brandDna.typography.headline || ""}
                      onChange={(v) => setOverride(cat.id, "typography.headline", v)}
                      placeholder="Buscar fonte..."
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Fonte de corpo"
                    baseValue={brandDna.typography.body}
                    overrideValue={getOverride(cat.id, "typography.body")}
                    onChangeOverride={(v) => setOverride(cat.id, "typography.body", v)}
                    onClearOverride={() => clearOverride(cat.id, "typography.body")}
                    hasOverride={!!getOverride(cat.id, "typography.body")}
                  >
                    <FontPicker
                      value={getOverride(cat.id, "typography.body") || brandDna.typography.body || ""}
                      onChange={(v) => setOverride(cat.id, "typography.body", v)}
                      placeholder="Buscar fonte..."
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Regras de tipografia"
                    baseValue={brandDna.typography.rules}
                    overrideValue={getOverride(cat.id, "typography.rules")}
                    onChangeOverride={(v) => setOverride(cat.id, "typography.rules", v)}
                    onClearOverride={() => clearOverride(cat.id, "typography.rules")}
                    hasOverride={!!getOverride(cat.id, "typography.rules")?.length}
                  >
                    <CampoLista
                      label="Regras (uma por linha)"
                      valor={getOverride(cat.id, "typography.rules") || brandDna.typography.rules}
                      onChange={(v) => setOverride(cat.id, "typography.rules", v)}
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Atmosfera / mood"
                    baseValue={brandDna.imagery.mood}
                    overrideValue={getOverride(cat.id, "imagery.mood")}
                    onChangeOverride={(v) => setOverride(cat.id, "imagery.mood", v)}
                    onClearOverride={() => clearOverride(cat.id, "imagery.mood")}
                    hasOverride={!!getOverride(cat.id, "imagery.mood")?.length}
                  >
                    <CampoLista
                      label="Adjetivos de atmosfera"
                      valor={getOverride(cat.id, "imagery.mood") || brandDna.imagery.mood}
                      onChange={(v) => setOverride(cat.id, "imagery.mood", v)}
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Tratamentos visuais"
                    baseValue={brandDna.imagery.treatments}
                    overrideValue={getOverride(cat.id, "imagery.treatments")}
                    onChangeOverride={(v) => setOverride(cat.id, "imagery.treatments", v)}
                    onClearOverride={() => clearOverride(cat.id, "imagery.treatments")}
                    hasOverride={!!getOverride(cat.id, "imagery.treatments")?.length}
                  >
                    <CampoLista
                      label="Tratamentos (ex: granulado, alto contraste)"
                      valor={getOverride(cat.id, "imagery.treatments") || brandDna.imagery.treatments}
                      onChange={(v) => setOverride(cat.id, "imagery.treatments", v)}
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Motivos gráficos"
                    baseValue={brandDna.motifs}
                    overrideValue={getOverride(cat.id, "motifs")}
                    onChangeOverride={(v) => setOverride(cat.id, "motifs", v)}
                    onClearOverride={() => clearOverride(cat.id, "motifs")}
                    hasOverride={!!getOverride(cat.id, "motifs")?.length}
                  >
                    <CampoLista
                      label="Motivos recorrentes"
                      valor={getOverride(cat.id, "motifs") || brandDna.motifs}
                      onChange={(v) => setOverride(cat.id, "motifs", v)}
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Regras de logotipo"
                    baseValue={brandDna.logoRules}
                    overrideValue={getOverride(cat.id, "logoRules")}
                    onChangeOverride={(v) => setOverride(cat.id, "logoRules", v)}
                    onClearOverride={() => clearOverride(cat.id, "logoRules")}
                    hasOverride={!!getOverride(cat.id, "logoRules")?.length}
                  >
                    <CampoLista
                      label="Regras de uso do logo"
                      valor={getOverride(cat.id, "logoRules") || brandDna.logoRules}
                      onChange={(v) => setOverride(cat.id, "logoRules", v)}
                    />
                  </OverrideSection>

                  <OverrideSection
                    label="Restrições (nunca gerar)"
                    baseValue={brandDna.negativeRules}
                    overrideValue={getOverride(cat.id, "negativeRules")}
                    onChangeOverride={(v) => setOverride(cat.id, "negativeRules", v)}
                    onClearOverride={() => clearOverride(cat.id, "negativeRules")}
                    hasOverride={!!getOverride(cat.id, "negativeRules")?.length}
                  >
                    <CampoLista
                      label="Restrições"
                      valor={getOverride(cat.id, "negativeRules") || brandDna.negativeRules}
                      onChange={(v) => setOverride(cat.id, "negativeRules", v)}
                    />
                  </OverrideSection>

                  {!hasOverride(cat.id) && (
                    <div className="text-center py-4 text-sm text-[MUTED]">
                      <p>
                        Nenhum override configurado para{" "}
                        <strong className="text-[FG]">{cat.label}</strong>.
                      </p>
                      <p className="mt-1">
                        Preencha qualquer campo acima para criar o override.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {activeCategory && (
        <div className="rounded-2xl border-2 border-[GOLD]/20 bg-[GOLD]/5 p-4">
          <h4 className="font-medium text-[FG] mb-3">
            Preview comparativo: {labelCategoriaEvento(activeCategory)}
          </h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border-2 border-[GOLD]/10 bg-[SURFACE]/60 p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-[GOLD_DARK]/80 mb-2">
                Global (base)
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-[MUTED]">Primária:</span>{" "}
                  <span className="text-[FG]">{brandDna.palette.primary[0] || "não definida"}</span>
                </p>
                <p>
                  <span className="font-medium text-[MUTED]">Secundária:</span>{" "}
                  <span className="text-[FG]">{brandDna.palette.secondary[0] || "não definida"}</span>
                </p>
                <p>
                  <span className="font-medium text-[MUTED]">Fonte título:</span>{" "}
                  <span className="text-[FG]">{brandDna.typography.headline || "não definida"}</span>
                </p>
                <p>
                  <span className="font-medium text-[MUTED]">Fonte corpo:</span>{" "}
                  <span className="text-[FG]">{brandDna.typography.body || "não definida"}</span>
                </p>
                <p>
                  <span className="font-medium text-[MUTED]">Mood:</span>{" "}
                  <span className="text-[FG]">{brandDna.imagery.mood.join(", ") || "não definido"}</span>
                </p>
              </div>
            </div>
            <div className="rounded-xl border-2 border-[GREEN]/20 bg-[GREEN_SOFT] p-4">
              <p className="text-xs uppercase tracking-[0.1em] text-[GREEN]/80 mb-2">
                Com override aplicado
              </p>
              <div className="space-y-2 text-sm">
                {(() => {
                  const effective = aplicarEventOverride(brandDna, activeCategory);
                  return (
                    <>
                      <p>
                        <span className="font-medium text-[MUTED]">Primária:</span>{" "}
                        <span className="text-[FG]">{effective.palette.primary[0] || "não definida"}</span>
                      </p>
                      <p>
                        <span className="font-medium text-[MUTED]">Secundária:</span>{" "}
                        <span className="text-[FG]">{effective.palette.secondary[0] || "não definida"}</span>
                      </p>
                      <p>
                        <span className="font-medium text-[MUTED]">Fonte título:</span>{" "}
                        <span className="text-[FG]">{effective.typography.headline || "não definida"}</span>
                      </p>
                      <p>
                        <span className="font-medium text-[MUTED]">Fonte corpo:</span>{" "}
                        <span className="text-[FG]">{effective.typography.body || "não definida"}</span>
                      </p>
                      <p>
                        <span className="font-medium text-[MUTED]">Mood:</span>{" "}
                        <span className="text-[FG]">{effective.imagery.mood.join(", ") || "não definido"}</span>
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
