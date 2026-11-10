import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  inputErrorResponse,
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
    const matches = await prisma.match.findMany({ orderBy: { isoDate: "asc" }, take: 200 });
    return NextResponse.json({ success: true, matches });
  } catch (error) {
    return safeServerError("Admin match listing failed:", error);
  }
}

function matchData(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};
  for (const [field, maxLength] of [["discipline", 100], ["datetime", 100], ["opponent", 160], ["league", 160], ["streamType", 80]] as const) {
    if (body[field] !== undefined || !partial) {
      data[field] = body[field] === undefined && field === "streamType"
        ? "Live Broadcast"
        : body[field] === null && field === "streamType"
          ? "Live Broadcast"
        : requiredText(body[field], field, maxLength);
    }
  }
  if (body.isoDate !== undefined || !partial) data.isoDate = requiredDate(body.isoDate, "Match date");
  if (body.streamUrl !== undefined || !partial) data.streamUrl = optionalUrl(body.streamUrl, "Stream URL");
  return data;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const data = matchData(await readJsonObject(request));
    const match = await prisma.match.create({ data: data as Parameters<typeof prisma.match.create>[0]["data"] });
    await recordAdminActivity({ action: "CREATE", entity: "Match", entityId: match.id, itemLabel: `${match.discipline} vs ${match.opponent}` });
    return NextResponse.json({ success: true, match }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Match creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Match ID", 100);
    const data = matchData(body, true);
    const match = await prisma.match.update({ where: { id }, data });
    await recordAdminActivity({ action: "UPDATE", entity: "Match", entityId: match.id, itemLabel: `${match.discipline} vs ${match.opponent}` });
    return NextResponse.json({ success: true, match });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Match update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "A valid match ID is required." }, { status: 400 });
    }
    const match = await prisma.match.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Match", entityId: match.id, itemLabel: `${match.discipline} vs ${match.opponent}` });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Match deletion failed:", error);
  }
}
