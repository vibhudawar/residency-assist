import "server-only";
import sharp from "sharp";

/**
 * Generates a fictional passport-style photo: a neutral silhouette on a chosen
 * background. Used so the demo never contains a real person's face.
 */
export async function silhouettePhoto(background: string, skin = "#8a6a52"): Promise<Buffer> {
  const width = 450;
  const height = 580;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${background}"/>
      <ellipse cx="225" cy="230" rx="95" ry="120" fill="${skin}"/>
      <path d="M60 580 C 70 430, 380 430, 390 580 Z" fill="#2f3b4c"/>
      <rect x="190" y="335" width="70" height="70" fill="${skin}"/>
    </svg>`;
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
}

export const PHOTO_WHITE = "#fbfbfb";
export const PHOTO_BLUE = "#7fa7d9";
