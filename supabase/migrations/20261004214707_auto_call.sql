-- Auto-call: the AI calls the applicant by itself after a fixable check, if they opted in.
-- The console switch lives in `settings`; due calls wait in `scheduled_calls`; a database job pings the
-- app's dialler every minute while a call is due. Pre-dial checks still decide every call.

create table public.settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  text,
  updated_at  timestamptz not null default now()
);
insert into public.settings (key, value) values ('auto_call', '{"enabled": false}') on conflict (key) do nothing;

create table public.scheduled_calls (
  id               bigint generated always as identity primary key,
  application_id   bigint not null references public.applications (id) on delete cascade,
  due_at           timestamptz not null,
  status           text not null default 'queued' check (status in ('queued', 'dialling', 'placed', 'cancelled')),
  reason           text not null check (reason in ('submitted', 'retry')),
  outcome          text,               -- what happened when it came due, in plain words
  tries            smallint not null default 0,
  call_attempt_id  bigint references public.call_attempts (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
-- At most one open automatic call per application.
create unique index scheduled_calls_one_open on public.scheduled_calls (application_id) where status in ('queued', 'dialling');
create index scheduled_calls_due_idx on public.scheduled_calls (due_at) where status = 'queued';
create index scheduled_calls_application_idx on public.scheduled_calls (application_id, created_at desc);

-- An officer can stop automatic calls for one application.
alter table public.applications add column auto_call_stopped boolean not null default false;

-- Server-side only, like every other table.
do $$
declare t text;
begin
  foreach t in array array['settings', 'scheduled_calls'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;
grant usage, select on all sequences in schema public to service_role;

-- The every-minute ping. The dialler's address and its secret live in Vault (set by
-- scripts/setup-auto-call-cron.ts), never in this file. It only fires while a call is due.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'auto-call-runner',
  '* * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'auto_call_runner_url'),
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'auto_call_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 25000
  )
  where exists (select 1 from vault.decrypted_secrets where name = 'auto_call_runner_url')
    and exists (select 1 from public.scheduled_calls where status = 'queued' and due_at <= now());
  $job$
);
