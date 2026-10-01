import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { PHOTO_BLUE, PHOTO_WHITE, silhouettePhoto } from "@/lib/demo/photos";
import { checkPhoto } from "./image-check";

/** A portrait "photo": plain background with a dark face-shaped block in the middle. */
async function photo(background: string, width = 450, height = 580) {
  const face = await sharp({ create: { width: 200, height: 260, channels: 3, background: "#6b4f3a" } }).png().toBuffer();
  return sharp({ create: { width, height, channels: 3, background } })
    .composite([{ input: face, left: Math.round((width - 200) / 2), top: Math.round(height * 0.3) }])
    .jpeg()
    .toBuffer();
}

describe("checkPhoto", () => {
  it("accepts a white background", async () => {
    expect((await checkPhoto(await photo("#fbfbfb"))).ok).toBe(true);
  });

  it("rejects a coloured background", async () => {
    const result = await checkPhoto(await photo("#7fa7d9"));
    expect(result).toMatchObject({ ok: false });
    expect(result.detail).toMatch(/white/i);
  });

  it("rejects a grey background", async () => {
    expect((await checkPhoto(await photo("#9a9a9a"))).ok).toBe(false);
  });

  it("judges the background only, even when the subject fills most of the frame", async () => {
    // Regression: stats() once measured the whole image, so a large dark subject failed a white background.
    expect((await checkPhoto(await silhouettePhoto(PHOTO_WHITE))).ok).toBe(true);
    expect((await checkPhoto(await silhouettePhoto(PHOTO_BLUE))).ok).toBe(false);
  });

  it("rejects a photo that is too small", async () => {
    expect((await checkPhoto(await photo("#ffffff", 300, 400))).detail).toMatch(/too small/i);
  });
});
