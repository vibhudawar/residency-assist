import "server-only";
import { hkdfSync } from "node:crypto";
import { requireEnv } from "@/lib/env";

/**
 * The secret the database's every-minute job sends to the dialler endpoint. Derived from the tool
 * secret, so there is nothing new to configure; scripts/setup-auto-call-cron.ts stores the same value
 * in Supabase Vault. It never appears in code, logs or migrations.
 */
export function autoCallCronSecret(toolSecret = requireEnv("TOOL_SHARED_SECRET")): string {
  return Buffer.from(hkdfSync("sha256", toolSecret, "", "residency-assist/auto-call-cron/v1", 32)).toString("hex");
}
