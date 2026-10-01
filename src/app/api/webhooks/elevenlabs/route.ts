import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "@/lib/env";
import { forLog } from "@/lib/security";
import { handlePostCallEvent } from "@/lib/webhooks/post-call";
import { verifyElevenLabsSignature } from "@/lib/webhooks/signature";

/** A long call's transcript is well under this; anything bigger is not a post-call payload. */
const MAX_BODY_BYTES = 5 * 1024 * 1024;

/**
 * ElevenLabs post-call webhook: POST /api/webhooks/elevenlabs.
 * Order: size → HMAC signature (ELEVENLABS_WEBHOOK_SECRET) → parse → store.
 * Nothing in the body is trusted until the signature checks out.
 */
export async function POST(req: Request) {
  const secret = env().ELEVENLABS_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "Webhook not configured." }, { status: 503 });

  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large." }, { status: 413 });
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ ok: false, error: "Payload too large." }, { status: 413 });

  if (!verifyElevenLabsSignature(raw, req.headers.get("elevenlabs-signature"), secret)) {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Body is not JSON." }, { status: 400 });
  }

  try {
    const result = await handlePostCallEvent(event);
    return NextResponse.json({ ok: true, handled: result.handled, matched: result.matched ?? null });
  } catch (err) {
    // A signed payload we can't read won't improve on retry: 400, not 500.
    if (err instanceof ZodError) return NextResponse.json({ ok: false, error: "Unexpected payload shape." }, { status: 400 });
    // Logged server-side only; a 500 lets ElevenLabs retry the delivery.
    console.error("post-call webhook failed", forLog(err instanceof Error ? err.message : err));
    return NextResponse.json({ ok: false, error: "Could not process the event." }, { status: 500 });
  }
}
