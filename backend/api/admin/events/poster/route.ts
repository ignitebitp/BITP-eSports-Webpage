import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requestIdentifier, safeServerError } from "@/lib/api";
import { recordAdminActivity } from "@/lib/admin-activity";
import { checkPersistentRateLimit } from "@/lib/rateLimit";

const MAX_POSTER_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_POSTER_BYTES + 64 * 1024;
const IMAGE_TYPES = new Map([
  ["image/jpeg", { extension: "jpg", matches: (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/png", { extension: "png", matches: (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a }],
  ["image/webp", { extension: "webp", matches: (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" }],
]);

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Poster upload request is too large." }, { status: 413 });
    }
    const rateLimit = await checkPersistentRateLimit(`event-poster:${requestIdentifier(request)}`, 20, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many poster uploads. Please try again later." }, { status: 429 });
    }
    const form = await request.formData();
    const eventIdValue = form.get("eventId");
    const file = form.get("poster");
    if (typeof eventIdValue !== "string" || !eventIdValue || eventIdValue.length > 100) {
      return NextResponse.json({ error: "A valid event ID is required." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_POSTER_BYTES) {
      return NextResponse.json({ error: "Choose a poster image no larger than 4 MB." }, { status: 400 });
    }
    const type = IMAGE_TYPES.get(file.type);
    if (!type) {
      return NextResponse.json({ error: "Poster must be a JPEG, PNG, or WebP image." }, { status: 415 });
    }
    const data = Buffer.from(await file.arrayBuffer());
    if (!type.matches(data)) {
      return NextResponse.json({ error: "The uploaded file contents do not match a supported image format." }, { status: 415 });
    }
    const event = await prisma.event.findUnique({ where: { id: eventIdValue }, select: { id: true, title: true } });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    await prisma.eventPoster.upsert({
      where: { eventId: event.id },
      create: { eventId: event.id, data, mimeType: file.type },
      update: { data, mimeType: file.type },
    });
    await recordAdminActivity({
      action: "UPDATE",
      entity: "Event poster",
      entityId: event.id,
      itemLabel: event.title,
    });
    return NextResponse.json({ success: true, posterUrl: `/api/events/${event.id}/poster` });
  } catch (error) {
    return safeServerError("Event poster upload failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const eventId = new URL(request.url).searchParams.get("eventId");
    if (!eventId || eventId.length > 100) {
      return NextResponse.json({ error: "A valid event ID is required." }, { status: 400 });
    }
    const poster = await prisma.eventPoster.findUnique({
      where: { eventId },
      select: { event: { select: { id: true, title: true } } },
    });
    if (!poster) return NextResponse.json({ error: "This event has no poster." }, { status: 404 });
    await prisma.eventPoster.delete({ where: { eventId } });
    await recordAdminActivity({
      action: "UPDATE",
      entity: "Event poster",
      entityId: poster.event.id,
      itemLabel: `Removed poster for ${poster.event.title}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Event poster removal failed:", error);
  }
}
