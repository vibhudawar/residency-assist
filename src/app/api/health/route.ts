import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { env, envStatus } from "@/lib/env";
import { db } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DbState = "ok" | "unreachable" | "schema_missing" | "not_configured";

/**
 * Setup check: which env vars are present (never their values), whether the
 * server can reach the database, and whether the public (browser) key is
 * correctly locked out of every table.
 */
export async function GET() {
  const vars = envStatus();
  const e = env();

  let database: DbState = "not_configured";
  if (e.NEXT_PUBLIC_SUPABASE_URL && e.SUPABASE_SECRET_KEY) {
    // Not a HEAD request: HEAD responses carry no body, so a missing table would look like success.
    const { error } = await db().from("applications").select("id").limit(1);
    if (!error) database = "ok";
    else database = error.code === "42P01" || error.code === "PGRST205" ? "schema_missing" : "unreachable";
  }

  let publicKeyLockedOut: boolean | null = null;
  if (e.NEXT_PUBLIC_SUPABASE_URL && e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    const browserLike = createClient(e.NEXT_PUBLIC_SUPABASE_URL, e.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await browserLike.from("applications").select("id").limit(1);
    publicKeyLockedOut = Boolean(error) || (data?.length ?? 0) === 0;
  }

  return NextResponse.json({ vars, database, publicKeyLockedOut });
}
