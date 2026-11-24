-- Creates a workspace for the signed in user if the signup trigger did not (for example accounts created
-- before the trigger existed). Safe to call repeatedly.
create or replace function public.ensure_workspace() returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u record; new_org uuid; existing uuid; label text;
begin
  if uid is null then raise exception 'Not signed in'; end if;
  select org_id into existing from memberships where user_id = uid order by created_at limit 1;
  if existing is not null then return existing; end if;
  select id, email, raw_user_meta_data as meta from auth.users where id = uid into u;
  insert into profiles (id, full_name) values (uid, u.meta->>'full_name') on conflict (id) do nothing;
  label := coalesce(nullif(trim(u.meta->>'org_name'), ''), coalesce(nullif(u.meta->>'full_name',''), split_part(u.email,'@',1)) || ' Workspace');
  insert into organizations (name, owner_id) values (label, uid) returning id into new_org;
  insert into memberships (org_id, user_id, role) values (new_org, uid, 'owner');
  insert into categories (org_id, name, color, is_default)
  select new_org, n, c, true from (values
    ('Contracts','#2463EB'),('Invoices','#16A6A1'),('Receipts','#75D5CF'),('Reports','#142B4A'),
    ('Resumes','#5B8DEF'),('Purchase Orders','#0E7C78'),('Financial Statements','#3B6FD4'),
    ('Legal Documents','#1B3F73'),('Medical Records','#4FBFB9'),('Other','#94A3B8')) as t(n, c)
  on conflict do nothing;
  insert into extraction_schemas (org_id, name, description, fields) values
   (new_org,'Invoice','Standard invoice fields','[{"name":"invoice_number","type":"string"},{"name":"vendor","type":"string"},{"name":"invoice_date","type":"date"},{"name":"due_date","type":"date"},{"name":"total_amount","type":"number"},{"name":"tax","type":"number"},{"name":"line_items","type":"array"}]'),
   (new_org,'Contract','Standard contract fields','[{"name":"contract_title","type":"string"},{"name":"parties","type":"array"},{"name":"effective_date","type":"date"},{"name":"expiration_date","type":"date"},{"name":"renewal_terms","type":"string"},{"name":"payment_terms","type":"string"},{"name":"obligations","type":"array"}]'),
   (new_org,'Resume','Standard resume fields','[{"name":"candidate_name","type":"string"},{"name":"email","type":"string"},{"name":"phone","type":"string"},{"name":"skills","type":"array"},{"name":"work_experience","type":"array"},{"name":"education","type":"array"},{"name":"certifications","type":"array"}]');
  return new_org;
end $$;
revoke all on function public.ensure_workspace() from public, anon;
grant execute on function public.ensure_workspace() to authenticated;
