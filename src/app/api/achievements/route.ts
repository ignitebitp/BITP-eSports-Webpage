import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ date: "desc" }, { order: "asc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        game: true,
        award: true,
        date: true,
        description: true,
        imageUrl: true,
        order: true,
      },
    });
    return NextResponse.json({ success: true, achievements });
  } catch (error) {
    console.error("Public achievement listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load achievements." }, { status: 500 });
  }
}
