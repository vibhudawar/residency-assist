-- Each call gets a one-time case token, passed to ElevenLabs as a secret__ dynamic
-- variable (sent only in tool request headers, never to the LLM). Tools resolve the
-- token → call attempt → application, so the model can't choose which case it touches.
-- Only the SHA-256 hash is stored.
alter table public.call_attempts add column case_token_hash text unique;

-- Verification belongs to a call attempt (the conversation id is only known once the call starts).
alter table public.verifications alter column conversation_id drop not null;
alter table public.verifications drop constraint verifications_conversation_id_key;
alter table public.verifications add column call_attempt_id bigint not null references public.call_attempts (id) on delete cascade;
alter table public.verifications add constraint verifications_call_attempt_id_key unique (call_attempt_id);

-- Corrections are idempotent per call attempt + field (conversation id may be unknown at first).
alter table public.corrections alter column conversation_id drop not null;
alter table public.corrections drop constraint corrections_conversation_id_field_key;
alter table public.corrections add column call_attempt_id bigint references public.call_attempts (id) on delete set null;
alter table public.corrections add constraint corrections_call_attempt_field_key unique (call_attempt_id, field);
create index corrections_call_attempt_idx on public.corrections (call_attempt_id);

-- Upload links: store only the token hash.
alter table public.uploads rename column token to token_hash;
