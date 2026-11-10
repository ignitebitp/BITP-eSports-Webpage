import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import { requireAdmin, requestIdentifier, safeServerError } from "@/lib/api";
import { checkPersistentRateLimit } from "@/lib/rateLimit";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_PHOTO_BYTES + 64 * 1024;
const IMAGE_TYPES = new Map([
  ["image/jpeg", (bytes: Uint8Array) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff],
  ["image/png", (bytes: Uint8Array) => bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a],
  ["image/webp", (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"],
]);

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Photo upload request is too large." }, { status: 413 });
    }
    const rateLimit = await checkPersistentRateLimit(`officer-photo:${requestIdentifier(request)}`, 20, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many photo uploads. Please try again later." }, { status: 429 });
    }

    const form = await request.formData();
    const officerId = form.get("officerId");
    const file = form.get("photo");
    if (typeof officerId !== "string" || !officerId || officerId.length > 100) {
      return NextResponse.json({ error: "A valid committee member ID is required." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "Choose a photo no larger than 4 MB." }, { status: 400 });
    }
    const matches = IMAGE_TYPES.get(file.type);
    if (!matches) {
      return NextResponse.json({ error: "Photos must be JPEG, PNG, or WebP images." }, { status: 415 });
    }
    const data = Buffer.from(await file.arrayBuffer());
    if (!matches(data)) {
      return NextResponse.json({ error: "The uploaded file contents do not match a supported image format." }, { status: 415 });
    }

    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      select: { id: true, name: true },
    });
    if (!officer) return NextResponse.json({ error: "Committee member not found." }, { status: 404 });

    await prisma.officerPhoto.upsert({
      where: { officerId: officer.id },
      create: { officerId: officer.id, data, mimeType: file.type },
      update: { data, mimeType: file.type },
    });
    await recordAdminActivity({
      action: "UPDATE",
      entity: "Committee member photo",
      entityId: officer.id,
      itemLabel: officer.name,
    });
    return NextResponse.json({ success: true, photoUrl: `/api/officers/${officer.id}/photo` });
  } catch (error) {
    return safeServerError("Committee member photo upload failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const officerId = new URL(request.url).searchParams.get("officerId");
    if (!officerId || officerId.length > 100) {
      return NextResponse.json({ error: "A valid committee member ID is required." }, { status: 400 });
    }
    const photo = await prisma.officerPhoto.findUnique({
      where: { officerId },
      select: { officer: { select: { id: true, name: true } } },
    });
    if (!photo) return NextResponse.json({ error: "This committee member has no uploaded photo." }, { status: 404 });

    await prisma.officerPhoto.delete({ where: { officerId } });
    await recordAdminActivity({
      action: "UPDATE",
      entity: "Committee member photo",
      entityId: photo.officer.id,
      itemLabel: `Removed photo for ${photo.officer.name}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Committee member photo removal failed:", error);
  }
}
