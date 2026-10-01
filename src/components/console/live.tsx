"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Keeps the console current while a call or review is happening. Pauses when the tab is hidden. */
export function AutoRefresh({ everyMs = 4000 }: { everyMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => document.visibilityState === "visible" && router.refresh();
    const timer = setInterval(tick, everyMs);
    return () => clearInterval(timer);
  }, [router, everyMs]);
  return null;
}

export type LampState = "pass" | "fix" | "route" | "officer" | "pending";

const lamp: Record<LampState, string> = {
  pass: "bg-led-green text-led-green",
  fix: "bg-led-amber text-led-amber",
  route: "bg-led-blue text-led-blue",
  officer: "bg-led-red text-led-red",
  pending: "bg-led-text/25 text-led-text/25",
};
const word: Record<LampState, string> = {
  pass: "text-led-green",
  fix: "text-led-amber",
  route: "text-led-blue",
  officer: "text-led-red",
  pending: "text-led-text/60",
};

/**
 * A board lamp + state word that, when its state changes while you watch (an approval, a call
 * ending), holds amber for the check and then settles on the new colour. First paint is still.
 */
export function ChangeLamp({ state, label, className }: { state: LampState; label: string; className?: string }) {
  const [initial] = useState(state);
  const changed = initial !== state;
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        key={`lamp-${state}`}
        aria-hidden
        className={cn("size-2 shrink-0 rounded-full shadow-[0_0_8px_currentColor]", lamp[state], changed && "animate-led-check")}
      />
      <span
        key={`word-${state}`}
        className={cn("font-led text-[14px] leading-none font-black tracking-[0.06em] uppercase led-glow", word[state], changed && "animate-led-check-text")}
      >
        {label}
      </span>
    </span>
  );
}

const TABS = [
  { href: "/console", label: "Cases", match: (p: string) => p === "/console" || p.startsWith("/console/cases") },
  { href: "/console/records", label: "Call records" },
  { href: "/console/handoffs", label: "Handoffs" },
  { href: "/console/sms", label: "SMS outbox" },
  { href: "/console/blocked", label: "Blocked actions" },
  { href: "/console/evidence", label: "Evidence" },
] as const;

/** The console's sections. Counts come from the server so the tabs say where work is waiting. */
export function ConsoleTabs({ counts }: { counts: Partial<Record<(typeof TABS)[number]["href"], number>> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Console sections" className="border-b border-rule bg-hall">
      <ul className="mx-auto flex max-w-[1440px] gap-1 overflow-x-auto px-6">
        {TABS.map((tab) => {
          const active = "match" in tab ? tab.match(pathname) : pathname.startsWith(tab.href);
          const count = counts[tab.href];
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex h-11 items-center gap-2 border-b-2 px-3 text-[14px] whitespace-nowrap transition-colors",
                  active ? "border-ink font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink",
                )}
              >
                {tab.label}
                {!!count && (
                  <span className="rounded-[4px] bg-ink px-1.5 py-0.5 font-mono text-[11px] leading-none text-paper">{count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
