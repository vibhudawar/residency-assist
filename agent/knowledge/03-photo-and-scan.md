# Personal photo and document scans (checks R4 and R5)

**Sources (checked 2 Oct 2026):**
- ICP FAQ — https://icp.gov.ae/en/faq/ [official]
- ICP photo specification (ICAO) — https://icp.gov.ae/wp-content/uploads/2021/11/icao_english.pdf [official]
- GDRFA Dubai, amendment of residence data — https://www.gdrfad.gov.ae/en/services/dff87d9f-b81d-11ed-5210-4cd98f768936 [official]

## What the official photo rules say
- The photo is **3.5 × 4.5 cm with a white background**, and must follow the international **ICAO** photo standard. [official, ICP]
- It must be **recent** — the ICP specification says no more than **6 months** old. [official]
- **Clear face and eyes**, looking straight at the camera, neutral expression, mouth closed, eyes open, no hair across the eyes. No shadows, reflections or flash glare. [official]
- The face fills roughly **70–80%** of the photo; the photo is sharp, in colour, with no creases or marks. [official, ICP specification]
- **No hats or sunglasses.** Medical glasses are allowed only if they don't cover the eyes and have no tinted lenses or glare. [official]
- Head coverings are allowed **only for religious reasons**, and the face must be fully visible from chin to forehead and both edges. [official]
- The new photo should not be the same one already printed on the passport or ID. [official, ICP FAQ]

## What this prototype's automatic check looks at
These are the checks the upload page runs; they are a simplified version of the rules above:
- **Plain white background** — measured along the top and sides of the photo.
- **Upright (portrait)** — taller than it is wide.
- **Large enough** — at least 400 × 500 pixels, so it isn't a screenshot or a tiny copy.

If a photo fails, the upload page shows exactly which of these failed. The assistant can say the same thing.

## Tips the assistant can give for taking the photo on a phone
- Stand in front of a **plain white wall** in good, even light, with no shadow behind you.
- Ask someone else to take it, holding the phone **upright** at eye level, about an arm's length away.
- Face and shoulders in the frame, looking straight at the camera; remove sunglasses and hats.
- Use the **camera**, not a screenshot or a photo of a printed photo.

## Document scans (R5)
- The scan must be **clear enough to read every line**. Lay the page flat in good light, fill the frame with the page, and hold still. [guidance]
- This prototype's check needs at least **1000 pixels on the long side** and a sharp image.

## How the upload link works
- The assistant sends an **SMS link** (tool: `send_upload_link`). The link works for **24 hours**, only for this application, and allows up to **5 tries**.
- After the caller uploads, check the result (tool: `check_upload`):
  - **Passed** → "It passed the automatic check. An officer will confirm it before it replaces the old one."
  - **Failed** → say exactly what failed (for example "the background isn't plain white") and help them try again.
  - **Not uploaded yet** → offer to wait a moment, or tell them they can do it later within 24 hours.

## Do not say
- Any official **file format, pixel size or file size** — no official page states one.
- That the photo is **approved** — passing the automatic check is not approval; an officer confirms it.
