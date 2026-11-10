"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, ChevronDown, Check, Loader2 } from "lucide-react";

const INK = "#0B0A08";
const SURFACE = "#12100C";
const FG = "#F5F0E4";
const MUTED = "#A69C87";
const BORDER = "#2A2418";
const GOLD = "#B8860B";
const GOLD_DARK = "#9A6B08";

const GOOGLE_FONTS_API = "https://www.googleapis.com/webfonts/v1/webfonts";
const GOOGLE_FONTS_KEY = process.env.NEXT_PUBLIC_GOOGLE_FONTS_KEY;

const FALLBACK_FONTS: GoogleFont[] = [
  { family: "Inter", category: "sans-serif", variants: ["regular", "500", "600", "700"], files: {} },
  { family: "Playfair Display", category: "serif", variants: ["regular", "500", "600", "700", "800", "900"], files: {} },
  { family: "Montserrat", category: "sans-serif", variants: ["regular", "500", "600", "700", "800", "900"], files: {} },
  { family: "Merriweather", category: "serif", variants: ["regular", "700", "900"], files: {} },
  { family: "Oswald", category: "sans-serif", variants: ["regular", "500", "600", "700"], files: {} },
  { family: "Lora", category: "serif", variants: ["regular", "500", "600", "700"], files: {} },
  { family: "DM Sans", category: "sans-serif", variants: ["regular", "500", "700"], files: {} },
  { family: "Cormorant Garamond", category: "serif", variants: ["regular", "600", "700"], files: {} },
  { family: "Plus Jakarta Sans", category: "sans-serif", variants: ["regular", "500", "600", "700", "800"], files: {} },
  { family: "Space Grotesk", category: "sans-serif", variants: ["regular", "500", "600", "700"], files: {} },
  { family: "Outfit", category: "sans-serif", variants: ["regular", "500", "600", "700", "800", "900"], files: {} },
  { family: "Instrument Sans", category: "sans-serif", variants: ["regular", "500", "600", "700"], files: {} },
  { family: "Syne", category: "sans-serif", variants: ["regular", "500", "600", "700", "800"], files: {} },
  { family: "Clash Display", category: "sans-serif", variants: ["regular", "500", "600", "700"], files: {} },
  { family: "General Sans", category: "sans-serif", variants: ["regular", "500", "600", "700"], files: {} },
  { family: "Geist", category: "sans-serif", variants: ["regular", "500", "600", "700"], files: {} },
];

interface GoogleFont {
  family: string;
  category: string;
  variants: string[];
  files: Record<string, string>;
}

interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
  label?: string;
  placeholder?: string;
  allowCustom?: boolean;
}

function getFontDisplayName(font: GoogleFont): string {
  return font.family;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    "sans-serif": "Sem serifa",
    "serif": "Com serifa",
    "display": "Display",
    "handwriting": "Manuscrita",
    "monospace": "Monoespaçada",
  };
  return labels[category] || category;
}

export default function FontPicker({ value, onChange, label, placeholder = "Buscar fonte...", allowCustom = true }: FontPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<GoogleFont | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedOnce = useRef(false);

  const loadFonts = useCallback(async () => {
    if (loadedOnce.current) return;
    setLoading(true);
    setError(null);
    try {
      const url = GOOGLE_FONTS_KEY
        ? `${GOOGLE_FONTS_API}?key=${GOOGLE_FONTS_KEY}&sort=popularity`
        : GOOGLE_FONTS_API;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const googleFonts: GoogleFont[] = (data.items || []).map((item: any) => ({
        family: item.family,
        category: item.category,
        variants: item.variants,
        files: item.files,
      }));
      setFonts([...FALLBACK_FONTS, ...googleFonts]);
      loadedOnce.current = true;
    } catch (err) {
      setError("Falha ao carregar Google Fonts. Usando fontes locais.");
      setFonts(FALLBACK_FONTS as GoogleFont[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFonts();
  }, [loadFonts]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filteredFonts = fonts.filter((font) =>
    font.family.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (font: GoogleFont) => {
    setSelectedFont(font);
    onChange(font.family);
    setOpen(false);
    setQuery("");
  };

  const displayValue = selectedFont?.family || value || "";

  const isGold = [
    "Bebas Neue", "Oswald", "Montserrat", "Playfair Display",
    "Cormorant Garamond", "Space Grotesk", "Syne",
  ].includes(displayValue);

  return (
    <div className="relative" ref={pickerRef}>
      {label && (
        <label className="mb-1.5 block text-xs font-medium text-[MUTED]">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (!open) setQuery("");
          }}
          className="w-full h-10 rounded-xl border-2 border-[BORDER]/15 bg-[SURFACE]/70 px-4 py-2.5 text-sm text-[FG] text-left outline-none transition-colors hover:border-[GOLD]/30 focus:border-[#B8860B]/50 flex items-center justify-between"
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <span
            style={{
              fontFamily: displayValue
                ? `'${displayValue}', system-ui`
                : "inherit",
            }}
          >
            {displayValue || placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[MUTED] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              className="absolute z-20 mt-1.5 w-full max-h-96 rounded-2xl border-2 border-[BORDER]/15 bg-[SURFACE]/95 shadow-[0_20px_50px_-12px_#B8860B/10] backdrop-blur-sm overflow-hidden"
              style={{ top: "100%", left: 0 }}
            >
              <div className="p-3 border-b-2 border-[BORDER]/10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[MUTED]" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border-2 border-[BORDER]/15 bg-[SURFACE]/70 pl-10 pr-4 py-2 text-sm text-[FG] outline-none focus:border-[#B8860B]/50"
                  />
                </div>
              </div>

              {loading && (
                <div className="p-4 flex items-center justify-center gap-2 text-[MUTED]">
                  <Loader2 className="h-5 w-5 animate-spin text-[GOLD]" />
                  Carregando fontes...
                </div>
              )}

              {error && !loading && (
                <div className="p-4 text-center text-xs text-[#EA580C]">
                  {error}
                </div>
              )}

              <div className="max-h-[400px] overflow-y-auto p-2">
                {filteredFonts.length === 0 && !loading && (
                  <div className="p-4 text-center text-xs text-[MUTED]">
                    Nenhuma fonte encontrada
                  </div>
                )}
                <div className="space-y-1">
                  {filteredFonts.map((font) => (
                    <button
                      key={font.family}
                      type="button"
                      onClick={() => handleSelect(font)}
                      className={`w-full px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                        font.family === displayValue
                          ? "bg-[GOLD]/10 text-[GOLD_DARK]"
                          : "text-[FG] hover:bg-[GOLD]/5"
                      }`}
                      style={{ fontFamily: `'${font.family}', system-ui` }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{font.family}</span>
                        {font.family === displayValue && (
                          <Check className="h-4 w-4 text-[GOLD] flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[MUTED]">
                        <span className="px-1.5 py-0.5 rounded bg-[GOLD]/10">
                          {getCategoryLabel(font.category)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[GOLD]/10">
                          {font.variants.slice(0, 3).join(", ")}
                          {font.variants.length > 3 ? "…" : ""}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {allowCustom && (
                <div className="border-t-2 border-[BORDER]/10 p-3">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(value);
                      setSelectedFont(null);
                      setOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-[MUTED] hover:text-[GOLD_DARK] hover:bg-[GOLD]/5 transition-colors"
                  >
                    Usar valor personalizado: {value || "nenhum"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AnimatePresence({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
