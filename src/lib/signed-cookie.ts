import "server-only";
import { createHmac, hkdfSync } from "node:crypto";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";
import { safeEqual } from "@/lib/security";

/**
 * An HMAC-signed JSON cookie. Each use gets its own key derived from the tool secret
 * (different HKDF `info`), so an applicant cookie can never be replayed as an officer cookie
 * and the tool secret itself is never used to sign anything.
 */
export function signedCookie<T extends { issuedAt: number }>(name: string, info: string, maxAgeSecs: number) {
  const key = () => Buffer.from(hkdfSync("sha256", requireEnv("TOOL_SHARED_SECRET"), "", info, 32));
  const sign = (payload: string) => createHmac("sha256", key()).update(payload).digest("base64url");

  return {
    async set(value: T) {
      const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
      (await cookies()).set(name, `${payload}.${sign(payload)}`, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: maxAgeSecs,
      });
    },
    async get(): Promise<T | null> {
      const raw = (await cookies()).get(name)?.value;
      if (!raw) return null;
      const [payload, signature] = raw.split(".");
      if (!payload || !safeEqual(signature, sign(payload))) return null;
      try {
        const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as T;
        return Date.now() - value.issuedAt > maxAgeSecs * 1000 ? null : value;
      } catch {
        return null;
      }
    },
    async clear() {
      (await cookies()).delete(name);
    },
  };
}
