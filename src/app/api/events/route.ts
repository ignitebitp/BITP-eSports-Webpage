import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reportImageUrl } from "@/lib/report-image";

export async function GET() {
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
    console.error("Public event listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load events." }, { status: 500 });
  }
}
