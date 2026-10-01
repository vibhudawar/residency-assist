import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** URL-safe random token (e.g. case tokens, upload links). */
export function randomToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

/** Constant-time string comparison (avoids leaking secrets through timing). */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Strip CR/LF before putting untrusted text in logs (prevents forged log lines). */
export function forLog(value: unknown): string {
  return String(value).replace(/[\r\n]/g, "_").slice(0, 200);
}
