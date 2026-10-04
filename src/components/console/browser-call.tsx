"use client";

import { ConversationProvider, useConversationControls, useConversationMode, useConversationStatus } from "@elevenlabs/react";
import { Mic, PhoneOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { browserCallEvent } from "@/app/console/actions";
import { Panel } from "@/components/hall/led-board";
import { Button } from "@/components/ui/button";
import type { BrowserSession } from "@/lib/calls/start";
import { refusedBy } from "@/lib/calls/tool-outcome";
import { LANGUAGE } from "@/lib/console/format";
import { cn } from "@/lib/utils";

export type CallLine =
  | { kind: "say"; id: string; who: "agent" | "user"; text: string }
  | { kind: "tool"; id: string; name: string; state: "running" | "ok" | "error" };

export type CallPhase = "ready" | "starting" | "live" | "ended" | "error";

/** Plain words for each tool, so the officer reads what the agent is doing, not function names. */
const TOOL_WORDS: Record<string, { row: string; short: string }> = {
  verify_identity: { row: "Checking identity", short: "Identity" },
  get_case: { row: "Reading the case", short: "Case" },
  submit_correction: { row: "Sending correction for approval", short: "Correction" },
  send_upload_link: { row: "Texting upload link", short: "Upload link" },
  check_upload: { row: "Checking the upload", short: "Upload" },
  list_slots: { row: "Finding appointment slots", short: "Slots" },
  book_appointment: { row: "Booking appointment", short: "Booking" },
  create_followup: { row: "Recording follow-up", short: "Follow-up" },
  create_callback: { row: "Booking a callback", short: "Callback" },
  record_opt_out: { row: "Adding to do-not-call list", short: "Opt-out" },
  language_detection: { row: "Switching language", short: "Language" },
  voicemail_detection: { row: "Checking for voicemail", short: "Voicemail" },
  end_call: { row: "Ending the call", short: "Ended" },
};

/**
 * ElevenLabs' own plumbing between call steps (moving from "open" to "verify", and so on) also arrives
 * as tool calls. It isn't something the agent does for the caller, so the board leaves it out.
 */
export const isInternalTool = (name: string) => name.startsWith("notify_condition") || name === "transfer_to_agent";

const lamp = { running: "bg-led-amber text-led-amber", ok: "bg-led-green text-led-green", error: "bg-led-red text-led-red" } as const;
const lampWord = { running: "text-led-amber", ok: "text-led-green", error: "text-led-red" } as const;
const stateWord = { running: "Check", ok: "Done", error: "Refused" } as const;

/**
 * The live call board: the call's state and what the agent has done so far at a glance, then what is
 * being said and each action in plain words. Drawn the same for a real browser call and for the local
 * replay of a recorded one.
 */
export function CallBoardView({
  title = "Live call — browser",
  language,
  phase,
  connecting,
  speaking,
  lines,
  startedAt,
  error,
  intro,
  outro,
  onStart,
  onEnd,
  onClose,
  clockRate = 1,
}: {
  title?: string;
  language: keyof typeof LANGUAGE;
  phase: CallPhase;
  connecting: boolean;
  speaking: boolean;
  lines: CallLine[];
  startedAt: number | null;
  error: string | null;
  intro: string;
  outro: string;
  onStart: () => void;
  onEnd: () => void;
  onClose: () => void;
  /** The replay runs faster than real time; its clock keeps the recorded call's time. */
  clockRate?: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  const board = useRef<HTMLDivElement>(null);
  const keys = useRef<HTMLDivElement>(null);
  const feed = useRef<HTMLOListElement>(null);
  const following = useRef(true);
  const mounted = useRef(false);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => setNow(Date.now()), 1000 / clockRate);
    return () => clearInterval(timer);
  }, [phase, clockRate]);

  // Follow new lines only while the reader is at the bottom; reading back up isn't interrupted.
  useLayoutEffect(() => {
    const el = feed.current;
    if (el && following.current) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // The key changes with the phase (Start → End call → Close): keep keyboard focus on it. On first
  // appearance, bring the board into view and put focus on its key.
  useEffect(() => {
    const active = document.activeElement;
    const first = !mounted.current;
    mounted.current = true;
    if (first) board.current?.scrollIntoView({ block: "nearest" });
    if (first || active === document.body || keys.current?.contains(active) || !active) keys.current?.querySelector("button")?.focus();
  }, [phase]);

  const elapsed = startedAt ? Math.max(0, Math.floor(((now - startedAt) * clockRate) / 1000)) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const word = phase === "live" ? (speaking ? "Speaking" : "Listening") : phase === "starting" || connecting ? "Connect" : phase === "ended" ? "Ended" : phase === "error" ? "Failed" : "Ready";
  const tone = phase === "live" ? "text-led-green" : phase === "error" ? "text-led-red" : phase === "ended" ? "text-led-text/60" : "text-led-amber";
  const shown = lines.filter((l) => l.kind === "say" || !isInternalTool(l.name));
  const tools = shown.filter((l): l is Extract<CallLine, { kind: "tool" }> => l.kind === "tool");

  // What the agent has done so far: each action once, in order, lit by its latest outcome.
  const progress = new Map<string, Extract<CallLine, { kind: "tool" }>["state"]>();
  for (const t of tools) progress.set(t.name, t.state);

  // Screen readers hear the call's turning points, not every line (the officer hears the call itself).
  const lastDone = [...tools].reverse().find((t) => t.state !== "running");
  const announce =
    phase === "live" && lastDone
      ? `${TOOL_WORDS[lastDone.name]?.row ?? lastDone.name}: ${lastDone.state === "ok" ? "done" : "refused"}`
      : phase === "live" ? "Call connected" : phase === "ended" ? "Call ended" : phase === "error" ? "Call failed" : phase === "starting" ? "Connecting" : "";

  return (
    <div ref={board}>
      <Panel title={title} aside={<span className="font-mono text-[12px] text-led-text/60">{LANGUAGE[language]} · {clock}</span>} className="mt-4">
        <p role="status" className="sr-only">{announce}</p>
        <div className="border-b border-board-rule px-4 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="flex items-center gap-3">
              <span aria-hidden className={cn("size-2.5 rounded-full shadow-[0_0_8px_currentColor]", phase === "live" ? "bg-led-green text-led-green" : phase === "error" ? "bg-led-red text-led-red" : phase === "ended" ? "bg-led-text/25 text-led-text/25" : "bg-led-amber text-led-amber")} />
              <span aria-hidden className={cn("font-led text-[26px] leading-none font-black tracking-[0.04em] uppercase led-glow", tone)}>{word}</span>
            </span>
            <div ref={keys} className="flex items-center gap-3">
              {(phase === "ready" || phase === "error") && (
                <Button type="button" variant="board" onClick={onStart}>
                  <Mic aria-hidden /> {phase === "error" ? "Try again" : "Start the call"}
                </Button>
              )}
              {(phase === "starting" || phase === "live") && (
                <Button type="button" variant="board" onClick={onEnd} className="hover:border-led-red hover:text-led-red">
                  <PhoneOff aria-hidden /> End call
                </Button>
              )}
              {phase === "ended" && (
                <Button type="button" variant="board" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
          {progress.size > 0 && (
            <ol aria-label="What the assistant has done" className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]">
              {[...progress].map(([name, state]) => (
                <li key={name} className="flex items-center gap-2">
                  <span aria-hidden className={cn("size-2 rounded-full shadow-[0_0_6px_currentColor]", lamp[state])} />
                  <span className={state === "error" ? "text-led-red" : "text-led-text/85"}>{TOOL_WORDS[name]?.short ?? name}</span>
                  <span className="sr-only">: {stateWord[state]}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        {phase === "ready" && <p className="px-4 py-4 text-[13.5px] leading-relaxed text-led-text/75">{intro}</p>}
        {error && <p role="alert" className="border-b border-board-rule px-4 py-3 text-[13.5px] text-led-red">{error}</p>}

        {shown.length > 0 && (
          <ol
            ref={feed}
            tabIndex={0}
            aria-label="Call transcript"
            onScroll={(e) => {
              const el = e.currentTarget;
              following.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
            }}
            className="max-h-[420px] divide-y divide-board-rule overflow-y-auto"
          >
            {shown.map((line) =>
              line.kind === "say" ? (
                <li key={line.id} className="grid gap-x-3 gap-y-1 px-4 py-2.5 text-[14px] leading-snug sm:grid-cols-[6.5rem_1fr]">
                  <span className={cn("text-[12.5px]", line.who === "agent" ? "text-led-amber" : "text-led-text/60")}>{line.who === "agent" ? "Assistant" : "Applicant"}</span>
                  <span dir="auto" className="max-w-[68ch] text-led-text">{line.text}</span>
                </li>
              ) : (
                <li key={line.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 bg-board-2/50 px-4 py-2 text-[13px] sm:grid-cols-[6.5rem_1fr_auto]">
                  <span className="col-span-2 text-[12.5px] text-led-text/60 sm:col-span-1">Action</span>
                  <span className="text-led-text/85">
                    {TOOL_WORDS[line.name]?.row ?? line.name}
                    {TOOL_WORDS[line.name] && <span className="ms-1.5 font-mono text-[11.5px] text-led-text/45">{line.name}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span aria-hidden className={cn("size-2 rounded-full shadow-[0_0_6px_currentColor]", lamp[line.state])} />
                    <span className={cn("w-[5.25rem] font-led text-[14px] font-black tracking-[0.06em] uppercase led-glow", lampWord[line.state])}>{stateWord[line.state]}</span>
                  </span>
                </li>
              ),
            )}
          </ol>
        )}
        {phase === "ended" && <p className="border-t border-board-rule px-4 py-3 text-[13px] text-led-text/70">{outro}</p>}
      </Panel>
    </div>
  );
}

const OUTRO = "Call ended. The full record (transcript, summary, latency) appears in Call records as soon as ElevenLabs sends it.";

function LiveCall({ session, onClose }: { session: BrowserSession; onClose: () => void }) {
  const router = useRouter();
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const [lines, setLines] = useState<CallLine[]>([]);
  const [phase, setPhase] = useState<CallPhase>("ready");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const connected = useRef(false);

  function start() {
    setPhase("starting");
    setError(null);
    startSession({
      conversationToken: session.conversationToken,
      connectionType: "webrtc",
      dynamicVariables: session.dynamicVariables,
      overrides: { agent: { language: session.language } },
      onConnect: () => {
        connected.current = true;
        setPhase("live");
        setStartedAt(Date.now());
        void browserCallEvent(session.attemptId, "live");
      },
      onMessage: ({ message, role, event_id }) => {
        if (message.trim()) setLines((l) => [...l, { kind: "say", id: `m${event_id}-${role}`, who: role, text: message }]);
      },
      onAgentToolRequest: ({ tool_name, tool_call_id }) =>
        setLines((l) => [...l, { kind: "tool", id: tool_call_id, name: tool_name, state: "running" }]),
      // Two events can report a tool's outcome: the bare one (transport errors only) and the full one,
      // which carries our backend's answer and so can say "refused". The full one always wins.
      onAgentToolResponse: (e) => {
        const full = "full_tool_result" in e;
        const state = e.is_error || (full && (e.is_blocked || refusedBy(e.full_tool_result))) ? "error" : "ok";
        setLines((l) => l.map((x) => (x.kind === "tool" && x.id === e.tool_call_id && (full || x.state === "running") ? { ...x, state } : x)));
      },
      onError: (message) => {
        setError(message || "The call couldn't connect.");
        if (!connected.current) {
          setPhase("error");
          void browserCallEvent(session.attemptId, "abandoned");
        }
      },
      onDisconnect: () => {
        if (!connected.current) return;
        setPhase("ended");
        // The record (transcript, analysis, latency) arrives by webhook shortly after the call ends.
        setTimeout(() => router.refresh(), 4000);
      },
    });
  }

  return (
    <CallBoardView
      language={session.language}
      phase={phase}
      connecting={status === "connecting"}
      speaking={isSpeaking}
      lines={lines}
      startedAt={startedAt}
      error={error}
      intro={`You'll speak as the applicant. Your browser will ask for the microphone. The assistant opens in ${LANGUAGE[session.language]}; speak another language and it switches.`}
      outro={OUTRO}
      onStart={start}
      onEnd={() => endSession()}
      onClose={onClose}
    />
  );
}

/** The browser call, in its own conversation context. */
export function BrowserCall({ session, onClose }: { session: BrowserSession; onClose: () => void }) {
  return (
    <ConversationProvider>
      <LiveCall session={session} onClose={onClose} />
    </ConversationProvider>
  );
}
