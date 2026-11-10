import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const gameSlug = new URL(request.url).searchParams.get("game");
  if (gameSlug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(gameSlug)) {
    return NextResponse.json({ error: "Invalid game filter." }, { status: 400 });
  }
  try {
    const members = await prisma.teamMember.findMany({
      where: gameSlug ? { gameSlug } : undefined,
      orderBy: [{ gameSlug: "asc" }, { order: "asc" }],
      take: 200,
      select: {
        id: true,
        name: true,
        handle: true,
        role: true,
        gameSlug: true,
        yearMajor: true,
        tag: true,
        imageUrl: true,
        order: true,
      },
    });
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error("Public team member listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load team members." }, { status: 500 });
  }
}
