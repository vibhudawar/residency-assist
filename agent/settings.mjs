// Agent settings that are a choice rather than a fact. Change here, then `pnpm agent:build`.

export const AGENT_NAME = "Residency Assist (prototype)";

/** LLM and a fallback. Compare 2–3 in agent tests before recording (quality vs. latency). */
export const LLM = "gpt-4.1";
export const TEMPERATURE = 0.2;

/**
 * Fastest TTS. ElevenLabs requires the v2 (English) model on an English-default agent; calls in
 * Arabic or Hindi (language presets) run on the multilingual v2.5 family. Compare with
 * eleven_v3_conversational before recording.
 */
export const TTS_MODEL = "eleven_flash_v2";

/**
 * One Voice Library voice per language — to be chosen by listening (3 candidates each).
 * Until then, the ElevenLabs default voice is used for all three.
 */
export const VOICES = {
  en: process.env.VOICE_ID_EN ?? "cjVigY5qzO86Huf0OWal",
  ar: process.env.VOICE_ID_AR ?? process.env.VOICE_ID_EN ?? "cjVigY5qzO86Huf0OWal",
  hi: process.env.VOICE_ID_HI ?? process.env.VOICE_ID_EN ?? "cjVigY5qzO86Huf0OWal",
};

/**
 * The first sentence of every call (Hindi kept gender-neutral, since the voice is not chosen yet), per language: identity, AI, recording, purpose, permission.
 * Deliberately no name: whoever answers learns nothing about the case before verification.
 */
export const FIRST_MESSAGE = {
  en: "Hello, this is Residency Assist, an AI assistant. This call is recorded. I'm calling about a residency application — is now a good time to talk?",
  ar: "مرحبًا، معك مساعد الإقامة، وهو مساعد يعمل بالذكاء الاصطناعي. هذه المكالمة مسجّلة. أتصل بخصوص طلب إقامة، هل الوقت مناسب للحديث الآن؟",
  hi: "नमस्ते, यह Residency Assist है, एक AI सहायक। यह कॉल रिकॉर्ड की जा रही है। यह कॉल एक रेज़िडेंसी आवेदन के बारे में है — क्या अभी बात करने का समय है?",
};

/** Words the speech recogniser should expect (official names and the demo's fictional people). */
export const ASR_KEYWORDS = [
  "Residency Assist", "GDRFA", "ICP", "Amer", "Emirates ID", "UAE PASS", "Salem", "Dubai Health",
  "Al Barsha", "Deira", "biometrics", "attestation",
  "Rahul Sharma", "Fatima Hassan", "Priya Verma", "Imran Khan", "Maria Santos", "Ahmed Rashid", "Sarah Thomas", "Arjun Patel",
];

/**
 * Where the tools call our backend: https://{{system__env_app_host}}/api/tools/<name>.
 * `app_host` is a workspace environment variable (e.g. residency-assist.vercel.app);
 * `tool_shared_secret` is a workspace secret environment variable holding TOOL_SHARED_SECRET.
 * Neither value is ever written into these config files.
 */
export const ENV_APP_HOST = "app_host";
export const ENV_TOOL_SECRET = "tool_shared_secret";

/** Live transfer to a person on phone calls. Without a number, hand-over is a callback. */
export const HUMAN_TRANSFER_NUMBER = process.env.HUMAN_TRANSFER_NUMBER ?? null;

export const MAX_CALL_SECONDS = 600;
