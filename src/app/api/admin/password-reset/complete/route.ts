import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  ApiInputError,
  inputErrorResponse,
  isCrossOriginRequest,
  readJsonObject,
  requestIdentifier,
  requiredText,
  safeServerError,
} from "@/lib/api";
import { checkPersistentRateLimit } from "@/lib/rateLimit";
import { normalizeUsername } from "@/lib/username";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(token)) {
    return NextResponse.json({ error: "This password link is invalid or has expired." }, { status: 400 });
  }
  try {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const [ipLimit, tokenLimit] = await Promise.all([
      checkPersistentRateLimit(`password-link-check-ip:${requestIdentifier(request)}`, 60, 60 * 60_000),
      checkPersistentRateLimit(`password-link-check-token:${tokenHash}`, 20, 60 * 60_000),
    ]);
    if (!ipLimit.success || !tokenLimit.success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
    const reset = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { purpose: true, usedAt: true, expiresAt: true, user: { select: { isActive: true, mustSetPassword: true } } },
    });
    const valid = reset && !reset.usedAt && reset.expiresAt > new Date() && reset.user.isActive &&
      ((reset.purpose === "INVITE" && reset.user.mustSetPassword) || reset.purpose === "RESET");
    if (!valid) return NextResponse.json({ error: "This password link is invalid or has expired." }, { status: 400 });
    return NextResponse.json({ success: true, purpose: reset.purpose });
  } catch (error) {
    return safeServerError("Password link validation failed:", error);
  }
}

export async function POST(request: Request) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const ipLimit = await checkPersistentRateLimit(`password-reset-complete:${requestIdentifier(request)}`, 10, 60 * 60_000);
    if (!ipLimit.success) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    const body = await readJsonObject(request, 2_048);
    if (typeof body.token !== "string" || !/^[A-Za-z0-9_-]{40,60}$/.test(body.token)) {
      throw new ApiInputError("This password link is invalid or has expired.");
    }
    const tokenKey = createHash("sha256").update(body.token).digest("hex");
    const tokenLimit = await checkPersistentRateLimit(`password-reset-token:${tokenKey}`, 5, 60 * 60_000);
    if (!tokenLimit.success) return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    if (typeof body.password !== "string" || body.password.length < 14 || Buffer.byteLength(body.password, "utf8") > 72) {
      throw new ApiInputError("The password must be 14–72 UTF-8 bytes long.");
    }
    const username = body.username === undefined ? null : normalizeUsername(body.username);
    if (body.username !== undefined && !username) {
      throw new ApiInputError("Username must be 3–30 characters using letters, numbers, dots, underscores, or hyphens.");
    }
    const name = body.name === undefined ? null : requiredText(body.name, "Name", 100);
    const tokenHash = tokenKey;
    const password = await hashPassword(body.password);
    const now = new Date();

    const result = await prisma.$transaction(async (transaction) => {
      const reset = await transaction.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: { select: { id: true, email: true, isActive: true, mustSetPassword: true } } },
      });
      if (
        !reset ||
        reset.usedAt ||
        reset.expiresAt <= now ||
        (reset.purpose === "RESET" && !reset.user.isActive) ||
        (reset.purpose === "INVITE" && (!reset.user.isActive || !reset.user.mustSetPassword || !username || !name)) ||
        (reset.purpose !== "RESET" && reset.purpose !== "INVITE")
      ) return false;
      if (reset.purpose === "INVITE") {
        const existingUsername = await transaction.adminUser.findUnique({ where: { username: username! }, select: { id: true } });
        if (existingUsername && existingUsername.id !== reset.user.id) {
          throw new ApiInputError("That username is already taken.", 409);
        }
      }
      const claimed = await transaction.passwordResetToken.updateMany({
        where: { id: reset.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) return false;
      await transaction.adminUser.update({
        where: { id: reset.userId },
        data: {
          password,
          ...(reset.purpose === "INVITE" ? { isActive: true, name: name!, username: username! } : {}),
          mustSetPassword: false,
          authVersion: { increment: 1 },
          passwordResetTokens: { updateMany: { where: { id: { not: reset.id }, usedAt: null }, data: { usedAt: now } } },
        },
      });
      if (reset.purpose === "INVITE") {
        await transaction.adminActivity.create({
          data: {
            actorId: reset.user.id,
            actorUsername: username,
            actorName: name!,
            actorEmail: reset.user.email,
            action: "INVITE_ACCEPT",
            entity: "User account",
            entityId: reset.user.id,
            itemLabel: `Accepted invitation as @${username}`,
          },
        });
      }
      return true;
    });

    if (!result) return NextResponse.json({ error: "This password link is invalid or has expired." }, { status: 400 });
    return NextResponse.json({ success: true, message: "Password set. You can now sign in." });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Password reset completion failed:", error);
  }
}
