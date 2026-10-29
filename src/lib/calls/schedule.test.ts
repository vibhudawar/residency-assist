import { describe, expect, it } from "vitest";
import { afterRefusal, nextCallTime, nextDayCallTime } from "./schedule";

// UAE is UTC+4 all year.
const uae = (iso: string) => new Date(`${iso}+04:00`);

describe("nextCallTime", () => {
  it("rings now during calling hours", () => {
    const now = uae("2026-10-05T14:30:00");
    expect(nextCallTime(now)).toEqual(now);
    expect(nextCallTime(uae("2026-10-05T09:00:00"))).toEqual(uae("2026-10-05T09:00:00"));
  });

  it("waits for 09:00 the same morning before hours", () => {
    expect(nextCallTime(uae("2026-10-05T01:40:00"))).toEqual(uae("2026-10-05T09:00:00"));
  });

  it("waits for 09:00 tomorrow from 18:00 on", () => {
    expect(nextCallTime(uae("2026-10-05T18:00:00"))).toEqual(uae("2026-10-06T09:00:00"));
    expect(nextCallTime(uae("2026-10-05T23:59:00"))).toEqual(uae("2026-10-06T09:00:00"));
  });
});

describe("nextDayCallTime", () => {
  it("retries at the same time tomorrow inside hours", () => {
    expect(nextDayCallTime(uae("2026-10-05T14:30:00"))).toEqual(uae("2026-10-06T14:30:00"));
  });

  it("moves an out-of-hours time to 09:00 the next day", () => {
    expect(nextDayCallTime(uae("2026-10-05T07:00:00"))).toEqual(uae("2026-10-06T09:00:00"));
    expect(nextDayCallTime(uae("2026-10-05T19:00:00"))).toEqual(uae("2026-10-06T09:00:00"));
  });
});

describe("afterRefusal", () => {
  const now = uae("2026-10-05T20:00:00");
  it("stops for good on consent, do-not-call, officer-only or nothing to fix", () => {
    for (const name of ["consent", "do_not_call", "officer_only", "fixable_issue"] as const) {
      expect(afterRefusal([{ name, detail: "" }], now)).toEqual({ action: "cancel" });
    }
  });

  it("stops when the retry limits are spent, but waits a day after today's try", () => {
    expect(afterRefusal([{ name: "attempt_limits", detail: "Call declined twice — stop calling, SMS and portal only." }], now)).toEqual({ action: "cancel" });
    expect(afterRefusal([{ name: "attempt_limits", detail: "Already called today — next attempt tomorrow." }], now)).toEqual({ action: "reschedule", dueAt: uae("2026-10-06T09:00:00") });
  });

  it("waits for calling hours, and briefly for a call already in progress", () => {
    expect(afterRefusal([{ name: "calling_hours", detail: "" }], now)).toEqual({ action: "reschedule", dueAt: uae("2026-10-06T09:00:00") });
    expect(afterRefusal([{ name: "no_active_call", detail: "" }], now)).toEqual({ action: "reschedule", dueAt: new Date(now.getTime() + 5 * 60 * 1000) });
  });

  it("a permanent reason wins over a temporary one", () => {
    expect(afterRefusal([{ name: "calling_hours", detail: "" }, { name: "consent", detail: "" }], now)).toEqual({ action: "cancel" });
  });
});
