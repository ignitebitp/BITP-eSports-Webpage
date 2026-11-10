import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requestIdentifier, safeServerError } from "@/lib/api";
import { recordAdminActivity } from "@/lib/admin-activity";
import { checkPersistentRateLimit } from "@/lib/rateLimit";
import {
  MAX_REPORT_IMAGE_BYTES,
  convertToWebp,
  isSupportedReportImage,
  reportImageUrl,
} from "@/lib/report-image";

const MAX_REQUEST_BYTES = MAX_REPORT_IMAGE_BYTES + 64 * 1024;

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Image upload request is too large." }, { status: 413 });
    }
    const rateLimit = await checkPersistentRateLimit(`event-report-image:${requestIdentifier(request)}`, 20, 60_000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many image uploads. Please try again later." }, { status: 429 });
    }
    const form = await request.formData();
    const eventIdValue = form.get("eventId");
    const file = form.get("image");
    if (typeof eventIdValue !== "string" || !eventIdValue || eventIdValue.length > 100) {
      return NextResponse.json({ error: "A valid event ID is required." }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_REPORT_IMAGE_BYTES) {
      return NextResponse.json({ error: "Choose an image no larger than 4 MB." }, { status: 400 });
    }
    const raw = Buffer.from(await file.arrayBuffer());
    if (!file.type || !isSupportedReportImage(file.type, raw)) {
      return NextResponse.json({ error: "Image must be a JPEG, PNG, or WebP file." }, { status: 415 });
    }
    const event = await prisma.event.findUnique({ where: { id: eventIdValue }, select: { id: true, title: true } });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const webp = await convertToWebp(raw);
    const image = await prisma.eventReportImage.create({
      data: { eventId: event.id, data: webp, mimeType: "image/webp" },
      select: { id: true },
    });
    await recordAdminActivity({
      action: "CREATE",
      entity: "Event report image",
      entityId: image.id,
      itemLabel: `Added report image to ${event.title}`,
    });
    return NextResponse.json(
      { success: true, image: { id: image.id, url: reportImageUrl(event.id, image.id) } },
      { status: 201 }
    );
  } catch (error) {
    return safeServerError("Event report image upload failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const imageId = new URL(request.url).searchParams.get("imageId");
    if (!imageId || imageId.length > 100) {
      return NextResponse.json({ error: "A valid image ID is required." }, { status: 400 });
    }
    const image = await prisma.eventReportImage.findUnique({
      where: { id: imageId },
      select: { id: true, event: { select: { id: true, title: true } } },
    });
    if (!image) return NextResponse.json({ error: "This report image was not found." }, { status: 404 });
    await prisma.eventReportImage.delete({ where: { id: image.id } });
    await recordAdminActivity({
      action: "DELETE",
      entity: "Event report image",
      entityId: image.id,
      itemLabel: `Removed report image from ${image.event.title}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Event report image removal failed:", error);
  }
}
