import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ApiInputError,
  inputErrorResponse,
  readJsonObject,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";
import { recordAdminActivity } from "@/lib/admin-activity";
import { normalizeUsername } from "@/lib/username";

export async function GET(request: Request) {
  const authorization = await requireAdmin(request);
  if (authorization) return authorization;

  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ success: true, profile: session });
  } catch (error) {
    return safeServerError("Admin profile fetch failed:", error);
  }
}

export async function PATCH(request: Request) {
  const authorization = await requireAdmin(request, true);
  if (authorization) return authorization;

  try {
    const body = await readJsonObject(request, 2_048);
    const name = requiredText(body.name, "Name", 100);
    const username = normalizeUsername(body.username);
    if (!username) {
      throw new ApiInputError("Username must be 3–30 characters using letters, numbers, dots, underscores, or hyphens.");
    }
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.adminUser.findUnique({ where: { username }, select: { id: true } });
    if (existing && existing.id !== session.id) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    const profile = await prisma.adminUser.update({
      where: { id: session.id },
      data: { name, username },
      select: { id: true, name: true, username: true, email: true, role: true },
    });
    await recordAdminActivity({
      action: "PROFILE_UPDATE",
      entity: "Profile",
      entityId: profile.id,
      itemLabel: `Updated profile for @${profile.username}`,
    });
    return NextResponse.json({ success: true, profile });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Admin profile update failed:", error);
  }
}
