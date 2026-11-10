import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ officerId: string }> }
) {
  try {
    const { officerId } = await context.params;
    if (!officerId || officerId.length > 100) return new Response("Not found.", { status: 404 });
    const photo = await prisma.officerPhoto.findUnique({
      where: { officerId },
      select: { data: true, mimeType: true },
    });
    if (!photo) return new Response("Not found.", { status: 404 });
    return new Response(new Uint8Array(photo.data), {
      headers: {
        "Content-Type": photo.mimeType,
        "Content-Length": String(photo.data.byteLength),
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Committee member photo fetch failed:", error instanceof Error ? error.name : "Unknown error");
    return new Response("Unable to load committee member photo.", { status: 500 });
  }
}
