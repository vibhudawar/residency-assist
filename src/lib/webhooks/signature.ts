import "server-only";
import { createHmac } from "node:crypto";
import { safeEqual } from "@/lib/security";

/** Same 30-minute window the SDK uses; anything older is treated as a replay. */
const TOLERANCE_SECS = 30 * 60;
/** Small allowance for clock drift on timestamps from the future. */
const FUTURE_SKEW_SECS = 5 * 60;

/**
 * Verifies the `ElevenLabs-Signature` header: `t=<unix secs>,v0=<hex HMAC-SHA256(secret, "<t>.<raw body>")>`.
 * Same scheme as the SDK's constructEvent, but compared in constant time.
 */
export function verifyElevenLabsSignature(rawBody: string, header: string | null, secret: string, nowSecs = Date.now() / 1000): boolean {
  if (!header) return false;
  const parts = header.split(",").map((p) => p.trim());
  const t = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v0 = parts.find((p) => p.startsWith("v0="));
  if (!t || !v0 || !/^\d{1,12}$/.test(t)) return false;

  const ts = Number(t);
  if (ts < nowSecs - TOLERANCE_SECS || ts > nowSecs + FUTURE_SKEW_SECS) return false;

  const expected = `v0=${createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex")}`;
  return safeEqual(v0, expected);
}

/** Builds a header the way ElevenLabs does — for tests and the local smoke run only. */
export function signForTest(rawBody: string, secret: string, nowSecs = Math.floor(Date.now() / 1000)): string {
  return `t=${nowSecs},v0=${createHmac("sha256", secret).update(`${nowSecs}.${rawBody}`).digest("hex")}`;
}
