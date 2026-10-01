-- Which requirements the last upload passed or failed, so the upload page can relight them after a reload.
alter table public.uploads add column check_requirements jsonb;
