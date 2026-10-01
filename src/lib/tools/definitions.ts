import "server-only";
import { z } from "zod";
import { latestRuleResults } from "@/lib/applications/evaluate";
import { requireEnv } from "@/lib/env";
import { normaliseName, normalisePassportNumber } from "@/lib/rules/engine";
import type { CorrectableField } from "@/lib/rules/types";
import { randomToken, sha256 } from "@/lib/security";
import { db } from "@/lib/supabase/server";
import { UAE_TZ } from "@/lib/time";
import { audit, logBlocked, type ToolContext } from "./context";

const MAX_VERIFY_ATTEMPTS = 2;
const UPLOAD_LINK_HOURS = 24;

/** What every tool returns to the agent. `ok:false` + `reason` tells it to stop and follow the prompt's fallback. */
export type ToolResult = Record<string, unknown> & { ok: boolean };

export interface ToolDefinition<A extends z.ZodType> {
  args: A;
  /** Case data or actions require a passed identity check on THIS call. */
  requiresVerification: boolean;
  run: (ctx: ToolContext, args: z.infer<A>) => Promise<ToolResult>;
}

function tool<A extends z.ZodType>(def: ToolDefinition<A>) {
  return def;
}

const digits = (v: string) => v.replace(/\D/g, "");

async function registryRecord(passportNumber: string, dob: string, fullName: string) {
  const byNumber = await db().from("passport_records").select("*").eq("passport_number", normalisePassportNumber(passportNumber)).maybeSingle();
  if (byNumber.data) return byNumber.data as { passport_number: string; full_name: string; date_of_birth: string };
  const byDob = await db().from("passport_records").select("*").eq("date_of_birth", dob);
  return (byDob.data ?? []).find((p) => normaliseName(p.full_name) === normaliseName(fullName)) ?? null;
}

async function failedRules(applicationId: number) {
  return (await latestRuleResults(applicationId)).filter((r) => !r.passed);
}

function spokenTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UAE_TZ, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));
}

export const tools = {
  /** Identity check: application reference + date of birth. Never passwords, PINs or OTPs. */
  verify_identity: tool({
    args: z.object({
      application_reference: z.string().min(1),
      date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD"),
    }),
    requiresVerification: false,
    async run(ctx, args) {
      const { data: existing } = await db().from("verifications").select("*").eq("call_attempt_id", ctx.attempt.id).maybeSingle();
      if (existing?.verified) return { ok: true, verified: true };
      if ((existing?.attempts ?? 0) >= MAX_VERIFY_ATTEMPTS) {
        await logBlocked(ctx, "verify_identity", "verification locked after too many failed attempts", { attempts: existing?.attempts });
        return { ok: true, verified: false, locked: true, attempts_left: 0 };
      }

      const record = await registryRecord(ctx.application.passport_number, ctx.application.date_of_birth, ctx.application.full_name);
      const trueDob = record?.date_of_birth ?? ctx.application.date_of_birth;
      const verified = digits(args.application_reference) === digits(ctx.application.reference) && args.date_of_birth === trueDob;
      const attempts = (existing?.attempts ?? 0) + 1;

      await db().from("verifications").upsert(
        {
          call_attempt_id: ctx.attempt.id,
          application_id: ctx.application.id,
          conversation_id: ctx.conversationId,
          attempts,
          verified,
          verified_at: verified ? new Date().toISOString() : null,
        },
        { onConflict: "call_attempt_id" },
      );
      await audit(ctx, verified ? "identity_verified" : "identity_check_failed", { attempts });
      // Never echo which part was wrong — that would help someone guess.
      return verified
        ? { ok: true, verified: true }
        : { ok: true, verified: false, locked: attempts >= MAX_VERIFY_ATTEMPTS, attempts_left: Math.max(0, MAX_VERIFY_ATTEMPTS - attempts) };
    },
  }),

  /** The problems with the application, in plain words. Type C issues are never disclosed. */
  get_case: tool({
    args: z.object({}).passthrough(),
    requiresVerification: true,
    async run(ctx) {
      const failed = await failedRules(ctx.application.id);
      if (failed.some((r) => r.rule_type === "C")) {
        await logBlocked(ctx, "get_case", "case has an officer-only issue; no details may be shared", {});
        return { ok: false, reason: "officer_only", next_step: "create_callback with escalate=true" };
      }
      return {
        ok: true,
        reference: ctx.application.reference,
        first_name: ctx.application.full_name.split(/\s+/)[0],
        issues: failed.map((r) => ({
          rule: r.rule_code,
          how_to_resolve:
            r.rule_type === "B" ? "route" : r.field ? "fix_by_voice" : ["R4", "R5"].includes(r.rule_code) ? "upload" : "book_visit",
          field: r.field,
          explanation: r.detail,
        })),
      };
    },
  }),

  /** Saves a corrected value as PENDING officer review. Only flagged fields; value must match the passport record. */
  submit_correction: tool({
    args: z.object({
      field: z.enum(["full_name", "date_of_birth", "passport_number"]),
      new_value: z.string().min(1).max(120),
      caller_confirmed_read_back: z.boolean(),
    }),
    requiresVerification: true,
    async run(ctx, args) {
      const field = args.field as CorrectableField;
      if (!args.caller_confirmed_read_back) {
        await logBlocked(ctx, "submit_correction", "value was not read back and confirmed by the caller", args);
        return { ok: false, reason: "read_back_required" };
      }

      const flagged = (await failedRules(ctx.application.id)).find((r) => r.field === field);
      if (!flagged) {
        await logBlocked(ctx, "submit_correction", `field '${field}' was not flagged by the rules check`, args);
        return { ok: false, reason: "field_not_flagged", message: "Only the fields flagged in this application can be corrected on this call." };
      }

      const record = await registryRecord(ctx.application.passport_number, ctx.application.date_of_birth, ctx.application.full_name);
      const matches =
        !!record &&
        (field === "full_name"
          ? normaliseName(args.new_value) === normaliseName(record.full_name)
          : field === "date_of_birth"
            ? args.new_value === record.date_of_birth
            : normalisePassportNumber(args.new_value) === record.passport_number);
      if (!matches) {
        await logBlocked(ctx, "submit_correction", "new value still does not match the passport record", { field });
        // Don't reveal the record's value — the officer will follow up.
        return { ok: false, reason: "still_does_not_match", next_step: "create_callback with escalate=true" };
      }

      const oldValue = String(ctx.application[field]);
      const { data, error } = await db()
        .from("corrections")
        .upsert(
          {
            application_id: ctx.application.id,
            call_attempt_id: ctx.attempt.id,
            conversation_id: ctx.conversationId,
            rule_code: flagged.rule_code,
            field,
            old_value: oldValue,
            new_value: args.new_value.trim(),
            status: "pending_review",
          },
          { onConflict: "call_attempt_id,field", ignoreDuplicates: false },
        )
        .select("id")
        .single();
      if (error || !data) throw new Error(`saving correction failed: ${error?.message}`);

      await db().from("applications").update({ status: "pending_review", updated_at: new Date().toISOString() }).eq("id", ctx.application.id);
      await audit(ctx, "correction_submitted", { correction_id: data.id, field });
      return { ok: true, correction_id: data.id, status: "pending_officer_review" };
    },
  }),

  /** Sends (simulated) SMS with a one-time upload link. */
  send_upload_link: tool({
    args: z.object({ kind: z.enum(["photo", "scan"]) }),
    requiresVerification: true,
    async run(ctx, args) {
      const rule = args.kind === "photo" ? "R4" : "R5";
      if (!(await failedRules(ctx.application.id)).some((r) => r.rule_code === rule)) {
        await logBlocked(ctx, "send_upload_link", `no ${args.kind} problem on this application`, args);
        return { ok: false, reason: "not_needed" };
      }
      const token = randomToken();
      await db().from("uploads").insert({
        token_hash: sha256(token),
        application_id: ctx.application.id,
        kind: args.kind,
        expires_at: new Date(Date.now() + UPLOAD_LINK_HOURS * 3600_000).toISOString(),
      });
      const url = `${requireEnv("APP_BASE_URL")}/u/${token}`;
      await db().from("sms_outbox").insert({
        application_id: ctx.application.id,
        to_phone: ctx.application.phone,
        body: `Residency Assist (prototype): upload your new ${args.kind} for application ${ctx.application.reference} here: ${url} — link valid ${UPLOAD_LINK_HOURS} hours.`,
      });
      await audit(ctx, "upload_link_sent", { kind: args.kind });
      return { ok: true, sent: true, valid_hours: UPLOAD_LINK_HOURS };
    },
  }),

  /** Has the applicant uploaded the new file yet, and did it pass the check? */
  check_upload: tool({
    args: z.object({ kind: z.enum(["photo", "scan"]) }),
    requiresVerification: true,
    async run(ctx, args) {
      const { data } = await db()
        .from("uploads")
        .select("uploaded_at, check_passed, check_detail")
        .eq("application_id", ctx.application.id)
        .eq("kind", args.kind)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!data) return { ok: true, status: "no_link_sent" };
      if (!data.uploaded_at) return { ok: true, status: "waiting_for_upload" };
      return { ok: true, status: data.check_passed ? "uploaded_and_passed" : "uploaded_but_failed", detail: data.check_detail };
    },
  }),

  /** Two earliest open Amer slots for a pending in-person step. */
  list_slots: tool({
    args: z.object({ purpose: z.enum(["biometrics", "medical"]) }),
    requiresVerification: true,
    async run(ctx, args) {
      const rule = args.purpose === "biometrics" ? "R6" : "R7";
      if (!(await failedRules(ctx.application.id)).some((r) => r.rule_code === rule)) {
        await logBlocked(ctx, "list_slots", `no pending ${args.purpose} step on this application`, args);
        return { ok: false, reason: "not_needed" };
      }
      const { data } = await db()
        .from("appointment_slots")
        .select("id, centre, starts_at")
        .eq("purpose", args.purpose)
        .is("application_id", null)
        .gt("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(2);
      if (!data?.length) return { ok: true, slots: [], next_step: "create_callback" };
      return { ok: true, slots: data.map((s) => ({ slot_id: s.id, centre: s.centre, when: spokenTime(s.starts_at) })) };
    },
  }),

  book_appointment: tool({
    args: z.object({ slot_id: z.number().int().positive() }),
    requiresVerification: true,
    async run(ctx, args) {
      const { data: slot } = await db().from("appointment_slots").select("id, purpose, centre, starts_at, application_id").eq("id", args.slot_id).maybeSingle();
      if (!slot) return { ok: false, reason: "slot_not_found" };
      if (slot.application_id === ctx.application.id) return { ok: true, already_booked: true, centre: slot.centre, when: spokenTime(slot.starts_at) };

      const rule = slot.purpose === "biometrics" ? "R6" : "R7";
      if (!(await failedRules(ctx.application.id)).some((r) => r.rule_code === rule)) {
        await logBlocked(ctx, "book_appointment", `no pending ${slot.purpose} step on this application`, args);
        return { ok: false, reason: "not_needed" };
      }
      // Atomic claim: only succeeds if the slot is still free.
      const { data: claimed } = await db()
        .from("appointment_slots")
        .update({ application_id: ctx.application.id, booked_at: new Date().toISOString() })
        .eq("id", slot.id)
        .is("application_id", null)
        .select("id");
      if (!claimed?.length) return { ok: false, reason: "slot_just_taken", next_step: "list_slots again" };

      await audit(ctx, "appointment_booked", { slot_id: slot.id, purpose: slot.purpose });
      return { ok: true, centre: slot.centre, when: spokenTime(slot.starts_at) };
    },
  }),

  /** Status issues the agent can't fix itself (old visa, fines, profession code, passport renewal). */
  create_followup: tool({
    args: z.object({ rule: z.enum(["R8", "R9", "R10", "R11"]), note: z.string().max(500).optional() }),
    requiresVerification: true,
    async run(ctx, args) {
      const issue = (await failedRules(ctx.application.id)).find((r) => r.rule_code === args.rule);
      if (!issue) {
        await logBlocked(ctx, "create_followup", `rule ${args.rule} is not an open issue on this application`, args);
        return { ok: false, reason: "not_an_open_issue" };
      }
      await db().from("handoffs").insert({
        application_id: ctx.application.id,
        conversation_id: ctx.conversationId,
        kind: "followup",
        reason: `${args.rule}: ${issue.detail}${args.note ? ` — ${args.note}` : ""}`,
      });
      await audit(ctx, "followup_created", { rule: args.rule });
      return { ok: true };
    },
  }),

  /** Hand the case to a person: callback later, or escalation (dispute, distress, asks for a human…). */
  create_callback: tool({
    args: z.object({
      reason: z.string().min(1).max(300),
      escalate: z.boolean(),
      preferred_time: z.string().max(100).optional(),
    }),
    requiresVerification: false,
    async run(ctx, args) {
      await db().from("handoffs").insert({
        application_id: ctx.application.id,
        conversation_id: ctx.conversationId,
        kind: args.escalate ? "escalation" : "callback",
        reason: args.reason,
        preferred_time: args.preferred_time ?? null,
      });
      await audit(ctx, args.escalate ? "escalated_to_human" : "callback_scheduled", {});
      return { ok: true };
    },
  }),

  /** Caller said stop: add their number to the do-not-call list. */
  record_opt_out: tool({
    args: z.object({}).passthrough(),
    requiresVerification: false,
    async run(ctx) {
      await db().from("opt_outs").upsert({ phone: ctx.application.phone, source: "call" }, { onConflict: "phone" });
      await audit(ctx, "opted_out", {});
      return { ok: true };
    },
  }),
} satisfies Record<string, ToolDefinition<z.ZodType>>;

export type ToolName = keyof typeof tools;
