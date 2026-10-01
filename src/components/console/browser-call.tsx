"use client";

import { ConversationProvider, useConversationControls, useConversationMode, useConversationStatus } from "@elevenlabs/react";
import { Mic, PhoneOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { browserCallEvent } from "@/app/console/actions";
import { Panel } from "@/components/hall/led-board";
import { Button } from "@/components/ui/button";
import type { BrowserSession } from "@/lib/calls/start";
import { LANGUAGE } from "@/lib/console/format";
import { cn } from "@/lib/utils";

type Line =
  | { kind: "say"; id: string; who: "agent" | "user"; text: string }
  | { kind: "tool"; id: string; name: string; state: "running" | "ok" | "error" };

/** Plain words for each tool, so the officer reads what the agent is doing, not function names. */
const TOOL_WORDS: Record<string, string> = {
  verify_identity: "Checking identity",
  get_case: "Reading the case",
  submit_correction: "Sending correction for approval",
  send_upload_link: "Texting upload link",
  check_upload: "Checking the upload",
  list_slots: "Finding appointment slots",
  book_appointment: "Booking appointment",
  create_followup: "Recording follow-up",
  create_callback: "Booking a callback",
  record_opt_out: "Adding to do-not-call list",
  language_detection: "Switching language",
  end_call: "Ending the call",
};

const lamp = { running: "bg-led-amber text-led-amber", ok: "bg-led-green text-led-green", error: "bg-led-red text-led-red" } as const;

function LiveCall({ session, onClose }: { session: BrowserSession; onClose: () => void }) {
  const router = useRouter();
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const [lines, setLines] = useState<Line[]>([]);
  const [phase, setPhase] = useState<"ready" | "starting" | "live" | "ended" | "error">("ready");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const connected = useRef(false);
  const feed = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [lines]);

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
      onAgentToolResponse: ({ tool_call_id, is_error }) =>
        setLines((l) => l.map((x) => (x.kind === "tool" && x.id === tool_call_id ? { ...x, state: is_error ? "error" : "ok" } : x))),
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

  const elapsed = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const word = phase === "live" ? (isSpeaking ? "Speaking" : "Listening") : phase === "starting" || status === "connecting" ? "Connect" : phase === "ended" ? "Ended" : phase === "error" ? "Failed" : "Ready";
  const tone = phase === "live" ? "text-led-green" : phase === "error" ? "text-led-red" : phase === "ended" ? "text-led-text/60" : "text-led-amber";

  return (
    <Panel
      title="Live call — browser"
      aside={<span className="font-mono text-[12px] text-led-text/60">{LANGUAGE[session.language]} · {clock}</span>}
      className="mt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-board-rule px-4 py-3.5">
        <span className="flex items-center gap-3">
          <span aria-hidden className={cn("size-2.5 rounded-full shadow-[0_0_8px_currentColor]", phase === "live" ? "bg-led-green text-led-green" : phase === "error" ? "bg-led-red text-led-red" : phase === "ended" ? "bg-led-text/25 text-led-text/25" : "bg-led-amber text-led-amber")} />
          <span role="status" className={cn("font-led text-[18px] leading-none font-black tracking-[0.06em] uppercase led-glow", tone)}>{word}</span>
        </span>
        <div className="flex items-center gap-3">
          {(phase === "ready" || phase === "error") && (
            <Button type="button" variant="board" onClick={start}>
              <Mic aria-hidden /> {phase === "error" ? "Try again" : "Start the call"}
            </Button>
          )}
          {(phase === "starting" || phase === "live") && (
            <Button type="button" variant="board" onClick={() => endSession()} className="hover:border-led-red hover:text-led-red">
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

      {phase === "ready" && (
        <p className="px-4 py-4 text-[13.5px] leading-relaxed text-led-text/75">
          You&apos;ll speak as the applicant. Your browser will ask for the microphone. The assistant opens in {LANGUAGE[session.language]}; speak another language and it switches.
        </p>
      )}
      {error && <p role="alert" className="border-b border-board-rule px-4 py-3 text-[13.5px] text-led-red">{error}</p>}

      {lines.length > 0 && (
        <ol ref={feed} aria-live="polite" aria-label="Call transcript" className="max-h-[420px] divide-y divide-board-rule overflow-y-auto">
          {lines.map((line) =>
            line.kind === "say" ? (
              <li key={line.id} className="grid grid-cols-[6.5rem_1fr] gap-x-3 px-4 py-2.5 text-[14px] leading-snug">
                <span className={cn("text-[12.5px]", line.who === "agent" ? "text-led-amber" : "text-led-text/60")}>{line.who === "agent" ? "Assistant" : "Applicant"}</span>
                <span dir="auto" className="text-led-text">{line.text}</span>
              </li>
            ) : (
              <li key={line.id} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-x-3 bg-board-2/50 px-4 py-2 text-[13px]">
                <span className="font-mono text-[11.5px] text-led-text/50">tool</span>
                <span className="text-led-text/85">
                  {TOOL_WORDS[line.name] ?? line.name} <span className="font-mono text-[11.5px] text-led-text/45">{line.name}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span aria-hidden className={cn("size-2 rounded-full shadow-[0_0_6px_currentColor]", lamp[line.state])} />
                  <span className={cn("w-[4.5rem] font-led text-[12.5px] font-black tracking-[0.06em] uppercase led-glow", line.state === "running" ? "text-led-amber" : line.state === "ok" ? "text-led-green" : "text-led-red")}>
                    {line.state === "running" ? "Check" : line.state === "ok" ? "Done" : "Refused"}
                  </span>
                </span>
              </li>
            ),
          )}
        </ol>
      )}
      {phase === "ended" && (
        <p className="border-t border-board-rule px-4 py-3 text-[13px] text-led-text/70">
          Call ended. The full record (transcript, summary, latency) appears in Call records as soon as ElevenLabs sends it.
        </p>
      )}
    </Panel>
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
