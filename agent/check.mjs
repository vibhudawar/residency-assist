// Validates agent/project configs against the ElevenLabs API spec (as embedded in the CLI),
// flagging schema errors and unknown (misspelled) fields. No API key needed.
//   pnpm agent:check        (needs python3 with jsonschema: pip install jsonschema)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const work = mkdtempSync(path.join(tmpdir(), "el-check-"));
const specFile = path.join(work, "spec.json");
writeFileSync(specFile, execFileSync("pnpm", ["exec", "elevenlabs", "--spec"], { maxBuffer: 64 * 1024 * 1024 }));
// Build a throwaway copy with stand-in IDs so tool tests and simulations are validated too.
const copy = path.join(work, "project");
execFileSync(process.execPath, [path.join(ROOT, "build.mjs")], { stdio: "ignore", env: { ...process.env, AGENT_PROJECT_DIR: copy, AGENT_PLACEHOLDER_IDS: "1" } });
execFileSync("python3", [path.join(ROOT, "validate.py"), specFile, copy], { stdio: "inherit" });
