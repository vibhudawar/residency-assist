import "server-only";
import { env } from "@/lib/env";
import { type Channel, openCallAttempt, type PredialCheck, predialChecks } from "./predial";

export type StartCallResult =
  | { kind: "blocked"; checks: PredialCheck[] }
  | { kind: "not_configured"; missing: string[]; checks: PredialCheck[] };

/** What the agent needs before a call of this channel can be placed. Names only, never values. */
function missingConfig(channel: Channel): string[] {
  const e = env();
  const needed = channel === "phone"
    ? (["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID", "ELEVENLABS_PHONE_NUMBER_ID"] as const)
    : (["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID"] as const);
  return needed.filter((k) => !e[k]);
}

/**
 * Officer presses "Call". The pre-dial checks always run first; a refusal is recorded as a
 * blocked attempt (that log is evidence). If the checks pass but the agent isn't set up yet,
 * nothing is opened and nothing is faked — the console says which setting is missing.
 */
export async function startCall(applicationId: number, channel: Channel): Promise<StartCallResult> {
  const pre = await predialChecks(applicationId, { channel });
  if (!pre.allowed) {
    await openCallAttempt(applicationId, { channel }); // re-checks and stores the blocked attempt with its reasons
    return { kind: "blocked", checks: pre.checks };
  }

  // No attempt is opened until the dialler exists: an attempt left "dialing" would block every later call.
  // The dialler (ElevenLabs outbound call / browser session) lands with the agent config.
  return { kind: "not_configured", missing: missingConfig(channel), checks: pre.checks };
}
