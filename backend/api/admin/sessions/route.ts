import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  inputErrorResponse,
  optionalText,
  readJsonObject,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;
  try {
    const sessions = await prisma.weeklySession.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ success: true, sessions });
  } catch (error) {
    return safeServerError("Admin session listing failed:", error);
  }
}

function sessionData(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};
  for (const [field, maxLength] of [["tag", 80], ["title", 160], ["time", 100], ["location", 160]] as const) {
    if (body[field] !== undefined || !partial) data[field] = requiredText(body[field], field, maxLength);
  }
  if (body.details !== undefined || !partial) data.details = optionalText(body.details, "Details", 2_000) ?? "";
  return data;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const data = sessionData(await readJsonObject(request));
    const session = await prisma.weeklySession.create({ data: data as Parameters<typeof prisma.weeklySession.create>[0]["data"] });
    await recordAdminActivity({ action: "CREATE", entity: "Weekly activity", entityId: session.id, itemLabel: session.title });
    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Weekly session creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Session ID", 100);
    const session = await prisma.weeklySession.update({
      where: { id },
      data: sessionData(body, true),
    });
    await recordAdminActivity({ action: "UPDATE", entity: "Weekly activity", entityId: session.id, itemLabel: session.title });
    return NextResponse.json({ success: true, session });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Weekly session update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "A valid session ID is required." }, { status: 400 });
    }
    const session = await prisma.weeklySession.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Weekly activity", entityId: session.id, itemLabel: session.title });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Weekly session deletion failed:", error);
  }
}
