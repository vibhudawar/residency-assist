# Pilot & Scale (one page)

## The proposed pilot

| | |
|---|---|
| **Partner** | GDRFA Dubai, through its customer-happiness team, with one Amer centre as the delivery partner. Path in: Ignyte (DIFC) introduction |
| **Length** | 4 weeks |
| **Scope** | One centre, one error type first: **name mismatch (R1)**, the simplest fix-on-the-call case. Photo uploads (R4) are added in week 3 if R1 holds its targets |
| **Who gets called** | Only applicants who ticked the AI-call consent box. Everyone else gets today's SMS and portal notice |
| **Human control** | Every correction goes to an officer, and the agent cannot approve anything. Officers can stop calls for any case from the console |
| **Exit rule** | Stop or narrow the pilot if a wrong correction ever reaches an officer, or if opt-outs or complaints pass an agreed threshold |

## What we measure (baselines from our Stage 1 canvas)

| KPI | Today | Pilot target | Measured by |
|---|---|---|---|
| First-call correction rate | 0 (no proactive channel) | **60%** of called returns fixed without a repeat visit | Post-call data collection (`outcome`) + case outcome |
| Time to correct a returned application | 2–10 working days + a repeat visit | **Same call** (voice fix), **< 24 h** (upload) | Return timestamp → correction submitted |
| Languages in the resolution channel | 2 (Arabic, English) | 3 in the pilot (+ Hindi), 6 at scale | Per-call language in post-call analysis |
| Safety | — | 0 wrong corrections approved; every refusal logged | Officer decisions + Blocked actions log |

## Scale, in numbers

These are estimates. GDRFA publishes no return rate, so we apply a conservative 5–10% to its published volumes.

| | |
|---|---|
| Dubai residency permits | 1.051M new + 910k renewals in H1 2026 (GDRFA, reported) |
| Returned for something fixable (est. 5–10%) | **~100k–200k a year** |
| Calls needed | **~275–550 a day** |
| Call length, from our real calls | 1:48–3:32, about **2.5 minutes** on average |
| Voice minutes | ~700–1,400 a day |
| ElevenLabs usage we measured | ~1,000 credits per call minute |
| At 60% first-call fixes | **~60k–120k returns a year** fixed without a second typing-centre or Amer visit (each one also saves the applicant a repeat service fee of ~AED 50–500) |

The agent is stateless per call, so volume is a telephony and concurrency question, not a rebuild.

## From prototype to production

| Prototype today | Production |
|---|---|
| Mock GDRFA case system and passport records | GDRFA / ICP case and identity APIs replace `get_case` and `verify_identity` behind the same tool contract |
| US Twilio number (free trial) | UAE carrier through a SIP trunk, on a registered caller ID applicants can verify |
| One call at a time | Each day's returns go to ElevenLabs batch calling, paced inside the 09:00–18:00 calling window |
| English, Arabic, Hindi | + Urdu, Malayalam, Tagalog: same agent, a new language preset and knowledge-base translations |
| Supabase cloud database | Data kept in-region (UAE) on the authority's own infrastructure |
| Callback for hand-over | Live transfer to an officer's phone line (`HUMAN_TRANSFER_NUMBER`) |

## Regulatory fit

| Requirement | How the design meets it |
|---|---|
| Dubai AI Ethics: say it's an AI | First sentence of every call: "…an AI assistant. This call is recorded." Checked automatically after every call |
| TDRA calling rules | Consent at the start, do-not-call list, 09:00–18:00 UAE only, recording disclosed |
| DIFC Regulation 10: right to object to automated decisions | The agent makes no decisions. Officers decide, and "stop calling" works at any point |
| Fraud and vishing risk | Never asks for passwords, codes or payment; applicants can check independently on the portal or through official channels |
