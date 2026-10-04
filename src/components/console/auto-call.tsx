"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { caseAutoCallAction, setAutoCallAction } from "@/app/console/actions";
import { Button } from "@/components/ui/button";
import { dueLabel, uaeTime } from "@/lib/console/format";
import type { AutoCallView } from "@/lib/console/queries";
import { cn } from "@/lib/utils";

const lamp = { on: "bg-led-green text-led-green shadow-[0_0_6px_currentColor]", wait: "bg-led-amber text-led-amber shadow-[0_0_6px_currentColor]", off: "bg-led-text/25" } as const;
const word = { on: "text-led-green led-glow", wait: "text-led-amber led-glow", off: "text-led-text/50" } as const;

/**
 * The console's auto-call switch, in the bar. Turning it on rings real phones, so it asks first (like
 * Reset demo) and says what it does; turning it off is immediate and cancels any call still waiting.
 */
export function AutoCallSwitch({ enabled }: { enabled: boolean }) {
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const switchKey = useRef<HTMLButtonElement>(null);
  const cancelKey = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  // Focus follows the step: into the question when it opens, back to the switch when it closes.
  useEffect(() => {
    if (asking) cancelKey.current?.focus();
    else if (returnFocus.current) {
      returnFocus.current = false;
      switchKey.current?.focus();
    }
  }, [asking]);

  const close = () => {
    returnFocus.current = true;
    setAsking(false);
  };
  const flip = (next: boolean) =>
    start(async () => {
      const result = await setAutoCallAction(next);
      setMessage(
        result.error
          ? { text: "Auto-call didn't change. Try again.", error: true }
          : { text: next ? "Auto-call on" : `Auto-call off${result.cancelled ? ` · ${result.cancelled} waiting call${result.cancelled === 1 ? "" : "s"} cancelled` : ""}` },
      );
      close();
    });

  if (asking) {
    return (
      <div
        className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2"
        onKeyDown={(e) => {
          if (e.key === "Escape") close();
        }}
      >
        <span id="auto-call-hint" className="basis-full text-end text-[12.5px] leading-snug text-led-text/80 lg:max-w-[46ch] lg:basis-auto">
          Rings opted-in applicants&apos; phones by itself, 09:00–18:00 UAE, for applications checked from now on. Checks still run before every call.
        </span>
        <Button ref={cancelKey} type="button" variant="board" size="sm" onClick={close}>
          Cancel
        </Button>
        <span aria-hidden className="w-4" />
        <Button
          type="button"
          variant="board"
          size="sm"
          aria-describedby="auto-call-hint"
          aria-disabled={pending}
          onClick={() => !pending && flip(true)}
          className="border-led-green/60 text-led-green hover:border-led-green hover:text-led-green"
        >
          {pending ? "Turning on…" : "Turn on auto-call"}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span role="status" className={cn("text-[12.5px] max-md:sr-only", message?.error ? "text-led-red" : "text-led-text/70")}>
        {message?.text}
      </span>
      <Button
        ref={switchKey}
        type="button"
        variant="board"
        size="sm"
        aria-pressed={enabled}
        aria-disabled={pending}
        onClick={() => {
          if (pending) return;
          setMessage(null);
          if (enabled) flip(false);
          else setAsking(true);
        }}
        title={enabled ? "The assistant calls opted-in applicants by itself. Press to turn off." : "Officers start every call. Press to let the assistant call by itself."}
      >
        <span aria-hidden className={cn("size-2 rounded-full", enabled ? lamp.on : lamp.off)} />
        Auto-call
        <span aria-hidden className={cn("font-led text-[13px] font-black tracking-[0.06em] uppercase", enabled ? word.on : word.off)}>
          {pending ? "…" : enabled ? "On" : "Off"}
        </span>
      </Button>
    </div>
  );
}

/** One line on the calling board: what the assistant will do by itself for this case, and the officer's say in it. */
export function CaseAutoCall({ applicationId, auto, manualAllowed }: { applicationId: number; auto: AutoCallView; manualAllowed: boolean }) {
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const change = (stopped: boolean) =>
    start(async () => {
      const result = await caseAutoCallAction(applicationId, stopped);
      setFailed(!!result.error);
    });

  const latest = auto.latest;
  const orKeys = manualAllowed ? " Call from the keys below if it's still needed." : "";
  let tone: keyof typeof lamp = "off";
  let state = "Off";
  let text: string;
  let action: { label: string; stopped: boolean } | null = null;

  if (!auto.enabled) {
    text = "Auto-call is off. Calls start from the keys below.";
  } else if (auto.stopped) {
    state = "Stopped";
    text = "Stopped for this case by an officer.";
    action = { label: "Resume automatic calls", stopped: false };
  } else if (latest?.status === "queued") {
    tone = "wait";
    state = "Queued";
    text = `For ${dueLabel(latest.dueAt)}${latest.reason === "retry" ? ", the next try after an unanswered call" : ""}.`;
    action = { label: "Stop automatic calls", stopped: true };
  } else if (latest?.status === "dialling") {
    tone = "wait";
    state = "Calling";
    text = "Placing the call now.";
  } else if (latest?.status === "placed") {
    tone = "on";
    state = "Placed";
    text = latest.outcome?.startsWith("Test mode") ? `At ${uaeTime(latest.updatedAt)} (test mode: nobody was rung).` : `Called automatically at ${uaeTime(latest.updatedAt)}.`;
    action = { label: "Stop automatic calls", stopped: true };
  } else if (latest?.status === "cancelled" && latest.stopReason !== "switched_off") {
    state = "Cancelled";
    text = `${latest.outcome ?? "This call was cancelled."}${orKeys}`;
  } else if (auto.qualifies) {
    text = `Returned before auto-call was on, so no automatic call.${orKeys}`;
  } else {
    text = "Nothing to call about: a call queues when a check finds something to fix and the applicant opted in.";
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-board-rule px-4 py-3">
      <p className="flex min-w-0 items-start gap-2.5 text-[13px] leading-snug">
        <span aria-hidden className={cn("mt-[0.4em] size-2 shrink-0 rounded-full", lamp[tone])} />
        <span className="min-w-0">
          <span className="sr-only">Automatic call: </span>
          <span className={cn("me-2 font-led text-[13px] font-black tracking-[0.06em] uppercase", word[tone])}>{state}</span>
          <span className="text-led-text/75">{text}</span>
          {failed && <span role="alert" className="ms-2 text-led-red">That didn&apos;t go through. Try again.</span>}
        </span>
      </p>
      {action && (
        <Button type="button" variant="board" size="sm" aria-disabled={pending} onClick={() => !pending && change(action.stopped)}>
          {pending ? "Saving…" : action.label}
        </Button>
      )}
    </div>
  );
}
