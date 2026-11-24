-- Selar payment hook. The webhook route uses only the public anon key; the shared secret is checked inside the database.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table if not exists app_private.settings (key text primary key, value text not null);
create table if not exists app_private.selar_events (
  id bigint generated always as identity primary key,
  received_at timestamptz not null default now(),
  outcome text, email text, plan text, reference text, payload jsonb
);

create or replace function public.record_selar_payment(
  p_secret text, p_email text, p_plan text, p_status text, p_reference text, p_payload jsonb
) returns text language plpgsql security definer set search_path = public, app_private as $$
declare expected text; uid uuid; org uuid; outcome text;
begin
  select value into expected from app_private.settings where key = 'selar_webhook_secret';
  if expected is null or p_secret is distinct from expected then
    return 'unauthorized';
  end if;
  if p_plan is null or p_plan not in ('starter','professional','enterprise') then
    outcome := 'unknown_plan';
  elsif p_email is null then
    outcome := 'no_email';
  else
    select id into uid from auth.users where lower(email) = lower(p_email);
    if uid is null then
      outcome := 'no_account';
    else
      select m.org_id into org from memberships m where m.user_id = uid and m.role = 'owner' order by m.created_at limit 1;
      if org is null then outcome := 'no_workspace';
      else
        delete from subscriptions where org_id = org;
        insert into subscriptions (org_id, plan, status, provider, provider_reference, current_period_end)
        values (org, p_plan, coalesce(p_status, 'active'), 'selar', p_reference,
                case when coalesce(p_status,'active') = 'active' then now() + interval '31 days' end);
        insert into audit_logs (org_id, user_id, action, entity, entity_id, meta)
        values (org, null, 'subscription.' || coalesce(p_status,'active'), 'subscription', p_reference, jsonb_build_object('plan', p_plan));
        outcome := 'applied';
      end if;
    end if;
  end if;
  insert into app_private.selar_events (outcome, email, plan, reference, payload) values (outcome, p_email, p_plan, p_reference, p_payload);
  return outcome;
end $$;

revoke all on function public.record_selar_payment(text,text,text,text,text,jsonb) from public;
grant execute on function public.record_selar_payment(text,text,text,text,text,jsonb) to anon, authenticated;

-- Set your secret once (choose a long random value), then put the same value in the webhook URL:
--   insert into app_private.settings (key, value) values ('selar_webhook_secret', 'REPLACE_WITH_LONG_RANDOM_STRING')
--   on conflict (key) do update set value = excluded.value;
