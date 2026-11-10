export type ImageVarKey = "FOTO_PRELETOR_ANEXADA" | "LOGO_IGREJA_ANEXADO";

/**
 * Brand DNA — representação estruturada da identidade visual de uma igreja
 * (ver docs/brand-dna.md). Ainda não é gerado nem consumido por nenhuma
 * rota; é só o tipo de domínio para a próxima fase (perfil visual por
 * template/igreja, variações por categoria de evento, etc). O prompt em
 * `FlyerTemplate.promptExtraido` continua sendo a única fonte de geração
 * até que essa fase seja implementada de fato — este tipo não deve virar
 * obrigatório em nenhum fluxo existente sem decisão explícita.
 */
export interface BrandDna {
  version: number;
  organizationId?: string;
  name: string;
  voice: string[];
  palette: {
    primary: string[];
    secondary: string[];
    neutrals: string[];
    avoid: string[];
  };
  typography: {
    headline?: string;
    body?: string;
    rules: string[];
  };
  composition: {
    preferred: string[];
    avoid: string[];
    textSafeAreas: string[];
  };
  imagery: {
    subjects: string[];
    mood: string[];
    treatments: string[];
    avoid: string[];
  };
  motifs: string[];
  logoRules: string[];
  copyRules: string[];
  negativeRules: string[];
  approvedAssetIds: string[];
  eventOverrides: Record<string, Partial<BrandDna>>;
  confidence: number;
  approvedByHuman: boolean;
}

/** Categorias de evento (Fase 1 do roadmap — docs/product-roadmap.md). */
export type CategoriaEvento =
  | "culto"
  | "jovens"
  | "ceia"
  | "conferencia"
  | "vigilia"
  | "aviso";

/** Presets de formato/proporção de saída (Fase 1 do roadmap). */
export type FormatoPresetId = "feed" | "quadrado" | "story" | "whatsapp";

export interface FormatoPreset {
  id: FormatoPresetId;
  nome: string;
  larguraPx: number;
  alturaPx: number;
  /** Orientação sobre áreas cobertas pela interface do app de destino, se houver. */
  notaSeguranca?: string;
}

/**
 * Ciclo de vida de um flyer gerado (Fase 1 do roadmap). "gerado" é o estado
 * inicial automático; os demais dependem de ação humana — a IA nunca marca
 * algo como aprovado ou publicado sozinha.
 */
export type StatusFlyer = "rascunho" | "gerado" | "aprovado" | "rejeitado" | "publicado";

export interface FlyerTemplate {
  id: string;
  nome: string;
  criadoEm: string;
  /** Prompt de criação já extraído, com variáveis entre colchetes. */
  promptExtraido: string;
  /** Miniatura (base64, já reduzida) da imagem de referência usada na extração. */
  thumbnailBase64?: string;
  /** Variáveis de texto detectadas no prompt, ex: DATA_EVENTO, NOME_PRELETOR. */
  variaveisTexto: string[];
  /** Quais placeholders de imagem o template espera. */
  variaveisImagem: ImageVarKey[];
  /** Categoria do evento, opcional — usada para organizar/filtrar templates. */
  categoria?: CategoriaEvento;
  /**
   * Perfil visual estruturado opcional (Brand DNA). Campo aditivo: templates
   * existentes continuam válidos sem ele. Ver docs/brand-dna.md para o
   * pipeline de preenchimento/aprovação previsto.
   */
  visualProfile?: BrandDna;
}

/** Tipos de item da biblioteca de mídia reutilizável (Fase 1 do roadmap). */
export type TipoAsset = "logo" | "foto" | "fundo";

/**
 * Item da biblioteca de logos, fotos e fundos (Fase 1 — docs/product-roadmap.md).
 * Fica disponível para reutilizar em vários templates/flyers, em vez de
 * enviar o mesmo arquivo de novo a cada geração.
 */
export interface AssetBiblioteca {
  id: string;
  nome: string;
  tipo: TipoAsset;
  criadoEm: string;
  mimeType: string;
  /** Imagem em base64 — usada no modo local (localStorage), sem banco/Blob. */
  base64?: string;
  /** URL no Vercel Blob, quando o upload é persistido (ver lib/blob.ts). */
  url?: string;
  /** Marca se este logo é o oficial da igreja (apenas para tipo "logo"). */
  oficial?: boolean;
}

export interface GeneratedFlyer {
  id: string;
  templateId: string;
  criadoEm: string;
  promptFinal: string;
  imagemBase64?: string;
  /** URL no Vercel Blob, se o upload estiver configurado (ver lib/blob.ts). */
  imagemUrl?: string;
  /** Valores de texto preenchidos pelo usuário nesta geração. */
  campos?: Record<string, string>;
  /** Preset de formato usado nesta geração, se algum. */
  formatoId?: FormatoPresetId;
  /** Estado de aprovação/publicação. Ausente = tratado como "gerado". */
  status?: StatusFlyer;
  /** Feedback "representa nossa igreja?", de 1 a 5. */
  avaliacao?: number;
  /** Motivo selecionado pelo usuário ao rejeitar (texto livre curto). */
  motivoRejeicao?: string;
}
