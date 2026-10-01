import "server-only";
import { signedCookie } from "@/lib/signed-cookie";

/**
 * Mock UAE PASS session. A real deployment would complete the UAE PASS OAuth flow;
 * here a signed cookie stands in for the identity it returns (a verified mobile number).
 */
export const SESSION_COOKIE = "ra_session";

export interface ApplicantSession {
  /** Mock UAE PASS account id. */
  sub: string;
  displayName: string;
  /** Verified mobile (E.164) — where the AI call goes. */
  mobile: string;
  issuedAt: number;
}

const cookie = signedCookie<ApplicantSession>(SESSION_COOKIE, "residency-assist/session/v1", 60 * 60 * 8);

export const setSession = cookie.set;
export const getSession = cookie.get;
export const clearSession = cookie.clear;

/** "+971 50 123 4567" → "••• ••• 4567" — only the last four digits are shown on screen. */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  return digits.length < 7 ? "••••" : `••• ••• ${digits.slice(-4)}`;
}
