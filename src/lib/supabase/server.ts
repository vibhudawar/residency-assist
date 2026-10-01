import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

/**
 * Server-side Supabase client using the secret key (service_role).
 * Never import this from a Client Component — the key must not reach the browser.
 */
export function db(): SupabaseClient {
  client ??= createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
