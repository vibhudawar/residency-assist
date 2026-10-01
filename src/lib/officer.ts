import "server-only";
import { redirect } from "next/navigation";
import { requireEnv } from "@/lib/env";
import { safeEqual, sha256 } from "@/lib/security";
import { signedCookie } from "@/lib/signed-cookie";

/**
 * Officer session for the operator console. A real deployment would use the authority's
 * staff SSO; the prototype uses one shared passcode (OFFICER_PASSCODE) and a signed cookie.
 */
export interface OfficerSession {
  /** Shown in the audit log as the reviewer. */
  name: string;
  issuedAt: number;
}

const cookie = signedCookie<OfficerSession>("ra_officer", "residency-assist/officer/v1", 60 * 60 * 8);

export const OFFICER_NAME = "Duty officer (demo)";

/** Constant-time passcode check. Both sides are hashed first so their lengths can't leak. */
export function passcodeMatches(input: string): boolean {
  return safeEqual(sha256(input), sha256(requireEnv("OFFICER_PASSCODE")));
}

export const setOfficerSession = cookie.set;
export const getOfficerSession = cookie.get;
export const clearOfficerSession = cookie.clear;

/** For console pages and actions: the officer, or a redirect to sign-in. */
export async function requireOfficer(): Promise<OfficerSession> {
  const officer = await cookie.get();
  if (!officer) redirect("/console/signin");
  return officer;
}
