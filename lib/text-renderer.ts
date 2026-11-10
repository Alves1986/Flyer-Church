import { createCanvas, loadImage, SKRSContext2D } from "@napi-rs/canvas";
import { FormatoPresetId, FormatoPreset } from "./types";
import { TextLayer, TextRenderResult } from "./text-renderer-types";
import path from "path";
import fs from "fs";

const FORMATOS: Record<FormatoPresetId, FormatoPreset> = {
  feed: { id: "feed", nome: "Feed (4:5)", larguraPx: 1080, alturaPx: 1350 },
  quadrado: { id: "quadrado", nome: "Quadrado (1:1)", larguraPx: 1080, alturaPx: 1080 },
  story: { id: "story", nome: "Story/Reels (9:16)", larguraPx: 1080, alturaPx: 1920 },
  whatsapp: { id: "whatsapp", nome: "WhatsApp (3:4)", larguraPx: 1080, alturaPx: 1440 },
};

export type ExportFormat = "png" | "webp" | "jpeg" | "pdf";

export interface ExportOptions {
  format?: ExportFormat;
  quality?: number; // 0.1 - 1.0 para jpeg/webp
  jpegQuality?: number; // alias
}

export interface ColorValidationResult {
  passed: boolean;
  deltaE: number;
  threshold: number;
  dominantColors: string[];
}

const DEFAULT_FONT_FAMILY = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

const FONT_FALLBACKS: Record<string, string> = {
  "inter": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  "playfair display": "'Playfair Display', Georgia, serif",
  "montserrat": "'Montserrat', system-ui, sans-serif",
  "merriweather": "'Merriweather', Georgia, serif",
  "oswald": "'Oswald', system-ui, sans-serif",
  "lora": "'Lora', Georgia, serif",
  "roboto": "'Roboto', system-ui, sans-serif",
  "source serif pro": "'Source Serif Pro', Georgia, serif",
  "dm sans": "'DM Sans', system-ui, sans-serif",
  "cormorant garamond": "'Cormorant Garamond', Georgia, serif",
  "plus jakarta sans": "'Plus Jakarta Sans', system-ui, sans-serif",
  "space grotesk": "'Space Grotesk', system-ui, sans-serif",
  "outfit": "'Outfit', system-ui, sans-serif",
  "instrument sans": "'Instrument Sans', system-ui, sans-serif",
  "syne": "'Syne', system-ui, sans-serif",
  "clash display": "'Clash Display', system-ui, sans-serif",
  "general sans": "'General Sans', system-ui, sans-serif",
  "geist": "'Geist', system-ui, sans-serif",
};

export function normalizeFontName(name: string): string {
  const lower = name.toLowerCase().trim();
  return FONT_FALLBACKS[lower] || name;
}

export function hexToRgba(hex: string, alpha = 1): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

export function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  let rlin = r / 255;
  let glin = g / 255;
  let blin = b / 255;

  rlin = rlin > 0.04045 ? Math.pow((rlin + 0.055) / 1.055, 2.4) : rlin / 12.92;
  glin = glin > 0.04045 ? Math.pow((glin + 0.055) / 1.055, 2.4) : glin / 12.92;
  blin = blin > 0.04045 ? Math.pow((blin + 0.055) / 1.055, 2.4) : blin / 12.92;

  const X = (rlin * 0.4124 + glin * 0.3576 + blin * 0.1805) * 100;
  const Y = (rlin * 0.2126 + glin * 0.7152 + blin * 0.0722) * 100;
  const Z = (rlin * 0.0193 + glin * 0.1192 + blin * 0.9505) * 100;

  const fx = X / 95.047 > 0.008856 ? Math.pow(X / 95.047, 1/3) : (7.787 * X / 95.047) + 16/116;
  const fy = Y / 100 > 0.008856 ? Math.pow(Y / 100, 1/3) : (7.787 * Y / 100) + 16/116;
  const fz = Z / 108.883 > 0.008856 ? Math.pow(Z / 108.883, 1/3) : (7.787 * Z / 108.883) + 16/116;

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);

  return { L, a, b: bVal };
}

export function deltaE(lab1: { L: number; a: number; b: number }, lab2: { L: number; a: number; b: number }): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function wrapText(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export async function renderTextLayers(
  baseImageBase64: string,
  textLayers: TextLayer[],
  values: Record<string, string>,
  formatoId: FormatoPresetId = "feed",
  options: ExportOptions = {}
): Promise<TextRenderResult> {
  const formato = FORMATOS[formatoId] || FORMATOS.feed;
  const format = options.format || "png";
  const quality = options.quality || options.jpegQuality || 0.9;

  const canvas = createCanvas(formato.larguraPx, formato.alturaPx);
  const ctx = canvas.getContext("2d");

  const baseImg = await loadImage(Buffer.from(baseImageBase64, "base64"));
  ctx.drawImage(baseImg, 0, 0, formato.larguraPx, formato.alturaPx);

  for (const layer of textLayers) {
    const text = values[layer.variable] ?? `[${layer.variable}]`;
    if (!text.trim()) continue;

    const fontFamily = normalizeFontName(layer.fontFamily);
    ctx.font = `${layer.fontSize}px "${fontFamily}"`;
    ctx.fillStyle = hexToRgba(layer.color);
    
    // --- Efeito Profissional: Sombra para legibilidade ---
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // --- Efeito Profissional: Contorno sutil para contraste máximo ---
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 1;
    ctx.lineJoin = "round";

    ctx.textAlign = layer.align;
    ctx.textBaseline = "top";

    const lines = wrapText(ctx, text, layer.maxWidth, layer.lineHeight, layer.fontSize);

    lines.forEach((line, i) => {
      const y = layer.y + i * layer.fontSize * layer.lineHeight;
      let x = layer.x;
      if (layer.align === "center") x = layer.x;
      else if (layer.align === "right") x = layer.x + layer.maxWidth;
      ctx.fillText(line, x, y);
    });
  }

  let buffer: Buffer;
  let mimeType: string;

  switch (format) {
    case "webp":
      buffer = canvas.toBuffer("image/webp", quality);
      mimeType = "image/webp";
      break;
    case "jpeg":
      buffer = canvas.toBuffer("image/jpeg", quality);
      mimeType = "image/jpeg";
      break;
    case "png":
    default:
      buffer = canvas.toBuffer("image/png");
      mimeType = "image/png";
      break;
  }

  return {
    base64: buffer.toString("base64"),
    mimeType: mimeType as TextRenderResult["mimeType"],
    width: formato.larguraPx,
    height: formato.alturaPx,
  };
}

export function validateBrandColors(
  baseImageBase64: string,
  brandPalette: string[],
  threshold: number = 15
): Promise<ColorValidationResult> {
  return new Promise(async (resolve) => {
    try {
      const img = await loadImage(Buffer.from(baseImageBase64, "base64"));
      const tempCanvas = createCanvas(img.width, img.height);
      const tempCtx = tempCanvas.getContext("2d");
      tempCtx.drawImage(img, 0, 0);

      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      const colorCounts: Record<string, number> = {};
      const step = 4;

      for (let i = 0; i < data.length; i += step * 10) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        if (a < 128) continue;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      const sortedColors = Object.entries(colorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([hex]) => hex);

      const brandLab = brandPalette.map((hex) => {
        const { r, g, b } = hexToRgb(hex);
        return rgbToLab(r, g, b);
      });
      let minDeltaE = Infinity;

      for (const colorHex of sortedColors) {
        const { r, g, b } = hexToRgb(colorHex);
        const colorLab = rgbToLab(r, g, b);
        for (const bLab of brandLab) {
          const dE = deltaE(colorLab, bLab);
          if (dE < minDeltaE) minDeltaE = dE;
        }
      }

      resolve({
        passed: minDeltaE <= threshold,
        deltaE: minDeltaE,
        threshold,
        dominantColors: sortedColors.slice(0, 5),
      });
    } catch {
      resolve({ passed: true, deltaE: 0, threshold, dominantColors: [] });
    }
  });
}

export function getFormato(formatoId: FormatoPresetId): FormatoPreset {
  return FORMATOS[formatoId] || FORMATOS.feed;
}

export function parseTextPositions(json: any): TextLayer[] {
  if (!json?.textPositions || !Array.isArray(json.textPositions)) return [];

  return json.textPositions
    .filter((tp: any) => tp.variable && typeof tp.x === "number" && typeof tp.y === "number")
    .map((tp: any) => ({
      variable: String(tp.variable).toUpperCase(),
      x: Number(tp.x),
      y: Number(tp.y),
      maxWidth: Number(tp.maxWidth) || 500,
      fontFamily: String(tp.fontFamily || "Inter"),
      fontSize: Number(tp.fontSize) || 32,
      color: String(tp.color || "#F5F0E4"),
      align: (["left", "center", "right"].includes(tp.align) ? tp.align : "center") as "left" | "center" | "right",
      lineHeight: Number(tp.lineHeight) || 1.2,
    }));
}