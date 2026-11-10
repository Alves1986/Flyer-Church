"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Copy, Check } from "lucide-react";

const INK = "#0A0A0A";
const SURFACE = "#F8F9FA";
const FG = "#0A0A0A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";

const COMMON_COLORS = [
  "#BB9E49", "#C9A227", "#DCC177", "#EAD9A0",
  "#0A0A0A", "#12100C", "#1A160F", "#241E14",
  "#F5F0E4", "#DCD3BF", "#A69C87",
  "#DC2626", "#EF4444", "#F87171",
  "#16A34A", "#22C55E", "#4ADE80",
  "#0891B2", "#06B6D4", "#22D3EE",
  "#7C3AED", "#A855F7", "#D8B4FE",
  "#EA580C", "#F97316", "#FB923C",
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return INK;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? INK : "#FFFFFF";
}

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showEyedropper?: boolean;
}

export default function ColorPicker({ value, onChange, label, showEyedropper = true }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const contrastColor = getContrastColor(value);

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-brand-stone overflow-hidden transition-all hover:border-brand-gold-500"
          style={{ backgroundColor: value }}
          aria-label={`Cor atual: ${value}`}
        >
          <span
            className="text-[10px] font-mono font-bold"
            style={{ color: contrastColor }}
          >
            {value.slice(1, 4)}
          </span>
        </button>

        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 rounded-xl border-2 border-brand-stone bg-white cursor-pointer"
          aria-label="Seletor de cor nativo"
        />

        <button
          type="button"
          onClick={handleCopy}
          className="h-10 w-10 rounded-xl border-2 border-brand-stone bg-white flex items-center justify-center text-slate-500 hover:text-brand-gold-600 hover:border-brand-gold-500 transition-colors"
          aria-label={copied ? "Copiado!" : "Copiar hex"}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>

        {showEyedropper && (
          <button
            type="button"
            onClick={async () => {
              try {
                const eyeDropper = new (window as any).EyeDropper();
                const result = await eyeDropper.open();
                onChange(result.sRGBHex);
              } catch {
                // Not supported
              }
            }}
            className="h-10 w-10 rounded-xl border-2 border-brand-stone bg-white flex items-center justify-center text-slate-500 hover:text-brand-gold-600 hover:border-brand-gold-500 transition-colors"
            aria-label="Conta-gotas"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}

        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
          }}
          className="flex-1 min-w-0 rounded-xl border-2 border-brand-stone bg-white px-3 py-2.5 text-sm font-mono text-brand-ink outline-none transition-all focus:border-brand-gold-500 focus:ring-4 focus:ring-brand-gold-100 placeholder:text-slate-300"
          placeholder="#BB9E49"
          maxLength={7}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            className="absolute z-20 mt-2 w-72 rounded-2xl border-2 border-brand-stone bg-white p-3 shadow-premium"
            style={{ top: "100%", left: 0 }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500">Cores rápidas</p>
              <p className="text-xs text-slate-400">Clique para aplicar</p>
            </div>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {COMMON_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelect(color)}
                  className="h-8 w-8 rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: color === value ? GOLD : "transparent",
                  }}
                  aria-label={color}
                  aria-pressed={color === value}
                >
                  {color === value && (
                    <Check
                      className="h-4 w-4 mx-auto my-1"
                      style={{ color: getContrastColor(color) }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t-2 border-brand-stone pt-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Ou digite o hex:
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
                  if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
                }}
                className="w-full rounded-xl border-2 border-brand-stone bg-slate-50 px-3 py-2 text-sm font-mono text-brand-ink outline-none transition-all focus:border-brand-gold-500"
                placeholder="#BB9E49"
                maxLength={7}
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
