-- Residency Assist — initial schema (mock GDRFA/ICP systems for a prototype).
-- All data is fictional. Access model: only server-side code (service_role,
-- via the secret key) touches these tables. anon/authenticated get nothing.

-- ---------------------------------------------------------------------------
-- Mock "external" government records (what the rules engine checks against)
-- ---------------------------------------------------------------------------

-- Mock ICP passport registry: the source of truth for name / DOB / number.
create table public.passport_records (
  passport_number text primary key,
  full_name       text not null,
  date_of_birth   date not null,
  expiry_date     date not null,
  nationality     text not null
);

-- Mock ICP / GDRFA status flags for a person (biometrics, medical, prior visa…).
create table public.person_status (
  passport_number          text primary key references public.passport_records (passport_number),
  biometrics_done          boolean not null default false,
  medical_test_done        boolean not null default false,
  medical_flag             boolean not null default false,  -- R12 (type C)
  security_flag            boolean not null default false,  -- R12 (type C)
  prior_visa_active        boolean not null default false,  -- R9
  unpaid_fines_aed         numeric(10, 2) not null default 0, -- R10
  contract_profession_code text                               -- R11
);

-- ---------------------------------------------------------------------------
-- Applications (the "cases")
-- ---------------------------------------------------------------------------

create table public.applications (
  id                     bigint generated always as identity primary key,
  reference              text not null unique,               -- e.g. RA-2026-000101 (spoken to the caller)
  -- What the applicant typed on the form
  full_name              text not null,
  date_of_birth          date not null,
  passport_number        text not null,
  passport_expiry        date not null,
  profession_code        text,
  phone                  text not null,                      -- E.164
  preferred_language     text not null default 'en' check (preferred_language in ('en', 'ar', 'hi')),
  photo_path             text,
  scan_path              text,
  -- Consent to be called by the AI assistant (captured at submission, never pre-ticked)
  ai_call_consent        boolean not null default false,
  ai_call_consent_at     timestamptz,
  status                 text not null default 'submitted' check (status in (
                           'submitted',           -- just in, rules not run yet
                           'returned_fixable',    -- type A/B issues, AI call allowed if consented
                           'returned_officer',    -- type C issue: officer only, never an AI call
                           'pending_review',      -- correction(s) waiting for an officer
                           'in_processing',       -- all clear / approved, back in the normal flow
                           'needs_human'          -- escalated / officer rejected a correction
                         )),
  is_demo_seed           boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index applications_status_idx on public.applications (status);
create index applications_phone_idx on public.applications (phone);

-- One row per rule per run. Latest run per application is what the agent sees.
create table public.rule_results (
  id              bigint generated always as identity primary key,
  application_id  bigint not null references public.applications (id) on delete cascade,
  rule_code       text not null check (rule_code ~ '^R([1-9]|1[0-2])$'),
  rule_type       text not null check (rule_type in ('A', 'B', 'C')),
  passed          boolean not null,
  field           text,             -- form field this rule is about (for the correction allowlist)
  detail          text,             -- plain-language explanation shown to agent / officer
  run_id          uuid not null,
  created_at      timestamptz not null default now()
);
create index rule_results_application_idx on public.rule_results (application_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Calls
-- ---------------------------------------------------------------------------

create table public.call_attempts (
  id                  bigint generated always as identity primary key,
  application_id      bigint not null references public.applications (id) on delete cascade,
  channel             text not null check (channel in ('phone', 'browser')),
  status              text not null check (status in (
                        'blocked',      -- pre-dial check refused the call
                        'queued',       -- waiting for the calling window
                        'dialing',
                        'no_answer',
                        'declined',     -- declined / busy
                        'silent',       -- picked up, nobody spoke
                        'voicemail',
                        'connected',
                        'completed',
                        'failed'
                      )),
  block_reason        text,            -- why the pre-dial check refused (no consent, DNC, hours, type C…)
  conversation_id     text unique,     -- ElevenLabs conversation id
  twilio_call_sid     text,
  started_at          timestamptz not null default now(),
  ended_at            timestamptz
);
create index call_attempts_application_idx on public.call_attempts (application_id, started_at desc);

-- Identity checks done during a call (ref + DOB only — never secrets).
create table public.verifications (
  id               bigint generated always as identity primary key,
  application_id   bigint not null references public.applications (id) on delete cascade,
  conversation_id  text not null,
  attempts         smallint not null default 0,
  verified         boolean not null default false,
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (conversation_id)
);
create index verifications_application_idx on public.verifications (application_id);

-- Corrections captured by the agent. Only ever created as pending_review;
-- only an officer (console) can approve or reject.
create table public.corrections (
  id               bigint generated always as identity primary key,
  application_id   bigint not null references public.applications (id) on delete cascade,
  conversation_id  text not null,
  rule_code        text not null,
  field            text not null,
  old_value        text,
  new_value        text not null,
  status           text not null default 'pending_review' check (status in ('pending_review', 'approved', 'rejected')),
  reviewed_by      text,
  review_note      text,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  unique (conversation_id, field)   -- same correction sent twice in one call is stored once
);
create index corrections_application_idx on public.corrections (application_id);
create index corrections_pending_idx on public.corrections (status) where status = 'pending_review';

-- Secure upload links (photo / scan re-upload). No personal data in the token.
create table public.uploads (
  id               bigint generated always as identity primary key,
  token            text not null unique,
  application_id   bigint not null references public.applications (id) on delete cascade,
  kind             text not null check (kind in ('photo', 'scan')),
  file_path        text,
  check_passed     boolean,
  check_detail     text,
  expires_at       timestamptz not null,
  uploaded_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index uploads_application_idx on public.uploads (application_id);

-- Amer appointment slots.
create table public.appointment_slots (
  id               bigint generated always as identity primary key,
  centre           text not null,
  purpose          text not null check (purpose in ('biometrics', 'medical')),
  starts_at        timestamptz not null,
  application_id   bigint references public.applications (id) on delete set null,
  booked_at        timestamptz
);
create index appointment_slots_open_idx on public.appointment_slots (purpose, starts_at) where application_id is null;
create index appointment_slots_application_idx on public.appointment_slots (application_id);

-- Everything handed to a human: callbacks, escalations, follow-ups (route to sponsor etc.).
create table public.handoffs (
  id               bigint generated always as identity primary key,
  application_id   bigint not null references public.applications (id) on delete cascade,
  conversation_id  text,
  kind             text not null check (kind in ('callback', 'escalation', 'followup')),
  reason           text not null,
  preferred_time   text,
  status           text not null default 'open' check (status in ('open', 'done')),
  created_at       timestamptz not null default now()
);
create index handoffs_application_idx on public.handoffs (application_id);
create index handoffs_open_idx on public.handoffs (status) where status = 'open';

-- Do-not-call list (opt-outs).
create table public.opt_outs (
  phone        text primary key,
  source       text not null check (source in ('call', 'portal', 'officer')),
  created_at   timestamptz not null default now()
);

-- Simulated SMS (shown in the console's "SMS outbox" instead of real texts).
create table public.sms_outbox (
  id               bigint generated always as identity primary key,
  application_id   bigint references public.applications (id) on delete cascade,
  to_phone         text not null,
  body             text not null,
  created_at       timestamptz not null default now()
);
create index sms_outbox_application_idx on public.sms_outbox (application_id);

-- Post-call webhook payloads (transcript, analysis, latency).
create table public.call_records (
  conversation_id     text primary key,
  application_id      bigint references public.applications (id) on delete set null,
  status              text,
  call_successful     text,
  language            text,
  duration_secs       integer,
  avg_latency_ms      integer,
  max_latency_ms      integer,
  transcript          jsonb,
  analysis            jsonb,
  received_at         timestamptz not null default now(),
  raw                 jsonb not null
);
create index call_records_application_idx on public.call_records (application_id);

-- Every action the backend refused (the "Blocked actions" log judges see).
create table public.blocked_actions (
  id               bigint generated always as identity primary key,
  application_id   bigint references public.applications (id) on delete cascade,
  conversation_id  text,
  tool             text not null,
  reason           text not null,
  payload          jsonb,
  created_at       timestamptz not null default now()
);
create index blocked_actions_application_idx on public.blocked_actions (application_id);

-- General audit trail.
create table public.audit_log (
  id               bigint generated always as identity primary key,
  application_id   bigint references public.applications (id) on delete cascade,
  actor            text not null,       -- 'portal' | 'rules' | 'agent' | 'officer' | 'system'
  event            text not null,
  detail           jsonb,
  created_at       timestamptz not null default now()
);
create index audit_log_application_idx on public.audit_log (application_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Access: server-side only
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'passport_records', 'person_status', 'applications', 'rule_results',
    'call_attempts', 'verifications', 'corrections', 'uploads',
    'appointment_slots', 'handoffs', 'opt_outs', 'sms_outbox',
    'call_records', 'blocked_actions', 'audit_log'
  ] loop
    -- RLS on with no policies: anon/authenticated can never read or write.
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

grant usage, select on all sequences in schema public to service_role;
