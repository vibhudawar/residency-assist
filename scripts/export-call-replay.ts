/**
 * Exports one recorded call (from call_records) as a replay for the live call board's local demo
 * mode: what was said, when, and each tool call with its outcome. Used for design review only.
 *   tsx --conditions=react-server --env-file=.env scripts/export-call-replay.ts <conversation_id> <out.json>
 */
import { writeFile } from "node:fs/promises";
import { refusedBy } from "@/lib/calls/tool-outcome";
import { db } from "@/lib/supabase/server";

type Turn = {
  role: "agent" | "user";
  message: string | null;
  time_in_call_secs: number | null;
  tool_calls?: { tool_name: string; request_id: string }[] | null;
  tool_results?: { type: string; tool_name?: string; request_id?: string; is_error?: boolean; result_value?: string }[] | null;
};

async function main() {
  const [, , conversationId, out] = process.argv;
  if (!conversationId || !out) throw new Error("usage: export-call-replay.ts <conversation_id> <out.json>");
  const { data } = await db().from("call_records").select("language, duration_secs, transcript").eq("conversation_id", conversationId).single();
  if (!data) throw new Error("no such call record");
  const events: unknown[] = [];
  for (const t of data.transcript as Turn[]) {
    const at = Math.round((t.time_in_call_secs ?? 0) * 10) / 10;
    if (t.message?.trim()) events.push({ at, kind: "say", who: t.role, text: t.message.trim() });
    for (const c of t.tool_calls ?? []) events.push({ at, kind: "tool", id: c.request_id, name: c.tool_name });
    for (const r of t.tool_results ?? []) if (r.type !== "workflow" && r.request_id) events.push({ at, kind: "result", id: r.request_id, ok: !r.is_error && !refusedBy(r.result_value) });
  }
  const replay = { source: `Recorded test call ${conversationId}`, language: data.language ?? "en", durationSecs: data.duration_secs, events };
  await writeFile(out, `${JSON.stringify(replay, null, 2)}\n`);
  console.log(`wrote ${events.length} events to ${out}`);
}

main();
