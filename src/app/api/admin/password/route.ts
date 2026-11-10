import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clearAdminSessionCookie, getAdminSession, hashPassword, verifyPassword } from "@/lib/auth";
import { ApiInputError, inputErrorResponse, readJsonObject, requireAdmin, requestIdentifier, safeServerError } from "@/lib/api";
import { checkPersistentRateLimit } from "@/lib/rateLimit";

export async function PATCH(request: Request) {
  const authorization = await requireAdmin(request, true);
  if (authorization) return authorization;
  try {
    if (!(await checkPersistentRateLimit(`password-change:${requestIdentifier(request)}`, 5, 60 * 60_000)).success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }
    const body = await readJsonObject(request, 2_048);
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") {
      throw new ApiInputError("Current and new passwords are required.");
    }
    if (body.newPassword.length < 14 || Buffer.byteLength(body.newPassword, "utf8") > 72) {
      throw new ApiInputError("The new password must be 14–72 UTF-8 bytes long.");
    }
    const user = await prisma.adminUser.findUnique({ where: { id: session.id } });
    if (!user || !(await verifyPassword(body.currentPassword, user.password))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { password: await hashPassword(body.newPassword), authVersion: { increment: 1 } },
    });
    await clearAdminSessionCookie();
    return NextResponse.json({ success: true, message: "Password changed. Please sign in again." });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Password change failed:", error);
  }
}
