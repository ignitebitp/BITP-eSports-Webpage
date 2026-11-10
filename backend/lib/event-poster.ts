import sharp from "sharp";

export const POSTER_IMAGE_TYPES = new Map([
  ["image/jpeg", { extension: "jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/png", { extension: "png", matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a }],
  ["image/webp", { extension: "webp", matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" }],
]);

export const MAX_POSTER_BYTES = 4 * 1024 * 1024;

export function isSupportedPosterImage(mimeType: string, data: Uint8Array): boolean {
  return POSTER_IMAGE_TYPES.get(mimeType)?.matches(data) === true;
}

/**
 * Normalizes any uploaded poster to an optimized, compressed WebP format.
 * Automatically rotates based on EXIF, caps max dimension at 1600px (preserving aspect ratio
 * without enlargement), and compresses using WebP at quality 82.
 */
export async function convertPosterToWebp(data: Buffer): Promise<Buffer> {
  return sharp(data)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();
}
