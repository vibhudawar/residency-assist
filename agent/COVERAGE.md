# How each edge case is proven

The 36 edge cases from `BUILD-PLAN.md` §5, and where each is proven.

- **Agent test:** `agent/tests.mjs`, run 10× with `pnpm agent:test`, pass rates in `agent/evidence/latest.md`.
- **Backend check:** the guardrail smoke tests `pnpm smoke:tools` (27 checks) and `pnpm smoke:webhook` (8 checks), plus unit tests.
- **Demo:** shown in a recording.

| # | Case | Agent test | Backend check | Demo |
|---|---|---|---|---|
| 1 | Didn't opt in | — | smoke:tools "Sara (no consent): AI call blocked" | 🎬 |
| 2 | Opted in, later on do-not-call list | open-stop-calling-opts-out | smoke:tools "Opt-out blocks later calls" | |
| 3 | Outside 09:00–18:00 | — | pre-dial check `calling_hours` (shown on the console's calling board) | |
| 4 | Medical/security flag | resolve-officer-only-says-nothing | smoke:tools "Maria (medical flag): AI call blocked" | 🎬 |
| 5 | Several problems in one application | resolve-explains-every-issue | — | 🎬 |
| 6 | Same rejection twice | — | pre-dial check `no_active_call` | |
| 7 | Fixed on the portal first | — | pre-dial check `fixable_issue` (status no longer returned) | |
| 8 | Too many attempts | — | pre-dial check `attempt_limits` | |
| 9 | Not picked up | — | smoke:webhook "Unanswered call recorded as no answer" | |
| 10 | Declined / busy | — | webhook maps busy → declined (unit test) | |
| 11 | Picked up, silence | open-silence-checks-line | smoke:webhook "Silent call recorded as silent" | |
| 12 | Voicemail | (system voicemail tool, no message left) | webhook outcome = voicemail (unit test) | |
| 13 | Someone else answers | open-wrong-person-reveals-nothing, open-no-details-before-verification, verify-cannot-read-case-before-verified, sim-red-team | smoke:tools "get_case before verification is refused" | 🎬 |
| 14 | "Not a good time" | open-not-now-books-callback | — | |
| 15 | "Is this a scam?" | open-scam-question-reassures | — | |
| 16 | Wrong details twice | verify-failure-does-not-say-which, verify-locked-reveals-nothing | smoke:tools "Second failure locks verification" | |
| 17 | Refuses to verify | verify-refusal-ends-politely | — | |
| 18 | Disagrees with the rejection | handover-escalates-to-person | — | |
| 19 | New value still doesn't match | resolve-never-reveals-passport-record | smoke:tools "Value that still doesn't match is refused … without revealing it" | |
| 20 | Wants to change an unflagged field | resolve-refuses-unflagged-field | smoke:tools "Correcting an unflagged field is refused" | 🎬 |
| 21 | "Just approve my visa" | resolve-cannot-approve-visa, verify-never-wants-secrets, sim-red-team | no approve tool exists; smoke:tools "Nothing is approved automatically" | 🎬 |
| 22 | Changes mind after read-back | **resolve-submits-only-after-read-back**, **resolve-never-submits-before-read-back**, **resolve-never-submits-when-caller-unsure** (high-stakes) | smoke:tools "Correction without read-back is refused" | |
| 23 | Can't upload right now | resolve-cant-upload-now-link-stays-valid | upload link valid 24 h | |
| 24 | Uploaded photo fails again | resolve-failed-upload-says-what-to-fix | upload page lights the failed requirement | |
| 25 | No appointment slots | resolve-no-slots-offers-alternative | — | |
| 26 | Legal advice / off-topic | resolve-no-legal-advice | — | |
| 27 | Asks to pay on the call | resolve-fines-never-takes-payment | no payment tool exists | |
| 28 | Unsupported language | open-unsupported-language-offers-options | — | |
| 29 | Noisy line, keeps mishearing | (hand-over condition in the workflow) | — | not yet tested |
| 30 | Upset or distressed | resolve-distressed-caller-gets-a-person | — | |
| 31 | Asks for a person | handover-escalates-to-person | — | 🎬 |
| 32 | Call drops midway | — | smoke:tools "Same correction sent twice is stored once"; webhook closes the attempt | |
| 33 | Backend down during the call | resolve-backend-down-books-callback | tool route returns `temporarily_unavailable`, saves nothing | |
| 34 | Post-call webhook fails | — | smoke:webhook "A retried delivery is stored once and logged once" | |
| 35 | Officer approves | — | review.ts compare-and-set; console capture | 🎬 |
| 36 | Officer rejects | — | review.ts reject → needs a person + SMS | |

Also covered: the end-to-end name fix in a full simulated call (`sim-full-name-fix-end-to-end`), and replies in Arabic and Hindi (`resolve-replies-in-arabic`, `resolve-replies-in-hindi`).
