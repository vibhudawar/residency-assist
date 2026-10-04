import { NextResponse } from "next/server";
import { runDueCalls } from "@/lib/calls/auto";
import { autoCallCronSecret } from "@/lib/calls/cron-secret";
import { forLog, safeEqual } from "@/lib/security";

// Placing a call can take a few seconds per due case.
export const maxDuration = 60;

/** Called every minute by the database job while an automatic call is due. */
export async function POST(request: Request) {
  if (!safeEqual(request.headers.get("x-cron-secret"), autoCallCronSecret())) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await runDueCalls()) });
  } catch (err) {
    console.error("auto-call run failed", forLog(err instanceof Error ? err.message : err));
    return NextResponse.json({ ok: false, error: "Run failed." }, { status: 500 });
  }
}
