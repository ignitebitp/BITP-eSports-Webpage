import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const games = await prisma.gameTitle.findMany({
      orderBy: { name: "asc" },
      take: 100,
    });
    return NextResponse.json({ success: true, games: games.map((game) => ({ ...game, id: game.slug })) });
  } catch (error) {
    console.error("Public game listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load team information." }, { status: 500 });
  }
}
