import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.weeklySession.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    console.error("Public session listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load weekly activities." }, { status: 500 });
  }
}
