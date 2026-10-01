// Validates agent/project configs against the ElevenLabs API spec (as embedded in the CLI),
// flagging schema errors and unknown (misspelled) fields. No API key needed.
//   pnpm agent:check        (needs python3 with jsonschema: pip install jsonschema)
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const specFile = path.join(mkdtempSync(path.join(tmpdir(), "el-spec-")), "spec.json");
writeFileSync(specFile, execFileSync("pnpm", ["exec", "elevenlabs", "--spec"], { maxBuffer: 64 * 1024 * 1024 }));
execFileSync("python3", [path.join(ROOT, "validate.py"), specFile, path.join(ROOT, "project")], { stdio: "inherit" });
