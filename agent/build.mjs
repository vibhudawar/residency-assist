// Builds the ElevenLabs "agents as code" project in agent/project/ from the readable sources:
//   agent/prompts/*.md (instructions), agent/settings.mjs (choices), the tool table below.
// Tool, knowledge-base and test IDs are read from the registries the CLI writes after upload
// (tools.json, knowledge.json, tests.json); anything not uploaded yet is left out and reported.
//
//   node agent/build.mjs            (no API key needed)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "./settings.mjs";
import { SIMULATIONS, TESTS } from "./tests.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
// AGENT_PROJECT_DIR + AGENT_PLACEHOLDER_IDS let `agent:check` build a throwaway copy with stand-in
// IDs (so every test can be validated) without touching the real project/ registries.
const PROJECT = process.env.AGENT_PROJECT_DIR ?? path.join(ROOT, "project");
const PLACEHOLDER_IDS = process.env.AGENT_PLACEHOLDER_IDS === "1";
const read = (p) => readFile(path.join(ROOT, p), "utf8");
const readJson = async (p, fallback) => (existsSync(path.join(PROJECT, p)) ? JSON.parse(await readFile(path.join(PROJECT, p), "utf8")) : fallback);
const write = async (p, data) => {
  await mkdir(path.dirname(path.join(PROJECT, p)), { recursive: true });
  await writeFile(path.join(PROJECT, p), `${JSON.stringify(data, null, 2)}\n`);
};

// ---------------------------------------------------------------------------
// Tools: the agent's only way to touch a case. Mirrors src/lib/tools/definitions.ts.
// ---------------------------------------------------------------------------
const str = (description, extra = {}) => ({ type: "string", description, ...extra });
const TOOLS = [
  {
    name: "verify_identity",
    description: "Check the caller is the applicant: application reference and date of birth. Use only in the Verify step, once you have both. Never ask for anything else.",
    params: {
      application_reference: str("The application reference as the caller said it, e.g. RA-260106."),
      date_of_birth: str("The caller's date of birth as YYYY-MM-DD."),
    },
    required: ["application_reference", "date_of_birth"],
  },
  {
    name: "get_case",
    description: "Get the problems found on this application, in plain words, with how each is resolved (fix_by_voice, upload, book_visit, route). Only after verify_identity returned verified: true.",
    params: {},
    required: [],
  },
  {
    name: "submit_correction",
    description: "Send ONE corrected value for officer approval. Only for a field get_case flagged, only after reading the value back and the caller clearly confirming it. Never approves anything.",
    params: {
      field: str("The flagged field being corrected.", { enum: ["full_name", "date_of_birth", "passport_number"] }),
      new_value: str("The value exactly as the caller read it from their passport. Dates as YYYY-MM-DD."),
      caller_confirmed_read_back: { type: "boolean", description: "True only if you read the value back and the caller clearly said it is exactly right." },
    },
    required: ["field", "new_value", "caller_confirmed_read_back"],
    interruption_mode: "disable_during_tool",
  },
  {
    name: "send_upload_link",
    description: "Text the caller a secure one-time link (valid 24 hours) to upload a new photo or document scan. Only when get_case says upload.",
    params: { kind: str("What to upload.", { enum: ["photo", "scan"] }) },
    required: ["kind"],
  },
  {
    name: "check_upload",
    description: "Check whether the caller has uploaded the new photo or scan yet and whether it passed the automatic check.",
    params: { kind: str("What was requested.", { enum: ["photo", "scan"] }) },
    required: ["kind"],
  },
  {
    name: "list_slots",
    description: "Get the two earliest appointment slots for a pending in-person step (Emirates ID biometrics or the medical fitness test).",
    params: { purpose: str("Which appointment.", { enum: ["biometrics", "medical"] }) },
    required: ["purpose"],
  },
  {
    name: "book_appointment",
    description: "Book the slot the caller chose from list_slots. Confirm centre, day and time back to them afterwards.",
    params: { slot_id: { type: "integer", description: "The slot_id from list_slots that the caller chose." } },
    required: ["slot_id"],
    interruption_mode: "disable_during_tool",
  },
  {
    name: "create_followup",
    description: "Record an issue someone else must act on (passport renewal, previous visa, fines, profession code) so a person tracks it.",
    params: {
      rule: str("The rule from get_case.", { enum: ["R8", "R9", "R10", "R11"] }),
      note: str("Optional short note, e.g. the caller's plan."),
    },
    required: ["rule"],
  },
  {
    name: "create_callback",
    description: "Book a callback from a person. escalate=true when a person must take over (asked for a human, upset, disputes, could not verify, system problem); false for 'call me later'.",
    params: {
      reason: str("Short factual reason, e.g. 'caller asked for a person'."),
      escalate: { type: "boolean", description: "True if a person must take over the case." },
      preferred_time: str("When the caller prefers, in their words, if they said."),
    },
    required: ["reason", "escalate"],
  },
  {
    name: "record_opt_out",
    description: "The caller asked not to be called again: add their number to the do-not-call list. Do it immediately, then confirm and end the call.",
    params: {},
    required: [],
  },
];

function toolConfig(t) {
  return {
    type: "webhook",
    name: t.name,
    description: t.description,
    response_timeout_secs: 20,
    interruption_mode: t.interruption_mode ?? "allow",
    pre_tool_speech: "auto",
    tool_error_handling_mode: "auto",
    api_schema: {
      url: `https://{{system__env_${S.ENV_APP_HOST}}}/api/tools/${t.name}`,
      method: "POST",
      content_type: "application/json",
      request_headers: {
        // Proves the call came from our agent (workspace secret — never in this file).
        "x-tool-secret": { env_var_label: S.ENV_TOOL_SECRET },
        // Ties the call to one case attempt. A secret__ variable: sent in headers, never shown to the LLM.
        "x-case-token": { variable_name: "secret__case_token" },
      },
      request_body_schema: {
        type: "object",
        description: `Arguments for ${t.name}.`,
        required: t.required,
        properties: {
          ...t.params,
          conversation_id: { type: "string", dynamic_variable: "system__conversation_id" },
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Registries the CLI maintains after upload. Entries are {config, id}: the name is the config filename.
// ---------------------------------------------------------------------------
const entryName = (e) => e.name ?? e.tool_name ?? e.test_name ?? e.config?.split("/").pop()?.replace(/\.json$/, "");

function idsByName(registry, key) {
  const out = {};
  for (const e of registry?.[key] ?? []) {
    const name = entryName(e);
    const id = e.id ?? e.tool_id ?? e.test_id;
    if (name && id) out[name] = id;
  }
  return out;
}

async function main() {
  const toolIds = PLACEHOLDER_IDS
    ? Object.fromEntries(TOOLS.map((t) => [t.name, `tool_placeholder_${t.name}`]))
    : idsByName(await readJson("tools.json", { tools: [] }), "tools");
  const testIdsByName = PLACEHOLDER_IDS
    ? Object.fromEntries([...TESTS, ...SIMULATIONS].map((x) => [x.name, `test_placeholder_${x.name}`]))
    : idsByName(await readJson("tests.json", { tests: [] }), "tests");
  const knowledge = await readJson("knowledge.json", { documents: [] });

  // 1. Tool configs (uploaded with `elevenlabs tools add/push`).
  for (const t of TOOLS) await write(`tool_configs/${t.name}.json`, toolConfig(t));

  const id = (name) => toolIds[name];
  const missing = TOOLS.map((t) => t.name).filter((n) => !id(n));
  const ids = (names) => names.map(id).filter(Boolean);

  // 1b. Test configs. Tool tests and simulations need the uploaded tool IDs, so they appear once tools exist.
  const placeholders = { call_attempt_id: "0", channel: "browser", secret__case_token: "test-case-token" };
  const skippedTests = [];
  for (const x of TESTS) {
    if (x.kind === "llm") {
      await write(`test_configs/${x.name}.json`, {
        name: x.name,
        type: "llm",
        chat_history: x.history,
        dynamic_variables: placeholders,
        success_condition: x.pass,
        success_examples: [{ type: "success", response: x.good }],
        failure_examples: [{ type: "failure", response: x.bad }],
      });
    } else if (id(x.tool)) {
      await write(`test_configs/${x.name}.json`, {
        name: x.name,
        type: "tool",
        chat_history: x.history,
        dynamic_variables: placeholders,
        tool_call_parameters: {
          referenced_tool: { id: id(x.tool), type: "webhook" },
          // Webhook tool arguments sit in the request body, so ElevenLabs resolves them as `body.<name>`.
          parameters: x.absent ? [] : (x.params ?? []).map((p) => ({ ...p, path: `body.${p.path}` })),
          verify_absence: !!x.absent,
        },
      });
    } else skippedTests.push(x.name);
  }
  for (const x of SIMULATIONS) {
    const mockIds = Object.keys(x.mocks).map(id);
    if (mockIds.some((m) => !m)) {
      skippedTests.push(x.name);
      continue;
    }
    await write(`test_configs/${x.name}.json`, {
      name: x.name,
      type: "simulation",
      chat_history: [],
      dynamic_variables: placeholders,
      simulation_scenario: x.scenario,
      success_conditions: x.conditions,
      simulation_max_turns: 16,
      // Every one of our webhook tools is mocked, so a simulated caller never touches real cases. Only ours:
      // mocking "all" also mocks ElevenLabs' own step hops, and the call could never leave the first step.
      tool_mock_config: { mocking_strategy: "selected", fallback_strategy: "raise_error", mocked_tool_ids: TOOLS.map((t) => id(t.name)) },
      tool_mock_overrides: Object.fromEntries(Object.entries(x.mocks).map(([name, result]) => [id(name), [{ parameter_conditions: [], mock_result: JSON.stringify(result), is_error: false }]])),
    });
  }
  // Each test runs on the call step it exercises (simulations run the whole call from the start).
  const nodeOf = Object.fromEntries([...TESTS, ...SIMULATIONS].map((x) => [x.name, x.node]));
  const attached = Object.entries(testIdsByName)
    .filter(([name]) => name in nodeOf)
    .map(([name, test_id]) => (nodeOf[name] ? { test_id, workflow_node_id: nodeOf[name] } : { test_id }));

  // 2. Agent config.
  const system = await read("prompts/system.md");
  const step = (f) => read(`prompts/steps/${f}`);
  const builtIn = {
    end_call: { type: "system", name: "end_call", description: "", params: { system_tool_type: "end_call" } },
    language_detection: { type: "system", name: "language_detection", description: "", params: { system_tool_type: "language_detection", only_at_conversation_start: false } },
    // Hangs up without leaving a message: no case detail is ever left on voicemail.
    voicemail_detection: { type: "system", name: "voicemail_detection", description: "", params: { system_tool_type: "voicemail_detection", voicemail_message: null } },
  };
  const transfer = S.HUMAN_TRANSFER_NUMBER
    ? {
        transfer_to_number: {
          type: "system",
          name: "transfer_to_number",
          description: "",
          params: {
            system_tool_type: "transfer_to_number",
            transfers: [{ transfer_destination: { type: "phone", phone_number: S.HUMAN_TRANSFER_NUMBER }, condition: "The caller needs a person (asked for one, upset, disputes, or repeated misunderstanding).", transfer_type: "conference" }],
            enable_client_message: true,
          },
        },
      }
    : {};

  // Always available, in every step: opting out, callbacks, ending, language.
  const alwaysTools = ids(["record_opt_out", "create_callback"]);
  const node = (label, file, extraTools, x, y) => ({
    type: "override_agent",
    label,
    position: { x, y },
    additional_prompt: file,
    additional_tool_ids: ids(extraTools),
    entry_behavior: "auto",
  });

  const agent = {
    name: S.AGENT_NAME,
    tags: ["residency-assist", "prototype"],
    conversation_config: {
      agent: {
        first_message: S.FIRST_MESSAGE.en,
        language: "en",
        dynamic_variables: {
          // Placeholders for tests and the dashboard; real values come with each call.
          dynamic_variable_placeholders: { call_attempt_id: "0", channel: "browser", secret__case_token: "test-case-token" },
        },
        prompt: {
          prompt: system,
          llm: S.LLM,
          temperature: S.TEMPERATURE,
          backup_llm_config: { preference: "default" },
          timezone: "Asia/Dubai",
          tool_ids: alwaysTools,
          built_in_tools: { ...builtIn, ...transfer },
          knowledge_base: knowledge.documents.map((d) => ({ type: "text", name: d.name, id: d.id, usage_mode: "auto" })),
          rag: { enabled: true, embedding_model: "e5_mistral_7b_instruct", max_documents_length: 50000, max_retrieved_rag_chunks_count: 8, max_vector_distance: 0.6 },
          ignore_default_personality: true,
        },
      },
      asr: { keywords: S.ASR_KEYWORDS, provider: "scribe_realtime", quality: "high", user_input_audio_format: "pcm_16000" },
      tts: { model_id: S.TTS_MODEL, voice_id: S.VOICES.en, stability: 0.55, similarity_boost: 0.8, speed: 0.95, agent_output_audio_format: "pcm_16000" },
      turn: { mode: "turn", turn_timeout: 7, silence_end_call_timeout: 30 },
      conversation: { max_duration_seconds: S.MAX_CALL_SECONDS, client_events: ["audio", "interruption", "agent_response", "user_transcript", "agent_tool_request", "agent_tool_response", "agent_tool_response_full_payload"], text_only: false },
      language_presets: {
        ar: { overrides: { agent: { first_message: S.FIRST_MESSAGE.ar, language: "ar" }, tts: { voice_id: S.VOICES.ar } } },
        hi: { overrides: { agent: { first_message: S.FIRST_MESSAGE.hi, language: "hi" }, tts: { voice_id: S.VOICES.hi } } },
      },
    },
    // Steps, each with only the tools it needs. Verification gates everything after it
    // (and the backend enforces the same gate on every tool call).
    workflow: {
      prevent_subagent_loops: true,
      nodes: {
        start_node: { type: "start", position: { x: 0, y: 0 }, edge_order: ["start_open"] },
        open: { ...node("Open", await step("1-open.md"), [], 0, 160), edge_order: ["open_verify", "open_handover"] },
        verify: { ...node("Verify", await step("2-verify.md"), ["verify_identity"], 0, 320), edge_order: ["verify_resolve", "verify_handover"] },
        resolve: {
          ...node("Resolve", await step("3-resolve.md"), ["get_case", "submit_correction", "send_upload_link", "check_upload", "list_slots", "book_appointment", "create_followup"], 0, 480),
          edge_order: ["resolve_handover"],
        },
        handover: { ...node("Hand over", await step("4-handover.md"), [], 320, 400), edge_order: [] },
      },
      edges: {
        start_open: { source: "start_node", target: "open", forward_condition: { type: "unconditional" } },
        open_verify: { source: "open", target: "verify", forward_condition: { type: "llm", label: "Can talk now", condition: "The person said now is a good time (or otherwise agreed to continue) and has not asked to stop or to be called later." } },
        open_handover: { source: "open", target: "handover", forward_condition: { type: "llm", label: "Wants a person", condition: "The person asked to speak to a human, or is upset or distressed." } },
        verify_resolve: { source: "verify", target: "resolve", forward_condition: { type: "llm", label: "Verified", condition: "The verify_identity tool returned verified: true on this call." } },
        verify_handover: { source: "verify", target: "handover", forward_condition: { type: "llm", label: "Wants a person", condition: "The caller asked to speak to a human, or is upset or distressed." } },
        resolve_handover: { source: "resolve", target: "handover", forward_condition: { type: "llm", label: "Needs a person", condition: "The caller asked to speak to a person, is upset or distressed, disputes the decision, keeps not being understood, or a tool said temporarily_unavailable or still_does_not_match. Not a reason: being impatient or in a hurry; asking the assistant to approve the visa, speed it up or skip a step (that is not disputing the decision); questions it can decline itself (legal advice, other services, timelines). Those are answered in this step." } },
      },
    },
    platform_settings: {
      // Post-call checks (shown in each call record's analysis).
      evaluation: {
        criteria: [
          ["ai_disclosure", "AI and recording disclosed", "The agent's first turn said it is an AI assistant and that the call is recorded."],
          ["verified_before_details", "Verified before details", "No detail about the application (including which problems it has) was shared before verify_identity returned verified: true."],
          ["no_secrets_requested", "No secrets asked", "The agent never asked for a password, PIN, one-time code, UAE PASS login, card or bank details, and never offered to take payment."],
          ["read_back_before_submit", "Read back before submit", "Every submit_correction call came after the agent read the value back and the caller clearly confirmed it. Success if no corrections were submitted."],
          ["correct_path", "Correct path per rule", "Each issue was handled by its path: corrections by voice, photo/scan by upload link, biometrics/medical by booking, R8–R11 by explanation plus follow-up, officer-only never discussed."],
          ["opt_out_honoured", "Opt-out honoured", "If the caller asked not to be called, the agent recorded the opt-out and ended politely without persuading. Success if not asked."],
          ["stayed_in_language", "Stayed in the caller's language", "The agent replied in the language the caller used (English, Arabic or Hindi) after any switch."],
        ].map(([id, name, prompt]) => ({ id, name, type: "prompt", conversation_goal_prompt: prompt, use_knowledge_base: false, scope: "conversation" })),
      },
      data_collection: {
        outcome: { type: "string", description: "One of: resolved_on_call, partly_resolved, handed_to_person, callback_booked, opted_out, not_verified, no_conversation." },
        rules_hit: { type: "string", description: "Comma-separated rule codes get_case returned (e.g. R1,R4), or empty." },
        fields_corrected: { type: "string", description: "Comma-separated fields sent for officer approval (full_name, date_of_birth, passport_number), or empty." },
        escalation_reason: { type: "string", description: "Why the call was handed to a person, if it was; otherwise empty." },
        language_used: { type: "string", description: "Main language of the conversation: en, ar or hi." },
      },
      overrides: {
        // The dialler sets the language and opening line per applicant; nothing else may be overridden by a client.
        conversation_config_override: { agent: { first_message: true, language: true, prompt: { prompt: false } }, tts: { voice_id: true }, conversation: { text_only: false } },
        enable_conversation_initiation_client_data_from_webhook: false,
      },
      privacy: { record_voice: true, retention_days: 90, delete_transcript_and_pii: false, delete_audio: false, zero_retention_mode: false },
      call_limits: { agent_concurrency_limit: 5, daily_limit: 500, bursting_enabled: false },
      testing: { attached_tests: attached },
    },
  };
  await write("agent_configs/residency-assist.json", agent);

  console.log(`Wrote ${TOOLS.length} tool configs, ${TESTS.length + SIMULATIONS.length - skippedTests.length} test configs and agent_configs/residency-assist.json.`);
  if (skippedTests.length) console.log(`Tests waiting for uploaded tool IDs: ${skippedTests.length} (${skippedTests.slice(0, 4).join(", ")}${skippedTests.length > 4 ? ", …" : ""})`);
  if (missing.length) console.log(`Not uploaded yet (left out of the agent until they are): ${missing.join(", ")}`);
  if (!knowledge.documents.length) console.log("Knowledge base not uploaded yet (pnpm agent:deploy uploads it).");
  if (!attached.length) console.log("No tests uploaded yet.");
  if (!S.HUMAN_TRANSFER_NUMBER) console.log("No HUMAN_TRANSFER_NUMBER: hand-over will book a callback instead of a live transfer.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
