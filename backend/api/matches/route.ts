import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({ orderBy: { isoDate: "asc" }, take: 200 });
    return NextResponse.json({
      success: true,
      matches: matches.map((match) => ({
        ...match,
        timestamp: match.isoDate.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Public match listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load match information." }, { status: 500 });
  }
}
