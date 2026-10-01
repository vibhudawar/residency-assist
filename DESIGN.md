---
name: Residency Assist
description: A residency service hall's numbered thermal ticket and black LED "now serving" board.
colors:
  hall: "#e4e8ea"
  paper: "#f6f8f9"
  ink: "#16181a"
  ink-2: "#4b5057"
  rule: "#d0d6da"
  input-stroke: "#bac2c8"
  paper-quiet: "#eaeef0"
  board: "#0c0e10"
  board-2: "#15181b"
  board-rule: "#262a2f"
  led-amber: "#ffb020"
  led-green: "#3ddc84"
  led-red: "#ff6a6f"
  led-blue: "#7ea6ff"
  led-dim: "#2c2a22"
  led-text: "#d9dcd6"
  fix: "#8a5200"
  fix-bg: "#fff0d3"
  route: "#2c4bb0"
  route-bg: "#e5ebff"
  officer: "#b1222a"
  officer-bg: "#fde6e7"
  ok: "#1e6b43"
  ring: "#c98400"
typography:
  display:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.3
  case-headline:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
  body-lead:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.375
  meta:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.25
  ticket:
    fontFamily: "Geist Mono, Readex Pro, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.375
  led-numeral:
    fontFamily: "Doto, Readex Pro, Geist Mono, monospace"
    fontSize: "34px"
    fontWeight: 900
    lineHeight: 1
  led-word:
    fontFamily: "Doto, Readex Pro, Geist Mono, monospace"
    fontSize: "15px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.06em"
  led-stage:
    fontFamily: "Doto, Readex Pro, Geist Mono, monospace"
    fontSize: "26px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.04em"
  led-word-rtl:
    fontFamily: "Readex Pro, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  cell: "3px"
  chip: "4px"
  control: "6px"
  button: "8px"
  board-inner: "7px"
  board: "10px"
  sheet: "12px"
  machine: "14px"
spacing:
  hairline: "3px"
  cell-gap: "3px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
  page-x: "24px"
  container: "1240px"
  console-container: "1440px"
  ticket-width: "360px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "0 24px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.board}"
    textColor: "{colors.paper}"
  button-quiet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 14px"
  button-key:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "40px"
  button-key-sm:
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.paper-quiet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
  button-secondary-hover:
    backgroundColor: "{colors.rule}"
  button-ghost:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.button}"
  button-ghost-hover:
    backgroundColor: "{colors.paper-quiet}"
    textColor: "{colors.ink}"
  button-destructive:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.officer}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "40px"
  button-destructive-hover:
    backgroundColor: "{colors.officer-bg}"
    textColor: "{colors.officer}"
  button-board:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.paper}"
    rounded: "{rounded.button}"
    padding: "0 16px"
    height: "40px"
  button-board-hover:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.led-amber}"
  button-board-confirm:
    backgroundColor: "{colors.led-red}"
    textColor: "{colors.board}"
    rounded: "{rounded.control}"
    height: "32px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  segment-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "5px"
  ticket:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.ticket}"
    padding: "28px 24px 24px"
    width: "360px"
  ref-cell-paper:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.led-numeral}"
    rounded: "{rounded.cell}"
    width: "34px"
    height: "52px"
  ref-cell-board:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.led-amber}"
    rounded: "{rounded.cell}"
    width: "23px"
    height: "34px"
  ref-cell-board-sm:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.led-amber}"
    rounded: "{rounded.cell}"
    width: "16px"
    height: "24px"
  led-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.led-text}"
    rounded: "{rounded.board}"
    padding: "6px"
  issue-chip-fix:
    backgroundColor: "{colors.fix-bg}"
    textColor: "{colors.fix}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  issue-chip-route:
    backgroundColor: "{colors.route-bg}"
    textColor: "{colors.route}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  issue-chip-officer:
    backgroundColor: "{colors.officer-bg}"
    textColor: "{colors.officer}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  status-chip-ok:
    backgroundColor: "{colors.paper-quiet}"
    textColor: "{colors.ok}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  chip-neutral:
    backgroundColor: "{colors.paper-quiet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.chip}"
    padding: "4px 8px"
  queue-row-selected:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.paper}"
    padding: "12px 16px"
  correction-slip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px 20px"
  upload-slot:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px"
  photo-frame:
    backgroundColor: "{colors.hall}"
    rounded: "{rounded.chip}"
    width: "104px"
    height: "134px"
  scan-frame:
    backgroundColor: "{colors.hall}"
    rounded: "{rounded.chip}"
    width: "104px"
    height: "148px"
  received-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "16px"
  closed-notice:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    padding: "16px 20px"
  upload-slip-picture:
    rounded: "{rounded.chip}"
    width: "120px"
    height: "154px"
  case-history-roll:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.ticket}"
    padding: "24px"
  log-table:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
  console-tab-count:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  console-bar:
    backgroundColor: "{colors.board}"
    textColor: "{colors.led-text}"
    padding: "12px 24px"
  hall-bar:
    backgroundColor: "{colors.board}"
    textColor: "{colors.led-text}"
    padding: "14px 24px"
  prototype-banner:
    backgroundColor: "{colors.led-amber}"
    textColor: "{colors.board}"
    padding: "6px 16px"
---

# Design System: Residency Assist

## Overview

**Creative North Star: "The Service Hall"**

The application is a numbered ticket from a residency service hall, and the hall's black LED board always says where it is and what happens next. Two materials carry everything. The working surface is cool thermal paper printed in near-black ink: the form, the ticket, the issue list. The status surface is a near-black LED board whose dot-matrix lamps light amber while checking, green when done, red when attention is needed, blue when someone else must act. The hall itself is a pale cool grey floor that both materials sit on.

The world is calm and dense. The hall feels like a public counter where things are being dealt with, not like a dashboard. One bilingual sans (Readex Pro, Latin and Arabic) carries everything a person reads. The ticket prints in thermal mono. Dot-matrix appears only where a real board would light it: reference numerals, the "now serving" stage, short state words. Arabic is true RTL. Columns, lamps and ticket rows mirror; reference numbers and passport data stay LTR inside fixed character cells.

The world rejects the generic government blue-header stepper form and its startup-gradient opposite.

The upload link (`/u/<token>`) is the same world on a phone: the applicant replaces one photo or scan, mid-call, in English or Arabic. The requirements are the board: each rule is its own lamp, unlit before a file is sent and lit in place after the check. The paper slot below it holds the photo at passport proportions.

The operator console (`/console`) is built in the same world, unchanged: an officer's counter desk. The queue, the pre-dial calling board, the latency board and every lit count are LED board; the open case file, correction slips, call records, logs and the case-history roll are thermal paper. Same tokens, same issue ramp, same lamp states, same motion grammar ("paper feeds down, LED cells light; nothing else moves"). The console is English-only and always LTR.

**Key Characteristics:**
- Two materials only: thermal paper (working) and LED board (status), on a cool hall-grey floor.
- The reference number always sits in fixed character cells: reverse-printed ink on paper, glowing amber on the board.
- One fixed three-step issue ramp (fixable / route / officer) used identically everywhere.
- Each type role has one job: Readex reads, Geist Mono prints, Doto lights.
- Motion is mechanical and diegetic: paper feeds, cells drop, lamps light.
- Full EN/AR parity with true RTL on the applicant portal; data stays LTR. The officer console is English and LTR.

## Colors

A cool, near-neutral paper-and-ink palette, lit by a small set of saturated LED lamp colours that live only on the black board.

### Primary
- **Thermal Ink** (ink): near-black. Used for all primary text on paper, the primary button, reverse-printed reference cells, the selected segment, and the selected photo-option stroke. It is the product's "primary": ink, not a brand colour.
- **Board Black** (board): the LED board panel, the hall bar, the dispenser machine, and the primary button's hover state (ink deepens to board).

### Secondary
- **Now-Serving Amber** (led-amber): the board's voice. Reference numerals on the board, the current stage, the "checking" phase of every rule row, the "fix" lamp, the prototype banner background, and text selection. On paper it never appears as text; its darker sibling **Caret Amber** (ring) carries focus outlines and the caret.

### Tertiary
- **Lamp Green / Lamp Red / Lamp Blue** (led-green, led-red, led-blue): board-only lamp states: pass/done, officer-only/needs attention, and route (someone else must act). They glow on black and are never used on paper.

### Issue Ramp (paper side)
- **Fixable** (fix on fix-bg): deep amber-brown on pale amber. The error can be fixed on the call.
- **Route** (route on route-bg): deep cobalt on pale blue. Explain and route; someone else must act.
- **Officer** (officer on officer-bg): deep red on pale rose. Officer-only. Also the destructive colour and the field-error text.

### Done Ink (paper side)
- **Stamp Green** (ok): deep green ink for "done" on paper: an approved correction line, a verified field, a consent dot, and the clear/goal-met status chip (ok on Quiet Paper). It is not an issue weight and never fills a surface. Lamp Green stays on the board.

### Neutral
- **Hall Floor** (hall): page background; the floor the materials rest on.
- **Thermal Paper** (paper): ticket, inputs, cards, issue rows, the mock UAE PASS sheet.
- **Quiet Paper** (paper-quiet): shadcn secondary/muted/accent fill; the neutral chip (refusal sources, "not evaluated") and the ground of the done chip.
- **Faded Ink** (ink-2): secondary text, field hints, ticket labels.
- **Paper Rule** (rule): section dividers, card borders, list rules. **Input Stroke** (input-stroke) is the slightly heavier field border.
- **Board Panel / Board Rule** (board-2, board-rule): cell wells and row dividers inside the board. **LED Text** (led-text): warm off-white for readable board copy, dimmed by opacity (70%, 60%, 25%) for secondary and upcoming states.

### Named Rules
**The Two Materials Rule.** Every surface is either paper (ink on cool white) or board (lamps on black). There is no third material: no tinted cards, no gradients, no glass.

**The Lamps Stay On The Board Rule.** LED green, red, blue and amber glow only on board black. On paper, issue weight is expressed with the paper-side ramp (fix / route / officer), never with a lamp colour.

**The One Ramp Rule.** Fixable, route and officer map to the same three colours on every surface: lamp, chip, label, row. Do not add a fourth weight. Do not reuse a ramp colour for decoration. A refusal or an event source is not an issue weight: it takes the neutral chip (ink on Quiet Paper), never officer red.

**The Done Ink Rule.** On paper, done reads in Stamp Green (ok) ink, as text or on Quiet Paper. On the board, done is Lamp Green. The two never swap materials.

## Typography

**Display / Body Font:** Readex Pro (Latin + Arabic), with ui-sans-serif, system-ui fallback
**Ticket / Data Font:** Geist Mono, falling back to Readex Pro for Arabic
**LED Font:** Doto (dot-matrix, 700/900), falling back to Readex Pro for Arabic glyphs

**Character:** One warm, open bilingual sans carries everything a person has to read, in both scripts at equal weight. The thermal mono and dot-matrix are machine voices. They appear only where a ticket printer or a lamp board would produce them.

### Hierarchy
- **Display** (600, 56px at `lg`, 44px below, 1.05, -0.02em): sign-in headline only, max 16ch.
- **Display, console sign-in** (600, 44px, 56px at `lg`, same as Display): the officer sign-in headline.
- **Case headline** (600, 28px, 1.25, -0.015em): the console's one heading per view: the applicant name on the open case file, each log page title, the empty-desk line.
- **Headline** (600, 36px form title; the upload link sets it at 28px on phones and 36px from `sm`, and it always names where the link stands: the task, "Photo received", or the closed state; 34px to 40px for the status "next step" sentence at 1.12, -0.015em): one per screen. On the status page it is the hall announcement of the single next step, max 24ch.
- **Title** (600, 19px): form section legends and console section titles (Why it was returned, Your decision, Call, Evidence sections). 22px is used for the mock UAE PASS sheet and the officer sign-in sheet heading.
- **Body** (400, 15px to 16px; lead paragraphs 18px at 1.625, max 52ch): tabular numerals are on globally.
- **Label** (500, 14px): field labels. Hints sit inline after a middle dot in Faded Ink, weight 400.
- **Meta** (400, 12px, 1.25): board header asides, board table column heads, count labels, the console bar subtitle and queue-row state lines. Paper-side meta (fact labels, slip captions, hints) sits at 12.5px in Faded Ink.
- **Ticket** (Geist Mono 400, 12.5px; labels uppercase in Faded Ink, values uppercase in ink unless typed case matters; uppercase is dropped in RTL).
- **LED numeral** (Doto 900, 34px in 52px-tall cells on paper, 22px in 34px cells on the board, 15px in 24px cells on queue rows). Lit counts on the queue board are 26px Doto; the latency board's averages are 17px.
- **LED word / stage** (Doto 900, uppercase; 15px at 0.06em for rule-row state words, 14px for queue-row state words, 13px for pre-dial PASS/STOP, 26px at 0.04em for the current stage; tracking resets to normal in RTL). In RTL the rule-row state word leaves Doto altogether: Readex semibold 14px, normal tracking, in the lamp colour with the same glow (led-word-rtl).

### Named Rules
**The Three Voices Rule.** Readex reads, Geist Mono prints, Doto lights. Dot-matrix is limited to reference numerals, lit counts and figures on a board, the current stage, row state words and the hall monogram. Never use it for sentences, labels or headings.

**The Equal Scripts Rule.** Arabic is set in the same family, size and weight as English. Doto has no Arabic glyphs, so in RTL the board's state words switch deliberately to Readex semibold 14px in the lamp colour, never a browser fallback; Geist Mono falls back to Readex for Arabic. A lit word reads as a lamp in both scripts.

**The One Digit System Rule.** A screen uses one set of digits. The reference prints in Latin digits in its cells, so Arabic screens format times, dates and counts with Latin digits too (`ar-AE-u-nu-latn`).

## Layout

A 1240px centred container with 24px side gutters on a 12-column grid at `lg`. Working screens split 7/12 (the counter: form or status narrative) and 5/12 (the ticket and its board, sticky at 32px from the top). The column gap is 48px. The sign-in screen splits 6/6: copy on one side, the ticket dispenser on the other. In RTL the grid mirrors, so the ticket sits on the left.

The ticket and the compact board share one width (max 360px) and stack with 24px between them. The ticket appears at the same scale on every stage. Only the content that changes moves.

Form sections stack 32px apart. Each opens with a top rule and 28px of padding. Fields sit on a 1-column grid that becomes 2 columns at `sm`, with a 20px gap. The primary action closes the form after its own top rule. Destructive actions (withdraw consent) are separated from neutral status by space: they sit at the opposite end of a justified row, never next to a primary.

Below `lg` everything is one column: the form or status first, then the ticket and board.

The upload link is one 560px column with 20px side gutters, 24px from the bar to the headline. Phone and desktop use the same order: headline; the reference in small paper cells, the first name and the link expiry on one meta line under it; the reason row; the requirement board; the photo slot (or the received card, or the closed notice); a 12.5px privacy line. The blocks stack 16px apart. On a 375 x 812 phone the slot's top edge and its first key show without scrolling.

The operator console runs wider: a 1440px container with 16px gutters (24px from `sm`). Under the console bar a hall-grey tab row (44px tabs, 2px ink underline on the active one) names the sections. The desk splits 4/12 and 8/12 at `lg` with a 40px gap: the queue board on the left, sticky 24px from the top and scrolling inside its own frame, the case file on the right. The case file keeps the same section order for every case: header, facts strip, why it was returned, your decision, call, case history. Sections open with a top rule and 20px of padding. The decision section sits above the calling board, so Approve is in the first viewport at 1440 x 900. Cross-case logs are full-width paper tables (min 860px) that scroll horizontally inside their frame on small screens. Below `lg` the desk is one column, queue first.

## Elevation & Depth

Depth is physical, not interface. Exactly three objects lift off the hall floor: the paper ticket, the black board, and the dispenser machine (plus the paper sheets: the mock UAE PASS sheet and the officer sign-in sheet; and the console's case-history roll, a printout from the same thermal printer as the ticket). Each casts one soft, downward, negatively spread shadow, like an object lying on a counter. Everything else is flat and separated by hairline rules. The LED glow is light, not elevation: a soft halo around lit glyphs and lamps.

### Shadow Vocabulary
- **Ticket drop** (`box-shadow: 0 18px 30px -18px rgb(22 24 26 / 0.45), 0 2px 6px -2px rgb(22 24 26 / 0.18)`): the paper ticket and the case-history roll.
- **Board drop** (`box-shadow: 0 24px 40px -24px rgb(0 0 0 / 0.6)`): every LED board panel.
- **Machine drop** (`box-shadow: 0 30px 50px -30px rgb(0 0 0 / 0.7)`): the dispenser body.
- **Sheet drop** (`box-shadow: 0 24px 40px -28px rgb(22 24 26 / 0.5)`): a standalone paper sheet (mock UAE PASS, officer sign-in).
- **LED glow** (`text-shadow: 0 0 6px color-mix(in oklab, currentColor 55%, transparent)`; lamps `0 0 6px` to `8px currentColor`): lit glyphs and lamps on the board only.
- **Cell well** (`box-shadow: inset 0 -1px 0 board-rule`): board character cells.

### Named Rules
**The Objects Lift Rule.** Only physical hall objects (ticket and case-history roll, board, machine, sheet) cast shadows. Cards, slips, log tables, inputs and buttons are flat.

**The Paper Can't Glow Rule.** Glow belongs to lamps. Reference cells on paper are reverse-printed ink with no glow. The same cells on the board glow amber.

## Shapes

Corners are small and mechanical, and they scale with the size of the object: 3px character cells, 4px chips, 6px controls and cards, 8px buttons, 10px board frames (with a 7px inner bezel), 12px sheets, 14px machine tops. Nothing is pill-shaped except lamps, which are round 8px dots.

The ticket and the case-history roll have no corners at all. Its top and bottom edges are perforated, cut by a repeating 8px semicircular tooth mask, so it reads as torn from a roll. Inside the ticket, dashed ink rules (30% ink) divide masthead, number and data. Blank reference cells are dashed outlines. Inside the board, a faint 6px dot-matrix grid (white at 3%) textures the panel field.

## Components

### Buttons
Solid and quiet, like a counter terminal key. The shared Button component is the Service Hall key set; nothing moves on press or hover, only colour and stroke change.
- **Shape:** gently squared (8px); 6px for the small and icon keys.
- **Sizes:** default 40px tall at 14px, small 32px at 13px, large 48px at 15px, icon 36px square. All keys are 500 weight.
- **Primary (default):** ink fill, paper text. Hover deepens ink to board black. The portal's form submit is the same key at 48px, min-width 220px, 16px text; the full-width portal sign-in key is 56px. Disabled drops opacity, with an inline spinner or a "…ing" label while pending.
- **Outline:** paper fill, 25%-ink stroke, ink text. Hover darkens the stroke to ink.
- **Secondary:** Quiet Paper fill, ink text; hover goes to Paper Rule.
- **Ghost:** no fill, Faded Ink text; hover fills Quiet Paper and inks the text. Used for Cancel.
- **Destructive:** quiet paper with officer text and a 35%-officer stroke; hover takes the full officer stroke on the officer wash. It is never filled red on paper.
- **Board:** for keys on the LED board: Board Panel fill, board-rule stroke, paper text. Hover lights stroke and text amber. The board's two-step confirm key (demo reset) is the one filled lamp key: Lamp Red with board text, on the board only.
- **Quiet (portal):** paper fill, 6px radius, 1px rule or 25%-ink stroke, 13.5px. The destructive quiet button turns its stroke and text officer-red on hover.
- **Text link:** Faded Ink, underlined on hover with a 0.2em offset.
- **On board (portal):** the language switch is a 6px outline in board-rule with paper text. Hover lights it amber.
- **Focus:** 2px solid Caret Amber outline at 2px offset, everywhere.

### Inputs / Fields
- **Style:** paper fill, 1px input-stroke border, 6px radius, 44px tall, 15px text. Passport and code fields set in Geist Mono, LTR. Passport numbers are uppercase with 0.08em tracking.
- **Focus:** the border goes to ink, plus a soft amber ring.
- **Error:** officer-red 13px message below the field, linked by aria-describedby.
- **Textarea (reject reason):** the same paper field at 6px radius, 14.5px text, 14px by 10px padding; focus goes to ink with a soft amber ring. A required reason carries a Faded Ink hint below that says where it goes.
- **Segmented choice (call language):** a 44px paper track with a 4px inset. The selected segment is ink with paper text. Each option label is set in its own language.
- **Choice cards (photo):** paper card, 6px radius, rule border. Selected gets an ink border plus a 1px ink ring.

### Cards / Containers
- **Issue row:** paper on hall, 6px radius, 1px rule border, 16px padding. It leads with a ramp-coloured mono code chip (R1 to R12, 4px radius), then the plain-language finding, then the ramp label and the rule it was checked against.
- **Consent box:** paper, 6px, rule border that turns ink when ticked. It is never pre-ticked.
- **Facts strip (console):** one paper strip, 6px, rule border, a 4-column label/value grid (2 below `sm`). Labels 12.5px Faded Ink; values 14px Geist Mono unless they are words.
- **Log table (console):** a plain paper table in a 6px rule-bordered frame. Column heads 12.5px Faded Ink at weight 400; rows divided by Paper Rule; times and identifiers in Geist Mono; case references link in mono ink. Empty logs are a dashed 25%-ink outline that says what will fill them.

### Chips
- **Issue chip:** ramp colour on its wash, 4px radius, mono code (R1 to R12) or a short ramp label.
- **Status chip:** the case status on the ramp wash for fix, route and officer; done or goal-met is Stamp Green on Quiet Paper.
- **Neutral chip:** ink (or Faded Ink) on Quiet Paper, for anything that is not an issue weight: refusal sources (Backend, Pre-dial check), "not evaluated".
- **Tab count:** ink fill with paper mono 11px numerals, 4px radius, on a console tab where work is waiting.

### Navigation (Hall Bar)
A board-black bar across every screen. Above it sits a full-width amber prototype banner (board text, 12.5px medium) that is never removed. The bar carries the amber Doto "R" monogram in a board-2 well, the product name in paper, the hall name in dimmed LED text (hidden on mobile), and the language switch.

### Navigation (Console Bar and Tabs)
The console bar is the hall bar, staff side: the same banner and monogram, the product name over "Operator console" in 12px dimmed LED text, then, when signed in, the demo reset, a board-rule divider, the officer's name and a paper text-link Sign out that lights amber on hover. Below it, the tab row sits on the hall floor: 14px Faded Ink tabs, the active tab in ink at 500 with a 2px ink underline, and a tab count where work is waiting. The tab row scrolls horizontally on mobile.

**Two-step reset.** "Reset demo" is a small board key. Pressing it asks first: a dimmed LED line says what it wipes, then Cancel (board key) and, after a deliberate gap, the Lamp Red Confirm reset key. The result is a short green or red LED word beside the key.

### Signature: The Ticket
The thermal ticket, max 360px wide, with a perforated edge and Geist Mono 12.5px. It has a masthead (hall name in uppercase plus three fading ink dots), the number block (reference cells, or "issued on submit"), a label/value data list on a 7.5rem label column, and a decorative LTR barcode with the spaced reference beneath. It prints the applicant's typed details live as they type. On submit it feeds down and prints its reference cell by cell.

### Signature: Reference Cells
The reference (`RA-` plus 6 digits) in fixed character cells, always LTR, read out by screen readers character by character. On paper: ink cells with paper digits, 52 x 34px, with dashed empty wells before issue. On the board: amber glowing digits in board-2 wells, 34 x 23px.

### Signature: LED Board
A board-black frame with 6px padding around a 7px bezel with the dot-matrix field. The header row holds a 13px title in LED text with an optional steady green "live" lamp. Three forms exist:
- **Rules check:** one row per rule: lamp, mono code, label, Doto state word.
- **Now Serving (stage board):** the reference in board cells, the current stage in 26px amber Doto, and every stage as a lamp in an even 3-column grid. Done is green, current is amber, upcoming is 25% LED text.
- **Waiting:** a single pending row before submit.

### Signature: Queue Board (console)
The hall's queue board, officer side, built on the LED Board panel. Its header carries "Queue" and the case count in 12px mono. Under it, three lit counts in an even 3-column grid divided by board rules: awaiting your decision (amber), open handoffs (blue), blocked today (red), each a 26px glowing Doto numeral over a 12px label. A zero count drops to 30% LED text. Then one row per case: small board reference cells and a change lamp with its state word, the name in LED text (paper when selected) with the failed rule codes in 11.5px mono, then a 12px state line (call language · the decision once there is one, otherwise the last call · "N to decide" in amber). The selected row sits on Board Panel; hover is Board Panel at 60%.

### Signature: Change Lamp
A board lamp (8px dot, 8px glow) with a 14px Doto state word. It is still on first paint. When its state changes while you watch (an approval, a call ending), the lamp and word hold amber for the check (the first 65% of 1100ms) and then settle on the new colour. This is how an approved slip relights its queue row green.

### Signature: Calling Board (console)
The pre-dial checks on an LED Board panel titled "Before calling", aside "checked on every press". A three-column table: the check (LED text, with a 12.5px detail at 65%), then a Phone and a Browser lamp, each a glowing green or red dot with a 13px Doto PASS or STOP. Check labels keep their sentence capitalisation. Under the table, the call keys (board variant, with phone and globe icons) and a 12.5px line saying what pressing will do. A refusal or not-connected outcome prints below in red or amber LED text, and the last six attempts list in mono time, channel and a coloured status.

### Signature: Correction Slip (console)
One correction the agent captured, as a paper slip (6px, 1px border at 40% ink while waiting, Paper Rule once decided). The header has the fix-ramp rule chip, the field name at 15px semibold, and a 12.5px caption with the capture time; it links "Open call record" only when a record exists. The body is old → new in 17px Geist Mono: the form value struck through in Faded Ink, an arrow, the confirmed value in ink. The footer, behind a top rule, holds the large primary "Approve correction" with a one-line note of what it writes. Reject sits at the far end of the row as a destructive key. Opening Reject replaces the row with a right-aligned form: a label, a required reason textarea (at least 5 characters), a hint saying where the reason goes, then Cancel (ghost) and Reject correction (destructive). Once decided, the footer prints the decision line: Stamp Green with a check for approved, officer ink for rejected, with who and when in mono. It feeds down only when decided while you watch.

### Signature: Requirement Board (upload link)
The LED Board's rules-check form, dense (13px rows, 8px row padding), titled with what the file needs ("What the photo needs"). One row per requirement: lamp, label, a 12.5px hint at 75% LED text, and the state word. Before a check every row is unlit: a 25% lamp and an en-dash (–) at 60% LED text. While the file is sending every row holds amber "Check". After the check each row settles in place on PASS (Lamp Green) or FIX (Lamp Red) through the rules cascade, starting at once (no ticket to wait for). Requirement rows are met or not met; the issue weight lives on the reason row's fix-ramp chip above the board. After a failed check the board and the failure summary scroll into view together, 16px from the top.

### Signature: Photo Slot (upload link)
One paper card (6px, rule border, 16px padding). A frame at passport proportion sits on the leading side: 104 x 134px for a photo, 104 x 148px for a scan, 4px corners. Empty, it is a dashed 30%-ink well with a 12px Faded Ink caption. Filled, it shows the picked file on a hall-grey ground. A file that failed the check gets a 2px officer ring at a 2px paper offset until another file is picked. The keys stack beside the frame, full width of their column, 48px: on touch devices a primary "Take photo" key with a camera icon over an outline "Choose from gallery" key; on desktop one primary "Choose file" key. Once a file is picked the pair becomes a primary Send key and a ghost "another" key. After a failed check a summary heads the card behind a rule: a 15px medium "Not accepted yet" and one Faded Ink line naming the FIX word and the tries left, with a singular for the last one. With no tries left the slot is replaced by the locked notice.

### Signature: Received Card (upload link)
A file that passed replaces the slot with a paper card (6px, 40%-ink border, 16px padding). The sent file stays in its passport frame (rule border) beside the text. A 24px Stamp Green round badge with a paper check leads a 19px semibold "Photo received". Under it, one 15px line on what happens next and a 14px Faded Ink line for the call. It feeds down only when the send happens while you watch; on a reload the headline already says "Photo received", so the card drops its own heading.

### Closed-State Notice (upload link)
An approved, rejected, expired, replaced or locked link shows one paper notice (6px, rule border, 16px by 20px padding). The h1 already names the state, so the notice is body only: a 15px Faded Ink line, max 52ch, on what it means and what to do. Approved adds the 28px Stamp Green check badge on the leading side.

### Signature: Upload Slip (console)
A sent file on the officer's desk, on the correction slip's frame and decision footer. The header has the fix-ramp R4 or R5 chip, "New photo" at 15px semibold, and a 12.5px caption with the send time in mono and "passed the automatic check". The body puts the two pictures side by side as 120 x 154px frames (4px, rule border) under 12.5px Faded Ink captions: the current file at 60% opacity, an arrow, then the new file. A missing picture is a dashed 30%-ink well that says "None". Once decided only the new file stays. The footer is the shared decision line: primary "Approve photo" with a note of what it replaces, Reject at the far end behind a typed reason, and the Stamp Green or officer decision line once decided.

### Signature: Case-History Roll (console)
The case history is one thermal printout: a paper roll with the ticket's perforated edges and ticket drop, Geist Mono 12.5px, a dashed-rule header with "Case history" and the reference. Every event prints top to bottom on a time / actor / event grid (5.5rem, 4.5rem, the rest), with detail in Faded Ink under the event. Calls, SMS, handoffs, refusals and decisions all print on this one roll; there is no second history.

### Signature: Board Tables (console)
Board-side figures (pre-dial checks, latency by language) are tables inside an LED Board panel: 12px column heads in 60% LED text, board-rule row dividers, data in mono LED text, and the headline figure in glowing amber Doto.

### Motion grammar
Paper feeds down, LED cells light; nothing else moves.
- **Paper feed** (900ms, ease-out-expo `cubic-bezier(0.16, 1, 0.3, 1)`): the ticket unclips top-down from a 12px lift.
- **Cell drop** (520ms, 300ms base delay plus 70ms per cell): each reference digit drops in from a blur.
- **Rules cascade** (1100ms per row, 900ms base delay plus 160ms per row): each row lights from 12% opacity. Its lamp and word hold amber with the localized word "Check" for the first 65%, then the word cross-fades to the row's own result colour.
- The cascade plays once, on arrival from submit. On the upload link it plays after each check, with no base delay. Reduced motion collapses every animation to its end state.
- **Change lamp** (1100ms, the same amber hold): a console lamp that changes state while you watch. First paint is still.
- **Decision feed** (the paper feed, 900ms): a slip's decision line, only when decided while you watch.
- Hover changes colour and stroke only. Keys and links never nudge, lift or press in.

## Do's and Don'ts

### Do:
- **Do** build every new surface from the two materials: thermal paper (ink on paper) for working content, LED board (lamps on board black) for status, queues and live state.
- **Do** show any reference number in fixed character cells: reverse-printed ink on paper, glowing amber on the board, always LTR.
- **Do** express issue weight only through the fix / route / officer ramp, identically on lamp, chip, label and row.
- **Do** use the amber "checking" hold before any board row settles on its result.
- **Do** keep the amber prototype banner at the top of every screen, including `/console`.
- **Do** set Arabic in Readex at the same size and weight as English, mirror the layout, and keep passport and reference data LTR.
- **Do** render the operator console's queue, call checks and counts as LED Board, and its case file, slips, logs and history as paper, with the same tokens, ramp and motion grammar.
- **Do** keep Approve the primary key on a correction slip, and keep Reject at the far end of the row behind a required, typed reason.
- **Do** print every case event (calls, SMS, handoffs, refusals, decisions) on the one case-history roll.
- **Do** use one digit system per screen: Latin digits on Arabic screens, matching the reference cells.
- **Do** let the h1 name where a link or case stands; a notice under it says only what that means and what to do next.

### Don't:
- **Don't** use the generic government blue-header stepper form, or its startup-gradient opposite.
- **Don't** put LED lamp colours (led-green, led-red, led-blue, led-amber) on paper as text or fills. Use the paper-side ramp, and Stamp Green (ok) for done.
- **Don't** mark refusals, sources or other non-issue states with the officer ramp. Use the neutral chip.
- **Don't** set sentences, headings or labels in Doto. Dot-matrix is for numerals, the current stage and short state words.
- **Don't** add glow to anything on paper, or shadows to anything that isn't a hall object (ticket and case-history roll, board, machine, sheet).
- **Don't** animate anything outside the paper-feed, cell-drop and lamp-lighting grammar. No hover lifts or arrow nudges, no press-in, no page transitions, no looping pulses. The live lamp is steady.
- **Don't** pre-tick consent, or place a destructive action beside the primary action.
