import { NextResponse } from "next/server";
import { envStatus } from "@/lib/env";
import { db } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Setup check: which env vars are present (never their values) + can we reach the database. */
export async function GET() {
  const vars = envStatus();

  let database: "ok" | "unreachable" | "schema_missing" | "not_configured" = "not_configured";
  if (vars.NEXT_PUBLIC_SUPABASE_URL === "set" && vars.SUPABASE_SECRET_KEY === "set") {
    // Not a HEAD request: HEAD responses carry no body, so a missing table would look like success.
    const { error } = await db().from("applications").select("id").limit(1);
    if (!error) database = "ok";
    else database = error.code === "42P01" || error.code === "PGRST205" ? "schema_missing" : "unreachable";
  }

  return NextResponse.json({ vars, database });
}
