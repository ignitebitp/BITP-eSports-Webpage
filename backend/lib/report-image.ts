import sharp from "sharp";

export const REPORT_IMAGE_TYPES = new Map([
  ["image/jpeg", { matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/png", { matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a }],
  ["image/webp", { matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" }],
]);

export const MAX_REPORT_IMAGE_BYTES = 4 * 1024 * 1024;

export function isSupportedReportImage(mimeType: string, data: Uint8Array) {
  return REPORT_IMAGE_TYPES.get(mimeType)?.matches(data) === true;
}

/**
 * Normalize any supported upload to a storage-efficient WebP.
 * Caps width at 1920px (preserving aspect ratio) and uses quality 82,
 * so archive photos stay small without visible loss.
 */
export async function convertToWebp(data: Buffer): Promise<Buffer> {
  return sharp(data)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

export function reportImageUrl(eventId: string, imageId: string) {
  return `/api/events/${eventId}/report-images/${imageId}`;
}
