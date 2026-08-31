import { FormatoPreset, FormatoPresetId } from "./types";

/**
 * Presets de formato/proporção (Fase 1 — docs/product-roadmap.md).
 * "Story" e "Status do WhatsApp" têm a mesma proporção (9:16) mas ficam
 * separados porque a interface de cada app cobre áreas diferentes — daí a
 * `notaSeguranca` própria de cada um.
 */
export const FORMATOS_PRESET: FormatoPreset[] = [
  {
    id: "feed",
    nome: "Feed (4:5)",
    larguraPx: 1080,
    alturaPx: 1350,
    notaSeguranca:
      "deixe uma margem confortável nas bordas — o Instagram corta levemente a imagem ao exibir em grade",
  },
  {
    id: "quadrado",
    nome: "Quadrado (1:1)",
    larguraPx: 1080,
    alturaPx: 1080,
  },
  {
    id: "story",
    nome: "Story (9:16)",
    larguraPx: 1080,
    alturaPx: 1920,
    notaSeguranca:
      "evite texto importante no terço superior e no terço inferior — ficam atrás da interface de Stories do Instagram",
  },
  {
    id: "whatsapp",
    nome: "Status do WhatsApp (9:16)",
    larguraPx: 1080,
    alturaPx: 1920,
    notaSeguranca:
      "evite texto importante no terço superior e no terço inferior — ficam atrás da interface de Status do WhatsApp",
  },
];

export function getFormatoPreset(id: FormatoPresetId): FormatoPreset {
  return FORMATOS_PRESET.find((f) => f.id === id) ?? FORMATOS_PRESET[0];
}

/**
 * Acrescenta ao prompt final a instrução de proporção/formato de saída.
 * Não altera o prompt salvo no template — a instrução é aplicada só na hora
 * de chamar a API de geração, então trocar de formato não exige reextrair
 * nada.
 */
export function aplicarFormatoAoPrompt(promptFinal: string, formato: FormatoPreset): string {
  const proporcao = `${formato.larguraPx}x${formato.alturaPx}px`;
  const instrucao = formato.notaSeguranca
    ? `Formato de saída: proporção ${proporcao} (${formato.nome}). Importante: ${formato.notaSeguranca}.`
    : `Formato de saída: proporção ${proporcao} (${formato.nome}).`;
  return `${promptFinal}\n\n${instrucao}`;
}
