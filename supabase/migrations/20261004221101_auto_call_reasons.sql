-- Auto-call: a resumed call isn't a retry, and why a call stopped is kept as a short code (the status
-- page uses it to tell the applicant the truth without parsing sentences).
alter table public.scheduled_calls drop constraint scheduled_calls_reason_check;
alter table public.scheduled_calls add constraint scheduled_calls_reason_check check (reason in ('submitted', 'retry', 'resumed'));

alter table public.scheduled_calls
  add column stop_reason text check (stop_reason in ('switched_off', 'officer', 'refused', 'not_configured', 'failed'));
