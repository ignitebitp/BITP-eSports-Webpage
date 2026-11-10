import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, safeServerError } from "@/lib/api";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;

  try {
    const activity = await prisma.adminActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ success: true, activity });
  } catch (error) {
    return safeServerError("Admin activity listing failed:", error);
  }
}
