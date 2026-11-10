import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  ApiInputError,
  inputErrorResponse,
  optionalText,
  readJsonObject,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";

const RESULT_BADGES = ["WIN", "SWEEP", "COMPLETED", "LOSS"] as const;

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;
  try {
    const results = await prisma.result.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return safeServerError("Admin result listing failed:", error);
  }
}

function resultData(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};
  for (const [field, maxLength] of [
    ["discipline", 100],
    ["league", 160],
    ["team1", 160],
    ["score1", 40],
    ["team2", 160],
    ["score2", 40],
  ] as const) {
    if (body[field] !== undefined || !partial) {
      data[field] = (body[field] === undefined || body[field] === null || body[field] === "") && field === "league"
        ? "Collegiate League"
        : requiredText(body[field], field, maxLength);
    }
  }

  if (body.badge !== undefined || !partial) {
    const badge = body.badge === undefined ? "WIN" : requiredText(body.badge, "Badge", 20);
    if (!RESULT_BADGES.includes(badge as (typeof RESULT_BADGES)[number])) {
      throw new ApiInputError("Badge must be WIN, SWEEP, COMPLETED, or LOSS.");
    }
    data.badge = badge;
  }
  if (body.subtext !== undefined || !partial) data.subtext = optionalText(body.subtext, "Subtext", 500) ?? "";
  if (body.eventId !== undefined) data.eventId = optionalText(body.eventId, "Event", 100);
  return data;
}

async function ensureLinkedEventExists(eventId: unknown) {
  if (typeof eventId !== "string" || !eventId) return;
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) throw new ApiInputError("The linked event was not found.", 404);
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const data = resultData(await readJsonObject(request));
    await ensureLinkedEventExists(data.eventId);
    const result = await prisma.result.create({ data: data as Parameters<typeof prisma.result.create>[0]["data"] });
    await recordAdminActivity({ action: "CREATE", entity: "Result", entityId: result.id, itemLabel: `${result.team1} vs ${result.team2}` });
    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Result creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Result ID", 100);
    const data = resultData(body, true);
    await ensureLinkedEventExists(data.eventId);
    const result = await prisma.result.update({
      where: { id },
      data,
    });
    await recordAdminActivity({ action: "UPDATE", entity: "Result", entityId: result.id, itemLabel: `${result.team1} vs ${result.team2}` });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Result update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "A valid result ID is required." }, { status: 400 });
    }
    const result = await prisma.result.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Result", entityId: result.id, itemLabel: `${result.team1} vs ${result.team2}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Result deletion failed:", error);
  }
}
