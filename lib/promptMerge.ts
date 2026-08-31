import { ImageVarKey } from "./types";

const IMAGE_VARS: ImageVarKey[] = ["FOTO_PRELETOR_ANEXADA", "LOGO_IGREJA_ANEXADO"];

/** Encontra todos os tokens [ALGO_ASSIM] em um texto. */
function findBracketTokens(text: string): string[] {
  const matches = text.match(/\[([A-Z0-9_]+)\]/g) ?? [];
  const unique = Array.from(new Set(matches.map((m) => m.slice(1, -1))));
  return unique;
}

/** Separa as variáveis de um prompt extraído em texto vs. imagem. */
export function parseTemplateVariables(promptExtraido: string): {
  variaveisTexto: string[];
  variaveisImagem: ImageVarKey[];
} {
  const tokens = findBracketTokens(promptExtraido);
  const variaveisImagem = tokens.filter((t): t is ImageVarKey =>
    IMAGE_VARS.includes(t as ImageVarKey)
  );
  const variaveisTexto = tokens.filter((t) => !IMAGE_VARS.includes(t as ImageVarKey));
  return { variaveisTexto, variaveisImagem };
}

/**
 * Mescla os valores preenchidos pelo usuário no prompt.
 * Variáveis de texto viram o próprio valor; variáveis de imagem viram uma
 * frase descritiva limpa (a imagem em si vai anexada como parte multimodal
 * separada na chamada de geração).
 */
export function mergePrompt(
  promptExtraido: string,
  valoresTexto: Record<string, string>
): string {
  let resultado = promptExtraido;

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

  return resultado;
}
