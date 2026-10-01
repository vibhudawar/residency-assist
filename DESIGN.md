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

The operator console (`/console`, not yet built) inherits this world unchanged. There the board becomes the officer's queue display: same tokens, same issue ramp, same lamp states, same motion grammar ("paper feeds down, LED cells light; nothing else moves"). Case records are paper; queue and call state are board.

**Key Characteristics:**
- Two materials only: thermal paper (working) and LED board (status), on a cool hall-grey floor.
- The reference number always sits in fixed character cells: reverse-printed ink on paper, glowing amber on the board.
- One fixed three-step issue ramp (fixable / route / officer) used identically everywhere.
- Each type role has one job: Readex reads, Geist Mono prints, Doto lights.
- Motion is mechanical and diegetic: paper feeds, cells drop, lamps light.
- Full EN/AR parity with true RTL; data stays LTR.

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

### Neutral
- **Hall Floor** (hall): page background; the floor the materials rest on.
- **Thermal Paper** (paper): ticket, inputs, cards, issue rows, the mock UAE PASS sheet.
- **Quiet Paper** (paper-quiet): shadcn secondary/muted/accent fill.
- **Faded Ink** (ink-2): secondary text, field hints, ticket labels.
- **Paper Rule** (rule): section dividers, card borders, list rules. **Input Stroke** (input-stroke) is the slightly heavier field border.
- **Board Panel / Board Rule** (board-2, board-rule): cell wells and row dividers inside the board. **LED Text** (led-text): warm off-white for readable board copy, dimmed by opacity (70%, 60%, 25%) for secondary and upcoming states.

### Named Rules
**The Two Materials Rule.** Every surface is either paper (ink on cool white) or board (lamps on black). There is no third material: no tinted cards, no gradients, no glass.

**The Lamps Stay On The Board Rule.** LED green, red, blue and amber glow only on board black. On paper, issue weight is expressed with the paper-side ramp (fix / route / officer), never with a lamp colour.

**The One Ramp Rule.** Fixable, route and officer map to the same three colours on every surface: lamp, chip, label, row. Do not add a fourth weight. Do not reuse a ramp colour for decoration.

## Typography

**Display / Body Font:** Readex Pro (Latin + Arabic), with ui-sans-serif, system-ui fallback
**Ticket / Data Font:** Geist Mono, falling back to Readex Pro for Arabic
**LED Font:** Doto (dot-matrix, 700/900), falling back to Readex Pro for Arabic glyphs

**Character:** One warm, open bilingual sans carries everything a person has to read, in both scripts at equal weight. The thermal mono and dot-matrix are machine voices. They appear only where a ticket printer or a lamp board would produce them.

### Hierarchy
- **Display** (600, 56px at `lg`, 44px below, 1.05, -0.02em): sign-in headline only, max 16ch.
- **Headline** (600, 36px form title; 34px to 40px for the status "next step" sentence at 1.12, -0.015em): one per screen. On the status page it is the hall announcement of the single next step, max 24ch.
- **Title** (600, 19px): form section legends. 22px is used for the mock UAE PASS sheet heading.
- **Body** (400, 15px to 16px; lead paragraphs 18px at 1.625, max 52ch): tabular numerals are on globally.
- **Label** (500, 14px): field labels. Hints sit inline after a middle dot in Faded Ink, weight 400.
- **Ticket** (Geist Mono 400, 12.5px; labels uppercase in Faded Ink, values uppercase in ink unless typed case matters; uppercase is dropped in RTL).
- **LED numeral** (Doto 900, 34px in 52px-tall cells on paper, 22px in 34px cells on the board).
- **LED word / stage** (Doto 900, uppercase; 15px at 0.06em for rule-row state words, 26px at 0.04em for the current stage; tracking resets to normal in RTL).

### Named Rules
**The Three Voices Rule.** Readex reads, Geist Mono prints, Doto lights. Dot-matrix is limited to reference numerals, the current stage, row state words and the hall monogram. Never use it for sentences, labels or headings.

**The Equal Scripts Rule.** Arabic is set in the same family, size and weight as English. Doto and Geist Mono fall back to Readex for Arabic, so board words stay legible in both scripts.

## Layout

A 1240px centred container with 24px side gutters on a 12-column grid at `lg`. Working screens split 7/12 (the counter: form or status narrative) and 5/12 (the ticket and its board, sticky at 32px from the top). The column gap is 48px. The sign-in screen splits 6/6: copy on one side, the ticket dispenser on the other. In RTL the grid mirrors, so the ticket sits on the left.

The ticket and the compact board share one width (max 360px) and stack with 24px between them. The ticket appears at the same scale on every stage. Only the content that changes moves.

Form sections stack 32px apart. Each opens with a top rule and 28px of padding. Fields sit on a 1-column grid that becomes 2 columns at `sm`, with a 20px gap. The primary action closes the form after its own top rule. Destructive actions (withdraw consent) are separated from neutral status by space: they sit at the opposite end of a justified row, never next to a primary.

Below `lg` everything is one column: the form or status first, then the ticket and board.

## Elevation & Depth

Depth is physical, not interface. Exactly three objects lift off the hall floor: the paper ticket, the black board, and the dispenser machine (plus the mock UAE PASS sheet, which is a paper object). Each casts one soft, downward, negatively spread shadow, like an object lying on a counter. Everything else is flat and separated by hairline rules. The LED glow is light, not elevation: a soft halo around lit glyphs and lamps.

### Shadow Vocabulary
- **Ticket drop** (`box-shadow: 0 18px 30px -18px rgb(22 24 26 / 0.45), 0 2px 6px -2px rgb(22 24 26 / 0.18)`): the paper ticket.
- **Board drop** (`box-shadow: 0 24px 40px -24px rgb(0 0 0 / 0.6)`): every LED board panel.
- **Machine drop** (`box-shadow: 0 30px 50px -30px rgb(0 0 0 / 0.7)`): the dispenser body.
- **Sheet drop** (`box-shadow: 0 24px 40px -28px rgb(22 24 26 / 0.5)`): a standalone paper sheet (mock UAE PASS).
- **LED glow** (`text-shadow: 0 0 6px color-mix(in oklab, currentColor 55%, transparent)`; lamps `0 0 6px` to `8px currentColor`): lit glyphs and lamps on the board only.
- **Cell well** (`box-shadow: inset 0 -1px 0 board-rule`): board character cells.

### Named Rules
**The Objects Lift Rule.** Only physical hall objects (ticket, board, machine, sheet) cast shadows. Cards, inputs and buttons are flat.

**The Paper Can't Glow Rule.** Glow belongs to lamps. Reference cells on paper are reverse-printed ink with no glow. The same cells on the board glow amber.

## Shapes

Corners are small and mechanical, and they scale with the size of the object: 3px character cells, 4px chips, 6px controls and cards, 8px buttons, 10px board frames (with a 7px inner bezel), 12px sheets, 14px machine tops. Nothing is pill-shaped except lamps, which are round 8px dots.

The ticket has no corners at all. Its top and bottom edges are perforated, cut by a repeating 8px semicircular tooth mask, so it reads as torn from a roll. Inside the ticket, dashed ink rules (30% ink) divide masthead, number and data. Blank reference cells are dashed outlines. Inside the board, a faint 6px dot-matrix grid (white at 3%) textures the panel field.

## Components

### Buttons
Solid and quiet, like a counter terminal key.
- **Shape:** gently squared (8px).
- **Primary:** ink fill, paper text, 500 weight at 15px to 16px, 48px tall (56px for the full-width sign-in key), min-width 220px on the form. Hover deepens ink to board black. Disabled drops to 70% opacity, with an inline spinner while pending.
- **Quiet / Secondary:** paper fill, 6px radius, 1px rule or 25%-ink stroke, 13.5px. Hover darkens the stroke to ink. The destructive quiet button turns its stroke and text officer-red on hover.
- **Text link:** Faded Ink, underlined on hover with a 0.2em offset.
- **On board:** the language switch is a 6px outline in board-rule with paper text. Hover lights it amber.
- **Focus:** 2px solid Caret Amber outline at 2px offset, everywhere.

### Inputs / Fields
- **Style:** paper fill, 1px input-stroke border, 6px radius, 44px tall, 15px text. Passport and code fields set in Geist Mono, LTR. Passport numbers are uppercase with 0.08em tracking.
- **Focus:** the border goes to ink, plus a soft amber ring.
- **Error:** officer-red 13px message below the field, linked by aria-describedby.
- **Segmented choice (call language):** a 44px paper track with a 4px inset. The selected segment is ink with paper text. Each option label is set in its own language.
- **Choice cards (photo):** paper card, 6px radius, rule border. Selected gets an ink border plus a 1px ink ring.

### Cards / Containers
- **Issue row:** paper on hall, 6px radius, 1px rule border, 16px padding. It leads with a ramp-coloured mono code chip (R1 to R12, 4px radius), then the plain-language finding, then the ramp label and the rule it was checked against.
- **Consent box:** paper, 6px, rule border that turns ink when ticked. It is never pre-ticked.

### Navigation (Hall Bar)
A board-black bar across every screen. Above it sits a full-width amber prototype banner (board text, 12.5px medium) that is never removed. The bar carries the amber Doto "R" monogram in a board-2 well, the product name in paper, the hall name in dimmed LED text (hidden on mobile), and the language switch.

### Signature: The Ticket
The thermal ticket, max 360px wide, with a perforated edge and Geist Mono 12.5px. It has a masthead (hall name in uppercase plus three fading ink dots), the number block (reference cells, or "issued on submit"), a label/value data list on a 7.5rem label column, and a decorative LTR barcode with the spaced reference beneath. It prints the applicant's typed details live as they type. On submit it feeds down and prints its reference cell by cell.

### Signature: Reference Cells
The reference (`RA-` plus 6 digits) in fixed character cells, always LTR, read out by screen readers character by character. On paper: ink cells with paper digits, 52 x 34px, with dashed empty wells before issue. On the board: amber glowing digits in board-2 wells, 34 x 23px.

### Signature: LED Board
A board-black frame with 6px padding around a 7px bezel with the dot-matrix field. The header row holds a 13px title in LED text with an optional steady green "live" lamp. Three forms exist:
- **Rules check:** one row per rule: lamp, mono code, label, Doto state word.
- **Now Serving (stage board):** the reference in board cells, the current stage in 26px amber Doto, and every stage as a lamp in an even 3-column grid. Done is green, current is amber, upcoming is 25% LED text.
- **Waiting:** a single pending row before submit.

### Motion grammar
Paper feeds down, LED cells light; nothing else moves.
- **Paper feed** (900ms, ease-out-expo `cubic-bezier(0.16, 1, 0.3, 1)`): the ticket unclips top-down from a 12px lift.
- **Cell drop** (520ms, 300ms base delay plus 70ms per cell): each reference digit drops in from a blur.
- **Rules cascade** (1100ms per row, 900ms base delay plus 160ms per row): each row lights from 12% opacity. Its lamp and word hold amber with the localized word "Check" for the first 65%, then the word cross-fades to the row's own result colour.
- The cascade plays once, on arrival from submit. Reduced motion collapses every animation to its end state.

## Do's and Don'ts

### Do:
- **Do** build every new surface from the two materials: thermal paper (ink on paper) for working content, LED board (lamps on board black) for status, queues and live state.
- **Do** show any reference number in fixed character cells: reverse-printed ink on paper, glowing amber on the board, always LTR.
- **Do** express issue weight only through the fix / route / officer ramp, identically on lamp, chip, label and row.
- **Do** use the amber "checking" hold before any board row settles on its result.
- **Do** keep the amber prototype banner at the top of every screen, including `/console`.
- **Do** set Arabic in Readex at the same size and weight as English, mirror the layout, and keep passport and reference data LTR.
- **Do** render the operator console's queue display as an LED Board with the same tokens, ramp and motion grammar.

### Don't:
- **Don't** use the generic government blue-header stepper form, or its startup-gradient opposite.
- **Don't** put LED lamp colours (led-green, led-red, led-blue, led-amber) on paper as text or fills. Use the paper-side ramp.
- **Don't** set sentences, headings or labels in Doto. Dot-matrix is for numerals, the current stage and short state words.
- **Don't** add glow to anything on paper, or shadows to anything that isn't a hall object (ticket, board, machine, sheet).
- **Don't** animate anything outside the paper-feed, cell-drop and lamp-lighting grammar. No hover lifts, no page transitions, no looping pulses. The live lamp is steady.
- **Don't** pre-tick consent, or place a destructive action beside the primary action.
