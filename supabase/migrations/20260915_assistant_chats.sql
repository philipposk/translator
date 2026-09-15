-- Page-assistant chat history saved to the user's account ("account" mode), synced across devices.
-- Run against the shared 6x7 Supabase project (the one in NEXT_PUBLIC_SUPABASE_URL). Idempotent — safe to re-run.
--
-- Adapted from the SDK's reference migration (packages/widget/supabase/assistant_chats.sql). Everything is
-- prefixed translator_ because the project is shared with other apps. Unlike the app's other tables (schema
-- `translator`, reached only with the service role), this table is read and written by the browser as the
-- signed-in user, so it lives in `public`, which Supabase already exposes to `authenticated`; the widget's
-- client targets it with .schema("public"). Putting it in `translator` would need USAGE on that schema for
-- `authenticated`, which would also reach any translator table that has grants but no RLS.
--
-- Access: row-level security, every policy "the row is mine" (auth.uid() = user_id). anon gets nothing.
--
-- Retention: chats with no activity for 12 months (updated_at) are deleted by
-- public.translator_assistant_chats_delete_inactive(), scheduled below with pg_cron when it is enabled.

create table if not exists public.translator_assistant_chats (
  id          text        not null check (char_length(id) between 1 and 128),
  user_id     uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  -- The adapter's `app` option; always 'translator'. The adapter scopes every query by it.
  app         text        not null default 'translator' check (char_length(app) <= 128),
  title       text        not null default 'New chat' check (char_length(title) <= 500),
  messages    jsonb       not null default '[]'::jsonb
                          check (jsonb_typeof(messages) = 'array')
                          -- Generous cap so one user cannot fill the database; the widget keeps at most
                          -- 100 messages per chat.
                          check (octet_length(messages::text) <= 5000000),
  pinned      boolean     not null default false,
  archived    boolean     not null default false,
  group_id    text,
  model       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- The adapter upserts on exactly (user_id, app, id): a chat id is unique only within one user's chats in
  -- one app.
  primary key (user_id, app, id)
);

-- The list: one user's chats in this app, newest first.
create index if not exists translator_assistant_chats_user_app_updated_idx
  on public.translator_assistant_chats (user_id, app, updated_at desc);
-- The retention sweep.
create index if not exists translator_assistant_chats_updated_idx
  on public.translator_assistant_chats (updated_at);

-- The client sends its own timestamps (a chat moved from a device keeps its real age), but never one in the
-- future: that would dodge the retention rule.
create or replace function public.translator_assistant_chats_clamp_times()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := least(coalesce(new.updated_at, now()), now());
  new.created_at := least(coalesce(new.created_at, now()), new.updated_at);
  return new;
end;
$$;

drop trigger if exists translator_assistant_chats_clamp_times on public.translator_assistant_chats;
create trigger translator_assistant_chats_clamp_times
  before insert or update on public.translator_assistant_chats
  for each row execute function public.translator_assistant_chats_clamp_times();

alter table public.translator_assistant_chats enable row level security;

drop policy if exists translator_assistant_chats_select_own on public.translator_assistant_chats;
create policy translator_assistant_chats_select_own on public.translator_assistant_chats
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists translator_assistant_chats_insert_own on public.translator_assistant_chats;
create policy translator_assistant_chats_insert_own on public.translator_assistant_chats
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists translator_assistant_chats_update_own on public.translator_assistant_chats;
create policy translator_assistant_chats_update_own on public.translator_assistant_chats
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists translator_assistant_chats_delete_own on public.translator_assistant_chats;
create policy translator_assistant_chats_delete_own on public.translator_assistant_chats
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.translator_assistant_chats from anon;
grant select, insert, update, delete on table public.translator_assistant_chats to authenticated;

-- Retention: delete chats with no activity for 12 months. Returns how many went. The interval is fixed (no
-- parameter), so nobody can call it to wipe everything.
create or replace function public.translator_assistant_chats_delete_inactive()
returns integer
language plpgsql
set search_path = ''
as $$
declare
  deleted integer;
begin
  delete from public.translator_assistant_chats
  where updated_at < now() - interval '12 months';
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

-- Only the database owner and the service role may run it; never a signed-in user.
revoke execute on function public.translator_assistant_chats_delete_inactive() from public, anon, authenticated;
grant execute on function public.translator_assistant_chats_delete_inactive() to service_role;

-- Daily at 03:17 UTC with pg_cron, when pg_cron is enabled (Database -> Extensions -> pg_cron). Re-running this
-- updates the same job rather than adding a second one.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'translator_assistant_chats_retention',
      '17 3 * * *',
      'select public.translator_assistant_chats_delete_inactive()'
    );
  else
    raise notice 'pg_cron is not enabled: enable it, then run cron.schedule(''translator_assistant_chats_retention'', ''17 3 * * *'', ''select public.translator_assistant_chats_delete_inactive()'')';
  end if;
end;
$$;

-- Check the job with:
--   select jobname, schedule, command from cron.job where jobname = 'translator_assistant_chats_retention';
--
-- The adapter also deletes the signed-in user's own inactive chats each time they open the assistant, but a
-- user who never comes back is only covered by the scheduled job.
