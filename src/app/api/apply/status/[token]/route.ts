import { NextResponse } from "next/server";
import { getApplicantStatus } from "@/lib/applications/status";

/** Polled by the status page for live updates. The token is the private link, never the reference. */
export async function GET(_req: Request, ctx: RouteContext<"/api/apply/status/[token]">) {
  const { token } = await ctx.params;
  const view = await getApplicantStatus(token);
  if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(view, { headers: { "cache-control": "no-store" } });
}
