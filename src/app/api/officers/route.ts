import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const OFFICER_GROUPS = ["President", "Core Executive", "Senior Coordinator", "Junior Coordinator"];

export async function GET() {
  try {
    const officers = await prisma.officer.findMany({
      orderBy: { order: "asc" },
      take: 100,
    });
    const photos = await prisma.officerPhoto.findMany({
      where: { officerId: { in: officers.map((officer) => officer.id) } },
      select: { officerId: true, updatedAt: true },
    });
    const photoUpdatedAt = new Map(photos.map((photo) => [photo.officerId, photo.updatedAt.getTime()]));
    return NextResponse.json({
      success: true,
      officers: officers.map((officer) => ({
        ...officer,
        group: OFFICER_GROUPS.includes(officer.role) && officer.group === "Senior Coordinator"
          ? officer.role
          : officer.group,
        photoUrl: photoUpdatedAt.has(officer.id)
          ? `/api/officers/${officer.id}/photo?v=${photoUpdatedAt.get(officer.id)}`
          : null,
      })),
    });
  } catch (error) {
    console.error("Public officer listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load committee information." }, { status: 500 });
  }
}
