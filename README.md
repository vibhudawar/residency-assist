# Residency Assist (prototype)

**Ignyte × ElevenLabs Voice AI Challenge · Stage 2 · Track 2: Government Services, Proactive Application Resolution**
Team StellarDevs: Vibhu Dawar, Nishank Dawar

When a Dubai residency application is returned for something fixable, Residency Assist **calls the applicant the same day**. It says it's an AI and that the call is recorded, verifies who they are without any password, explains the problem in their language, and fixes what it can on the call. **An officer still approves every change.**

Prototype. Not affiliated with GDRFA or ICP. All applicants and case data are fictional, and the "Mock GDRFA case system" stands in for the real one.

**Demo video:** [https://youtu.be/UbB6bDUbons](https://youtu.be/UbB6bDUbons)

**Live:** [https://residency-assist.vercel.app](https://residency-assist.vercel.app) (applicant portal) · [https://residency-assist.vercel.app/console](https://residency-assist.vercel.app/console) (officer console)

**Officer console passcode for judges:** 

```
test@pass
```



## Stage 2 deliverables


| Ignyte asked for                                                                    | Where it is                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A live, callable agent or hosted web deployment                                     | **[https://residency-assist.vercel.app](https://residency-assist.vercel.app)**: browser calls work any time ([how to try it](#try-it-in-3-minutes)). Phone calls go out through Twilio inside UAE calling hours                                                                                  |
| Recorded end-to-end demo: main call flow + a failure or escalation path             | **[Demo video](https://youtu.be/UbB6bDUbons)**: Rahul is called by phone and his typo is fixed (main flow); Arjun uploads a new photo mid-call; Kofi's issues are routed, payment is refused and he's **handed over to a person** (escalation)                                                   |
| Agent Testing suite and results: multi-run pass rate + a high-stakes tool-call test | **[docs/EVIDENCE.md](docs/EVIDENCE.md)**: 41 tests × 10 runs on ElevenLabs Agent Testing, **404/410 passed**; high-stakes `submit_correction` tool-call tests **30/30**. Suite: `[agent/tests.mjs](agent/tests.mjs)`, raw results: `[agent/evidence/latest.md](agent/evidence/latest.md)`        |
| Transcripts and post-call analysis for the demo calls                               | **[docs/transcripts/](docs/transcripts/)**: [Rahul (phone)](docs/transcripts/1-rahul-phone-name-fix.md) · [Arjun](docs/transcripts/2-arjun-photo-and-passport.md) · [Kofi](docs/transcripts/3-kofi-route-and-escalate.md), each with tool calls and ElevenLabs' 7 evaluation checks (all passed) |
| One-page architecture diagram + short technical README                              | **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** and this README                                                                                                                                                                                                                                 |
| Also                                                                                | [Pilot & Scale one-pager](docs/PILOT-AND-SCALE.md) · [the agent as code](agent/README.md)                                                                                                                                                                                                        |


---



## Try it in 3 minutes

1. Open **/console**, sign in with the passcode above, and click **Reset demo** (top bar). Every judge starts from the same clean state.
2. Open the portal in a second tab → **Sign in with UAE PASS** (mock) → **Fill demo applicant details**. The name is typed as "Rahul **Sarma**"; the passport says Sharma.
3. Tick **"An AI assistant may call me…"** → **Submit**. The 12-rule check returns the application for one fixable thing.
4. Console → **Rahul Sarma** → **Call in browser** → **Start the call**. Allow the microphone. You are the applicant:
  - "Yes, now is fine."
  - Your reference (shown on the status page) and date of birth **12 April 1991**.
  - When asked, spell **Rahul Sharma**, then confirm the read-back.
5. The correction appears as a slip on the case. Click **Approve correction**. The applicant's status page moves to **In processing**.

Other demo cases are already in the queue: **Arjun Patel** (photo + expiring passport, RA-260108, DOB 21 July 1989) and **Kofi Mensah** (fines + profession code, RA-260109, DOB 15 March 1987). Try asking the agent to approve your visa, to take payment for a fine, or to skip verification. It refuses, and the server logs each refusal in **Blocked actions**.

Browser calls work at any time. Phone calls only go out inside UAE calling hours (09:00–18:00), by design.

---



## What the agent does with each kind of problem

The portal runs 12 checks (mock data) and sorts every failed check into one of three tiers. The agent's options depend on the tier.


| Tier                  | Checks                                                                 | What happens on the call                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fix on the call**   | R1 name, R2 date of birth, R3 passport number                          | Caller reads the value from their passport. The agent reads it back letter by letter, and only after a clear "yes" sends it **for officer approval** |
|                       | R4 photo, R5 scan                                                      | One-time SMS link (24 h). The upload is checked automatically while the caller waits, then an officer confirms it                                    |
|                       | R6 biometrics, R7 medical test                                         | Books the earliest slot                                                                                                                              |
| **Explain and route** | R8 passport validity, R9 previous visa, R10 fines, R11 profession code | Says who must act and the official channel, logs a follow-up for the team, **never takes payment**                                                   |
| **Officer only**      | R12 medical or security matters                                        | The AI never calls. The pre-dial check blocks it and the applicant gets an SMS                                                                       |


No consent, no call: without the opt-in box ticked, the applicant gets the normal SMS and portal notice only.

## How it's built (short version)

- **Applicant portal + officer console:** Next.js 16 on Vercel, Supabase (Postgres, private storage, RLS on, server-only access).
- **Voice agent:** ElevenLabs Agents, built entirely as code in `[agent/](agent/README.md)`. It's a workflow of four steps: Open → Verify → Resolve, plus Hand over from any step. **Each step only has its own tools**, so in Verify the agent doesn't even have `get_case`.
- **10 server tools** on our backend (`/api/tools/<name>`). Every call needs the workspace tool secret **and** a one-time case token created for that call. Our server then checks verification, the arguments, whether the field was really flagged, and whether the new value matches the passport record. The model can propose; only the server can act.
- **Calls:** browser (WebRTC) for judges; outbound phone through Twilio for the proactive call. Auto-call dials as soon as a fixable return is found, after pre-dial checks: consent, do-not-call list, calling hours, officer-only cases, attempt limits.
- **After every call:** ElevenLabs' signed post-call webhook stores the transcript, latency and 7 automatic evaluation checks in **Call records**.

Full picture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Evidence


| What                                                                                                               | Where                                                                  |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Agent test suite: 41 tests, each run 10 times on ElevenLabs, incl. high-stakes `submit_correction` tool-call tests | [docs/EVIDENCE.md](docs/EVIDENCE.md) · raw: `agent/evidence/latest.md` |
| Real calls: transcripts with tool calls and ElevenLabs post-call analysis                                          | [docs/transcripts/](docs/transcripts/)                                 |
| End-to-end browser tests (portal → tools → webhook → officer → status)                                             | `e2e/report/latest.md`                                                 |
| Live latency, guardrails and test results                                                                          | Console → **Evidence**                                                 |
| Pilot and scale plan                                                                                               | [docs/PILOT-AND-SCALE.md](docs/PILOT-AND-SCALE.md)                     |




## Run it locally

Needs Node 24 (`.nvmrc`), pnpm 10, a Supabase project and an ElevenLabs API key.

```bash
pnpm install
cp env.template .env            # fill in the keys (comments in the file say what each one is)
supabase db push                # 9 migrations: schema, RLS, storage bucket, case tokens, auto-call queue
pnpm dev                        # http://localhost:3000
```

Deploy the app first. ElevenLabs must reach `/api/tools/*` over public https. Then:

```bash
APP_BASE_URL=https://<your-deployment> pnpm agent:deploy   # tools, knowledge base, tests, agent
node --env-file=.env agent/test.mjs 10                     # the agent test suite, 10 runs each
```

Other checks: `pnpm test` (unit tests), `pnpm test:e2e` (end-to-end flows), `pnpm smoke:tools` (27 tool guardrail checks against a running server).

## Repository map


| Path                              | What                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/app/apply`, `src/app/u`      | Applicant portal and the one-time upload page                                                                |
| `src/app/console`                 | Officer console: queue, case file, live call board, records, handoffs, SMS outbox, blocked actions, evidence |
| `src/app/api/tools/[tool]`        | The agent's 10 tools, one endpoint, all security checks in one place                                         |
| `src/lib/rules`                   | The 12-rule check                                                                                            |
| `src/lib/calls`                   | Pre-dial checks, phone and browser dialler, auto-call queue                                                  |
| `src/app/api/webhooks/elevenlabs` | Signed post-call webhook                                                                                     |
| `agent/`                          | The ElevenLabs agent as code: prompts, knowledge base, tools, tests, deploy                                  |
| `supabase/migrations`             | Database schema                                                                                              |


