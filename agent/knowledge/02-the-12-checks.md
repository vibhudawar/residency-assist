# The 12 checks, and what happens when one fails

**Source:** Residency Assist rules engine (this prototype). The checks mirror common reasons residency applications are returned in Dubai; the records they are checked against are fictional.
**Applies to:** explaining any issue the `get_case` tool returns.

Every application is checked against 12 rules. Each failed rule has one of three paths:
- **Fix on the call** — the assistant can help fix it now (then an officer approves).
- **Someone else must act** — the assistant explains who must act; it cannot fix it on the call.
- **Officer only** — never handled by the AI. If a case has one of these, there is no AI call.

| Check | What it means when it fails | Path | What the assistant does |
|---|---|---|---|
| R1 Name matches passport | The name on the form is spelled differently from the passport. | Fix on the call | Ask for the name **exactly as printed in the passport**, spell it back letter by letter, confirm, submit for approval. |
| R2 Date of birth matches | The date of birth on the form is not the one in the passport. | Fix on the call | Ask for the date of birth as in the passport, read it back (day, month in words, year), confirm, submit. |
| R3 Passport number matches | The passport number on the form has a typo. | Fix on the call | Ask for the number as printed, read it back character by character, confirm, submit. |
| R4 Photo meets requirements | The photo is not accepted (for example, the background is not plain white, or it is too small). | Fix on the call | Send an SMS upload link; the applicant takes a new photo; check that it passed. |
| R5 Scan is readable | The document scan is too blurry or too low-resolution to read. | Fix on the call | Send an SMS upload link for a clearer scan. |
| R6 Emirates ID biometrics | Fingerprints and photo for the Emirates ID have not been taken yet. | Fix on the call | Offer two appointment slots and book one. |
| R7 Medical fitness test | The medical fitness test has not been done yet. | Fix on the call | Offer two appointment slots and book one. |
| R8 Passport valid 6+ months | The passport expires in less than six months. | Someone else must act | Explain the passport must be renewed first (with the applicant's own embassy or consulate). Create a follow-up. |
| R9 No active previous visa | A previous UAE residence visa is still active. | Someone else must act | Explain the previous sponsor or employer must cancel it first. Create a follow-up. |
| R10 No unpaid fines | There are unpaid immigration fines. | Someone else must act | Say the amount the system shows and where fines can be paid officially. **Never take payment on the call.** Create a follow-up. |
| R11 Profession code matches | The job (profession) code does not match the labour contract. | Someone else must act | Explain the employer must correct it. Create a follow-up. |
| R12 Officer review | The application needs review by an officer. | Officer only | **Never discussed by the AI.** Cases with this issue are never called. |

## Rules for fixing details on the call (R1–R3)
- Only the fields the check flagged can be changed. If the caller asks to change anything else, explain that this call can only fix the flagged items and offer a person.
- Always **read the value back** and get a clear "yes" before submitting. If the caller changes their mind, take the new value and read it back again.
- The new value must match the passport record. If it still does not match, the system refuses it: tell the caller it still doesn't match the passport we have on file, **without saying what the record says**, and offer a person.
- After submitting, say: "I've sent this correction to an officer for approval. You'll see the update on the portal and get an SMS."

## Several problems in one application
Explain all of them at the start, briefly, then work through them one at a time: fixes on the call first, then the ones someone else must act on.
