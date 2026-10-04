/**
 * Points the database's every-minute auto-call job at the deployed dialler, storing its address and
 * secret in Supabase Vault (safe to re-run; updates in place). Never prints the secret.
 *   APP_BASE_URL=https://residency-assist.vercel.app tsx --conditions=react-server --env-file=.env scripts/setup-auto-call-cron.ts
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { autoCallCronSecret } from "@/lib/calls/cron-secret";

const base = process.env.APP_BASE_URL ?? "";
const url = new URL("/api/calls/run", base);
if (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("APP_BASE_URL must be the public https address of the app.");
const secret = autoCallCronSecret();
if (!/^[0-9a-f]{64}$/.test(secret)) throw new Error("unexpected secret format");

const upsert = (name: string, value: string, description: string) => `
  if exists (select 1 from vault.secrets where name = '${name}') then
    perform vault.update_secret((select id from vault.secrets where name = '${name}'), '${value}');
  else
    perform vault.create_secret('${value}', '${name}', '${description}');
  end if;`;

const sql = `do $$ begin${upsert("auto_call_runner_url", url.href, "Auto-call dialler endpoint")}${upsert("auto_call_cron_secret", secret, "Auto-call dialler secret")}
end $$;`;

const dir = mkdtempSync(path.join(tmpdir(), "auto-call-"));
const file = path.join(dir, "vault.sql");
try {
  writeFileSync(file, sql, { mode: 0o600 });
  execFileSync("supabase", ["db", "query", "--linked", "--file", file], { stdio: ["ignore", "ignore", "inherit"] });
  console.log(`Auto-call job now calls ${url.href} (secret stored in Vault).`);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
