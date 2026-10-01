import "server-only";
import { createHmac, hkdfSync } from "node:crypto";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";
import { safeEqual } from "@/lib/security";

/**
 * Mock UAE PASS session. A real deployment would complete the UAE PASS OAuth flow;
 * here a signed cookie stands in for the identity it returns (a verified mobile number).
 */
export const SESSION_COOKIE = "ra_session";
const MAX_AGE_SECS = 60 * 60 * 8;

export interface ApplicantSession {
  /** Mock UAE PASS account id. */
  sub: string;
  displayName: string;
  /** Verified mobile (E.164) — where the AI call goes. */
  mobile: string;
  issuedAt: number;
}

function key(): Buffer {
  // Derive a dedicated signing key so the tool secret itself is never used for cookies.
  return Buffer.from(hkdfSync("sha256", requireEnv("TOOL_SHARED_SECRET"), "", "residency-assist/session/v1", 32));
}

function sign(payload: string): string {
  return createHmac("sha256", key()).update(payload).digest("base64url");
}

export async function setSession(session: ApplicantSession) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  (await cookies()).set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECS,
  });
}

export async function getSession(): Promise<ApplicantSession | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  const [payload, signature] = raw.split(".");
  if (!payload || !safeEqual(signature, sign(payload))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as ApplicantSession;
    if (Date.now() - session.issuedAt > MAX_AGE_SECS * 1000) return null;
    return session;
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** "+971 50 123 4567" → "••• ••• 4567" — only the last four digits are shown on screen. */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.length < 7 ? "••••" : `••• ••• ${digits.slice(-4)}`;
}
