// One command to put the agent on ElevenLabs (safe to re-run):
//   pnpm agent:deploy        (= node --env-file=.env agent/deploy.mjs)
//
// Needs in .env: ELEVENLABS_API_KEY, TOOL_SHARED_SECRET, and APP_BASE_URL pointing at the
// public https deployment (ElevenLabs must be able to reach the tool endpoints).
// Order: workspace host + secret → knowledge base → tools → tests → agent. Never prints secrets.
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as S from "./settings.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.join(ROOT, "project");
const SECRET_NAME = "residency-assist-tool-secret";

const apiKey = process.env.ELEVENLABS_API_KEY;
const toolSecret = process.env.TOOL_SHARED_SECRET;
const base = process.env.APP_BASE_URL ?? "";
if (!apiKey) fail("ELEVENLABS_API_KEY is not set in .env.");
if (!toolSecret) fail("TOOL_SHARED_SECRET is not set in .env.");
const url = safeUrl(base);
if (!url || url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname)) {
  fail("APP_BASE_URL must be the public https address of the app (deploy to Vercel first), so ElevenLabs can reach the tools.");
}

const client = new ElevenLabsClient({ apiKey });
const step = (s) => console.log(`\n— ${s}`);

function fail(message) {
  console.error(`Deploy stopped: ${message}`);
  process.exit(1);
}
function safeUrl(v) {
  try {
    return new URL(v);
  } catch {
    return null;
  }
}
async function readJson(file, fallback) {
  const p = path.join(PROJECT, file);
  return existsSync(p) ? JSON.parse(await readFile(p, "utf8")) : fallback;
}
async function writeJson(file, data) {
  await writeFile(path.join(PROJECT, file), `${JSON.stringify(data, null, 2)}\n`);
}
/** Runs the ElevenLabs CLI inside agent/project (it reads ELEVENLABS_API_KEY from the environment). */
function cli(...args) {
  execFileSync("pnpm", ["exec", "elevenlabs", ...args], { cwd: PROJECT, stdio: "inherit", env: process.env });
}
const build = () => execFileSync(process.execPath, [path.join(ROOT, "build.mjs")], { stdio: "inherit", env: process.env });
const registered = (registry, key) => new Set((registry[key] ?? []).map((e) => e.name ?? e.tool_name ?? e.test_name).filter(Boolean));

async function main() {
  for (const [file, key] of [["agents.json", "agents"], ["tools.json", "tools"], ["tests.json", "tests"]]) {
    if (!existsSync(path.join(PROJECT, file))) await writeJson(file, { [key]: [] });
  }

  step("Workspace settings the tools read (host + tool secret)");
  const { environmentVariables = [] } = await client.environmentVariables.list();
  const byLabel = new Map(environmentVariables.map((v) => [v.label, v]));
  const host = url.host;
  if (!byLabel.has(S.ENV_APP_HOST)) {
    await client.environmentVariables.create({ type: "string", label: S.ENV_APP_HOST, values: { production: host } });
    console.log(`created ${S.ENV_APP_HOST} = ${host}`);
  } else {
    await client.environmentVariables.update(byLabel.get(S.ENV_APP_HOST).id, { values: { production: host } });
    console.log(`updated ${S.ENV_APP_HOST} = ${host}`);
  }
  if (!byLabel.has(S.ENV_TOOL_SECRET)) {
    const secret = await client.conversationalAi.secrets.create({ name: SECRET_NAME, value: toolSecret });
    await client.environmentVariables.create({ type: "secret", label: S.ENV_TOOL_SECRET, values: { production: { secretId: secret.secretId } } });
    console.log(`created ${S.ENV_TOOL_SECRET} (stored as workspace secret "${SECRET_NAME}")`);
  } else {
    console.log(`${S.ENV_TOOL_SECRET} already set (to rotate it, update the secret "${SECRET_NAME}" in the ElevenLabs dashboard)`);
  }

  step("Knowledge base");
  const knowledge = await readJson("knowledge.json", { documents: [] });
  const known = new Map(knowledge.documents.map((d) => [d.file, d]));
  const files = (await readdir(path.join(ROOT, "knowledge"))).filter((f) => f.endsWith(".md") && f !== "README.md").sort();
  for (const file of files) {
    const text = await readFile(path.join(ROOT, "knowledge", file), "utf8");
    const hash = createHash("sha256").update(text).digest("hex").slice(0, 16);
    if (known.get(file)?.hash === hash) {
      console.log(`unchanged ${file}`);
      continue;
    }
    const name = `Residency Assist — ${text.match(/^#\s+(.+)$/m)?.[1] ?? file}`;
    const doc = await client.conversationalAi.knowledgeBase.documents.createFromText({ text, name });
    known.set(file, { file, name, id: doc.id, hash });
    console.log(`uploaded ${file} (old versions stay in the workspace; delete them there if you like)`);
  }
  await writeJson("knowledge.json", { documents: [...known.values()].filter((d) => files.includes(d.file)) });

  step("Tools");
  build();
  const tools = registered(await readJson("tools.json", { tools: [] }), "tools");
  for (const f of (await readdir(path.join(PROJECT, "tool_configs"))).filter((x) => x.endsWith(".json"))) {
    const name = f.replace(/\.json$/, "");
    if (!tools.has(name)) cli("tools", "add", name, "--type", "webhook", "--config-path", `tool_configs/${f}`);
  }
  cli("tools", "push");

  step("Tests");
  build();
  if (existsSync(path.join(PROJECT, "test_configs"))) cli("tests", "push", "--config-dir", "test_configs");
  else console.log("no test_configs yet");

  step("Agent");
  build();
  const agents = await readJson("agents.json", { agents: [] });
  if (!(agents.agents ?? []).length) cli("agents", "add", S.AGENT_NAME, "--from-file", "agent_configs/residency-assist.json");
  else cli("agents", "push");

  const agent = (await readJson("agents.json", { agents: [] })).agents?.[0];
  const agentId = agent?.id ?? agent?.agent_id;
  console.log(`\nDone. Agent id: ${agentId ?? "(see agents.json)"} — put it in .env as ELEVENLABS_AGENT_ID.`);
  console.log("Next: run the attached tests with  pnpm exec elevenlabs agents test <agent id>  (from agent/project).");
}

main().catch((err) => fail(err instanceof Error ? err.message : String(err)));
