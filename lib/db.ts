import { neon } from "@neondatabase/serverless";

/**
 * Camada de persistência opcional em Postgres.
 *
 * A Vercel oferece Postgres através da integração nativa com a Neon
 * (Storage → Create Database → Postgres, ou `vercel install neon`), que
 * injeta a connection string como `DATABASE_URL` (algumas instalações mais
 * antigas usam `POSTGRES_URL` — por isso checamos as duas).
 *
 * Segue o mesmo padrão já usado em `app/api/extract` e `app/api/generate`:
 * se a variável de ambiente não estiver configurada, as rotas que dependem
 * disso respondem 501 com uma mensagem clara, e o cliente (`lib/store.ts`)
 * cai de volta para o `localStorage`. Isso mantém o app 100% funcional sem
 * nenhuma configuração, e "liga" o banco automaticamente assim que você
 * conectar um banco Postgres ao projeto na Vercel.
 */
const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED;

export function isDbConfigured(): boolean {
  return Boolean(CONNECTION_STRING);
}

type NeonSql = ReturnType<typeof neon>;
let client: NeonSql | null = null;

function getClient(): NeonSql {
  if (!CONNECTION_STRING) {
    throw new Error(
      "Banco não configurado: defina DATABASE_URL (Vercel → Storage → Postgres)."
    );
  }
  if (!client) {
    client = neon(CONNECTION_STRING);
  }
  return client;
}

/** Tagged template para queries SQL — uso: `await sql\`select 1\``. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getClient()(strings, ...values);
}

let schemaReady: Promise<void> | null = null;

/** Garante que as tabelas existem. Idempotente e barato (CREATE TABLE IF NOT EXISTS). */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        create table if not exists organizations (
          id uuid primary key default gen_random_uuid(),
          clerk_org_id text unique not null,
          name text not null,
          slug text unique not null,
          denomination text,
          team_size text,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        );
      `;
      await sql`
        create table if not exists organization_members (
          id uuid primary key default gen_random_uuid(),
          organization_id uuid references organizations(id) on delete cascade,
          user_id text not null,
          role text not null check (role in ('owner','admin','designer','editor','viewer')),
          created_at timestamptz not null default now(),
          unique (organization_id, user_id)
        );
      `;
      await sql`
        create table if not exists templates (
          id text primary key,
          organization_id uuid references organizations(id) on delete cascade,
          nome text not null,
          prompt_extraido text not null,
          thumbnail_url text,
          variaveis_texto text[] not null default '{}',
          variaveis_imagem text[] not null default '{}',
          categoria text,
          criado_em timestamptz not null default now()
        );
      `;
      await sql`
        create index if not exists idx_templates_org on templates(organization_id);
      `;
      await sql`
        create table if not exists assets (
          id text primary key,
          organization_id uuid references organizations(id) on delete cascade,
          nome text not null,
          tipo text not null,
          url text not null,
          mime_type text,
          criado_em timestamptz not null default now()
        );
      `;
      await sql`
        create index if not exists idx_assets_org on assets(organization_id);
      `;
      await sql`
        create table if not exists flyers_gerados (
          id text primary key,
          organization_id uuid references organizations(id) on delete cascade,
          template_id text references templates(id) on delete cascade,
          generated_by text,
          campos jsonb not null default '{}',
          prompt_final text not null,
          imagem_url text,
          formato_id text,
          status text not null default 'gerado',
          avaliacao smallint,
          motivo_rejeicao text,
          criado_em timestamptz not null default now()
        );
      `;
      await sql`
        create index if not exists idx_flyers_org on flyers_gerados(organization_id);
      `;
      await sql`
        create table if not exists brand_dna (
          id text primary key,
          organization_id uuid references organizations(id) on delete cascade unique,
          dados jsonb not null,
          atualizado_em timestamptz not null default now()
        );
      `;
      await sql`
        create table if not exists usage_events (
          id uuid primary key default gen_random_uuid(),
          organization_id uuid references organizations(id) on delete cascade,
          user_id text not null,
          event_type text not null check (event_type in ('generation','extraction')),
          credits_consumed integer not null default 1,
          metadata jsonb not null default '{}',
          created_at timestamptz not null default now()
        );
      `;
      await sql`
        create index if not exists idx_usage_org_date on usage_events(organization_id, created_at);
      `;
      await sql`
        create table if not exists audit_logs (
          id uuid primary key default gen_random_uuid(),
          organization_id uuid references organizations(id) on delete cascade,
          user_id text not null,
          action text not null,
          resource_type text,
          resource_id text,
          metadata jsonb not null default '{}',
          created_at timestamptz not null default now()
        );
      `;
      await sql`
        create index if not exists idx_audit_org_date on audit_logs(organization_id, created_at);
      `;
      await sql`
        create or replace function set_current_org_id(org_id uuid)
        returns void language sql as $$
          set local app.current_org_id = org_id::text;
        $$;
      `;
      await sql`
        do $$
        begin
          if not exists (
            select 1 from pg_policies where tablename = 'templates' and policyname = 'templates_org_isolation'
          ) then
            alter table templates enable row level security;
            create policy templates_org_isolation on templates
              using (organization_id = current_setting('app.current_org_id')::uuid);
          end if;
        end $$;
      `;
      await sql`
        do $$
        begin
          if not exists (
            select 1 from pg_policies where tablename = 'assets' and policyname = 'assets_org_isolation'
          ) then
            alter table assets enable row level security;
            create policy assets_org_isolation on assets
              using (organization_id = current_setting('app.current_org_id')::uuid);
          end if;
        end $$;
      `;
      await sql`
        do $$
        begin
          if not exists (
            select 1 from pg_policies where tablename = 'flyers_gerados' and policyname = 'flyers_org_isolation'
          ) then
            alter table flyers_gerados enable row level security;
            create policy flyers_org_isolation on flyers_gerados
              using (organization_id = current_setting('app.current_org_id')::uuid);
          end if;
        end $$;
      `;
      await sql`
        do $$
        begin
          if not exists (
            select 1 from pg_policies where tablename = 'brand_dna' and policyname = 'brand_dna_org_isolation'
          ) then
            alter table brand_dna enable row level security;
            create policy brand_dna_org_isolation on brand_dna
              using (organization_id = current_setting('app.current_org_id')::uuid);
          end if;
        end $$;
      `;
      await sql`
        do $$
        begin
          if not exists (
            select 1 from pg_policies where tablename = 'usage_events' and policyname = 'usage_events_org_isolation'
          ) then
            alter table usage_events enable row level security;
            create policy usage_events_org_isolation on usage_events
              using (organization_id = current_setting('app.current_org_id')::uuid);
          end if;
        end $$;
      `;
      await sql`
        do $$
        begin
          if not exists (
            select 1 from pg_policies where tablename = 'audit_logs' and policyname = 'audit_logs_org_isolation'
          ) then
            alter table audit_logs enable row level security;
            create policy audit_logs_org_isolation on audit_logs
              using (organization_id = current_setting('app.current_org_id')::uuid);
          end if;
        end $$;
      `;
      await sql`alter table templates add column if not exists categoria text;`;
      await sql`alter table templates add column if not exists organization_id uuid references organizations(id) on delete cascade;`;
      await sql`alter table assets add column if not exists organization_id uuid references organizations(id) on delete cascade;`;
      await sql`alter table flyers_gerados add column if not exists organization_id uuid references organizations(id) on delete cascade;`;
      await sql`alter table flyers_gerados add column if not exists generated_by text;`;
      await sql`alter table flyers_gerados add column if not exists formato_id text;`;
      await sql`alter table flyers_gerados add column if not exists status text not null default 'gerado';`;
      await sql`alter table flyers_gerados add column if not exists avaliacao smallint;`;
      await sql`alter table flyers_gerados add column if not exists motivo_rejeicao text;`;
      await sql`alter table brand_dna add column if not exists organization_id uuid references organizations(id) on delete cascade unique;`;
    })();
  }
  return schemaReady;
}

export async function setOrgContext(orgId: string) {
  if (!isDbConfigured()) return;
  await sql`select set_current_org_id(${orgId}::uuid)`;
}