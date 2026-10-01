import { NextResponse } from "next/server";
import { resetDemo } from "@/lib/demo/reset";
import { getOfficerSession } from "@/lib/officer";

/** Resets the demo to its starting state (8 fictional people, 7 seeded applications). Officers only. */
export async function POST() {
  if (!(await getOfficerSession())) {
    return NextResponse.json({ ok: false, error: "Officer sign-in required." }, { status: 401 });
  }
  try {
    const seeded = await resetDemo();
    return NextResponse.json({ ok: true, seeded });
  } catch (err) {
    console.error("demo reset failed", err);
    return NextResponse.json({ ok: false, error: "Reset failed — see server logs." }, { status: 500 });
  }
}
