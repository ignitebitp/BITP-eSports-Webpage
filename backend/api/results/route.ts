import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const results = await prisma.result.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Public result listing failed:", error instanceof Error ? error.name : "Unknown error");
    return NextResponse.json({ error: "Unable to load results." }, { status: 500 });
  }
}
