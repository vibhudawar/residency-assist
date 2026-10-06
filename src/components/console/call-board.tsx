"use client";

import { Globe, Phone } from "lucide-react";
import { useActionState, useEffect } from "react";
import { callAction, type CallState } from "@/app/console/actions";
import { Panel } from "@/components/hall/led-board";
import { Button } from "@/components/ui/button";
import { CaseAutoCall } from "./auto-call";
import { DockedCallBoard, useCallKeeper } from "./call-keeper";
import type { PredialCheck } from "@/lib/calls/predial";
import type { AutoCallView } from "@/lib/console/queries";
import { CALL_STATUS, CHECK_LABEL, uaeTime } from "@/lib/console/format";
import { cn } from "@/lib/utils";

interface Predial {
  allowed: boolean;
  checks: PredialCheck[];
}

function Lamp({ passed, label }: { passed: boolean; label: string }) {
  return (
    <span className="flex items-center justify-end gap-2">
      <span className="sr-only">{label}: </span>
      <span aria-hidden className={cn("size-2 rounded-full shadow-[0_0_6px_currentColor]", passed ? "bg-led-green text-led-green" : "bg-led-red text-led-red")} />
      <span className={cn("w-[3.6rem] font-led text-[13px] font-black tracking-[0.06em] uppercase led-glow", passed ? "text-led-green" : "text-led-red")}>
        {passed ? "Pass" : "Stop"}
      </span>
    </span>
  );
}

/**
 * The calling board: every pre-dial check for both channels, lit, with the call keys under it.
 * Pressing a key always re-runs the checks on the server; a refusal is logged as a blocked attempt.
 */
export function CallBoard({
  applicationId,
  name,
  reference,
  phone,
  browser,
  calls,
  auto,
}: {
  applicationId: number;
  name: string;
  reference: string;
  auto: AutoCallView;
  phone: Predial;
  browser: Predial;
  calls: { id: number; channel: string; status: string; blockReason: string | null; startedAt: string }[];
}) {
  const [state, action, pending] = useActionState<CallState, FormData>(callAction, {});
  // A browser call is handed to the console's call keeper, so it carries on across console pages.
  const keeper = useCallKeeper();
  const session = state.outcome === "browser" ? state.session : undefined;
  const { open } = keeper;
  useEffect(() => {
    if (session) open({ session, applicationId, name, reference });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps
  // One call at a time: while a browser call is open (here, ready or live; or live on another case),
  // this case can't start another. The key stays focusable so everyone meets the reason.
  const ownOpen = keeper.active?.applicationId === applicationId;
  const elsewhere = keeper.busy && !ownOpen ? keeper.active : null;
  const browserLocked = ownOpen || !!elsewhere;
  const browserBy = new Map(browser.checks.map((c) => [c.name, c]));

  return (
    <>
    <Panel title="Before calling" aside={<span className="font-mono text-[12px] text-led-text/60">checked on every press</span>}>
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-board-rule text-[12px] text-led-text/60">
            <th scope="col" className="px-4 py-2 text-start font-normal">Check</th>
            <th scope="col" className="w-28 px-2 py-2 text-end font-normal">Phone</th>
            <th scope="col" className="w-28 px-4 py-2 text-end font-normal">Browser</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-board-rule">
          {phone.checks.map((c) => {
            const b = browserBy.get(c.name);
            return (
              <tr key={c.name} className="align-top">
                <td className="px-4 py-2.5">
                  <span className="block text-led-text">{CHECK_LABEL[c.name] ?? c.name}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-led-text/65">{c.passed && b && !b.passed ? b.detail : c.detail}</span>
                </td>
                <td className="px-2 py-2.5"><Lamp passed={c.passed} label="Phone" /></td>
                <td className="px-4 py-2.5">{b && <Lamp passed={b.passed} label="Browser" />}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <CaseAutoCall applicationId={applicationId} auto={auto} manualAllowed={phone.allowed || browser.allowed} />

      <form action={action} className="flex flex-wrap items-center gap-3 border-t border-board-rule px-4 py-3.5">
        <input type="hidden" name="applicationId" value={applicationId} />
        <Button type="submit" name="channel" value="phone" disabled={pending} variant="board">
          <Phone aria-hidden /> Call phone
        </Button>
        <Button
          type="submit"
          name="channel"
          value="browser"
          disabled={pending}
          aria-disabled={browserLocked || undefined}
          aria-describedby={browserLocked ? `call-hint-${applicationId}` : undefined}
          onClick={(e) => browserLocked && e.preventDefault()}
          variant="board"
          className={cn(browserLocked && "opacity-60 hover:border-board-rule hover:text-paper")}
        >
          <Globe aria-hidden /> Call in browser
        </Button>
        <p id={`call-hint-${applicationId}`} className="text-[12.5px] text-led-text/65">
          {ownOpen
            ? "The browser call for this case is open below."
            : elsewhere
            ? `A call with ${elsewhere.name} is still on. End it before starting another.`
            : phone.allowed ? "Phone call allowed now." : browser.allowed ? "Browser call allowed; phone is held by a check above." : "No call allowed — pressing will log the refusal."}
        </p>
      </form>

      {state.outcome && !(state.outcome === "browser" && !ownOpen) && (
        <div role="status" className="border-t border-board-rule px-4 py-3 text-[13.5px] leading-relaxed">
          {state.outcome === "blocked" && (
            <p className="text-led-red">
              Call refused before dialling and logged as a blocked attempt: {state.refused?.map((c) => CHECK_LABEL[c.name] ?? c.name).join(" · ")}.
            </p>
          )}
          {state.outcome === "not_configured" && (
            <p className="text-led-amber">
              Checks passed. The ElevenLabs agent isn&apos;t connected yet, so no call was placed
              {state.missing?.length ? <> — missing <span className="font-mono text-[12.5px]">{state.missing.join(", ")}</span></> : null}.
            </p>
          )}
          {state.outcome === "failed" && <p className="text-led-red">Couldn&apos;t start the call. Try again; details are in the server log.</p>}
          {state.outcome === "dialling" && (
            <p className="text-led-amber">Ringing the applicant&apos;s phone now. The call shows below; the transcript and analysis arrive when it ends.</p>
          )}
          {state.outcome === "browser" && ownOpen && <p className="text-led-green">Checks passed. The live call panel is ready below — start it when you are.</p>}
        </div>
      )}

      {calls.length > 0 && (
        <ol className="border-t border-board-rule px-4 py-3 text-[12.5px]">
          {calls.slice(0, 6).map((c) => (
            <li key={c.id} className="grid grid-cols-[6.5rem_4.5rem_1fr] gap-x-3 py-1">
              <span className="font-mono text-led-text/60">{uaeTime(c.startedAt)}</span>
              <span className="text-led-text/60 capitalize">{c.channel}</span>
              <span className={cn(c.status === "blocked" ? "text-led-red" : c.status === "completed" ? "text-led-green" : "text-led-text")}>
                {CALL_STATUS[c.status] ?? c.status}
                {c.blockReason && <span className="text-led-text/60"> — {c.blockReason}</span>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
    <DockedCallBoard applicationId={applicationId} />
    </>
  );
}
