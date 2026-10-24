/**
 * When an automatic call may ring, as pure functions (UAE time, 09:00–18:00, no daylight saving).
 * The pre-dial checks still decide at dial time; these only pick when to try.
 */
import { addDays, uaeDateTime, uaeHour, uaeToday } from "@/lib/time";

export const WINDOW = { start: "09:00", startHour: 9, endHour: 18 } as const;
void addDays; // TEMPORARY (for recording): used only by the disabled calling-hours body in nextCallTime. Remove when restoring.

/** Now, if it's calling hours; otherwise the next 09:00 UAE. */
export function nextCallTime(now: Date): Date {
  // TEMPORARY (for recording): calling-hours window disabled, so an auto-call is due now at any time.
  // Restore by removing this line and uncommenting the body below.
  return now;
  // const hour = uaeHour(now);
  // if (hour >= WINDOW.startHour && hour < WINDOW.endHour) return now;
  // const day = hour < WINDOW.startHour ? uaeToday(now) : addDays(uaeToday(now), 1);
  // return uaeDateTime(day, WINDOW.start);
}

/** A retry: the next day, at the same time if that's within calling hours, otherwise 09:00 that day. At most one try a day. */
export function nextDayCallTime(from: Date): Date {
  const sameTime = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  const hour = uaeHour(sameTime);
  if (hour >= WINDOW.startHour && hour < WINDOW.endHour) return sameTime;
  return uaeDateTime(uaeToday(sameTime), WINDOW.start);
}

export type PredialName = "consent" | "do_not_call" | "calling_hours" | "officer_only" | "fixable_issue" | "attempt_limits" | "no_active_call";

/**
 * A due call the pre-dial checks refused: try again later (only hours, today's try already used, or a
 * call already in progress), or stop for good (consent, do-not-call, officer-only, nothing to fix,
 * or the retry limits are spent).
 */
export function afterRefusal(failed: { name: PredialName; detail: string }[], now: Date): { action: "reschedule"; dueAt: Date } | { action: "cancel" } {
  const names = new Set(failed.map((c) => c.name));
  const permanent = ["consent", "do_not_call", "officer_only", "fixable_issue"].some((n) => names.has(n as PredialName));
  if (permanent) return { action: "cancel" };
  const limit = failed.find((c) => c.name === "attempt_limits");
  // Only "already called today" waits for tomorrow; total or decline limits mean stop.
  if (limit && !/today/i.test(limit.detail)) return { action: "cancel" };
  if (limit) return { action: "reschedule", dueAt: nextDayCallTime(now) };
  if (names.has("calling_hours")) return { action: "reschedule", dueAt: nextCallTime(now) };
  if (names.has("no_active_call")) return { action: "reschedule", dueAt: new Date(now.getTime() + 5 * 60 * 1000) };
  return { action: "cancel" };
}
