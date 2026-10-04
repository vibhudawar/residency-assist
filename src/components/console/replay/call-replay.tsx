"use client";

import { useEffect, useRef, useState } from "react";
import { type CallLine, type CallPhase, CallBoardView } from "@/components/console/browser-call";
import type { LANGUAGE } from "@/lib/console/format";

export type ReplayEvent =
  | { at: number; kind: "say"; who: "agent" | "user"; text: string }
  | { at: number; kind: "tool"; id: string; name: string }
  | { at: number; kind: "result"; id: string; ok: boolean };

export interface Replay {
  source: string;
  language: string;
  durationSecs: number;
  events: ReplayEvent[];
}

/** Roughly how long a line takes to say, so the board shows "Speaking" while the assistant talks. */
const sayingMs = (text: string) => Math.min(9000, 600 + text.length * 55);

/**
 * Plays a recorded call on the live call board, at its real pace or faster, for design review and
 * local demos. Nothing is sent anywhere. `seekTo` (seconds) starts the board at that moment.
 */
/** The board as it stands `at` seconds into the call: every line said and tool used so far. */
function linesAt(events: ReplayEvent[], at: number): CallLine[] {
  const lines: CallLine[] = [];
  events.forEach((e, i) => {
    if (e.at > at) return;
    if (e.kind === "say") lines.push({ kind: "say", id: `say-${i}`, who: e.who, text: e.text });
    else if (e.kind === "tool") lines.push({ kind: "tool", id: e.id, name: e.name, state: "running" });
    else {
      const tool = lines.find((l) => l.kind === "tool" && l.id === e.id);
      if (tool && tool.kind === "tool") tool.state = e.ok ? "ok" : "error";
    }
  });
  return lines;
}

/**
 * Plays a recorded call on the live call board, at its real pace or faster, for design review and
 * local demos. Nothing is sent anywhere. `seekTo` (seconds) opens the board at that moment.
 */
export function CallReplay({ replay, speed = 1, seekTo }: { replay: Replay; speed?: number; seekTo?: number }) {
  const ended = seekTo !== undefined && seekTo >= replay.durationSecs;
  const [phase, setPhase] = useState<CallPhase>(seekTo === undefined ? "ready" : ended ? "ended" : "live");
  const [lines, setLines] = useState<CallLine[]>(() => (seekTo === undefined ? [] : linesAt(replay.events, seekTo)));
  const [speaking, setSpeaking] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(() => (seekTo === undefined ? null : Date.now() - (seekTo * 1000) / speed));
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  function apply(e: ReplayEvent, i: number) {
    if (e.kind === "say") {
      setLines((l) => [...l, { kind: "say", id: `say-${i}`, who: e.who, text: e.text }]);
      if (e.who === "agent") {
        setSpeaking(true);
        later(sayingMs(e.text) / speed, () => setSpeaking(false));
      } else setSpeaking(false);
    } else if (e.kind === "tool") setLines((l) => [...l, { kind: "tool", id: e.id, name: e.name, state: "running" }]);
    else setLines((l) => l.map((x) => (x.kind === "tool" && x.id === e.id ? { ...x, state: e.ok ? "ok" : "error" } : x)));
  }

  /** Everything after `from` seconds, at the replay's pace, then the call ends. */
  function schedule(from: number) {
    replay.events.forEach((e, i) => {
      if (e.at > from) later(((e.at - from) * 1000) / speed, () => apply(e, i));
    });
    later(((replay.durationSecs - from) * 1000) / speed, () => {
      setSpeaking(false);
      setPhase("ended");
    });
  }

  function start() {
    clear();
    setLines([]);
    setPhase("starting");
    later(700 / speed, () => {
      setPhase("live");
      setStartedAt(Date.now());
      schedule(0);
    });
  }

  useEffect(() => {
    if (seekTo !== undefined && !ended) schedule(seekTo);
    return clear;
    // Runs once, on arrival, when the page asks for a moment of the call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CallBoardView
      title="Live call — browser (replay)"
      language={(replay.language in { en: 1, ar: 1, hi: 1 } ? replay.language : "en") as keyof typeof LANGUAGE}
      phase={phase}
      connecting={false}
      speaking={speaking}
      lines={lines}
      startedAt={startedAt}
      error={null}
      intro="A replay of a recorded test call, played on the live call board. Nothing is sent; no credits are used."
      outro="Replay finished. In a real call, the full record (transcript, summary, latency) appears in Call records."
      onStart={start}
      onEnd={() => {
        clear();
        setSpeaking(false);
        setPhase("ended");
      }}
      onClose={() => {
        clear();
        setLines([]);
        setPhase("ready");
      }}
      clockRate={speed}
    />
  );
}
