import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/demo/reset";

/** Resets the demo to its starting state (8 fictional people, 7 seeded applications). */
export async function POST() {
  try {
    const seeded = await resetDemo();
    return NextResponse.json({ ok: true, seeded });
  } catch (err) {
    console.error("demo reset failed", err);
    return NextResponse.json({ ok: false, error: "Reset failed — see server logs." }, { status: 500 });
  }
}
