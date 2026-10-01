import "server-only";
import { z } from "zod";

const optional = z.string().trim().optional().transform((v) => (v ? v : undefined));

const schema = z.object({
  ELEVENLABS_API_KEY: optional,
  ELEVENLABS_AGENT_ID: optional,
  ELEVENLABS_PHONE_NUMBER_ID: optional,
  ELEVENLABS_WEBHOOK_SECRET: optional,
  TOOL_SHARED_SECRET: optional,
  APP_BASE_URL: z.string().trim().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: optional,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optional,
  SUPABASE_SECRET_KEY: optional,
  TWILIO_ACCOUNT_SID: optional,
  TWILIO_API_KEY_SID: optional,
  TWILIO_API_KEY_SECRET: optional,
  TWILIO_FROM_NUMBER: optional,
  DEMO_PHONE_NUMBER: optional,
});

export type Env = z.infer<typeof schema>;
export type EnvKey = keyof Env;

let cached: Env | undefined;

export function env(): Env {
  cached ??= schema.parse(process.env);
  return cached;
}

/** Returns the value or throws a clear error naming the missing variable (never its value). */
export function requireEnv<K extends EnvKey>(key: K): NonNullable<Env[K]> {
  const value = env()[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing environment variable ${key}. Add it to .env.local.`);
  }
  return value as NonNullable<Env[K]>;
}

/** "set" / "missing" per variable — safe to show, reveals no values. */
export function envStatus(): Record<EnvKey, "set" | "missing"> {
  const e = env();
  return Object.fromEntries(
    (Object.keys(schema.shape) as EnvKey[]).map((k) => [k, e[k] ? "set" : "missing"]),
  ) as Record<EnvKey, "set" | "missing">;
}
