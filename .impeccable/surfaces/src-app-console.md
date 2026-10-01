---
version: 1
slug: "src-app-console"
primary_target: "src/app/console"
related_targets: ["src/app/apply"]
---

# Surface: Operator console (`/console`)

**Mode:** Operate — an officer works a queue: check a case, start the AI call, read what happened, approve or reject each correction. Evaluators watch it on desktop.
**Inherits** the Service Hall world from DESIGN.md unchanged (two materials, one ramp, three voices, motion grammar).

## Audience, job, constraints
- Case officer (and judges running the demo). English only; transcripts show the language spoken.
- Job: from a queue of returned cases, see why each was returned, whether the AI may call (pre-dial checks), start a call (phone or browser), and decide every correction the agent captured. Nothing reaches the applicant record without Approve.
- Cross-case views: call records (transcript, analysis, latency), handoffs (callbacks, escalations, follow-ups), SMS outbox, blocked actions, evidence (tests), demo reset.
- Calls are real only: until ElevenLabs keys exist, call controls run the pre-dial checks (and log blocked attempts) and then state the key is not set. Nothing is simulated.
- Reject needs a typed reason; it sets "needs a person" and sends a simulated SMS.
- Officer sign-in: shared OFFICER_PASSCODE (prototype stand-in for staff SSO). Prototype banner on every screen.

## Direction contract

THESIS: The console is an Amer counter: the hall's queue board on one side, the open case file on the desk; pick a number, deal with it, call the next. Refuses the generic admin dashboard (sidebar + KPI cards + data table) and its opposite, the decorative "control room" wall.

OWN-WORLD: Inherited Service Hall. Queue, live call and cross-case counts are LED board (board black, amber/green/red/blue lamps, Doto numerals in fixed cells). The case file, correction slips, transcripts and logs are thermal paper in ink, Geist Mono for data, Readex for reading. Issue weight only on the fix / route / officer ramp. Reject isolated from Approve by empty space and a required reason.

STORY: The officer signs in, sees the queue lit by issue weight with "awaiting decision" and "blocked" counts on the board, opens a number, reads the failed rules and pre-dial lamps, calls, watches the call land in the case history, then approves the slip — and the queue row goes green.

FIRST VIEWPORT: Desktop. Hall bar + banner, then a tab row (Cases · Call records · Handoffs · SMS outbox · Blocked actions · Evidence). Left 4/12: the queue board, one row per case (ref cells, name, ramp lamp, state word), counts in its header. Right 8/12: the case file — header with reference cells and status, failed rules, pre-dial check board with Call phone / Call in browser, the correction slips (old → new, Approve; Reject apart), then the case history printed top to bottom.

FORM: Counter desk — candidate 1 of my ordered structural list (dealt 4, 6, 1; user asked for the best-UX pick). Seed key 8330f2cf. Raises: the case history roll (from Thermal logbook) and lit decision/blocked counts on the queue board (from Supervisor wall). Signature interaction: Approve settles the slip and the queue lamp relights green via the amber check hold. Motion grammar: paper feeds down, LED cells light; nothing else moves.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
