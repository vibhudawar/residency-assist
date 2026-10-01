-- A new photo/scan that passes the automatic check still waits for an officer,
-- exactly like a typed correction: nothing replaces the old file until Approve.
alter table public.uploads
  add column attempts      smallint not null default 0,
  add column review_status text check (review_status in ('pending_review', 'approved', 'rejected')),
  add column reviewed_by   text,
  add column review_note   text,
  add column reviewed_at   timestamptz;

create index uploads_pending_idx on public.uploads (review_status) where review_status = 'pending_review';
