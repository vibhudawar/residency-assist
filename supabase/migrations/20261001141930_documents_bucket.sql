-- Private bucket for application photos and scans. Only server code (service_role)
-- reads/writes it; no storage policies are created, so anon/authenticated get nothing.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
