-- The applicant's status page is reached by an unguessable link (not the reference number,
-- which is short and spoken aloud). Only the SHA-256 hash of the link token is stored.
alter table public.applications add column status_token_hash text unique;
