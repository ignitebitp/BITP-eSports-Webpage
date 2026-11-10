import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  ApiInputError,
  inputErrorResponse,
  optionalBoolean,
  optionalInteger,
  optionalText,
  readJsonObject,
  requiredDate,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";
import { reportImageUrl } from "@/lib/report-image";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;

  try {
    const events = await prisma.event.findMany({
      orderBy: { isoDate: "asc" },
      include: {
        results: { orderBy: { createdAt: "asc" } },
        reportImages: { select: { id: true }, orderBy: { createdAt: "asc" } },
      },
      take: 200,
    });
    const posters = await prisma.eventPoster.findMany({
      where: { eventId: { in: events.map((event) => event.id) } },
      select: { eventId: true },
    });
    const posterIds = new Set(posters.map((poster) => poster.eventId));
    return NextResponse.json({
      success: true,
      events: events.map((event) => ({
        ...event,
        posterUrl: posterIds.has(event.id) ? `/api/events/${event.id}/poster` : null,
        reportImages: event.reportImages.map((image) => ({ id: image.id, url: reportImageUrl(event.id, image.id) })),
      })),
    });
  } catch (error) {
    return safeServerError("Admin event listing failed:", error);
  }
}

function eventData(body: Record<string, unknown>, partial = false) {
  const data: {
    title?: string;
    dateStr?: string;
    timeStr?: string;
    endTimeStr?: string | null;
    isoDate?: Date;
    discipline?: string;
    location?: string;
    locationSub?: string;
    format?: string;
    formatSub?: string;
    statusBadge?: string;
    description?: string | null;
    report?: string | null;
    slotsFilled?: number;
    slotsTotal?: number;
    isSpotlight?: boolean;
  } = {};

  const textFields = [
    ["title", 160],
    ["dateStr", 80],
    ["timeStr", 80],
    ["discipline", 100],
    ["location", 160],
    ["locationSub", 160],
    ["format", 100],
    ["formatSub", 160],
    ["statusBadge", 50],
  ] as const;
  const optionalDefaults: Partial<Record<(typeof textFields)[number][0], string>> = {
    timeStr: "TBA",
    locationSub: "",
    formatSub: "",
    statusBadge: "UPCOMING",
  };
  for (const [field, maxLength] of textFields) {
    if (body[field] !== undefined || !partial) {
      const defaultValue = optionalDefaults[field];
      (data as Record<string, unknown>)[field] =
        (body[field] === undefined || body[field] === null || body[field] === "") && defaultValue !== undefined
          ? defaultValue
          : requiredText(body[field], field, maxLength);
    }
  }

  if (body.endTimeStr !== undefined || !partial) {
    data.endTimeStr = optionalText(body.endTimeStr, "End time", 80) ?? null;
  }
  if (body.isoDate !== undefined || !partial) {
    data.isoDate = requiredDate(body.isoDate, "Event date");
  }
  if (body.description !== undefined || !partial) {
    data.description = optionalText(body.description, "Description", 4_000)?.replace(/\r\n?/g, "\n") ?? null;
  }
  if (body.report !== undefined || !partial) {
    data.report = optionalText(body.report, "Report", 8_000)?.replace(/\r\n?/g, "\n") ?? null;
  }
  if (body.slotsFilled !== undefined || !partial) {
    data.slotsFilled = optionalInteger(body.slotsFilled, "Filled slots", 0, 0, 100_000);
  }
  if (body.slotsTotal !== undefined || !partial) {
    data.slotsTotal = optionalInteger(body.slotsTotal, "Total slots", 64, 1, 100_000);
  }
  if (body.isSpotlight !== undefined || !partial) {
    data.isSpotlight = optionalBoolean(body.isSpotlight, "Spotlight");
  }
  return data;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const data = eventData(await readJsonObject(request));
    if ((data.slotsFilled ?? 0) > (data.slotsTotal ?? 0)) {
      throw new ApiInputError("Filled slots cannot exceed total slots.");
    }
    const event = await prisma.$transaction(async (tx) => {
      if (data.isSpotlight) {
        await tx.event.updateMany({ where: { isSpotlight: true }, data: { isSpotlight: false } });
      }
      return tx.event.create({ data: data as Parameters<typeof tx.event.create>[0]["data"] });
    });
    await recordAdminActivity({ action: "CREATE", entity: "Event", entityId: event.id, itemLabel: event.title });
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Event creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;

  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Event ID", 100);
    const data = eventData(body, true);
    if (
      data.slotsFilled !== undefined &&
      data.slotsTotal !== undefined &&
      data.slotsFilled > data.slotsTotal
    ) {
      throw new ApiInputError("Filled slots cannot exceed total slots.");
    }
    const event = await prisma.$transaction(async (tx) => {
      if (data.isSpotlight) {
        await tx.event.updateMany({
          where: { id: { not: id }, isSpotlight: true },
          data: { isSpotlight: false },
        });
      }
      return tx.event.update({ where: { id }, data });
    });
    await recordAdminActivity({ action: "UPDATE", entity: "Event", entityId: event.id, itemLabel: event.title });
    return NextResponse.json({ success: true, event });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Event update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "A valid event ID is required." }, { status: 400 });
    }
    const event = await prisma.event.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Event", entityId: event.id, itemLabel: event.title });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Event deletion failed:", error);
  }
}
