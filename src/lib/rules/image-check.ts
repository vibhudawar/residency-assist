import "server-only";
import sharp from "sharp";
import type { ImageCheck, ImageRequirement } from "./types";

// Practitioner-consensus thresholds for UAE visa photos (ICP publishes no pixel spec).
const PHOTO_MIN_WIDTH = 400;
const PHOTO_MIN_HEIGHT = 500;
const WHITE_MIN_BRIGHTNESS = 215; // 0–255, per channel average along the border
const WHITE_MAX_CHROMA = 30;      // max channel spread → "grey/white", not coloured
const SCAN_MIN_LONG_SIDE = 1000;
const SCAN_MIN_SHARPNESS = 1.0;   // sharp's stats().sharpness estimate

type Requirement = { key: ImageRequirement; ok: boolean; failDetail: string };

function result(requirements: Requirement[], passDetail: string): ImageCheck {
  const failed = requirements.find((r) => !r.ok);
  return {
    ok: !failed,
    detail: failed ? failed.failDetail : passDetail,
    requirements: requirements.map(({ key, ok }) => ({ key, ok })),
  };
}

async function whiteBackground(buffer: Buffer, width: number, height: number): Promise<boolean> {
  const strip = Math.max(4, Math.round(Math.min(width, height) * 0.06));
  const regions = [
    { left: 0, top: 0, width, height: strip },                                         // top
    { left: 0, top: 0, width: strip, height: Math.round(height * 0.5) },                 // left, upper half
    { left: width - strip, top: 0, width: strip, height: Math.round(height * 0.5) },     // right, upper half
  ];
  for (const region of regions) {
    // stats() measures the input image, not the pipeline output, so materialise the crop first.
    const crop = await sharp(buffer).rotate().removeAlpha().extract(region).toBuffer();
    const { channels } = await sharp(crop).stats();
    const means = channels.slice(0, 3).map((c) => c.mean);
    const brightness = means.reduce((a, b) => a + b, 0) / means.length;
    const chroma = Math.max(...means) - Math.min(...means);
    if (brightness < WHITE_MIN_BRIGHTNESS || chroma > WHITE_MAX_CHROMA) return false;
  }
  return true;
}

/**
 * Checks a passport-style photo: size, portrait shape, and a plain white
 * background (sampled from the top and side borders, away from the face).
 * Every requirement is checked, so the applicant learns everything to fix in one go.
 */
export async function checkPhoto(buffer: Buffer): Promise<ImageCheck> {
  const image = sharp(buffer).rotate().removeAlpha();
  const meta = await image.metadata();
  // EXIF-rotated phone photos report their stored size; swap when the orientation turns them.
  const turned = (meta.orientation ?? 1) >= 5;
  const width = (turned ? meta.height : meta.width) ?? 0;
  const height = (turned ? meta.width : meta.height) ?? 0;

  return result(
    [
      {
        key: "photo_size",
        ok: width >= PHOTO_MIN_WIDTH && height >= PHOTO_MIN_HEIGHT,
        failDetail: `The photo is too small (${width}×${height}). It must be at least ${PHOTO_MIN_WIDTH}×${PHOTO_MIN_HEIGHT} pixels.`,
      },
      { key: "photo_portrait", ok: height > width, failDetail: "The photo must be portrait (taller than it is wide)." },
      {
        key: "photo_background",
        ok: width > 8 && height > 8 && (await whiteBackground(buffer, width, height)),
        failDetail: "The photo background is not plain white. Retake it against a plain white wall.",
      },
    ],
    "Photo meets the size and white-background requirements.",
  );
}

/** Checks a document scan is large and sharp enough to read. */
export async function checkScan(buffer: Buffer): Promise<ImageCheck> {
  const image = sharp(buffer).rotate();
  const { width = 0, height = 0 } = await image.metadata();
  const { sharpness } = await image.stats();
  return result(
    [
      {
        key: "scan_resolution",
        ok: Math.max(width, height) >= SCAN_MIN_LONG_SIDE,
        failDetail: `The scan is too low-resolution (${width}×${height}). Upload a clearer scan.`,
      },
      { key: "scan_sharpness", ok: sharpness >= SCAN_MIN_SHARPNESS, failDetail: "The scan is blurry. Upload a sharper scan where the text is readable." },
    ],
    "Scan is clear and readable.",
  );
}
