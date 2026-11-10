import { ImageVarKey } from "./types";
import { TextLayer } from "./text-renderer-types";
import { parseTextPositions } from "./text-renderer";

const IMAGE_VARS: ImageVarKey[] = ["FOTO_PRELETOR_ANEXADA", "LOGO_IGREJA_ANEXADO"];

/** Encontra todos os tokens [ALGO_ASSIM] em um texto. */
export function findBracketTokens(text: string): string[] {
  const matches = text.match(/\[([A-Z0-9_]+)\]/g) ?? [];
  const unique = Array.from(new Set(matches.map((m) => m.slice(1, -1))));
  return unique;
}

/** Tenta fazer parse do novo formato JSON { prompt, textPositions }. Retorna null se não for JSON válido. */
export function tryParseExtractionJson(text: string): { prompt: string; textPositions: TextLayer[] } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const json = JSON.parse(trimmed);
    if (typeof json.prompt === "string" && Array.isArray(json.textPositions)) {
      return { prompt: json.prompt, textPositions: json.textPositions };
    }
  } catch {
    return null;
  }
  return null;
}

/** Separa as variáveis de um prompt extraído em texto vs. imagem. */
export function parseTemplateVariables(promptExtraido: string): {
  variaveisTexto: string[];
  variaveisImagem: ImageVarKey[];
  textLayers: TextLayer[];
} {
  const parsed = tryParseExtractionJson(promptExtraido);
  let promptParaTokens = promptExtraido;
  let textLayers: TextLayer[] = [];

  if (parsed) {
    promptParaTokens = parsed.prompt;
    textLayers = parsed.textPositions;
  }

  const tokens = findBracketTokens(promptParaTokens);
  const variaveisImagem = tokens.filter((t): t is ImageVarKey =>
    IMAGE_VARS.includes(t as ImageVarKey)
  );
  const variaveisTexto = tokens.filter((t) => !IMAGE_VARS.includes(t as ImageVarKey));
  return { variaveisTexto, variaveisImagem, textLayers };
}

/**
 * Mescla os valores preenchidos pelo usuário no prompt.
 * Variáveis de texto viram o próprio valor; variáveis de imagem viram uma
 * frase descritiva limpa (a imagem em si vai anexada como parte multimodal
 * separada na chamada de geração).
 * Retorna { promptFinal, textLayers } para uso no Text Layer Rendering.
 */
export function mergePrompt(
  promptExtraido: string,
  valoresTexto: Record<string, string>
): { promptFinal: string; textLayers: TextLayer[] } {
  const parsed = tryParseExtractionJson(promptExtraido);
  let resultado = promptExtraido;
  let textLayers: TextLayer[] = [];

  if (parsed) {
    resultado = parsed.prompt;
    textLayers = parsed.textPositions;
  }

  resultado = resultado.replaceAll(
    "[FOTO_PRELETOR_ANEXADA]",
    "the attached preacher reference photo"
  );
  resultado = resultado.replaceAll(
    "[LOGO_IGREJA_ANEXADO]",
    "the attached church logo image"
  );

  for (const [chave, valor] of Object.entries(valoresTexto)) {
    const token = `[${chave}]`;
    resultado = resultado.replaceAll(token, valor || token);
  }

  return { promptFinal: resultado, textLayers };
}
