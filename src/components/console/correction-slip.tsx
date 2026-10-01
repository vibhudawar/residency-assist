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

type SlipStatus = "pending_review" | "approved" | "rejected";

export interface Slip {
  id: number;
  ruleCode: string;
  field: string;
  oldValue: string | null;
  newValue: string;
  status: SlipStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  conversationId: string;
}

export interface UploadSlipData {
  id: number;
  kind: "photo" | "scan";
  status: SlipStatus;
  newUrl: string | null;
  currentUrl: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  uploadedAt: string;
}

const ERRORS: Record<NonNullable<ReviewState["error"]>, string> = {
  already_decided: "Someone already decided this. The page has the current state.",
  reason_required: "Write a short reason (at least 5 characters).",
  failed: "That didn't go through. Try again.",
};

const show = (field: string, v: string | null) => (v && field === "date_of_birth" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? uaeDay(v) : v ?? "—");

/** The paper slip every decision sits on: header, what changes, then the decision line. */
function SlipFrame({ label, decided, children }: { label: string; decided: boolean; children: React.ReactNode }) {
  return (
    <article aria-label={label} className={cn("rounded-[6px] border bg-paper", decided ? "border-rule" : "border-ink/40")}>
      {children}
    </article>
  );
}

/**
 * The decision line. Approve is the primary; Reject sits apart, opens inline and needs a reason.
 * Once decided, the outcome line feeds down — only when it is decided while you watch.
 */
function Decision({
  kind,
  id,
  status,
  reviewedBy,
  reviewNote,
  reviewedAt,
  approveLabel,
  approveHint,
  approvedText,
  rejectedText,
  noun,
}: {
  kind: "correction" | "upload";
  id: number;
  status: SlipStatus;
  reviewedBy: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  approveLabel: string;
  approveHint: string;
  approvedText: string;
  rejectedText: string;
  noun: string;
}) {
  const [approveState, approve, approving] = useActionState<ReviewState, FormData>(approveAction, {});
  const [rejectState, reject, rejecting] = useActionState<ReviewState, FormData>(rejectAction, {});
  const [rejectOpen, setRejectOpen] = useState(false);
  const [initialStatus] = useState(status);
  const feed = initialStatus !== status && "animate-paper-feed";
  const decided = status !== "pending_review";
  const error = approveState.error ?? rejectState.error;
  const hidden = (
    <>
      <input type="hidden" name="slipId" value={id} />
      <input type="hidden" name="kind" value={kind} />
    </>
  );

  return (
    <footer className="border-t border-rule px-5 py-4">
      {status === "approved" && (
        <p className={cn("flex items-center gap-2 text-[13.5px] text-ok", feed)}>
          <Check aria-hidden className="size-4 shrink-0" />
          <span>
            Approved by {reviewedBy} at <span className="font-mono">{reviewedAt && uaeTime(reviewedAt)}</span>. {approvedText}
          </span>
        </p>
      )}
      {status === "rejected" && (
        <p className={cn("text-[13.5px] text-officer", feed)}>
          Rejected by {reviewedBy} at <span className="font-mono">{reviewedAt && uaeTime(reviewedAt)}</span>: “{reviewNote}”. {rejectedText}
        </p>
      )}
      {!decided && !rejectOpen && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <form action={approve} className="flex items-center gap-4">
            {hidden}
            <Button type="submit" disabled={approving} size="lg">
              {approving ? "Approving…" : approveLabel}
            </Button>
            <p className="max-w-[34ch] text-[12.5px] leading-snug text-ink-2">{approveHint}</p>
          </form>
          <Button type="button" variant="destructive" onClick={() => setRejectOpen(true)}>
            Reject…
          </Button>
        </div>
      )}
      {!decided && rejectOpen && (
        <form action={reject} className="ms-auto grid max-w-[460px] gap-2.5">
          {hidden}
          <Label htmlFor={`reason-${kind}-${id}`} className="text-[14px] font-medium">
            Why are you rejecting this?
          </Label>
          <Textarea
            id={`reason-${kind}-${id}`}
            name="reason"
            required
            minLength={5}
            maxLength={300}
            rows={2}
            autoFocus
            aria-describedby={`reason-hint-${kind}-${id}`}
            className="rounded-[6px] border-input bg-paper px-3.5 py-2.5 text-[14.5px] focus-visible:border-ink focus-visible:ring-ring/30"
          />
          <p id={`reason-hint-${kind}-${id}`} className="text-[12.5px] leading-snug text-ink-2">
            Kept in the audit log. The application is not changed; it goes to a person and the applicant gets an SMS saying an officer will contact them.
          </p>
          <div className="mt-1 flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={rejecting}>
              {rejecting ? "Rejecting…" : `Reject ${noun}`}
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
  );
}

/** One correction the agent captured on a call. */
export function CorrectionSlip({ slip, hasRecord }: { slip: Slip; hasRecord: boolean }) {
  const decided = slip.status !== "pending_review";
  return (
    <SlipFrame label={`${FIELD_LABEL[slip.field] ?? slip.field} correction`} decided={decided}>
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
        <ArrowRight aria-hidden className="mb-1 size-4 text-ink-2 rtl:rotate-180" />
        <div>
          <p className="text-[12.5px] text-ink-2">Caller confirmed · matches passport record</p>
          <p className="mt-1 font-mono text-[17px] font-medium text-ink">{show(slip.field, slip.newValue)}</p>
        </div>
      </div>

      <Decision
        kind="correction"
        id={slip.id}
        status={slip.status}
        reviewedBy={slip.reviewedBy}
        reviewNote={slip.reviewNote}
        reviewedAt={slip.reviewedAt}
        approveLabel="Approve correction"
        approveHint="Writes the new value and re-runs the 12 rules."
        approvedText="The application now carries the corrected value."
        rejectedText="The application was not changed; the applicant was told an officer will contact them."
        noun="correction"
      />
    </SlipFrame>
  );
}

function Picture({ url, alt, label, muted = false }: { url: string | null; alt: string; label: string; muted?: boolean }) {
  return (
    <figure>
      <figcaption className="text-[12.5px] text-ink-2">{label}</figcaption>
      {url ? (
        // Short-lived signed URL from private storage; next/image would cache it past its expiry.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} className={cn("mt-1.5 h-[154px] w-[120px] rounded-[4px] border border-rule object-cover", muted && "opacity-60")} />
      ) : (
        <div className="mt-1.5 grid h-[154px] w-[120px] place-items-center rounded-[4px] border border-dashed border-ink/30 text-[12px] text-ink-2">None</div>
      )}
    </figure>
  );
}

/** A new photo or scan the applicant sent from their upload link. It already passed the automatic check. */
export function UploadSlip({ slip }: { slip: UploadSlipData }) {
  const decided = slip.status !== "pending_review";
  const noun = slip.kind === "photo" ? "photo" : "scan";
  return (
    <SlipFrame label={`New ${noun}`} decided={decided}>
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 pt-4">
        <h3 className="flex items-center gap-2.5 text-[15px] font-semibold">
          <span className="rounded-[4px] bg-fix-bg px-2 py-1 font-mono text-[12px] font-medium text-fix">{slip.kind === "photo" ? "R4" : "R5"}</span>
          New {noun}
        </h3>
        <p className="text-[12.5px] text-ink-2">
          Sent from the upload link at <span className="font-mono">{slip.uploadedAt && uaeTime(slip.uploadedAt)}</span> · passed the automatic check
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 px-5 pt-3.5 pb-4">
        {!decided && (
          <>
            <Picture url={slip.currentUrl} alt={`Current ${noun} on the application`} label="On the application" muted />
            <ArrowRight aria-hidden className="mb-[70px] size-4 text-ink-2 rtl:rotate-180" />
          </>
        )}
        <Picture url={slip.newUrl} alt={`New ${noun} from the applicant`} label={decided ? `New ${noun}` : "New, from the applicant"} />
      </div>

      <Decision
        kind="upload"
        id={slip.id}
        status={slip.status}
        reviewedBy={slip.reviewedBy}
        reviewNote={slip.reviewNote}
        reviewedAt={slip.reviewedAt}
        approveLabel={`Approve ${noun}`}
        approveHint={`Replaces the ${noun} on the application and re-runs the 12 rules.`}
        approvedText={`The new ${noun} is now on the application.`}
        rejectedText={`The old ${noun} stays; the applicant was told an officer will contact them.`}
        noun={noun}
      />
    </SlipFrame>
  );
}
