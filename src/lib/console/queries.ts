import "server-only";
import { cache } from "react";
import { latestRuleResults } from "@/lib/applications/evaluate";
import { type PredialCheck, predialChecks } from "@/lib/calls/predial";
import { signedDocumentUrl } from "@/lib/storage";
import { maskPhone } from "./format";
import { db } from "@/lib/supabase/server";

/**
 * Read models for the operator console. Every function returns an explicit field list
 * (never raw rows); the console is officer-only, so it does show case data in full.
 */

export type Ramp = "pass" | "fix" | "route" | "officer";
export type CaseStatus = "submitted" | "returned_fixable" | "returned_officer" | "pending_review" | "in_processing" | "needs_human";

export interface QueueRow {
  id: number;
  reference: string;
  fullName: string;
  status: CaseStatus;
  ramp: Ramp;
  language: "en" | "ar" | "hi";
  consent: boolean;
  failed: string[];
  pendingCorrections: number;
  /** The officer's latest decision on this case, if any. */
  lastDecision: "approved" | "rejected" | null;
  lastCall: { status: string; channel: string } | null;
  createdAt: string;
}

/** Weight on the one ramp: officer-only beats fixable beats route; a person needed reads as officer. */
function rampOf(status: CaseStatus, failedTypes: string[]): Ramp {
  if (status === "in_processing") return "pass";
  if (status === "returned_officer" || status === "needs_human") return "officer";
  if (status === "pending_review") return "fix";
  if (failedTypes.includes("A")) return "fix";
  return failedTypes.length ? "route" : "pass";
}

/** Officer work first: decisions waiting, then calls to make, then the rest. */
const ORDER: Record<CaseStatus, number> = {
  pending_review: 0, needs_human: 1, returned_fixable: 2, returned_officer: 3, submitted: 4, in_processing: 5,
};

/** One read per request: the desk layout (queue) and the /console page (first case) share it. */
export const getQueue = cache(async function getQueue(): Promise<{ rows: QueueRow[]; awaitingDecision: number; blockedToday: number; openHandoffs: number }> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [{ data: apps }, { data: rules }, { data: corrections }, { data: uploads }, { data: attempts }, blocked, blockedCalls, handoffs] = await Promise.all([
    db().from("applications").select("id, reference, full_name, status, preferred_language, ai_call_consent, created_at").order("created_at", { ascending: false }).limit(200),
    db().from("rule_results").select("application_id, rule_code, rule_type, passed, run_id, created_at").order("created_at", { ascending: false }).limit(4000),
    db().from("corrections").select("application_id, status, reviewed_at").in("status", ["pending_review", "approved", "rejected"]),
    db().from("uploads").select("application_id, review_status, reviewed_at").not("review_status", "is", null),
    db().from("call_attempts").select("application_id, status, channel, started_at").order("started_at", { ascending: false }).limit(1000),
    db().from("blocked_actions").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
    db().from("call_attempts").select("id", { count: "exact", head: true }).eq("status", "blocked").gte("started_at", startOfDay.toISOString()),
    db().from("handoffs").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const latestRun = new Map<number, string>();
  const failed = new Map<number, { code: string; type: string }[]>();
  for (const r of rules ?? []) {
    if (!latestRun.has(r.application_id)) latestRun.set(r.application_id, r.run_id);
    if (latestRun.get(r.application_id) !== r.run_id || r.passed) continue;
    failed.set(r.application_id, [...(failed.get(r.application_id) ?? []), { code: r.rule_code, type: r.rule_type }]);
  }
  const pending = new Map<number, number>();
  const decided = new Map<number, { status: string; at: string }>();
  // Typed corrections and new files are both slips waiting at the counter.
  const slips = [
    ...(corrections ?? []),
    ...(uploads ?? []).map((u) => ({ application_id: u.application_id, status: u.review_status as string, reviewed_at: u.reviewed_at })),
  ];
  for (const c of slips) {
    if (c.status === "pending_review") pending.set(c.application_id, (pending.get(c.application_id) ?? 0) + 1);
    else if (c.reviewed_at && (decided.get(c.application_id)?.at ?? "") < c.reviewed_at) decided.set(c.application_id, { status: c.status, at: c.reviewed_at });
  }
  const lastCall = new Map<number, { status: string; channel: string }>();
  for (const a of attempts ?? []) if (!lastCall.has(a.application_id)) lastCall.set(a.application_id, { status: a.status, channel: a.channel });

  const rows = (apps ?? []).map((a): QueueRow => {
    const f = (failed.get(a.id) ?? []).sort((x, y) => Number(x.code.slice(1)) - Number(y.code.slice(1)));
    const status = a.status as CaseStatus;
    return {
      id: a.id,
      reference: a.reference,
      fullName: a.full_name,
      status,
      ramp: rampOf(status, f.map((x) => x.type)),
      language: a.preferred_language,
      consent: a.ai_call_consent,
      failed: f.map((x) => x.code),
      pendingCorrections: pending.get(a.id) ?? 0,
      lastDecision: (decided.get(a.id)?.status as "approved" | "rejected" | undefined) ?? null,
      lastCall: lastCall.get(a.id) ?? null,
      createdAt: a.created_at,
    };
  });
  rows.sort((x, y) => ORDER[x.status] - ORDER[y.status] || y.createdAt.localeCompare(x.createdAt));

  return {
    rows,
    awaitingDecision: [...pending.values()].reduce((s, n) => s + n, 0),
    blockedToday: (blocked.count ?? 0) + (blockedCalls.count ?? 0),
    openHandoffs: handoffs.count ?? 0,
  };
});

export interface CaseEvent {
  at: string;
  actor: string;
  event: string;
  detail: string | null;
}

export interface CaseFile {
  id: number;
  reference: string;
  status: CaseStatus;
  ramp: Ramp;
  fullName: string;
  dateOfBirth: string;
  passportNumber: string;
  passportExpiry: string;
  professionCode: string | null;
  phone: string;
  language: "en" | "ar" | "hi";
  consent: boolean;
  consentAt: string | null;
  createdAt: string;
  photoUrl: string | null;
  rules: { code: string; type: "A" | "B" | "C"; passed: boolean; detail: string | null }[];
  /** Conversations whose post-call record has arrived. */
  recordedConversations: string[];
  predial: { phone: { allowed: boolean; checks: PredialCheck[] }; browser: { allowed: boolean; checks: PredialCheck[] } };
  calls: { id: number; channel: string; status: string; blockReason: string | null; conversationId: string | null; startedAt: string; endedAt: string | null }[];
  uploads: { id: number; kind: "photo" | "scan"; status: "pending_review" | "approved" | "rejected"; newUrl: string | null; currentUrl: string | null; reviewedBy: string | null; reviewNote: string | null; reviewedAt: string | null; uploadedAt: string }[];
  corrections: { id: number; ruleCode: string; field: string; oldValue: string | null; newValue: string; status: "pending_review" | "approved" | "rejected"; reviewedBy: string | null; reviewNote: string | null; reviewedAt: string | null; createdAt: string; conversationId: string }[];
  handoffs: { id: number; kind: string; reason: string; preferredTime: string | null; status: string; createdAt: string }[];
  sms: { id: number; body: string; createdAt: string }[];
  blocked: { id: number; tool: string; reason: string; createdAt: string }[];
  appointment: { centre: string; purpose: string; startsAt: string } | null;
  history: CaseEvent[];
}

/** Audit events whose full record is printed from its own table instead (SMS body, handoff reason). */
const FOLDED = new Set(["sms_sent", "followup_created", "escalated_to_human", "callback_scheduled"]);

const DETAIL_KEYS = ["field", "reason", "reasons", "outcome", "failed", "channel", "kind", "rule", "purpose", "reviewed_by", "attempts"] as const;

/** The audit detail as one readable line (only known keys, so nothing unexpected reaches the screen). */
function describe(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const d = detail as Record<string, unknown>;
  const parts = DETAIL_KEYS.filter((k) => d[k] !== undefined && d[k] !== null).map((k) => {
    const v = d[k];
    return `${k.replace(/_/g, " ")}: ${Array.isArray(v) ? v.join(", ") || "none" : String(v)}`;
  });
  return parts.length ? parts.join(" · ") : null;
}

export async function getCase(id: number): Promise<CaseFile | null> {
  const { data: a } = await db()
    .from("applications")
    .select("id, reference, status, full_name, date_of_birth, passport_number, passport_expiry, profession_code, phone, preferred_language, ai_call_consent, ai_call_consent_at, created_at, photo_path, scan_path")
    .eq("id", id)
    .maybeSingle();
  if (!a) return null;

  const [rules, phone, browser, calls, corrections, handoffs, sms, blocked, slot, audit, photoUrl, records, uploads] = await Promise.all([
    latestRuleResults(id),
    predialChecks(id, { channel: "phone" }),
    predialChecks(id, { channel: "browser" }),
    db().from("call_attempts").select("id, channel, status, block_reason, conversation_id, started_at, ended_at").eq("application_id", id).order("started_at", { ascending: false }),
    db().from("corrections").select("id, rule_code, field, old_value, new_value, status, reviewed_by, review_note, reviewed_at, created_at, conversation_id").eq("application_id", id).order("created_at"),
    db().from("handoffs").select("id, kind, reason, preferred_time, status, created_at").eq("application_id", id).order("created_at", { ascending: false }),
    db().from("sms_outbox").select("id, body, created_at").eq("application_id", id).order("created_at", { ascending: false }),
    db().from("blocked_actions").select("id, tool, reason, created_at").eq("application_id", id).order("created_at", { ascending: false }),
    db().from("appointment_slots").select("centre, purpose, starts_at").eq("application_id", id).order("starts_at").limit(1).maybeSingle(),
    db().from("audit_log").select("actor, event, detail, created_at").eq("application_id", id).order("created_at").limit(300),
    a.photo_path ? signedDocumentUrl(a.photo_path) : Promise.resolve(null),
    db().from("call_records").select("conversation_id").eq("application_id", id),
    db().from("uploads").select("id, kind, review_status, file_path, reviewed_by, review_note, reviewed_at, uploaded_at").eq("application_id", id).not("review_status", "is", null).order("uploaded_at"),
  ]);
  const scanUrl = a.scan_path ? await signedDocumentUrl(a.scan_path) : null;
  const uploadSlips = await Promise.all(
    (uploads.data ?? []).map(async (u) => ({
      id: u.id,
      kind: u.kind as "photo" | "scan",
      status: u.review_status as "pending_review" | "approved" | "rejected",
      newUrl: u.file_path ? await signedDocumentUrl(u.file_path) : null,
      currentUrl: u.kind === "photo" ? photoUrl : scanUrl,
      reviewedBy: u.reviewed_by,
      reviewNote: u.review_note,
      reviewedAt: u.reviewed_at,
      uploadedAt: u.uploaded_at ?? "",
    })),
  );

  const status = a.status as CaseStatus;
  const ruleRows = rules
    .map((r) => ({ code: r.rule_code, type: r.rule_type as "A" | "B" | "C", passed: r.passed, detail: r.detail }))
    .sort((x, y) => Number(x.code.slice(1)) - Number(y.code.slice(1)));

  return {
    id: a.id,
    reference: a.reference,
    status,
    ramp: rampOf(status, ruleRows.filter((r) => !r.passed).map((r) => r.type)),
    fullName: a.full_name,
    dateOfBirth: a.date_of_birth,
    passportNumber: a.passport_number,
    passportExpiry: a.passport_expiry,
    professionCode: a.profession_code,
    phone: maskPhone(a.phone),
    language: a.preferred_language,
    consent: a.ai_call_consent,
    consentAt: a.ai_call_consent_at,
    createdAt: a.created_at,
    photoUrl,
    rules: ruleRows,
    recordedConversations: (records.data ?? []).map((r) => r.conversation_id),
    predial: { phone, browser },
    calls: (calls.data ?? []).map((c) => ({ id: c.id, channel: c.channel, status: c.status, blockReason: c.block_reason, conversationId: c.conversation_id, startedAt: c.started_at, endedAt: c.ended_at })),
    uploads: uploadSlips,
    corrections: (corrections.data ?? []).map((c) => ({
      id: c.id, ruleCode: c.rule_code, field: c.field, oldValue: c.old_value, newValue: c.new_value, status: c.status,
      reviewedBy: c.reviewed_by, reviewNote: c.review_note, reviewedAt: c.reviewed_at, createdAt: c.created_at, conversationId: c.conversation_id,
    })),
    handoffs: (handoffs.data ?? []).map((h) => ({ id: h.id, kind: h.kind, reason: h.reason, preferredTime: h.preferred_time, status: h.status, createdAt: h.created_at })),
    sms: (sms.data ?? []).map((s) => ({ id: s.id, body: s.body, createdAt: s.created_at })),
    blocked: (blocked.data ?? []).map((b) => ({ id: b.id, tool: b.tool, reason: b.reason, createdAt: b.created_at })),
    appointment: slot.data ? { centre: slot.data.centre, purpose: slot.data.purpose, startsAt: slot.data.starts_at } : null,
    // The roll: the audit trail, with texts, handoffs and backend refusals printed in full, in the order they happened.
    history: [
      ...(audit.data ?? [])
        .filter((e) => !FOLDED.has(e.event))
        .map((e) => ({ at: e.created_at, actor: e.actor, event: e.event, detail: describe(e.detail) })),
      ...(sms.data ?? []).map((m) => ({ at: m.created_at, actor: "sms", event: "sms_sent", detail: m.body })),
      ...(handoffs.data ?? []).map((h) => ({ at: h.created_at, actor: "handoff", event: `handoff_${h.kind}`, detail: h.reason })),
      ...(blocked.data ?? []).map((b) => ({ at: b.created_at, actor: "refused", event: `refused_${b.tool}`, detail: b.reason })),
    ].sort((x, y) => x.at.localeCompare(y.at)),
  };
}

// ---------------------------------------------------------------------------
// Cross-case logs
// ---------------------------------------------------------------------------

type WithRef = { applications: { id: number; reference: string } | null };
const ref = (row: WithRef) => (row.applications ? { applicationId: row.applications.id, reference: row.applications.reference } : { applicationId: null, reference: null });

export interface TranscriptTurn { role: "agent" | "user"; message: string; timeInCallSecs: number | null }

export async function getCallRecords() {
  const { data } = await db()
    .from("call_records")
    .select("conversation_id, status, call_successful, language, duration_secs, avg_latency_ms, max_latency_ms, transcript, analysis, received_at, applications(id, reference)")
    .order("received_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((r) => {
    const analysis = (r.analysis ?? {}) as { transcript_summary?: unknown };
    const transcript = Array.isArray(r.transcript) ? (r.transcript as Record<string, unknown>[]) : [];
    return {
      conversationId: r.conversation_id,
      ...ref(r as unknown as WithRef),
      status: r.status,
      successful: r.call_successful,
      language: r.language,
      durationSecs: r.duration_secs,
      avgLatencyMs: r.avg_latency_ms,
      maxLatencyMs: r.max_latency_ms,
      summary: typeof analysis.transcript_summary === "string" ? analysis.transcript_summary : null,
      transcript: transcript
        .filter((t) => typeof t.message === "string" && t.message)
        .map((t): TranscriptTurn => ({
          role: t.role === "agent" ? "agent" : "user",
          message: String(t.message),
          timeInCallSecs: typeof t.time_in_call_secs === "number" ? t.time_in_call_secs : null,
        })),
      receivedAt: r.received_at,
    };
  });
}

export async function getHandoffs() {
  const { data } = await db().from("handoffs").select("id, kind, reason, preferred_time, status, created_at, applications(id, reference)").order("created_at", { ascending: false }).limit(100);
  return (data ?? []).map((h) => ({ id: h.id, ...ref(h as unknown as WithRef), kind: h.kind, reason: h.reason, preferredTime: h.preferred_time, status: h.status, createdAt: h.created_at }));
}

export async function getSmsOutbox() {
  const { data } = await db().from("sms_outbox").select("id, to_phone, body, created_at, applications(id, reference)").order("created_at", { ascending: false }).limit(100);
  return (data ?? []).map((s) => ({ id: s.id, ...ref(s as unknown as WithRef), toPhone: maskPhone(s.to_phone), body: s.body, createdAt: s.created_at }));
}

export async function getBlockedActions() {
  const [{ data: actions }, { data: calls }] = await Promise.all([
    db().from("blocked_actions").select("id, tool, reason, conversation_id, created_at, applications(id, reference)").order("created_at", { ascending: false }).limit(100),
    db().from("call_attempts").select("id, channel, block_reason, started_at, applications(id, reference)").eq("status", "blocked").order("started_at", { ascending: false }).limit(100),
  ]);
  return [
    ...(actions ?? []).map((b) => ({ key: `t${b.id}`, ...ref(b as unknown as WithRef), source: "tool" as const, what: b.tool, reason: b.reason, at: b.created_at })),
    ...(calls ?? []).map((c) => ({ key: `c${c.id}`, ...ref(c as unknown as WithRef), source: "pre-dial" as const, what: `${c.channel} call`, reason: c.block_reason ?? "", at: c.started_at })),
  ].sort((x, y) => y.at.localeCompare(x.at));
}

export async function getLatency() {
  const { data } = await db().from("call_records").select("language, avg_latency_ms, max_latency_ms").not("avg_latency_ms", "is", null);
  const by = new Map<string, { calls: number; sum: number; max: number }>();
  for (const r of data ?? []) {
    const k = r.language ?? "unknown";
    const cur = by.get(k) ?? { calls: 0, sum: 0, max: 0 };
    by.set(k, { calls: cur.calls + 1, sum: cur.sum + (r.avg_latency_ms ?? 0), max: Math.max(cur.max, r.max_latency_ms ?? 0) });
  }
  return [...by.entries()].map(([language, v]) => ({ language, calls: v.calls, avgMs: Math.round(v.sum / v.calls), maxMs: v.max }));
}
