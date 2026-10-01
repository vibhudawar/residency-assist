# Agent knowledge base

Documents the voice agent looks things up in during a call (uploaded to the ElevenLabs agent's knowledge base). This README is not uploaded.

| File | Covers | Used when |
|---|---|---|
| 01-about-this-call.md | Who is calling, consent, what the assistant can and never does, scam question, opt-out, handover, languages | Every call |
| 02-the-12-checks.md | R1–R12 in plain words, path (fix / someone else / officer only), what the assistant does | Explaining `get_case` results |
| 03-photo-and-scan.md | Official photo rules, this prototype's checks, phone tips, upload link | R4, R5 |
| 04-passport-validity.md | Six-month rule, renew via embassy | R8 |
| 05-name-and-personal-details.md | Why mismatches happen, read-back method, amending data later | R1–R3 |
| 06-attestation.md | MOFA attestation steps | Only if asked |
| 07-previous-visa-still-active.md | Only the sponsor cancels; MOHRE/GDRFA; grace periods (never personalised) | R9 |
| 08-unpaid-fines.md | Official payment channels, never take payment, AED 50/day overstay | R10 |
| 09-medical-test-and-biometrics.md | Dubai Health medical test, ICP biometrics, booking, prototype note | R6, R7 |
| 10-amer-and-official-channels.md | Amer, 800 5111, how to check status yourself | Scam question, anything out of scope |
| 11-profession-code.md | Employer fixes via MOHRE | R11 |

## How facts are labelled
- **[official]** — stated on a UAE government page (icp.gov.ae, gdrfad.gov.ae, u.ae, dubaihealth.ae, mofa.gov.ae, mohre.gov.ae, dubai.ae). Each document lists the pages with the date they were checked.
- **[guidance]** — common practice not stated on an official page we could open. Worded as general information.
- Each document ends with **Do not say**: things that vary, conflict between sources, or must never be said on a call.

## Rules for editing
- Never add a fee, number, time limit or phone number that isn't on an official page.
- Keep R12 (medical / security) out of every document: it is never discussed by the AI.
- Residency Assist is a prototype, not GDRFA/ICP/Amer. No document may suggest otherwise.
- Re-check sources before the final recording (last checked 2 Oct 2026).

## Known conflicts between sources (kept out of what the agent says)
- Overstay fine: current ICP page says AED 50/day; an older GDRFA FAQ says AED 100/day → documents use AED 50.
- Photo background: ICP FAQ and GDRFA say white; the ICAO PDF says light-coloured → documents say white.
- Deadline to complete residency after entry: u.ae says one month, ICP says 60 days → not stated.
- Grace period after cancellation: ICP tiers (30–180 days) vs a MOHRE note (30 days or remaining work-card time) → never personalised.
