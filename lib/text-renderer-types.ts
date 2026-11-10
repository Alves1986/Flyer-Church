export interface TextLayer {
  variable: string;
  x: number;
  y: number;
  maxWidth: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
}

export interface TextRenderResult {
  base64: string;
  mimeType: "image/png" | "image/webp" | "image/jpeg" | "application/pdf";
  width: number;
  height: number;
}

export type ExportFormat = "png" | "webp" | "jpeg";

export interface ExportOptions {
  format?: ExportFormat;
  quality?: number;
  jpegQuality?: number;
}

export interface ColorValidationResult {
  passed: boolean;
  deltaE: number;
  threshold: number;
  dominantColors: string[];
}

export type FormatoPresetId = "feed" | "quadrado" | "story" | "whatsapp";