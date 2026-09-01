import { AssetBiblioteca, BrandDna, FlyerTemplate, GeneratedFlyer } from "./types";

const TEMPLATES_KEY = "flyerforge.templates.v1";
const ASSETS_KEY = "flyerforge.assets.v1";
const BRAND_DNA_KEY = "flyerforge.brandDna.v1";

// --- Camada local (localStorage) — modo zero-config, sem necessidade de banco. ---

function getTemplatesLocal(): FlyerTemplate[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(TEMPLATES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FlyerTemplate[];
  } catch {
    return [];
  }
}

function saveTemplateLocal(template: FlyerTemplate) {
  if (typeof window === "undefined") return;
  const templates = getTemplatesLocal().filter((t) => t.id !== template.id);
  window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify([template, ...templates]));
}

function deleteTemplateLocal(id: string) {
  if (typeof window === "undefined") return;
  const templates = getTemplatesLocal().filter((t) => t.id !== id);
  window.localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

function getAssetsLocal(): AssetBiblioteca[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ASSETS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AssetBiblioteca[];
  } catch {
    return [];
  }
}

function saveAssetLocal(asset: AssetBiblioteca) {
  if (typeof window === "undefined") return;
  const assets = getAssetsLocal().filter((a) => a.id !== asset.id);
  window.localStorage.setItem(ASSETS_KEY, JSON.stringify([asset, ...assets]));
}

function deleteAssetLocal(id: string) {
  if (typeof window === "undefined") return;
  const assets = getAssetsLocal().filter((a) => a.id !== id);
  window.localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
}

// --- Camada remota (Vercel Postgres via /api/templates) — usada quando o
// projeto tem um banco conectado na Vercel. Se a rota responder 501 (banco
// não configurado) ou a rede falhar, cai de volta para o localStorage
// automaticamente, sem quebrar a experiência. ---

export async function getTemplates(): Promise<FlyerTemplate[]> {
  try {
    const res = await fetch("/api/templates", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.templates as FlyerTemplate[];
    }
  } catch {
    // sem rede / erro inesperado — cai para o localStorage abaixo
  }
  return getTemplatesLocal();
}

export async function getTemplate(id: string): Promise<FlyerTemplate | undefined> {
  try {
    const res = await fetch(`/api/templates/${id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.template as FlyerTemplate;
    }
    if (res.status !== 501) {
      // 404 do banco: não existe mesmo lá, mas pode existir no localStorage
      // (ex: templates de exemplo/seed). Cai para a busca local também.
    }
  } catch {
    // sem rede — cai para o localStorage abaixo
  }
  return getTemplatesLocal().find((t) => t.id === id);
}

export async function saveTemplate(template: FlyerTemplate): Promise<void> {
  try {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(template),
    });
    if (res.ok) return;
  } catch {
    // sem rede — cai para o localStorage abaixo
  }
  saveTemplateLocal(template);
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      deleteTemplateLocal(id);
      return;
    }
  } catch {
    // sem rede — cai para o localStorage abaixo
  }
  deleteTemplateLocal(id);
}

/**
 * Duplica um template existente (Fase 1 — docs/product-roadmap.md): gera um
 * novo id e data de criação, mantém prompt/variáveis/categoria, e salva pelo
 * mesmo caminho híbrido de `saveTemplate` (banco com fallback local).
 */
export async function duplicateTemplate(template: FlyerTemplate): Promise<FlyerTemplate> {
  const copia: FlyerTemplate = {
    ...template,
    id: crypto.randomUUID(),
    nome: `${template.nome} (cópia)`,
    criadoEm: new Date().toISOString(),
  };
  await saveTemplate(copia);
  return copia;
}

/** Registra no histórico (tabela flyers_gerados) se houver banco conectado; no-op caso contrário. */
export async function recordGeneratedFlyer(input: {
  id: string;
  templateId: string;
  promptFinal: string;
  campos?: Record<string, string>;
  imagemUrl?: string;
  formatoId?: GeneratedFlyer["formatoId"];
  status?: GeneratedFlyer["status"];
}): Promise<void> {
  try {
    await fetch("/api/flyers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // histórico é best-effort — nunca deve quebrar a geração do flyer
  }
}

/**
 * Atualiza status/avaliação/motivo de rejeição de um flyer já registrado no
 * histórico (Fase 1). Best-effort e silencioso: sem banco conectado (ou sem
 * rede), a rota responde 501/erro e esta função simplesmente não persiste
 * nada — quem chamou já deve ter atualizado o estado local da tela.
 */
export async function updateGeneratedFlyer(
  id: string,
  patch: Pick<Partial<GeneratedFlyer>, "status" | "avaliacao" | "motivoRejeicao">
): Promise<boolean> {
  try {
    const res = await fetch(`/api/flyers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Lista o histórico de flyers gerados (requer banco conectado). */
export async function getGeneratedFlyers(templateId?: string): Promise<GeneratedFlyer[]> {
  const qs = templateId ? `?templateId=${encodeURIComponent(templateId)}` : "";
  const res = await fetch(`/api/flyers${qs}`, { cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Histórico indisponível.");
  }
  const data = await res.json();
  return data.flyers as GeneratedFlyer[];
}

/** Envia uma imagem para o Vercel Blob se estiver configurado; retorna undefined caso contrário. */
export async function uploadImage(
  filename: string,
  base64: string,
  mimeType: string
): Promise<string | undefined> {
  try {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename, base64, mimeType }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.url as string;
    }
  } catch {
    // Blob não configurado ou sem rede — segue sem persistir a imagem
  }
  return undefined;
}

// --- Biblioteca de logos, fotos e fundos (Fase 1 — docs/product-roadmap.md).
// Mesmo padrão híbrido dos templates: tenta o banco (via /api/assets, que só
// aceita itens já com `url` no Vercel Blob) e cai para o localStorage (que
// guarda a imagem em base64) sem banco/Blob configurados ou sem rede. ---

/** Lista a biblioteca. Usa o banco se disponível; senão, o localStorage deste navegador. */
export async function getAssets(): Promise<AssetBiblioteca[]> {
  try {
    const res = await fetch("/api/assets", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return data.assets as AssetBiblioteca[];
    }
  } catch {
    // sem rede / erro inesperado — cai para o localStorage abaixo
  }
  return getAssetsLocal();
}

/**
 * Salva um novo item da biblioteca (ou atualiza um existente). Se o Vercel
 * Blob estiver configurado, faz o upload da imagem primeiro para obter uma
 * `url` e tenta persistir no banco; caso contrário (ou se algum dos dois
 * passos falhar), guarda no localStorage com a imagem em base64 — a tela
 * continua funcionando normalmente em qualquer um dos dois casos.
 */
export async function saveAsset(asset: AssetBiblioteca): Promise<AssetBiblioteca> {
  let salvo = asset;

  if (asset.base64 && !asset.url) {
    const url = await uploadImage(`biblioteca/${asset.tipo}-${asset.id}`, asset.base64, asset.mimeType);
    if (url) salvo = { ...asset, url };
  }

  if (salvo.url) {
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...salvo, base64: undefined }),
      });
      if (res.ok) return salvo;
    } catch {
      // sem rede — cai para o localStorage abaixo
    }
  }

  saveAssetLocal(salvo);
  return salvo;
}

/** Remove um item da biblioteca (banco e/ou localStorage, best-effort nos dois). */
export async function deleteAsset(id: string): Promise<void> {
  try {
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
  } catch {
    // sem rede / sem banco — segue para remover do localStorage também
  }
  deleteAssetLocal(id);
}

// --- Brand DNA (Fase 2 — docs/brand-dna.md). Mesmo padrão híbrido dos
// templates: tenta o banco (via /api/brand-dna) e cai para o localStorage
// deste navegador sem banco configurado ou sem rede. Sem multi-tenancy
// ainda, existe no máximo um Brand DNA por instalação/navegador. ---

function getBrandDnaLocal(): BrandDna | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BRAND_DNA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BrandDna;
  } catch {
    return null;
  }
}

function saveBrandDnaLocal(brandDna: BrandDna) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BRAND_DNA_KEY, JSON.stringify(brandDna));
}

/** Lê o Brand DNA atual. Usa o banco se disponível; senão, o localStorage deste navegador. */
export async function getBrandDna(): Promise<BrandDna | null> {
  try {
    const res = await fetch("/api/brand-dna", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return (data.brandDna as BrandDna | null) ?? getBrandDnaLocal();
    }
  } catch {
    // sem rede / erro inesperado — cai para o localStorage abaixo
  }
  return getBrandDnaLocal();
}

/** Salva o Brand DNA (proposta editada e aprovada, ou rascunho). */
export async function saveBrandDna(brandDna: BrandDna): Promise<void> {
  try {
    const res = await fetch("/api/brand-dna", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(brandDna),
    });
    if (res.ok) {
      saveBrandDnaLocal(brandDna);
      return;
    }
  } catch {
    // sem rede — cai para o localStorage abaixo
  }
  saveBrandDnaLocal(brandDna);
}

export async function getCreditBalance(): Promise<{
  creditsRemaining: number;
  creditsMonthly: number;
  planName: string;
  resetDate: string;
} | null> {
  try {
    const res = await fetch("/api/billing/balance", { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
  }
  return null;
}
