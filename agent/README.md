# The voice agent, as code

Everything ElevenLabs needs to run the Residency Assist agent lives here, in readable files. Nothing is configured by hand in the dashboard.

| Path | What it is |
|---|---|
| `prompts/system.md` | Main instructions: personality, tone, goal, guardrails, tools |
| `prompts/steps/*.md` | One file per call step: Open → Verify → Resolve, and Hand over (from any step) |
| `knowledge/*.md` | The 11 knowledge documents the agent looks things up in (see `knowledge/README.md`) |
| `settings.mjs` | Choices: LLM, voice per language, opening line per language, speech keywords |
| `build.mjs` | Turns the above into ElevenLabs config files in `project/` |
| `deploy.mjs` | Uploads everything to ElevenLabs (safe to re-run) |
| `check.mjs`, `validate.py` | Checks the configs against ElevenLabs' own API schema, offline |
| `project/` | The ElevenLabs CLI project (generated configs + the ID registries the CLI writes) |

## How the call is wired

- **Steps, each with only its own tools.** Open has only opt-out, callback and end call. Verify adds `verify_identity`. Resolve adds the case and fix tools. The backend enforces the same order on every tool call, so a confused model still can't skip verification.
- **No secrets in these files.**
  - The backend address comes from a workspace setting (`app_host`).
  - The tool secret comes from a workspace secret (`tool_shared_secret`).
  - Each call's case token is a `secret__` variable: sent in a header, never shown to the model.
- **The opening line names no one.** Whoever answers hears nothing about the case before verification.
- **Post-call checks** run on every call: AI disclosed, verified before details, no secrets asked, read back before submit, correct path per rule, opt-out honoured, stayed in language.

## Commands

```bash
pnpm agent:build     # regenerate project/ from the sources (no key needed)
pnpm agent:check     # build + validate against the ElevenLabs API schema (needs python3 + jsonschema)
pnpm agent:deploy    # upload: workspace host + secret, knowledge base, tools, tests, agent
```

`agent:deploy` needs `ELEVENLABS_API_KEY` in `.env`, and `APP_BASE_URL` set to the public https deployment. ElevenLabs has to be able to reach `/api/tools/*`. It prints the agent id to put in `.env` as `ELEVENLABS_AGENT_ID`.

## Still to choose before recording
- One voice per language (`VOICE_ID_EN`, `VOICE_ID_AR`, `VOICE_ID_HI`), picked by listening to 3 candidates each.
- LLM and TTS model, compared on quality vs. delay in the agent tests.
- Optional `HUMAN_TRANSFER_NUMBER` for a live transfer on phone calls. Without it, hand-over books a callback.
