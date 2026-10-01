import "server-only";
import type { ApplicationRow } from "@/lib/applications/evaluate";
import { requireEnv } from "@/lib/env";
import { safeEqual, sha256 } from "@/lib/security";
import { db } from "@/lib/supabase/server";

export const TOOL_SECRET_HEADER = "x-tool-secret";
export const CASE_TOKEN_HEADER = "x-case-token";

export interface CallAttemptRow {
  id: number;
  application_id: number;
  channel: "phone" | "browser";
  status: string;
  conversation_id: string | null;
}

export interface ToolContext {
  attempt: CallAttemptRow;
  application: ApplicationRow;
  conversationId: string | null;
  verified: boolean;
}

export class ToolAuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

/**
 * Authenticates a tool call and resolves which case it belongs to.
 * The case comes ONLY from the secret case token header — never from model-filled arguments.
 */
export async function resolveToolContext(req: Request, conversationId: string | null): Promise<ToolContext> {
  if (!safeEqual(req.headers.get(TOOL_SECRET_HEADER), requireEnv("TOOL_SHARED_SECRET"))) {
    throw new ToolAuthError(401, "bad tool secret");
  }
  const token = req.headers.get(CASE_TOKEN_HEADER);
  if (!token) throw new ToolAuthError(403, "missing case token");

  const { data: attempt } = await db()
    .from("call_attempts")
    .select("id, application_id, channel, status, conversation_id")
    .eq("case_token_hash", sha256(token))
    .maybeSingle();
  if (!attempt) throw new ToolAuthError(403, "unknown case token");
  if (["blocked", "completed", "failed"].includes(attempt.status)) {
    throw new ToolAuthError(403, `call attempt is ${attempt.status}`);
  }

  // First tool call of a conversation: remember the ElevenLabs conversation id + mark connected.
  if (conversationId && !attempt.conversation_id) {
    await db().from("call_attempts").update({ conversation_id: conversationId, status: "connected" }).eq("id", attempt.id);
    attempt.conversation_id = conversationId;
  }

  const { data: application } = await db().from("applications").select("*").eq("id", attempt.application_id).single();
  if (!application) throw new ToolAuthError(403, "application not found");

  const { data: verification } = await db()
    .from("verifications")
    .select("verified")
    .eq("call_attempt_id", attempt.id)
    .maybeSingle();

  return {
    attempt: attempt as CallAttemptRow,
    application: application as ApplicationRow,
    conversationId: attempt.conversation_id,
    verified: verification?.verified === true,
  };
}

/** Records an action the backend refused — shown in the console's "Blocked actions" log. */
export async function logBlocked(ctx: ToolContext, tool: string, reason: string, payload: unknown) {
  await db().from("blocked_actions").insert({
    application_id: ctx.application.id,
    conversation_id: ctx.conversationId,
    tool,
    reason,
    payload,
  });
}

export async function audit(ctx: ToolContext, event: string, detail: unknown) {
  await db().from("audit_log").insert({ application_id: ctx.application.id, actor: "agent", event, detail });
}
