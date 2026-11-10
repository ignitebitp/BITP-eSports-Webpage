import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  inputErrorResponse,
  optionalInteger,
  optionalUrl,
  readJsonObject,
  requiredDate,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;
  try {
    const achievements = await prisma.achievement.findMany({
      orderBy: [{ date: "desc" }, { order: "asc" }],
      take: 200,
    });
    return NextResponse.json({ success: true, achievements });
  } catch (error) {
    return safeServerError("Achievement listing failed:", error);
  }
}

function achievementData(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};
  for (const [field, maxLength] of [
    ["title", 160],
    ["game", 100],
    ["award", 120],
    ["description", 2_000],
  ] as const) {
    if (body[field] !== undefined || !partial) data[field] = requiredText(body[field], field, maxLength);
  }
  if (body.date !== undefined || !partial) data.date = requiredDate(body.date, "Achievement date");
  if (body.imageUrl !== undefined || !partial) data.imageUrl = optionalUrl(body.imageUrl, "Image URL") ?? "";
  if (body.order !== undefined || !partial) data.order = optionalInteger(body.order, "Display order", 0, 0, 10_000);
  return data;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const data = achievementData(await readJsonObject(request));
    const achievement = await prisma.achievement.create({
      data: data as Parameters<typeof prisma.achievement.create>[0]["data"],
    });
    await recordAdminActivity({ action: "CREATE", entity: "Achievement", entityId: achievement.id, itemLabel: achievement.title });
    return NextResponse.json({ success: true, achievement }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Achievement creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Achievement ID", 100);
    const achievement = await prisma.achievement.update({
      where: { id },
      data: achievementData(body, true),
    });
    await recordAdminActivity({ action: "UPDATE", entity: "Achievement", entityId: achievement.id, itemLabel: achievement.title });
    return NextResponse.json({ success: true, achievement });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Achievement update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) return NextResponse.json({ error: "A valid achievement ID is required." }, { status: 400 });
    const achievement = await prisma.achievement.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Achievement", entityId: achievement.id, itemLabel: achievement.title });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Achievement deletion failed:", error);
  }
}
