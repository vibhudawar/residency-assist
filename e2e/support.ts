/**
 * Shared steps for the end-to-end flows. Each test plays the applicant and the officer in the
 * browser, and plays the voice assistant (and ElevenLabs' post-call webhook) through the same HTTP
 * endpoints the real agent uses, so everything except the voice itself runs for real.
 * Secrets are read from .env and only ever sent to the app under test; nothing is printed.
 */
import { type APIRequestContext, type Browser, expect, type Page } from "@playwright/test";
import sharp from "sharp";
import { openCallAttempt } from "@/lib/calls/predial";
import { resetDemo } from "@/lib/demo/reset";
import { db } from "@/lib/supabase/server";
import { signForTest } from "@/lib/webhooks/signature";

const PASSCODE = process.env.OFFICER_PASSCODE ?? "";
const TOOL_SECRET = process.env.TOOL_SHARED_SECRET ?? "";
export const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET ?? "";

/** Back to the seven demo cases, with nothing left over from an earlier test. */
export const freshDemo = () => resetDemo();

export async function appId(reference: string): Promise<number> {
  const { data } = await db().from("applications").select("id").eq("reference", reference).single();
  if (!data) throw new Error(`no application ${reference}`);
  return data.id as number;
}

/** The newest application with this name (a portal submission gets a fresh reference). */
export async function latestReference(fullName: string): Promise<string> {
  const { data } = await db().from("applications").select("reference").eq("full_name", fullName).order("id", { ascending: false }).limit(1).single();
  if (!data) throw new Error(`no application for ${fullName}`);
  return data.reference as string;
}

/** What the dialler does when a browser call starts: pre-dial checks, then a one-time case token. */
export async function startCall(reference: string) {
  const opened = await openCallAttempt(await appId(reference), { channel: "browser" });
  if (!opened.attempt || !opened.caseToken) throw new Error(`call to ${reference} was refused`);
  return { attemptId: opened.attempt.id, token: opened.caseToken, conversationId: `e2e-conv-${opened.attempt.id}` };
}

type Call = Awaited<ReturnType<typeof startCall>>;

/** One tool call, exactly as the ElevenLabs agent sends it. */
export async function tool(request: APIRequestContext, call: Pick<Call, "token" | "conversationId">, name: string, args: Record<string, unknown> = {}, secret = TOOL_SECRET) {
  const res = await request.post(`/api/tools/${name}`, {
    headers: { "x-tool-secret": secret, "x-case-token": call.token },
    data: { conversation_id: call.conversationId, ...args },
  });
  return { status: res.status(), body: (await res.json()) as Record<string, unknown> };
}

/** ElevenLabs' signed post-call webhook for a finished call. */
export async function postCallWebhook(request: APIRequestContext, call: Call, language: string) {
  const turn = (role: "agent" | "user", message: string, at: number, ttfb?: number) => ({
    role,
    message: `[e2e test] ${message}`,
    time_in_call_secs: at,
    tool_calls: null,
    conversation_turn_metrics: ttfb === undefined ? null : { convai_llm_service_ttfb: { elapsed_time: ttfb } },
  });
  const body = JSON.stringify({
    type: "post_call_transcription",
    event_timestamp: Math.floor(Date.now() / 1000),
    data: {
      agent_id: "e2e-agent",
      conversation_id: call.conversationId,
      status: "done",
      transcript: [
        turn("agent", "Hello, this is Residency Assist, an AI assistant. This call is recorded.", 0),
        turn("user", "Yes, now is fine.", 4),
        turn("agent", "Could you tell me your application reference?", 6, 0.44),
        turn("agent", "I've sent that correction to an officer for approval.", 52, 0.52),
      ],
      metadata: { call_duration_secs: 68, termination_reason: "end_call tool" },
      analysis: { call_successful: "success", transcript_summary: "[e2e test] Caller verified and confirmed the corrected name." },
      conversation_initiation_client_data: {
        conversation_config_override: { agent: { language } },
        dynamic_variables: { call_attempt_id: String(call.attemptId) },
      },
    },
  });
  const res = await request.post("/api/webhooks/elevenlabs", {
    headers: { "content-type": "application/json", "elevenlabs-signature": signForTest(body, WEBHOOK_SECRET) },
    data: body,
  });
  return res.status();
}

/** Test calls end the way real calls do, and the demo phone comes off the do-not-call list. */
export async function endTestCalls() {
  await db().from("call_attempts").update({ status: "completed", ended_at: new Date().toISOString() }).in("status", ["dialing", "connected"]);
  await db().from("opt_outs").delete().eq("source", "call");
}

/** A separate browser for the officer, signed in to the console. */
export async function officer(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/console/signin");
  await page.locator("#passcode").fill(PASSCODE);
  await page.getByRole("button", { name: "Open the console" }).click();
  await page.waitForURL(/\/console$/);
  return page;
}

export async function openCase(page: Page, name: string) {
  await page.goto("/console");
  await page.getByRole("link", { name: new RegExp(name) }).first().click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
}

/** A head-and-shoulders test photo: on white it passes the check, on blue it fails. */
export async function photo(background: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1160"><rect width="100%" height="100%" fill="${background}"/><ellipse cx="450" cy="470" rx="190" ry="240" fill="#6b4f3a"/><path d="M110 1160 C140 860 300 780 450 780 C600 780 760 860 790 1160 Z" fill="#2d3540"/></svg>`;
  return { name: "photo.jpg", mimeType: "image/jpeg", buffer: await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer() };
}

/** The applicant's portal language (the same cookie the language switch sets). */
export const portalLanguage = (page: Page, baseURL: string, lang: "en" | "ar") => page.context().addCookies([{ name: "ra_lang", value: lang, url: baseURL }]);
