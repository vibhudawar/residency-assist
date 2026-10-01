/** All "business" time in this prototype is UAE time. */
export const UAE_TZ = "Asia/Dubai";

/** Today's date in the UAE as YYYY-MM-DD. */
export function uaeToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: UAE_TZ }).format(now);
}

/** Current hour (0–23) in the UAE. */
export function uaeHour(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: UAE_TZ, hour: "2-digit", hourCycle: "h23" }).format(now));
}

/** Adds days to a YYYY-MM-DD date. */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** A UAE wall-clock time on a given date, as a UTC Date (UAE is UTC+4, no DST). */
export function uaeDateTime(isoDate: string, hhmm: string): Date {
  return new Date(`${isoDate}T${hhmm}:00+04:00`);
}
