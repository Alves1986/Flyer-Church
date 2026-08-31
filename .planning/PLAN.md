# PLAN.md — FlyerForge SaaS Transformation (Fase 3)

**Phase:** 3 — SaaS Multi-Igreja
**Status:** Planned
**Created:** 2026-08-31
**Target:** 8-11 weeks (1 dev) | 4.5-6 weeks (2 devs)

---

## 1. Visão Geral

Transformar o FlyerForge de ferramenta local-first em **SaaS multi-tenancy vendável** para igrejas, mantendo a arquitetura de degradação graciosa e a qualidade editorial premium.

### Objetivos de Negócio
- **MVP SaaS:** Auth, organizações, billing, onboarding self-service
- **Diferencial Técnico:** Text Layer Rendering (texto determinístico sobre IA)
- **Métrica Norte:** Taxa de flyers aprovados/publicados > 70% nos primeiros 30 dias
- **Receita:** Primeiro cliente pagante em semana 6; $1k MRR em semana 12

### Princípios Não-Negociáveis
1. **Zero breaking changes** para pilotos atuais (localStorage fallback preservado)
2. **RLS obrigatório** — isolamento de dados por `organization_id` em todas as tabelas
3. **Text layers server-side** — não opcional; é o moat
4. **Feature flags** para rollout gradual (Brand DNA v2, novo modelo IA, etc.)

---

## 2. Arquitetura Alvo

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 14 APP ROUTER                     │
├─────────────────────────────────────────────────────────────────┤
│  Middleware (org resolution) → API Routes (RLS enforced)        │
├─────────────────────────────────────────────────────────────────┤
│  Clerk Auth (SSO, Orgs, Roles, Billing Portal)                  │
├─────────────────────────────────────────────────────────────────┤
│  Vercel Postgres (Neon) + RLS                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ organizations│ │ org_members │ │ templates   │ │ assets    │ │
│  │ flyers_gerados│ │ brand_dna   │ │ usage_events│ │ plans     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Vercel Blob (assets) + CDN                                     │
├─────────────────────────────────────────────────────────────────┤
│  External: OpenRouter (extract) | Gemini/Flux (generate)        │
│  Billing: Paddle (MoR Brasil) | Stripe (fallback global)        │
│  Observability: Axiom + Sentry + PostHog                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Epics & Tasks

### EPIC 1: Foundation — Auth + Multi-Tenancy + RLS (Semanas 1-2)

#### Task 1.1: Clerk Integration
- [ ] **1.1.1** Instalar `@clerk/nextjs` + configurar `middleware.ts` com `authMiddleware`
- [ ] **1.1.2** Criar `lib/auth.ts` com helpers: `getCurrentOrg()`, `getCurrentUser()`, `requireOrg()`
- [ ] **1.1.3** Configurar Clerk Dashboard: Organizations enabled, Custom roles (owner, admin, designer, editor, viewer)
- [ ] **1.1.4** Webhook Clerk → `/api/clerk/webhook` para sync `organizations` + `organization_members`
- [ ] **1.1.5** Testes: login, create org, invite member, role enforcement

#### Task 1.2: Database Migration + RLS
- [ ] **1.2.1** Migration SQL: adicionar `organization_id UUID REFERENCES organizations(id)` em:
  - `templates`, `assets`, `flyers_gerados`, `brand_dna`, `usage_events`
- [ ] **1.2.2** Criar policies RLS por tabela (ex: `CREATE POLICY templates_org_isolation ON templates USING (organization_id = current_setting('app.current_org_id')::uuid)`)
- [ ] **1.2.3** Função `set_current_org_id(org_id)` chamada no middleware antes de queries
- [ ] **1.2.4** Backfill: popular `organization_id` para dados existentes (org "default" para pilotos)
- [ ] **1.2.5** Testes automatizados de isolamento: user A não vê templates de user B

#### Task 1.3: Subdomain/Path Routing
- [ ] **1.3.1** Middleware resolve org: `hostname` → wildcard domain OU `/org/[slug]` path
- [ ] **1.3.2** `lib/org.ts`: `resolveOrgFromRequest(req)` → retorna `organization_id` + `slug`
- [ ] **1.3.3** Inject `x-organization-id` header em todas as API routes
- [ ] **1.3.4** Fallback: sem org resolvido → redirect para onboarding ou landing

### EPIC 2: Billing + Créditos (Semanas 2-3)

#### Task 2.1: Paddle/Stripe Setup
- [ ] **2.1.1** Criar produtos no Paddle: Free, Pro (R$49), Church (R$149), Enterprise (custom)
- [ ] **2.1.2** Configurar webhooks: `subscription.created`, `subscription.updated`, `transaction.completed`
- [ ] **2.1.3** `lib/billing.ts`: `checkCredits(orgId, cost)`, `consumeCredits(orgId, cost, eventType)`, `getCreditBalance(orgId)`
- [ ] **2.1.4** Tabela `usage_events`: org_id, event_type (generation|extraction), credits, metadata, created_at
- [ ] **2.1.5** Job cron (Vercel Cron): reset monthly credits no dia 1 + sync Paddle status

#### Task 2.2: Gating & UI
- [ ] **2.2.1** Middleware/Helper: `requireCredits(cost)` — bloqueia geração se sem crédito, retorna 402 + upgrade CTA
- [ ] **2.2.2** Componente `CreditBadge` no header: mostra créditos restantes + link "Gerenciar plano"
- [ ] **2.2.3** Página `/configuracao/plano`: tabela de planos, uso atual, histórico de faturas (Paddle portal)
- [ ] **2.2.4** Email transactionais (Resend): boas-vindas, fatura, 80% limite, sem créditos

### EPIC 3: Onboarding Wizard + Dashboard (Semanas 3-4)

#### Task 3.1: Onboarding Wizard (3 passos)
- [ ] **3.1.1** Rota `/onboarding` com stepper: (1) Dados da igreja → (2) Template inicial → (3) Convidar equipe
- [ ] **3.1.2** Passo 1: Form `nome`, `slug` (validação unique), `denominacao`, `tamanho_equipe`
- [ ] **3.1.3** Passo 2: Upload flyer referência → chama `/api/extract` → salva template + propõe Brand DNA
- [ ] **3.1.4** Passo 3: Convite por email (Clerk `inviteUser`) com role `designer` default
- [ ] **3.1.5** Completion: redirect para `/dashboard` com toast "Primeiro template pronto!"

#### Task 3.2: Dashboard Principal
- [ ] **3.2.1** Layout: Sidebar (navegação) + Header (org switcher, credits, user menu)
- [ ] **3.2.2** Cards: "Templates ativos" (grid), "Últimos flyers" (list), "Métricas rápidas" (gerados mês, taxa aprovação, créditos)
- [ ] **3.2.3** Ações rápidas: "Novo template", "Novo flyer", "Biblioteca", "Configurações"
- [ ] **3.2.4** Empty states ilustrados + CTAs contextuais

#### Task 3.3: Team Management
- [ ] **3.3.1** `/configuracao/equipe`: lista membros, roles, status convite
- [ ] **3.3.2** Convidar/Remover/Alterar role (Clerk API)
- [ ] **3.3.3** Activity log: quem gerou, aprovou, rejeitou, convidou (tabela `audit_logs`)

### EPIC 4: Brand DNA Editor Visual (Semanas 4-5)

#### Task 4.1: Brand DNA CRUD + UI
- [ ] **4.1.1** `/marca` (renomear de `/marca` para `/configuracao/marca`): editor visual
- [ ] **4.1.2** Seções: Paleta (color pickers + hex), Tipografia (font pickers Google Fonts), Composição, Imagery, Motifs, Logo Rules
- [ ] **4.1.3** Upload de referências aprovadas (máx 5) → análise IA propõe Brand DNA (reutilizar `/api/brand-dna/propose`)
- [ ] **4.1.4** Aprovação humana obrigatória (`approvedByHuman: true`) antes de ativar
- [ ] **4.1.5** Versionamento: `version` incrementa a cada save aprovado; histórico visível

#### Task 4.2: Event Overrides
- [ ] **4.2.1** UI para overrides por categoria: Culto, Jovens, Ceia, Conferência, Vigília, Aviso
- [ ] **4.2.2** Herança: override vazio = usa global; override parcial = merge deep
- [ ] **4.2.3** Preview lado a lado: global vs override aplicado

### EPIC 5: Biblioteca de Assets Inteligente (Semanas 5-6)

#### Task 5.1: Asset Management
- [ ] **5.1.1** `/biblioteca` refatorado: grid responsivo, filtros por tipo (logo/foto/fundo), busca por tag
- [ ] **5.1.2** Upload múltiplo + drag-drop + progress
- [ ] **5.1.3** Auto-tag via CLIP embedding (serverless function) → tags: "preletor", "fundo_escuro", "logo_horizontal", etc.
- [ ] **5.1.4** Smart suggest no editor de flyer: "Baseado no template X, sugerimos estes assets"

#### Task 5.2: Versionamento de Logo
- [ ] **5.2.1** Logo marcado como "oficial" → propaga para templates ativos (prompt update sugerido)
- [ ] **5.2.2** Histórico de logos por org

### EPIC 6: Text Layer Rendering — O Moat (Semanas 6-8)

#### Task 6.1: Server-Side Canvas Engine
- [ ] **6.1.1** Instalar `@napi-rs/canvas` + fontes (Inter, Playfair Display, Montserrat, etc. no Dockerfile)
- [ ] **6.1.2** `lib/text-renderer.ts`: `renderTextLayers(baseImageBase64, textLayers, brandDna, formato)` → `finalImageBase64`
- [ ] **6.1.3** TextLayer spec: `{ variable: string, x: number, y: number, maxWidth: number, fontFamily: string, fontSize: number, color: string, align: 'left'|'center'|'right', lineHeight: number }`
- [ ] **6.1.4** Extração de coordenadas: meta-prompt atualizado para retornar `textPositions` JSON junto com prompt

#### Task 6.2: Integração no Fluxo de Geração
- [ ] **6.2.1** Atualizar `META_PROMPT_EXTRACAO` para incluir `textPositions` no output
- [ ] **6.2.2** `lib/promptMerge.ts` expandido: retorna `{ prompt: string, textLayers: TextLayer[] }`
- [ ] **6.2.3** `/api/generate` modificado: 1) chama IA para imagem base (sem texto) → 2) `renderTextLayers` → 3) retorna final
- [ ] **6.2.4** Preview no editor: canvas interativo para ajustar posição/tamanho/fonte antes de gerar final

#### Task 6.3: Qualidade & Fallbacks
- [ ] **6.3.1** Validação pós-gera: comparar cores dominantes da imagem base vs Brand DNA palette (delta E)
- [ ] **6.3.2** Fallback: se Canvas falhar → retorna imagem IA original + warning
- [ ] **6.3.3** Export options: PNG (padrão), WebP, PDF (para impressão), JPEG qualidade configurável

### EPIC 7: Histórico Avançado + Bulk Actions (Semanas 7-8)

#### Task 7.1: Histórico Rico
- [ ] **7.1.1** `/historico` com filtros: status, categoria, data, template, autor
- [ ] **7.1.2** Cards com thumbnail, status badge, avaliação, ações (ver, baixar, duplicar, aprovar)
- [ ] **7.1.3** Bulk actions: selecionar múltiplos → "Baixar ZIP", "Marcar aprovado", "Deletar"
- [ ] **7.1.4** Comparação A/B: lado a lado dois flyers do mesmo template

#### Task 7.2: Analytics Internos
- [ ] **7.2.1** `/analytics` (admin/owner): gráficos de geração/semana, taxa aprovação por template, categoria, usuário
- [ ] **7.2.2** Export CSV de usage_events

### EPIC 8: Polish, Tests & Launch Prep (Semanas 8-10)

#### Task 8.1: Landing Page + Marketing
- [ ] **8.1.1** Landing em `/` (public): hero, demo video/gif, features, pricing, depoimentos, CTA "Começar grátis"
- [ ] **8.1.2** SEO: sitemap, robots, OG images dinâmicas, structured data
- [ ] **8.1.3** Docs/Help Center: Mintlify ou Nextra em `/docs`

#### Task 8.2: Testes Automatizados
- [ ] **8.2.1** Unit: `promptMerge`, `parseTemplateVariables`, `aplicarFormatoAoPrompt`, `aplicarBrandDnaAoPrompt`, `renderTextLayers`
- [ ] **8.2.2** Integration: `/api/extract`, `/api/generate` (mock providers), `/api/billing/webhook`
- [ ] **8.2.3** E2E Playwright: fluxo completo onboarding → extrair → gerar → aprovar → baixar
- [ ] **8.2.4** Visual regression: Chromatic ou Playwright snapshot para páginas críticas
- [ ] **8.2.5** Load test: k6 ou Artillery — 50 gerações concorrentes

#### Task 8.3: Observabilidade & Hardening
- [ ] **8.3.1** Axiom: structured logs com `organization_id`, `user_id`, `trace_id`
- [ ] **8.3.2** Sentry: error tracking + performance (tracesSampleRate 0.1)
- [ ] **8.3.3** PostHog: eventos `template_created`, `flyer_generated`, `flyer_approved`, `upgrade_clicked`, `onboarding_completed`
- [ ] **8.3.4** Feature flags (Unleash self-host): `brand-dna-v2`, `flux-fallback`, `text-layers-v2`
- [ ] **8.3.5** Rate limiting: `/api/generate` (10/min/org), `/api/extract` (20/min/org)

#### Task 8.4: Beta & Iteração
- [ ] **8.4.1** Recrutar 3-5 igrejas beta (lista de espera)
- [ ] **8.4.2** Onboarding assistido + coleta feedback semanal
- [ ] **8.4.3** Iterar: corrigir bugs críticos, ajustar UX, melhorar qualidade geração
- [ ] **8.4.4** Launch checklist: DNS, SSL, emails, billing, legal (termos, privacidade, LGPD)

---

## 4. Especificações Técnicas Detalhadas

### 4.1 Schema SQL (Migração Fase 3)

```sql
-- organizations (gerenciado por Clerk webhook)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  denomination TEXT,
  team_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- organization_members (gerenciado por Clerk webhook)
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- clerk user id
  role TEXT NOT NULL CHECK (role IN ('owner','admin','designer','editor','viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, user_id)
);

-- templates (estender)
ALTER TABLE templates ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_templates_org ON templates(organization_id);

-- assets (estender)
ALTER TABLE assets ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_assets_org ON assets(organization_id);

-- flyers_gerados (estender)
ALTER TABLE flyers_gerados ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE flyers_gerados ADD COLUMN generated_by TEXT; -- clerk user id
CREATE INDEX idx_flyers_org ON flyers_gerados(organization_id);

-- brand_dna (estender)
ALTER TABLE brand_dna ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE;
-- já existe approvedByHuman, version

-- usage_events (novo)
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('generation','extraction')),
  credits_consumed INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_usage_org_date ON usage_events(organization_id, created_at);

-- audit_logs (novo)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_org_date ON audit_logs(organization_id, created_at);

-- RLS Policies (exemplo para templates)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY templates_org_isolation ON templates
  USING (organization_id = current_setting('app.current_org_id')::uuid);
-- Repetir para assets, flyers_gerados, brand_dna, usage_events, audit_logs

-- Função para setar org context
CREATE OR REPLACE FUNCTION set_current_org_id(org_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  SET LOCAL app.current_org_id = org_id::text;
$$;
```

### 4.2 Text Layer Rendering Spec

**Input (do meta-prompt atualizado):**
```json
{
  "prompt": "Imagem base...",
  "textPositions": [
    {
      "variable": "NOME_EVENTO",
      "x": 540, "y": 200,
      "maxWidth": 900,
      "fontFamily": "Playfair Display",
      "fontSize": 72,
      "color": "#BB9E49",
      "align": "center",
      "lineHeight": 1.1
    },
    {
      "variable": "DATA_EVENTO",
      "x": 540, "y": 320,
      "maxWidth": 600,
      "fontFamily": "Inter",
      "fontSize": 28,
      "color": "#F5F0E1",
      "align": "center",
      "lineHeight": 1.3
    }
    // ... outras variáveis
  ]
}
```

**Render Pipeline:**
```typescript
// lib/text-renderer.ts
export async function renderTextLayers(
  baseImageBase64: string,
  textLayers: TextLayer[],
  values: Record<string, string>,
  brandDna?: BrandDna,
  formato?: FormatoPreset
): Promise<{ base64: string; mimeType: string }> {
  const canvas = createCanvas(formato.larguraPx, formato.alturaPx);
  const ctx = canvas.getContext('2d');
  
  // 1. Desenhar imagem base
  const baseImg = await loadImage(Buffer.from(baseImageBase64, 'base64'));
  ctx.drawImage(baseImg, 0, 0, formato.larguraPx, formato.alturaPx);
  
  // 2. Aplicar fontes do Brand DNA se disponível
  registerFonts(brandDna?.typography);
  
  // 3. Renderizar cada text layer
  for (const layer of textLayers) {
    const text = values[layer.variable] ?? `[${layer.variable}]`;
    ctx.font = `${layer.fontSize}px "${layer.fontFamily}"`;
    ctx.fillStyle = layer.color;
    ctx.textAlign = layer.align;
    ctx.textBaseline = 'top';
    
    // Word wrap
    const lines = wrapText(ctx, text, layer.maxWidth, layer.lineHeight);
    lines.forEach((line, i) => {
      ctx.fillText(line, layer.x, layer.y + i * layer.fontSize * layer.lineHeight);
    });
  }
  
  return {
    base64: canvas.toBuffer('image/png').toString('base64'),
    mimeType: 'image/png'
  };
}
```

### 4.3 Meta-Prompt Atualizado (Extração + Posições)

```typescript
// lib/metaPrompt.ts — adição ao META_PROMPT_EXTRACAO
export const META_PROMPT_EXTRACAO = `... (original) ...

SAÍDA ESPERADA: Um objeto JSON válido (sem markdown) com dois campos:
{
  "prompt": "prompt de criação longo e descritivo em português...",
  "textPositions": [
    {
      "variable": "NOME_EVENTO",
      "x": 540, "y": 200, "maxWidth": 900,
      "fontFamily": "Playfair Display", "fontSize": 72,
      "color": "#BB9E49", "align": "center", "lineHeight": 1.1
    },
    // ... para TODAS as variáveis de texto detectadas
  ]
}

Coordenadas (x,y) em pixels relativos à imagem de referência (assumindo 1080x1350 feed).
Cores em hex. Fontes: use nomes padrão (Playfair Display, Inter, Montserrat, etc.).
Se não conseguir estimar posição exata, use layout padrão centralizado.`;
```

### 4.4 Billing Plans Config

```typescript
// lib/plans.ts
export const PLANS = {
  free: {
    id: 'free',
    name: 'Gratuito',
    priceMonthly: 0,
    creditsMonthly: 10,
    templatesLimit: 1,
    brandDna: false,
    library: false,
    teamSeats: 1,
    prioritySupport: false,
    apiAccess: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 4900, // centavos
    creditsMonthly: 200,
    templatesLimit: -1,
    brandDna: true,
    library: true,
    teamSeats: 3,
    prioritySupport: false,
    apiAccess: false,
  },
  church: {
    id: 'church',
    name: 'Igreja',
    priceMonthly: 14900,
    creditsMonthly: 1000,
    templatesLimit: -1,
    brandDna: true,
    library: true,
    teamSeats: 10,
    prioritySupport: true,
    apiAccess: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;
```

### 4.5 Feature Flags

```typescript
// lib/flags.ts
export const FLAGS = {
  'brand-dna-v2': { default: false, rollout: 10 }, // % orgs
  'flux-fallback': { default: false, rollout: 0 },  // só Pro+
  'text-layers-v2': { default: true, rollout: 100 }, // obrigatório
  'smart-suggest': { default: false, rollout: 25 },
} as const;
```

---

## 5. Critérios de Aceitação (Definition of Done)

### Epic 1 (Foundation)
- [ ] Login Clerk funciona; org criada via UI Clerk aparece no DB
- [ ] RLS bloqueia cross-org access (teste automatizado passing)
- [ ] Middleware resolve org por subdomínio E path
- [ ] `npx tsc --noEmit` limpo; `npm run build` passing

### Epic 2 (Billing)
- [ ] Webhook Paddle processa subscription.created → credits updated
- [ ] Geração bloqueia com 402 quando créditos = 0
- [ ] CreditBadge mostra contagem correta em tempo real
- [ ] Portal Paddle acessível from `/configuracao/plano`

### Epic 3 (Onboarding + Dashboard)
- [ ] Novo usuário completa onboarding em < 3 min
- [ ] Template inicial criado e aparece no dashboard
- [ ] Convite de equipe envia email; aceitação adiciona member
- [ ] Activity log registra ações principais

### Epic 4 (Brand DNA)
- [ ] Editor visual salva Brand DNA com `approvedByHuman: true`
- [ ] Overrides por categoria funcionam (merge deep)
- [ ] Geração usa Brand DNA ativo quando aprovado

### Epic 5 (Biblioteca)
- [ ] Upload múltiplo + auto-tag (mock CLIP ok para MVP)
- [ ] Smart suggest aparece no editor de flyer
- [ ] Logo versionado; troca propaga sugestão de update

### Epic 6 (Text Layers) — CRÍTICO
- [ ] Meta-prompt retorna `textPositions` JSON válido
- [ ] Canvas renderiza textos nas posições corretas
- [ ] Preview interativo permite ajustar posição/fonte/tamanho
- [ ] Export PNG/WebP/PDF idêntico ao preview
- [ ] Fallback gracioso se Canvas falhar

### Epic 7 (Histórico + Analytics)
- [ ] Filtros funcionam; bulk actions executam
- [ ] A/B comparison side-by-side
- [ ] Analytics page mostra gráficos básicos

### Epic 8 (Polish + Launch)
- [ ] Landing page converted > 5% visitors → signup
- [ ] Testes: unit > 80% coverage lib/, E2E passing CI
- [ ] Load test: 50 concorrentes < 5s p95
- [ ] Sentry/Axiom/PostHog recebendo dados
- [ ] 3 igrejas beta ativas > 2 semanas sem bugs críticos

---

## 6. Riscos & Mitigações

| Risco | Prob. | Impacto | Mitigação |
|-------|-------|---------|-----------|
| Custo Gemini explode | Média | Alto | Hard limit 50/dia/org free; 500/dia Pro; alerta 80%; Flux fallback só Pro+ |
| RLS quebra queries existentes | Baixa | Crítico | Testes de isolamento automatizados em CI; staging com 2 orgs |
| Text rendering lento | Média | Médio | Cache de fontes; pool Canvas; timeout 30s; fallback para IA original |
| Igrejas não convertem | Média | Alto | Onboarding wizard com "aha moment" na 1ª geração; email drip 3/7/14 dias |
| Clerk/Paddle custos inesperados | Baixa | Médio | Monitoramento de custos diários; alerts em $50/dia |

---

## 7. Sequência de Execução Recomendada

```
SEMANA 1: 1.1 + 1.2 (Auth + RLS) — foundation crítica
SEMANA 2: 1.3 + 2.1 (Routing + Billing core)
SEMANA 3: 2.2 + 3.1 (Billing UI + Onboarding)
SEMANA 4: 3.2 + 3.3 + 4.1 (Dashboard + Team + Brand DNA)
SEMANA 5: 4.2 + 5.1 (Overrides + Biblioteca)
SEMANA 6: 6.1 + 6.2 (Text Layers Core)
SEMANA 7: 6.3 + 7.1 (Qualidade + Histórico)
SEMANA 8: 7.2 + 8.1 (Analytics + Landing)
SEMANA 9: 8.2 + 8.3 (Testes + Observabilidade)
SEMANA 10: 8.4 (Beta + Iteração + Launch)
```

---

## 8. Comandos de Validação Contínua

```bash
# Tipo + Build
npx tsc --noEmit && npm run build

# Lint
npm run lint

# Testes
npm run test:unit
npm run test:integration
npm run test:e2e

# Visual regression
npm run test:visual

# Load test (manual)
k6 run load-test.js

# DB migration check
npx drizzle-kit check # ou equivalente
```

---

## 9. Próximos Passos Imediatos

1. **Aprovar este PLAN.md** — confirmar escopo e priorização
2. **Setup Clerk + Paddle accounts** — credenciais para dev
3. **Criar branch `feat/saas-foundation`** — iniciar Epic 1
4. **Rodar migration RLS em staging** — validar isolamento

---

## 10. Decisões Pendentes (Resolver Antes de Iniciar)

| Decisão | Opções | Recomendação |
|---------|--------|--------------|
| Auth Provider | Clerk vs NextAuth v5 | **Clerk** (orgs, billing portal, roles prontos) |
| Billing Provider | Paddle vs Stripe | **Paddle** (MoR Brasil, LGPD, invoices automáticos) |
| Subdomain Strategy | Wildcard domains vs `/org/[slug]` | **Path-based primeiro** (funciona day 1, sem DNS config) |
| Fontes no Canvas | Google Fonts auto-download vs bundlar | **Bundlar no Dockerfile** (consistente, offline) |
| CLIP Auto-tag | Serverless function vs client-side | **Serverless (Vercel Function)** — privacidade, performance |

---

*Este plano segue a metodologia GSD. Cada task é atômica, testável e rastreável. Execute `gsd-execute-phase` para iniciar a implementação.*