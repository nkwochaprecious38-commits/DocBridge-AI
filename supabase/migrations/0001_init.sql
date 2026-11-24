-- DocBridge schema. Run in the Supabase SQL editor or via `supabase db push`.
create extension if not exists vector;
create extension if not exists pgcrypto;

-- ---------- Core tenancy ----------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  retention_days int check (retention_days is null or retention_days > 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create type public.member_role as enum ('owner', 'admin', 'member', 'viewer');

create table public.memberships (
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index on public.memberships (user_id);

-- Helper functions (security definer so policies do not recurse)
create or replace function public.is_member(o uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = o and user_id = auth.uid());
$$;

create or replace function public.has_role(o uuid, roles public.member_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where org_id = o and user_id = auth.uid() and role = any(roles));
$$;

-- ---------- Content ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text default '#2463EB',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create type public.doc_status as enum ('uploaded','processing','processed','awaiting_review','approved','failed');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  parent_id uuid references public.documents(id) on delete cascade,
  name text not null,
  file_type text not null,
  mime_type text,
  size_bytes bigint not null default 0,
  storage_path text not null,
  folder text not null default '/',
  tags text[] not null default '{}',
  page_count int not null default 0,
  page_range int4range,
  status public.doc_status not null default 'uploaded',
  category_id uuid references public.categories(id) on delete set null,
  summary jsonb,
  ocr_used boolean not null default false,
  error text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index on public.documents (org_id, created_at desc);
create index on public.documents (org_id, status);

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  page_number int not null,
  text text not null default '',
  confidence numeric,
  fts tsvector generated always as (to_tsvector('english', coalesce(text, ''))) stored,
  unique (document_id, page_number)
);
create index document_pages_fts on public.document_pages using gin (fts);
create index on public.document_pages (org_id);

create table public.extraction_schemas (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  fields jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table public.extraction_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  schema_id uuid references public.extraction_schemas(id) on delete set null,
  schema_name text,
  data jsonb not null default '{}',
  missing_fields text[] not null default '{}',
  status text not null default 'awaiting_review' check (status in ('awaiting_review','approved','rejected')),
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.extraction_records (org_id, document_id);

create table public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create table public.knowledge_base_documents (
  kb_id uuid not null references public.knowledge_bases(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  primary key (kb_id, document_id)
);

-- Embeddings table is provisioned for a vector provider. Retrieval currently uses Postgres full text search.
create table public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  page_number int,
  chunk text not null,
  embedding vector(1536)
);

create table public.ai_queries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  kind text not null default 'chat',
  question text not null,
  answer jsonb,
  created_at timestamptz not null default now()
);

create table public.processing_jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  stage text not null default 'pipeline',
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  attempts int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on public.processing_jobs (org_id, created_at desc);

create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  agent text not null,
  document_id uuid references public.documents(id) on delete set null,
  status text not null default 'succeeded' check (status in ('running','succeeded','failed','awaiting_approval','approved','rejected')),
  input jsonb,
  output jsonb,
  created_at timestamptz not null default now()
);
create index on public.agent_runs (org_id, created_at desc);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null default 'document_uploaded',
  trigger_category text,
  steps jsonb not null default '[]',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  status text not null default 'running' check (status in ('running','succeeded','failed','awaiting_approval','rejected')),
  next_step int not null default 0,
  log jsonb not null default '[]',
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on public.workflow_executions (org_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  detail text,
  status text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  kind text not null default 'manual',
  assignee uuid references auth.users(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  execution_id uuid references public.workflow_executions(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index on public.audit_logs (org_id, created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  plan text not null check (plan in ('starter','professional','enterprise')),
  status text not null default 'active',
  provider text not null default 'selar',
  provider_reference text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Signup bootstrap ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare new_org uuid; org_label text;
begin
  insert into profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  org_label := coalesce(nullif(trim(new.raw_user_meta_data->>'org_name'), ''),
                        coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)) || ' Workspace');
  insert into organizations (name, owner_id) values (org_label, new.id) returning id into new_org;
  insert into memberships (org_id, user_id, role) values (new_org, new.id, 'owner');
  insert into categories (org_id, name, color, is_default)
  select new_org, n, c, true from (values
    ('Contracts','#2463EB'),('Invoices','#16A6A1'),('Receipts','#75D5CF'),('Reports','#142B4A'),
    ('Resumes','#5B8DEF'),('Purchase Orders','#0E7C78'),('Financial Statements','#3B6FD4'),
    ('Legal Documents','#1B3F73'),('Medical Records','#4FBFB9'),('Other','#94A3B8')) as t(n, c);
  insert into extraction_schemas (org_id, name, description, fields) values
   (new_org, 'Invoice', 'Standard invoice fields', '[{"name":"invoice_number","type":"string"},{"name":"vendor","type":"string"},{"name":"invoice_date","type":"date"},{"name":"due_date","type":"date"},{"name":"total_amount","type":"number"},{"name":"tax","type":"number"},{"name":"line_items","type":"array"}]'),
   (new_org, 'Contract', 'Standard contract fields', '[{"name":"contract_title","type":"string"},{"name":"parties","type":"array"},{"name":"effective_date","type":"date"},{"name":"expiration_date","type":"date"},{"name":"renewal_terms","type":"string"},{"name":"payment_terms","type":"string"},{"name":"obligations","type":"array"}]'),
   (new_org, 'Resume', 'Standard resume fields', '[{"name":"candidate_name","type":"string"},{"name":"email","type":"string"},{"name":"phone","type":"string"},{"name":"skills","type":"array"},{"name":"work_experience","type":"array"},{"name":"education","type":"array"},{"name":"certifications","type":"array"}]');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------- RPCs ----------
create or replace function public.search_pages(p_org uuid, p_query text, p_limit int default 12)
returns table (document_id uuid, document_name text, page_number int, excerpt text, rank real, category_id uuid, tags text[], created_at timestamptz)
language sql stable security invoker set search_path = public as $$
  select p.document_id, d.name, p.page_number,
         ts_headline('english', p.text, websearch_to_tsquery('english', p_query), 'MaxFragments=2,MaxWords=35,MinWords=12'),
         ts_rank(p.fts, websearch_to_tsquery('english', p_query)),
         d.category_id, d.tags, d.created_at
  from document_pages p join documents d on d.id = p.document_id
  where p.org_id = p_org and p.fts @@ websearch_to_tsquery('english', p_query)
  order by 5 desc limit p_limit;
$$;

create or replace function public.add_member_by_email(p_org uuid, p_email text, p_role public.member_role)
returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not has_role(p_org, array['owner','admin']::member_role[]) then raise exception 'Not permitted'; end if;
  if p_role = 'owner' then raise exception 'Cannot assign owner role'; end if;
  select id into uid from auth.users where lower(email) = lower(p_email);
  if uid is null then return 'not_found'; end if;
  insert into memberships (org_id, user_id, role) values (p_org, uid, p_role)
  on conflict (org_id, user_id) do update set role = excluded.role where memberships.role <> 'owner';
  return 'ok';
end $$;

create or replace function public.list_members(p_org uuid)
returns table (user_id uuid, email text, full_name text, role public.member_role, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.user_id, u.email::text, p.full_name, m.role, m.created_at
  from memberships m join auth.users u on u.id = m.user_id left join profiles p on p.id = m.user_id
  where m.org_id = p_org and is_member(p_org);
$$;

-- Retention: delete documents older than the organization's retention window. Schedule with pg_cron, for example:
--   select cron.schedule('docbridge_retention', '0 3 * * *', 'select public.purge_expired_documents()');
-- Storage objects are removed by the application when documents are deleted. For scheduled purges, also run a
-- storage cleanup job (see README).
create or replace function public.purge_expired_documents() returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  with del as (
    delete from documents d using organizations o
    where d.org_id = o.id and o.retention_days is not null
      and d.created_at < now() - make_interval(days => o.retention_days)
    returning d.id
  ) select count(*) into n from del;
  return n;
end $$;
revoke all on function public.purge_expired_documents() from public, anon, authenticated;

-- ---------- Row level security ----------
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table categories enable row level security;
alter table documents enable row level security;
alter table document_pages enable row level security;
alter table extraction_schemas enable row level security;
alter table extraction_records enable row level security;
alter table knowledge_bases enable row level security;
alter table knowledge_base_documents enable row level security;
alter table document_embeddings enable row level security;
alter table ai_queries enable row level security;
alter table processing_jobs enable row level security;
alter table agent_runs enable row level security;
alter table workflows enable row level security;
alter table workflow_executions enable row level security;
alter table tasks enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;
alter table subscriptions enable row level security;

create policy org_read on organizations for select using (is_member(id));
create policy org_update on organizations for update using (has_role(id, array['owner','admin']::member_role[]));

create policy profile_self on profiles for select using (id = auth.uid());
create policy profile_update on profiles for update using (id = auth.uid());

create policy mem_read on memberships for select using (is_member(org_id));
create policy mem_update on memberships for update using (has_role(org_id, array['owner','admin']::member_role[]) and role <> 'owner');
create policy mem_delete on memberships for delete using (
  (has_role(org_id, array['owner','admin']::member_role[]) and role <> 'owner') or (user_id = auth.uid() and role <> 'owner'));

-- Generic tenant policies: members read, non owner viewers cannot write.
do $$
declare t text;
begin
  foreach t in array array['categories','documents','document_pages','extraction_schemas','extraction_records',
    'knowledge_bases','knowledge_base_documents','document_embeddings','processing_jobs','agent_runs',
    'workflows','workflow_executions','tasks'] loop
    execute format('create policy %I on %I for select using (is_member(org_id))', t || '_r', t);
    execute format('create policy %I on %I for insert with check (has_role(org_id, array[''owner'',''admin'',''member'']::member_role[]))', t || '_i', t);
    execute format('create policy %I on %I for update using (has_role(org_id, array[''owner'',''admin'',''member'']::member_role[]))', t || '_u', t);
    execute format('create policy %I on %I for delete using (has_role(org_id, array[''owner'',''admin'',''member'']::member_role[]))', t || '_d', t);
  end loop;
end $$;

create policy ai_r on ai_queries for select using (is_member(org_id) and (user_id = auth.uid() or has_role(org_id, array['owner','admin']::member_role[])));
create policy ai_i on ai_queries for insert with check (is_member(org_id) and user_id = auth.uid());

create policy notif_r on notifications for select using (is_member(org_id) and (user_id = auth.uid() or user_id is null));
create policy notif_i on notifications for insert with check (is_member(org_id));
create policy notif_u on notifications for update using (user_id = auth.uid());

create policy audit_r on audit_logs for select using (has_role(org_id, array['owner','admin']::member_role[]));
create policy audit_i on audit_logs for insert with check (is_member(org_id) and user_id = auth.uid());

create policy sub_r on subscriptions for select using (is_member(org_id));
-- Subscription rows are written by a trusted backend (service role) after payment confirmation.

-- ---------- Storage ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 26214400) on conflict (id) do nothing;

create policy "docs_read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and is_member(((storage.foldername(name))[1])::uuid));
create policy "docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and has_role(((storage.foldername(name))[1])::uuid, array['owner','admin','member']::member_role[]));
create policy "docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and has_role(((storage.foldername(name))[1])::uuid, array['owner','admin','member']::member_role[]));
