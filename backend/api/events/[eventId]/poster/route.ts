import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    if (!eventId || eventId.length > 100) {
      return new Response("Not found.", { status: 404 });
    }
    const poster = await prisma.eventPoster.findUnique({
      where: { eventId },
      select: { data: true, mimeType: true },
    });
    if (!poster) return new Response("Not found.", { status: 404 });
    return new Response(new Uint8Array(poster.data), {
      headers: {
        "Content-Type": poster.mimeType,
        "Content-Length": String(poster.data.byteLength),
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Event poster fetch failed:", error instanceof Error ? error.name : "Unknown error");
    return new Response("Unable to load event poster.", { status: 500 });
  }
}
