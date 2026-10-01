# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Applicants** — expatriate residents in Dubai (largely South Asian, Arab, Filipino) filing or renewing a residency visa. They want the application through first time; when it is returned for a small, fixable mistake they want to know exactly what is wrong and fix it without another typing-centre visit. Often not native English speakers.
- **Officers** — GDRFA/ICP case officers reviewing corrections the voice agent captured, approving or rejecting each one, reading call transcripts.
- **Evaluators** — Ignyte × ElevenLabs Stage-2 judges (banking, insurance and government stakeholders) who run the end-to-end flow themselves from a hosted link and watch recorded demos on desktop.

## Product Purpose

Residency Assist is a prototype of a proactive, multilingual voice agent for Dubai residency applications. When an application is returned for a correctable error, the agent calls the applicant (only if they opted in), verifies them without secrets, explains the error against the official rule, and resolves it on the call — the correction then waits for a human officer's approval. Success: a returned application is fixed on one call instead of a repeat typing-centre visit and a 2–10 working-day cycle.

This repo is the Stage-2 build for the Ignyte × ElevenLabs challenge (Track 2, use case 6 — Proactive Application Resolution), submitted by 2026-10-14.

## Positioning

Every incumbent UAE government channel (DubaiNow, TAMM, U-Ask, Amer 800-5111) waits for the resident to reach in. Residency Assist reaches out first, at the moment of rejection, in the applicant's language — and is consent-first: no opt-in at submission, no AI call.

## Operating Context

- **Applicant portal** (`/apply`): mock UAE PASS sign-in → application form (passport details typed by the applicant, preferred language, photo, optional AI-call consent) → live 12-rule check → status page that updates as the call and officer act.
- **Operator console** (`/console`): officer sign-in → case inbox with pre-dial checks → live/browser call → officer approval of corrections → call records, escalations, blocked actions, latency and test evidence.
- **Real process this mirrors:** GDRFA smart services require login (username/password or UAE PASS) to submit; status checks need none. Applications are cross-checked against ICP passport records; returns arrive today as a terse SMS or portal status change.
- Demo is recorded and judged on desktop; applicants in reality are mostly on phones.

## Capabilities and Constraints

- 12 rules (R1–R12) with three resolution types: A fixable on the call, B explain and route, C officer-only (the AI never calls).
- Agent is tool-scoped; backend refuses corrections without verification, on unflagged fields, or values that still don't match the passport record. Corrections are only ever "pending officer review".
- Pre-dial checks: consent, do-not-call list, 09:00–18:00 UAE calling hours, officer-only block, retry limits.
- Languages: portal UI English + Arabic (RTL); voice agent English, Arabic, Hindi.
- All people, passports and cases are fictional. SMS is simulated in-app (an "SMS outbox"), not sent.
- Stack: Next.js 16 (App Router) on Vercel, Supabase (Postgres + private storage), ElevenLabs Agents + Twilio. UI built with shadcn/ui + 21st.dev components.
- Desktop-first, fully usable on phones.

## Brand Commitments

- Name: **Residency Assist (prototype)**. Never presented as GDRFA, ICP or any government body; every screen carries "Prototype — not affiliated with GDRFA/ICP".
- Voice: plain, calm, precise, government-service clarity. Explains rules as information, never legal advice; never pressures.
- The agent always opens by saying it is an AI and the call is recorded.

## Evidence on Hand

- Research briefs in `../research/` (GDRFA/ICP process, rejection reasons, UAE PDPL / TDRA / DIFC Reg 10, demographics, incumbent channels).
- GDRFA Dubai H1 2026 volumes: 1.051M new residency permits + 910k renewals (press).
- No real customers, pilots, testimonials or official endorsements exist — do not fabricate any.

## Product Principles

1. Consent before contact: nothing reaches the applicant who did not opt in.
2. A human decides: the agent prepares, the officer approves.
3. Show the rule, not just the verdict: every problem is explained against the requirement it failed.
4. Reveal nothing to the wrong person: no case detail before verification.
5. Every refusal is visible: blocked actions are logged and shown, not hidden.

## Accessibility & Inclusion

- Arabic UI must be a true right-to-left layout, not mirrored English.
- Plain-language copy for non-native English readers; target WCAG 2.2 AA.
