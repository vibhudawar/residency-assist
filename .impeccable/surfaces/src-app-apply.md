---
version: 1
slug: "src-app-apply"
primary_target: "src/app/apply"
related_targets: ["src/app/console"]
---

# Surface: Applicant portal (`/apply`)

**Mode:** Operate — the applicant completes a task (sign in, submit, understand what's wrong, follow the fix). Evaluators watch it on desktop.
**Shares its world with** the operator console (`/console`).

## Audience, job, constraints
- Expat applicant in Dubai, often not a native English reader; English + Arabic (true RTL). Desktop-first, works on phones.
- Job: submit once; if returned, see exactly which rule failed and that help is coming (AI call only if opted in).
- Flow: mock UAE PASS sign-in → form (typed passport details, preferred language, photo, consent box not pre-ticked) → live 12-rule check → status page that updates through call + officer review.
- "Prototype — not affiliated with GDRFA/ICP" on every screen. All data fictional.

## Direction contract

THESIS: The application is a numbered service-hall ticket; the hall's board always says where it is and what happens next. Refuses the generic government blue-header stepper form and its startup-gradient opposite.

OWN-WORLD: Cool thermal-ticket white paper with near-black thermal ink for the working surface; a near-black LED board panel with amber "now serving", green "done", red "needs attention" dot-matrix glyphs for status and the rule check. Reference numbers in fixed character cells. One workhorse bilingual sans (Latin + Arabic) for everything readable; dot-matrix only for board numerals and short board labels. Issue weight on one fixed ramp: fixable / route / officer-only. Reject isolated from Approve by empty space.

STORY: The applicant takes a ticket (sign in), fills the counter form while their ticket prints live beside it, submits, watches the board check each rule, and leaves knowing their number, what failed, and the single next step.

FIRST VIEWPORT: Desktop, two columns. Left 7/12: the counter form, sections stacked, primary "Submit application" at the end of the form. Right 5/12, sticky: the ticket at true ticket proportions — header strip, reference cells (blank "RA-······" until submit), the typed details printing in thermal type as you type — and below it a compact LED board showing "Waiting to submit". Sign-in screen: a ticket dispenser panel with one action, "Sign in with UAE PASS (mock)".

FORM: The Service Hall — candidate 4 of my ordered grounded list (Amer service-hall tickets and LED boards); seed key 25649a8f. Signature interaction: the ticket prints its reference cell by cell on submit, then the board cascades the 12 rule rows one by one (amber → green/red). Motion grammar: paper feeds down, LED cells cascade; nothing else moves.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Raises (named donors)
- Split-flap Concourse: reference in fixed character cells, changes cascade cell by cell.
- Dark Developer Console: destructive actions isolated by empty space.
- Star Atlas: one fixed issue-weight ramp everywhere.
- Botanical Folio: the same ticket at the same scale at every stage; only the change moves.
- Character Goods Catalog: every case card has the same fixed fields in the same slots.

## Unresolved
- Exact faces and tokens are set at build and recorded in DESIGN.md at finish.
