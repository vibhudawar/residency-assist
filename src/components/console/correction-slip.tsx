"use client";

import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { approveAction, rejectAction, type ReviewState } from "@/app/console/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FIELD_LABEL, uaeDay, uaeTime } from "@/lib/console/format";
import { cn } from "@/lib/utils";

export interface Slip {
  id: number;
  ruleCode: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  status: "pending_review" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  conversationId: string;
}

const ERRORS: Record<NonNullable<ReviewState["error"]>, string> = {
  already_decided: "Someone already decided this correction. The page has the current state.",
  reason_required: "Write a short reason (at least 5 characters).",
  failed: "That didn't go through. Try again.",
};

const show = (field: string, v: string | null) => (v && field === "date_of_birth" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? uaeDay(v) : v ?? "—");

/** One correction the agent captured, waiting at the counter. Approve is the primary; Reject sits apart and needs a reason. */
export function CorrectionSlip({ slip, hasRecord }: { slip: Slip; hasRecord: boolean }) {
  const [approveState, approve, approving] = useActionState<ReviewState, FormData>(approveAction, {});
  const [rejectState, reject, rejecting] = useActionState<ReviewState, FormData>(rejectAction, {});
  const [rejectOpen, setRejectOpen] = useState(false);
  // The decision line feeds down only when it is decided while you watch, not on every page load.
  const [initialStatus] = useState(slip.status);
  const feed = initialStatus !== slip.status && "animate-paper-feed";
  const decided = slip.status !== "pending_review";
  const error = approveState.error ?? rejectState.error;

  return (
    <article
      aria-label={`${FIELD_LABEL[slip.field] ?? slip.field} correction`}
      className={cn("rounded-[6px] border bg-paper", decided ? "border-rule" : "border-ink/40")}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 pt-4">
        <h3 className="flex items-center gap-2.5 text-[15px] font-semibold">
          <span className="rounded-[4px] bg-fix-bg px-2 py-1 font-mono text-[12px] font-medium text-fix">{slip.ruleCode}</span>
          {FIELD_LABEL[slip.field] ?? slip.field}
        </h3>
        <p className="text-[12.5px] text-ink-2">
          Captured on the call at <span className="font-mono">{uaeTime(slip.createdAt)}</span> ·{" "}
          {hasRecord ? (
            <Link href={`/console/records#${slip.conversationId}`} className="underline-offset-[0.2em] hover:text-ink hover:underline">
              Open call record
            </Link>
          ) : (
            "call record not received yet"
          )}
        </p>
      </header>

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-x-4 px-5 pt-3.5 pb-4">
        <div>
          <p className="text-[12.5px] text-ink-2">On the form</p>
          <p className="mt-1 font-mono text-[17px] text-ink-2 line-through decoration-ink/40">{show(slip.field, slip.oldValue)}</p>
        </div>
        <ArrowRight aria-hidden className="mb-1 size-4 text-ink-2" />
        <div>
          <p className="text-[12.5px] text-ink-2">Caller confirmed · matches passport record</p>
          <p className="mt-1 font-mono text-[17px] font-medium text-ink">{show(slip.field, slip.newValue)}</p>
        </div>
      </div>

      <footer className="border-t border-rule px-5 py-4">
        {slip.status === "approved" && (
          <p className={cn("flex items-center gap-2 text-[13.5px] text-ok", feed)}>
            <Check aria-hidden className="size-4" /> Approved by {slip.reviewedBy} at <span className="font-mono">{slip.reviewedAt && uaeTime(slip.reviewedAt)}</span>. The application now carries the corrected value.
          </p>
        )}
        {slip.status === "rejected" && (
          <p className={cn("text-[13.5px] text-officer", feed)}>
            Rejected by {slip.reviewedBy} at <span className="font-mono">{slip.reviewedAt && uaeTime(slip.reviewedAt)}</span>: “{slip.reviewNote}”. The application was not changed; the applicant was told an officer will contact them.
          </p>
        )}
        {!decided && !rejectOpen && (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <form action={approve} className="flex items-center gap-4">
              <input type="hidden" name="correctionId" value={slip.id} />
              <Button type="submit" disabled={approving} size="lg">
                {approving ? "Approving…" : "Approve correction"}
              </Button>
              <p className="max-w-[34ch] text-[12.5px] leading-snug text-ink-2">Writes the new value and re-runs the 12 rules.</p>
            </form>
            <Button type="button" variant="destructive" onClick={() => setRejectOpen(true)}>
              Reject…
            </Button>
          </div>
        )}
        {!decided && rejectOpen && (
          <form action={reject} className="ms-auto grid max-w-[460px] gap-2.5">
            <input type="hidden" name="correctionId" value={slip.id} />
            <Label htmlFor={`reason-${slip.id}`} className="text-[14px] font-medium">
              Why are you rejecting this?
            </Label>
            <Textarea
              id={`reason-${slip.id}`}
              name="reason"
              required
              minLength={5}
              maxLength={300}
              rows={2}
              autoFocus
              aria-describedby={`reason-hint-${slip.id}`}
              className="rounded-[6px] border-input bg-paper px-3.5 py-2.5 text-[14.5px] focus-visible:border-ink focus-visible:ring-ring/30"
            />
            <p id={`reason-hint-${slip.id}`} className="text-[12.5px] leading-snug text-ink-2">
              Kept in the audit log. The application is not changed; it goes to a person and the applicant gets an SMS saying an officer will contact them.
            </p>
            <div className="mt-1 flex items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={rejecting}>
                {rejecting ? "Rejecting…" : "Reject correction"}
              </Button>
            </div>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-[13px] text-officer">
            {ERRORS[error]}
          </p>
        )}
      </footer>
    </article>
  );
}
