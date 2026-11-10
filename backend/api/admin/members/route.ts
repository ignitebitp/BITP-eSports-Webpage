import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  inputErrorResponse,
  optionalInteger,
  optionalUrl,
  readJsonObject,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;
  try {
    const members = await prisma.teamMember.findMany({
      orderBy: [{ gameSlug: "asc" }, { order: "asc" }],
      take: 200,
    });
    return NextResponse.json({ success: true, members });
  } catch (error) {
    return safeServerError("Team member listing failed:", error);
  }
}

function memberData(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};
  for (const [field, maxLength] of [
    ["name", 120],
    ["handle", 80],
    ["role", 100],
    ["gameSlug", 80],
    ["yearMajor", 120],
    ["tag", 40],
  ] as const) {
    if (body[field] !== undefined || !partial) data[field] = requiredText(body[field], field, maxLength);
  }
  if (body.imageUrl !== undefined || !partial) data.imageUrl = optionalUrl(body.imageUrl, "Image URL") ?? "";
  if (body.order !== undefined || !partial) data.order = optionalInteger(body.order, "Display order", 0, 0, 10_000);
  return data;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const data = memberData(await readJsonObject(request));
    const member = await prisma.teamMember.create({ data: data as Parameters<typeof prisma.teamMember.create>[0]["data"] });
    await recordAdminActivity({ action: "CREATE", entity: "Team roster member", entityId: member.id, itemLabel: member.name });
    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Team member creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Member ID", 100);
    const member = await prisma.teamMember.update({ where: { id }, data: memberData(body, true) });
    await recordAdminActivity({ action: "UPDATE", entity: "Team roster member", entityId: member.id, itemLabel: member.name });
    return NextResponse.json({ success: true, member });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Team member update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) return NextResponse.json({ error: "A valid member ID is required." }, { status: 400 });
    const member = await prisma.teamMember.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Team roster member", entityId: member.id, itemLabel: member.name });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Team member deletion failed:", error);
  }
}
