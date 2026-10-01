---
version: 1
slug: "src-app-u"
primary_target: "src/app/u"
related_targets: ["src/app/apply", "src/app/console"]
---

# Surface: Upload link (`/u/<token>`)

**Mode:** Operate — the applicant replaces one file (photo or document scan) on a phone, often while the assistant waits on the call.
**Inherits** the Service Hall world from DESIGN.md unchanged.

## Audience, job, constraints
- Expat applicant, opened from an SMS on a phone, frequently mid-call; often not a native English reader. English + Arabic (true RTL), opens in the application's language unless the language cookie says otherwise.
- Job: understand what was wrong with the old file, take a new one that meets the rules, see immediately whether it passed, and know what happens next.
- No sign-in: the random link is the key (one application, one file kind, 24 h, closes once a file passes, 5 attempts). Shows only first name and reference.
- A file that passes the automatic check is "received, waiting for an officer" — it never replaces the old file until the officer approves in the console.
- Prototype banner on every screen. No personal data in the URL.

## Direction contract

THESIS: The requirements are the board. Each photo rule is its own lamp — unlit before the photo, lit green or red in place after — so the applicant sees exactly which rule their photo met. Refuses the generic drag-and-drop upload box with a spinner and a pass/fail toast.

OWN-WORLD: Inherited Service Hall: hall-grey floor, the reason on paper with the fix-ramp R4/R5 chip, the requirement board in board black with dot-matrix state words, the photo slot as a paper frame at passport proportions with a dashed empty well, ink keys.

STORY: The applicant reads one line on why the old photo was returned, reads three lamps of what a good photo needs, takes the photo with the camera key, sends it, watches each lamp hold amber then settle, and either reads "Photo received — an officer will confirm it, you can tell the assistant" or sees exactly which lamp failed and tries again.

FIRST VIEWPORT: Phone 375 wide. Hall bar + banner; headline "Take a new passport photo" with the reference and link expiry under it; the reason row; the requirement board (three unlit lamps); the photo slot top edge with the "Take photo" key visible without scrolling below 812 px. Desktop: one 560 px column, same order.

FORM: Requirement lamps — candidate 2 of my ordered structural list (dealt 4, 2, 3; user chose the recommended card). Seed key e2c4c3d7. Signature interaction: on send, the board's rows run the rules-check cascade (amber "Check" hold, then each settles green or red). Motion grammar: paper feeds down, LED cells light; nothing else moves.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
