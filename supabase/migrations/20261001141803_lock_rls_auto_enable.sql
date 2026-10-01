-- Supabase's project-level "auto-enable RLS" event trigger function lives in public
-- and is SECURITY DEFINER, so it is exposed as /rest/v1/rpc/rls_auto_enable.
-- Event triggers don't need EXECUTE grants, so remove them from API roles.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
