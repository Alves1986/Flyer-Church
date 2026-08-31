-- Schema de referência para o banco Postgres do FlyerForge.
--
-- Você NÃO precisa rodar isso manualmente: as rotas em app/api/templates e
-- app/api/flyers chamam `ensureSchema()` (lib/db.ts) automaticamente, que
-- cria essas tabelas com CREATE TABLE IF NOT EXISTS na primeira chamada.
-- Este arquivo existe apenas como documentação/referência do schema e para
-- quem preferir rodar a migração manualmente (ex: `psql $POSTGRES_URL -f db/schema.sql`).
--
-- Como conectar um banco:
--   1. No dashboard da Vercel, abra o projeto → aba "Storage" → "Create Database" → Postgres
--      (integração nativa com a Neon).
--   2. A Vercel injeta DATABASE_URL (e variações) automaticamente nas env vars do projeto.
--   3. Redeploy — a partir daí os templates e o histórico de flyers passam a
--      ser salvos no banco em vez de (apenas) no localStorage do navegador.
--
-- Para as imagens (logo, foto do preletor, flyer gerado), conecte também um
-- Blob store: Storage → Create Database → Blob. Isso injeta
-- BLOB_READ_WRITE_TOKEN e habilita o upload em app/api/upload.

create table if not exists templates (
  id text primary key,
  nome text not null,
  prompt_extraido text not null,
  thumbnail_url text,
  variaveis_texto text[] not null default '{}',
  variaveis_imagem text[] not null default '{}',
  categoria text, -- culto | jovens | ceia | conferencia | vigilia | aviso (lib/categorias.ts)
  criado_em timestamptz not null default now()
);

create table if not exists flyers_gerados (
  id text primary key,
  template_id text references templates(id) on delete cascade,
  campos jsonb not null default '{}',
  prompt_final text not null,
  imagem_url text,
  formato_id text, -- feed | quadrado | story | whatsapp (lib/formatos.ts)
  status text not null default 'gerado', -- rascunho | gerado | aprovado | rejeitado | publicado (lib/statusFlyer.ts)
  avaliacao smallint, -- 1 a 5, "representa nossa igreja?"
  motivo_rejeicao text,
  criado_em timestamptz not null default now()
);

-- Migração para bancos conectados antes da Fase 1 (roadmap):
-- alter table templates add column if not exists categoria text;
-- alter table flyers_gerados add column if not exists formato_id text;
-- alter table flyers_gerados add column if not exists status text not null default 'gerado';
-- alter table flyers_gerados add column if not exists avaliacao smallint;
-- alter table flyers_gerados add column if not exists motivo_rejeicao text;
-- (a própria app roda essas migrações sozinha via ensureSchema() em lib/db.ts;
-- as linhas acima são só para quem prefere aplicar manualmente via psql)
