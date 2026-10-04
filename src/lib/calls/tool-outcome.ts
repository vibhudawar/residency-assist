/**
 * Our backend answers a refusal with a normal reply ({ ok: false, reason }, a failed identity check as
 * verified: false, a locked one as locked: true), so "no transport error" isn't "done". Reads the
 * tool's own answer; anything unreadable counts as done. Used by the live call board and its replays.
 */
export function refusedBy(result: string | null | undefined): boolean {
  if (!result) return false;
  try {
    const body = JSON.parse(result) as Record<string, unknown>;
    return body.ok === false || body.verified === false || body.locked === true;
  } catch {
    return false;
  }
}
