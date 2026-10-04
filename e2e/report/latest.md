# End-to-end flows — 2026-10-04 22:16 UTC

7 of 7 flows passed against http://localhost:3006. Each flow starts from a fresh demo and plays the applicant and the officer in a real browser, and the voice assistant and ElevenLabs' webhook through the same endpoints the live agent uses.

| Flow | Result | Steps | Time |
|---|---|---|---|
| A typo is fixed on the call, approved by an officer, and the applicant sees it | Pass | 10 | 23.3s |
| An officer rejects a correction: nothing changes, a person takes over and the applicant is told | Pass | 5 | 20s |
| A new photo by SMS link: a bad one is refused with the reason, a good one is approved by an officer | Pass | 6 | 24.5s |
| Calls that break the rules are refused before dialling and logged | Pass | 3 | 26.1s |
| Only the right people get in: officers, verified callers, and signed webhooks | Pass | 7 | 11.3s |
| The applicant portal works in Arabic, right to left, and switches back | Pass | 2 | 0.6s |
| With auto-call on, the assistant calls by itself after a fixable check, and the officer can stop it | Pass | 5 | 25.1s |

## A typo is fixed on the call, approved by an officer, and the applicant sees it

- ✓ Applicant signs in, fills the form with a name typo, opts in to AI calls and submits
- ✓ The 12-rule check returns the name; with auto-call off, an officer arranges the call
- ✓ Assistant can't read the case before the caller is verified
- ✓ Caller verifies with reference and date of birth; the case lists the name issue
- ✓ Caller confirms the read-back; mid-call the applicant sees the call and the pending correction
- ✓ The call ends: ElevenLabs' signed post-call record shows in Call records with its latency
- ✓ After the call, the applicant sees the correction waiting for an officer
- ✓ Officer opens the case and approves the correction
- ✓ Applicant's status page shows the approval and the application moves to processing
- ✓ The applicant is told by SMS, logged in the outbox

## An officer rejects a correction: nothing changes, a person takes over and the applicant is told

- ✓ On a call, Ahmed verifies and confirms his date of birth from his passport
- ✓ A reason is required to reject
- ✓ Officer rejects with a reason; the slip records who, when and why
- ✓ The case is handed to a person, listed under Handoffs
- ✓ The applicant is told by SMS that an officer will contact them

## A new photo by SMS link: a bad one is refused with the reason, a good one is approved by an officer

- ✓ On a call, the assistant texts Fatima an upload link
- ✓ The text with the link is in the SMS outbox
- ✓ A photo on a blue background is refused, naming exactly what's wrong
- ✓ A photo on white passes the automatic check and waits for an officer
- ✓ Officer compares old and new and approves the photo
- ✓ The link now says the new photo is on the application, and is closed

## Calls that break the rules are refused before dialling and logged

- ✓ Sarah never opted in to AI calls: the call is refused for consent
- ✓ Maria's case is officer-only (a medical result): the AI never calls
- ✓ Both refusals are in the Blocked actions log

## Only the right people get in: officers, verified callers, and signed webhooks

- ✓ Console pages send a signed-out visitor to sign-in
- ✓ A wrong passcode is refused
- ✓ Demo reset refuses anyone who isn't a signed-in officer
- ✓ Agent tools refuse a wrong tool secret and an unknown case token
- ✓ The post-call webhook refuses an unsigned record
- ✓ The auto-call dialler refuses anyone without the job's secret
- ✓ A status link that isn't valid says so, with the way back

## The applicant portal works in Arabic, right to left, and switches back

- ✓ In Arabic the page is right to left with Arabic text and the prototype banner
- ✓ The language switch returns to English, left to right

## With auto-call on, the assistant calls by itself after a fixable check, and the officer can stop it

- ✓ Auto-call starts off; turning it on asks first
- ✓ The applicant submits; the status page says when the assistant will call
- ✓ The case shows the automatic call: placed now, or queued for calling hours
- ✓ The officer stops automatic calls for this case; the applicant is told an officer will arrange it
- ✓ Turning auto-call off is immediate
