import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string; imageId: string }> }
) {
  try {
    const { eventId, imageId } = await context.params;
    if (!eventId || eventId.length > 100 || !imageId || imageId.length > 100) {
      return new Response("Not found.", { status: 404 });
    }
    const image = await prisma.eventReportImage.findFirst({
      where: { id: imageId, eventId },
      select: { data: true, mimeType: true },
    });
    if (!image) return new Response("Not found.", { status: 404 });
    return new Response(new Uint8Array(image.data), {
      headers: {
        "Content-Type": image.mimeType,
        "Content-Length": String(image.data.byteLength),
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Event report image fetch failed:", error instanceof Error ? error.name : "Unknown error");
    return new Response("Unable to load event report image.", { status: 500 });
  }
}
