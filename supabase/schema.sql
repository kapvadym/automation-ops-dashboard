-- ============================================================
-- automation-ops-dashboard consolidated schema
-- One Supabase project backing 4 adapted domains: rag, workflow,
-- agent, keys. Tables are domain-prefixed to avoid collisions.
-- Shapes are unchanged from each original project's schema.sql,
-- just renamed. Applied via Supabase MCP; kept here for reference.
-- ============================================================

-- ---------- rag ----------
create schema if not exists extensions;
create extension if not exists vector schema extensions;

create table if not exists rag_documents (
  id bigserial primary key,
  source text not null,
  content text not null,
  embedding extensions.vector(768),
  created_at timestamptz default now()
);

create or replace function match_rag_documents(
  query_embedding extensions.vector(768),
  match_count int default 4
)
returns table (
  id bigint,
  source text,
  content text,
  similarity float
)
language sql stable
set search_path = public, extensions
as $$
  select
    rag_documents.id,
    rag_documents.source,
    rag_documents.content,
    1 - (rag_documents.embedding <=> query_embedding) as similarity
  from rag_documents
  order by rag_documents.embedding <=> query_embedding
  limit match_count;
$$;

alter table rag_documents enable row level security;

create policy "Public read access" on rag_documents
  for select using (true);
create policy "Public insert for ingestion" on rag_documents
  for insert with check (true);
create policy "Public delete for re-ingestion" on rag_documents
  for delete using (true);

-- ---------- workflow ----------
create table if not exists workflow_pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  status text not null check (status in ('received', 'enriching', 'forwarding', 'completed', 'failed')),
  received_at timestamptz not null default now(),
  payload jsonb not null,
  enrichment jsonb,
  forwarding jsonb,
  error jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists workflow_pipeline_runs_status_idx on workflow_pipeline_runs (status);

alter table workflow_pipeline_runs enable row level security;

create policy "Backend insert" on workflow_pipeline_runs for insert with check (true);
create policy "Backend select" on workflow_pipeline_runs for select using (true);
create policy "Backend update" on workflow_pipeline_runs for update using (true);

-- ---------- agent ----------
create table if not exists agent_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists agent_messages (
  id bigint generated always as identity primary key,
  session_id uuid not null references agent_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  tool_calls jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_session_id_created_at_idx
  on agent_messages (session_id, created_at);

create table if not exists agent_products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price_usd numeric(10, 2) not null,
  stock_qty int not null,
  rating numeric(2, 1) not null
);

alter table agent_sessions enable row level security;
alter table agent_messages enable row level security;
alter table agent_products enable row level security;

create policy "public can read sessions" on agent_sessions
  for select using (true);
create policy "public can create sessions" on agent_sessions
  for insert with check (true);
create policy "public can update sessions" on agent_sessions
  for update using (true);

create policy "public can read messages" on agent_messages
  for select using (true);
create policy "public can create messages" on agent_messages
  for insert with check (true);

create policy "public can read products" on agent_products
  for select using (true);

-- ---------- keys ----------
-- user_id references a single fixed demo auth.users row (see README) —
-- there is no visitor-facing signup/login flow in this app.
create table if not exists keys_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists keys_api_keys_user_id_idx on keys_api_keys (user_id);
create index if not exists keys_api_keys_key_hash_active_idx
  on keys_api_keys (key_hash) where revoked_at is null;

alter table keys_api_keys enable row level security;

create policy "users can select own keys" on keys_api_keys
  for select using ((select auth.uid()) = user_id);
create policy "users can insert own keys" on keys_api_keys
  for insert with check ((select auth.uid()) = user_id);
create policy "users can update own keys" on keys_api_keys
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
