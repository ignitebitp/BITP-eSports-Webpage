import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";
import {
  ApiInputError,
  inputErrorResponse,
  optionalInteger,
  readJsonObject,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";

const OFFICER_GROUPS = ["President", "Core Executive", "Senior Coordinator", "Junior Coordinator"];

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;
  try {
    const officers = await prisma.officer.findMany({ orderBy: { order: "asc" }, take: 100 });
    const photos = await prisma.officerPhoto.findMany({
      where: { officerId: { in: officers.map((officer) => officer.id) } },
      select: { officerId: true, updatedAt: true },
    });
    const photoUpdatedAt = new Map(photos.map((photo) => [photo.officerId, photo.updatedAt.getTime()]));
    return NextResponse.json({
      success: true,
      officers: officers.map((officer) => ({
        ...officer,
        group: OFFICER_GROUPS.includes(officer.role) && officer.group === "Senior Coordinator"
          ? officer.role
          : officer.group,
        photoUrl: photoUpdatedAt.has(officer.id)
          ? `/api/officers/${officer.id}/photo?v=${photoUpdatedAt.get(officer.id)}`
          : null,
      })),
    });
  } catch (error) {
    return safeServerError("Officer listing failed:", error);
  }
}

function officerData(body: Record<string, unknown>, partial = false) {
  const data: Record<string, unknown> = {};
  if (!partial) {
    data.handle = "";
    data.yearMajor = "";
    data.tag = "";
    data.discord = "";
    data.imageUrl = "";
  }
  if (body.name !== undefined || !partial) data.name = requiredText(body.name, "name", 120);
  if (body.rollNo !== undefined || !partial) {
    const rollNo = requiredText(body.rollNo, "Roll number", 40);
    const parts = rollNo.split("/").map((part) => part.trim());
    if (parts.length !== 3 || !/^[A-Za-z]+$/.test(parts[0]) || !/^\d{1,12}$/.test(parts[1]) || !/^\d{2,4}$/.test(parts[2])) {
      throw new ApiInputError("Roll number must use Department/Unique number/Enrollment year (for example, BTECH/15272/25).");
    }
    data.rollNo = `${parts[0].toUpperCase()}/${parts[1]}/${parts[2]}`;
  }
  if (body.role !== undefined || !partial) data.role = requiredText(body.role, "Post", 100);
  if (body.group !== undefined || !partial) {
    const group = requiredText(body.group, "Committee section", 40);
    if (!OFFICER_GROUPS.includes(group)) {
      throw new ApiInputError(`Committee section must be one of: ${OFFICER_GROUPS.join(", ")}.`);
    }
    data.group = group;
  }
  if (body.order !== undefined || !partial) data.order = optionalInteger(body.order, "Display order", 0, 0, 10_000);
  return data;
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const data = officerData(await readJsonObject(request));
    const officer = await prisma.officer.create({ data: data as Parameters<typeof prisma.officer.create>[0]["data"] });
    await recordAdminActivity({ action: "CREATE", entity: "Committee member", entityId: officer.id, itemLabel: officer.name });
    return NextResponse.json({ success: true, officer }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Officer creation failed:", error);
  }
}

export async function PUT(request: Request) {
  const authorization = await requireAdmin(request, true, "content:write");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request);
    const id = requiredText(body.id, "Officer ID", 100);
    const officer = await prisma.officer.update({ where: { id }, data: officerData(body, true) });
    await recordAdminActivity({ action: "UPDATE", entity: "Committee member", entityId: officer.id, itemLabel: officer.name });
    return NextResponse.json({ success: true, officer });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Officer update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "content:delete");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) return NextResponse.json({ error: "A valid officer ID is required." }, { status: 400 });
    const officer = await prisma.officer.delete({ where: { id } });
    await recordAdminActivity({ action: "DELETE", entity: "Committee member", entityId: officer.id, itemLabel: officer.name });
    return NextResponse.json({ success: true });
  } catch (error) {
    return safeServerError("Officer deletion failed:", error);
  }
}
