import { NextResponse } from "next/server";
import { forLog } from "@/lib/security";
import { logBlocked, resolveToolContext, ToolAuthError } from "@/lib/tools/context";
import { tools, type ToolName } from "@/lib/tools/definitions";

/**
 * Webhook endpoint for every agent tool: POST /api/tools/<name>.
 * Order of checks: tool secret → case token → verification gate → argument validation → run.
 * Failures the agent should talk about come back as 200 + { ok:false, reason } so it can
 * follow its fallback script; auth failures are real 401/403s.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/tools/[tool]">) {
  const { tool: name } = await ctx.params;
  const def = tools[name as ToolName];
  if (!def) return NextResponse.json({ ok: false, reason: "unknown_tool" }, { status: 404 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }
  const conversationId = typeof body.conversation_id === "string" && body.conversation_id ? body.conversation_id : null;

  try {
    const toolCtx = await resolveToolContext(req, conversationId);

    if (def.requiresVerification && !toolCtx.verified) {
      await logBlocked(toolCtx, name, "identity not verified on this call", body);
      return NextResponse.json({ ok: false, reason: "not_verified", next_step: "verify_identity first" });
    }

    const parsed = def.args.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, reason: "invalid_arguments", issues: parsed.error.issues.map((i) => i.message) });
    }

    // Each definition's run() matches its own args schema; the map loses that pairing.
    const run = def.run as (c: typeof toolCtx, a: unknown) => Promise<Record<string, unknown>>;
    return NextResponse.json(await run(toolCtx, parsed.data));
  } catch (err) {
    if (err instanceof ToolAuthError) {
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: err.status });
    }
    // Dependency failure: save nothing more, tell the agent to fall back to a callback.
    console.error("tool failed", forLog(name), err instanceof Error ? forLog(err.message) : "unknown error");
    return NextResponse.json({ ok: false, reason: "temporarily_unavailable", next_step: "apologise, say you can't finish now, offer a callback" });
  }
}
