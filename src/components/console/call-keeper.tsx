"use client";

import { ConversationProvider, useConversationControls, useConversationMode, useConversationStatus } from "@elevenlabs/react";
import { PhoneOff } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, use, useEffect, useRef, useState } from "react";
import { browserCallEvent } from "@/app/console/actions";
import { RefCells } from "@/components/hall/ref-cells";
import { Button, buttonVariants } from "@/components/ui/button";
import type { BrowserSession } from "@/lib/calls/start";
import { refusedBy } from "@/lib/calls/tool-outcome";
import { LANGUAGE } from "@/lib/console/format";
import { cn } from "@/lib/utils";
import { type CallLine, type CallPhase, CallBoardView, isInternalTool, TOOL_WORDS } from "./browser-call";

/**
 * Keeps a browser call alive across the whole console. The call lives here, in the desk layout, not in
 * the case page: an officer can open the SMS outbox or Handoffs mid-call and the conversation carries
 * on. The case page draws the full call board from this state; every other page shows the call bar.
 */

interface ActiveCall {
  session: BrowserSession;
  applicationId: number;
  name: string;
  reference: string;
}

interface Keeper {
  active: ActiveCall | null;
  phase: CallPhase;
  lines: CallLine[];
  startedAt: number | null;
  error: string | null;
  speaking: boolean;
  connecting: boolean;
  /** True while a call is connecting or connected: only one at a time. */
  busy: boolean;
  open: (call: ActiveCall) => void;
  start: () => void;
  end: () => void;
  close: () => void;
  /** The case page reports that its full board is on screen, so the bar steps aside. */
  showBoard: () => () => void;
  boardShown: boolean;
}

const KeeperContext = createContext<Keeper | null>(null);

export function useCallKeeper() {
  const keeper = use(KeeperContext);
  if (!keeper) throw new Error("useCallKeeper must be used inside <CallKeeper>");
  return keeper;
}

export function CallKeeper({ children }: { children: React.ReactNode }) {
  return (
    <ConversationProvider>
      <KeeperState>{children}</KeeperState>
    </ConversationProvider>
  );
}

function KeeperState({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { startSession, endSession } = useConversationControls();
  const { status } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  const [active, setActive] = useState<ActiveCall | null>(null);
  const [lines, setLines] = useState<CallLine[]>([]);
  const [phase, setPhase] = useState<CallPhase>("ready");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [boards, setBoards] = useState(0);
  const connected = useRef(false);
  const busy = phase === "starting" || phase === "live";

  // Leaving the console (reload, closing the tab) would cut the caller off: ask first.
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  function open(call: ActiveCall) {
    if (busy) return;
    connected.current = false;
    setActive(call);
    setLines([]);
    setPhase("ready");
    setError(null);
    setStartedAt(null);
  }

  function start() {
    if (!active) return;
    const { session } = active;
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

  const value: Keeper = {
    active,
    phase,
    lines,
    startedAt,
    error,
    speaking: isSpeaking,
    connecting: status === "connecting",
    busy,
    open,
    start,
    end: () => endSession(),
    close: () => {
      if (busy || !active) return;
      // A call that was opened but never started frees its attempt, so the queue stops saying "Dialling".
      if (phase === "ready") void browserCallEvent(active.session.attemptId, "abandoned");
      setActive(null);
      setLines([]);
      setPhase("ready");
      // The keys that had focus are gone: hand it to the page, not to <body>.
      requestAnimationFrame(() => document.getElementById("console-main")?.focus());
    },
    showBoard: () => {
      setBoards((n) => n + 1);
      return () => setBoards((n) => n - 1);
    },
    boardShown: boards > 0,
  };

  return <KeeperContext value={value}>{children}</KeeperContext>;
}

const OUTRO = "Call ended. The full record (transcript, summary, latency) appears in Call records as soon as ElevenLabs sends it.";

/** The full live call board, on the case it belongs to. Draws nothing for any other case. */
export function DockedCallBoard({ applicationId }: { applicationId: number }) {
  const k = useCallKeeper();
  const mine = k.active?.applicationId === applicationId;
  const { showBoard } = k;
  useEffect(() => (mine ? showBoard() : undefined), [mine]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!mine || !k.active) return null;
  const { session } = k.active;
  return (
    <CallBoardView
      key={session.attemptId}
      language={session.language}
      phase={k.phase}
      connecting={k.connecting}
      speaking={k.speaking}
      lines={k.lines}
      startedAt={k.startedAt}
      error={k.error}
      intro={`You'll speak as the applicant. Your browser will ask for the microphone. The assistant opens in ${LANGUAGE[session.language]}; speak another language and it switches. You can open other console pages during the call; it keeps going.`}
      outro={OUTRO}
      onStart={k.start}
      onEnd={k.end}
      onClose={k.close}
    />
  );
}

function useClock(startedAt: number | null, running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);
  const s = startedAt ? Math.max(0, Math.floor((now - startedAt) / 1000)) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Plain words for what the call is doing now: the latest line said, or the action under way. */
function nowLine(lines: CallLine[]) {
  const shown = lines.filter((l) => l.kind === "say" || !isInternalTool(l.name));
  const last = shown.at(-1);
  if (!last) return null;
  if (last.kind === "tool") return TOOL_WORDS[last.name]?.row ?? null;
  return `${last.who === "agent" ? "Assistant" : "Applicant"}: ${last.text}`;
}

/**
 * The call bar: the call, lit on a slim board pinned under the tabs, on every console page except the
 * one already showing its full board. Its height is published as --call-bar so the sticky queue,
 * anchors and focused controls stay clear of it.
 */
export function LiveCallBar() {
  const k = useCallKeeper();
  const pathname = usePathname();
  const clock = useClock(k.startedAt, k.phase === "live");
  const bar = useRef<HTMLElement>(null);
  const keys = useRef<HTMLSpanElement>(null);
  const shown = !!k.active && !k.boardShown;

  useEffect(() => {
    const el = bar.current;
    const root = document.documentElement;
    if (!shown || !el) return;
    const write = () => root.style.setProperty("--call-bar", `${el.offsetHeight}px`);
    write();
    const ro = new ResizeObserver(write);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--call-bar");
    };
  }, [shown]);

  // The keys change with the phase (End call → Close): keep keyboard focus on them.
  useEffect(() => {
    const active = document.activeElement;
    if (!active || active === document.body || keys.current?.contains(active)) keys.current?.querySelector<HTMLElement>("button, a")?.focus({ preventScroll: true });
  }, [k.phase]);

  if (!shown || !k.active) return null;

  const { applicationId, name, reference } = k.active;
  const word = k.phase === "live" ? (k.speaking ? "Speaking" : "Listening") : k.phase === "starting" || k.connecting ? "Connect" : k.phase === "ended" ? "Ended" : k.phase === "error" ? "Failed" : "Ready";
  const lampTone = k.phase === "live" ? "bg-led-green text-led-green" : k.phase === "error" ? "bg-led-red text-led-red" : k.phase === "ended" ? "bg-led-text/25 text-led-text/25" : "bg-led-amber text-led-amber";
  const wordTone = k.phase === "live" ? "text-led-green" : k.phase === "error" ? "text-led-red" : k.phase === "ended" ? "text-led-text/60" : "text-led-amber";
  const announce = k.phase === "live" ? "connected" : k.phase === "starting" ? "connecting" : k.phase === "ended" ? "ended" : k.phase === "error" ? "failed" : "ready on the case";
  const caseHref = `/console/cases/${applicationId}`;
  const onCase = pathname === caseHref;

  return (
    <section ref={bar} aria-label="Browser call" className="sticky top-0 z-40 border-b border-board-rule bg-board text-led-text">
      <p role="status" className="sr-only">
        Call with {name}: {announce}
      </p>
      <div className="mx-auto flex max-w-[1440px] items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:flex-wrap sm:px-6">
        <span aria-hidden className="flex shrink-0 items-center gap-2.5">
          <span className={cn("size-2.5 rounded-full shadow-[0_0_8px_currentColor]", lampTone)} />
          <span className={cn("font-led text-[15px] leading-none font-black tracking-[0.06em] uppercase led-glow sm:w-[7.5rem]", wordTone)}>{word}</span>
        </span>
        <span className="flex min-w-0 items-center gap-3 text-[13.5px]">
          <span className="truncate text-paper">{name}</span>
          <RefCells value={reference} tone="board" size="sm" className="max-sm:hidden" />
          {k.phase === "live" && <span className="font-mono text-[12px] text-led-text/60 tabular-nums">{clock}</span>}
        </span>
        {k.phase === "error" ? (
          <span role="alert" className="min-w-0 flex-1 truncate text-[13px] text-led-red max-md:hidden">
            {k.error ?? "The call couldn't connect."}
          </span>
        ) : (
          <span dir="auto" className="min-w-0 flex-1 truncate text-[13px] text-led-text/75 max-md:hidden">
            {k.phase === "ready"
              ? "Ready on the case. Start it there when you are."
              : k.phase === "starting"
                ? "Connecting the call…"
                : k.phase === "ended"
                  ? "Call ended. The record arrives in Call records shortly."
                  : nowLine(k.lines)}
          </span>
        )}
        <span ref={keys} className="ms-auto flex shrink-0 items-center gap-3">
          {!onCase && (
            <Link href={caseHref} className={buttonVariants({ variant: "board", size: "sm" })}>
              Back to case
            </Link>
          )}
          {k.busy && (
            <Button type="button" variant="board" size="sm" onClick={k.end} className="hover:border-led-red hover:text-led-red">
              <PhoneOff aria-hidden /> End call
            </Button>
          )}
          {!k.busy && (
            <Button type="button" variant="board" size="sm" onClick={k.close}>
              Close
            </Button>
          )}
        </span>
      </div>
    </section>
  );
}
