import "server-only";
import sharp from "sharp";
import type { ImageCheck } from "./types";

// Practitioner-consensus thresholds for UAE visa photos (ICP publishes no pixel spec).
const PHOTO_MIN_WIDTH = 400;
const PHOTO_MIN_HEIGHT = 500;
const WHITE_MIN_BRIGHTNESS = 215; // 0–255, per channel average along the border
const WHITE_MAX_CHROMA = 30;      // max channel spread → "grey/white", not coloured
const SCAN_MIN_LONG_SIDE = 1000;
const SCAN_MIN_SHARPNESS = 1.0;   // sharp's stats().sharpness estimate

/**
 * Checks a passport-style photo: size, portrait shape, and a plain white
 * background (sampled from the top and side borders, away from the face).
 */
export async function checkPhoto(buffer: Buffer): Promise<ImageCheck> {
  const image = sharp(buffer).rotate().removeAlpha();
  const { width = 0, height = 0 } = await image.metadata();

  if (width < PHOTO_MIN_WIDTH || height < PHOTO_MIN_HEIGHT) {
    return { ok: false, detail: `The photo is too small (${width}×${height}). It must be at least ${PHOTO_MIN_WIDTH}×${PHOTO_MIN_HEIGHT} pixels.` };
  }
  if (width >= height) {
    return { ok: false, detail: "The photo must be portrait (taller than it is wide)." };
  }

  const strip = Math.max(4, Math.round(Math.min(width, height) * 0.06));
  const regions = [
    { left: 0, top: 0, width, height: strip },                                         // top
    { left: 0, top: 0, width: strip, height: Math.round(height * 0.5) },                 // left, upper half
    { left: width - strip, top: 0, width: strip, height: Math.round(height * 0.5) },     // right, upper half
  ];

  for (const region of regions) {
    const { channels } = await sharp(buffer).rotate().removeAlpha().extract(region).stats();
    const means = channels.slice(0, 3).map((c) => c.mean);
    const brightness = means.reduce((a, b) => a + b, 0) / means.length;
    const chroma = Math.max(...means) - Math.min(...means);
    if (brightness < WHITE_MIN_BRIGHTNESS || chroma > WHITE_MAX_CHROMA) {
      return { ok: false, detail: "The photo background is not plain white. Retake it against a plain white wall." };
    }
  }

  return { ok: true, detail: "Photo meets the size and white-background requirements." };
}

/** Checks a document scan is large and sharp enough to read. */
export async function checkScan(buffer: Buffer): Promise<ImageCheck> {
  const image = sharp(buffer).rotate();
  const { width = 0, height = 0 } = await image.metadata();
  if (Math.max(width, height) < SCAN_MIN_LONG_SIDE) {
    return { ok: false, detail: `The scan is too low-resolution (${width}×${height}). Upload a clearer scan.` };
  }
  const { sharpness } = await image.stats();
  if (sharpness < SCAN_MIN_SHARPNESS) {
    return { ok: false, detail: "The scan is blurry. Upload a sharper scan where the text is readable." };
  }
  return { ok: true, detail: "Scan is clear and readable." };
}
