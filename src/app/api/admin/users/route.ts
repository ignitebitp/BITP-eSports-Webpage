import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hashPassword, isAdminRole } from "@/lib/auth";
import { recordAdminActivity } from "@/lib/admin-activity";
import { isAdminPasswordEmailConfigured, sendAdminPasswordEmail } from "@/lib/admin-email";
import {
  ApiInputError,
  inputErrorResponse,
  optionalText,
  readJsonObject,
  requestIdentifier,
  requiredText,
  requireAdmin,
  safeServerError,
} from "@/lib/api";
import { checkPersistentRateLimit } from "@/lib/rateLimit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MANAGE_ROLES = ["OWNER", "ADMIN", "MODERATOR"] as const;

export async function GET(request: Request) {
  const authorization = await requireAdmin(request, false, "users:manage");
  if (authorization) return authorization;
  try {
    const actor = await getAdminSession();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const users = await prisma.adminUser.findMany({
      where: actor.role === "ADMIN" ? { role: "MODERATOR" } : undefined,
      select: { id: true, email: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return safeServerError("Admin user listing failed:", error);
  }
}

export async function POST(request: Request) {
  const authorization = await requireAdmin(request, true, "users:manage");
  if (authorization) return authorization;
  if (!isAdminPasswordEmailConfigured()) {
    return NextResponse.json({ error: "Account invitation email is not configured." }, { status: 503 });
  }
  try {
    if (!(await checkPersistentRateLimit(`admin-user-create:${requestIdentifier(request)}`, 10, 60_000)).success) {
      return NextResponse.json({ error: "Too many account invitations. Please try again later." }, { status: 429 });
    }
    const body = await readJsonObject(request, 4_096);
    const email = requiredText(body.email, "Email", 254).toLowerCase();
    const name = email.split("@")[0].slice(0, 100) || "Invited user";
    const role = requiredText(body.role, "Role", 20);
    const message = optionalText(body.message, "Message", 1000);
    const actor = await getAdminSession();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!EMAIL_PATTERN.test(email)) throw new ApiInputError("Enter a valid email address.");
    if (!MANAGE_ROLES.includes(role as (typeof MANAGE_ROLES)[number]) || !isAdminRole(role)) {
      throw new ApiInputError("Choose OWNER, ADMIN, or MODERATOR.");
    }
    if (actor.role === "ADMIN" && role !== "MODERATOR") {
      return NextResponse.json({ error: "Admins can only create Moderator accounts." }, { status: 403 });
    }
    const existing = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, mustSetPassword: true, role: true },
    });
    if (existing && (!existing.mustSetPassword || !isAdminRole(existing.role))) {
      throw new ApiInputError("An account with this email already exists.", 409);
    }
    if (existing && actor.role === "ADMIN" && existing.role !== "MODERATOR") {
      return NextResponse.json({ error: "Admins can only manage Moderator accounts." }, { status: 403 });
    }

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = existing
      ? await prisma.$transaction(async (transaction) => {
        await transaction.passwordResetToken.updateMany({
          where: { userId: existing.id, usedAt: null },
          data: { usedAt: new Date() },
        });
        await transaction.passwordResetToken.create({
          data: { userId: existing.id, tokenHash, purpose: "INVITE", expiresAt: new Date(Date.now() + 30 * 60_000) },
        });
        return transaction.adminUser.update({
          where: { id: existing.id },
          data: { name, role },
          select: { id: true, email: true, username: true, name: true, role: true, isActive: true, createdAt: true },
        });
      })
      : await prisma.adminUser.create({
        data: {
          email,
          name,
          role,
          password: await hashPassword(randomBytes(48).toString("base64url")),
          mustSetPassword: true,
          passwordResetTokens: {
            create: { tokenHash, purpose: "INVITE", expiresAt: new Date(Date.now() + 30 * 60_000) },
          },
        },
        select: { id: true, email: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      });
    try {
      await sendAdminPasswordEmail(email, token, "invite", message);
    } catch (error) {
      if (!existing) await prisma.adminUser.delete({ where: { id: user.id } });
      throw error;
    }
    await recordAdminActivity({
      action: "INVITE",
      entity: "User account",
      entityId: user.id,
      itemLabel: `${user.email}`,
    });
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Admin user invitation failed:", error);
  }
}

export async function PATCH(request: Request) {
  const authorization = await requireAdmin(request, true, "users:manage");
  if (authorization) return authorization;
  try {
    const body = await readJsonObject(request, 4_096);
    const id = requiredText(body.id, "User ID", 100);
    const actor = await getAdminSession();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (actor.role === "ADMIN") {
      return NextResponse.json({ error: "Admins can create or delete Moderator accounts, but cannot change account roles or status." }, { status: 403 });
    }
    const role = body.role === undefined ? undefined : requiredText(body.role, "Role", 20);
    if (role !== undefined && (!isAdminRole(role) || !MANAGE_ROLES.includes(role as (typeof MANAGE_ROLES)[number]))) {
      throw new ApiInputError("Choose OWNER, ADMIN, or MODERATOR.");
    }
    if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
      throw new ApiInputError("Active status must be true or false.");
    }

    const user = await prisma.$transaction(async (transaction) => {
      const current = await transaction.adminUser.findUnique({ where: { id } });
      if (!current) return null;
      if (actor.role === "ADMIN" && (current.role !== "MODERATOR" || (role !== undefined && role !== "MODERATOR"))) {
        throw new ApiInputError("Admins can only manage Moderator accounts.", 403);
      }
      const willLoseOwnerAccess = current.role === "OWNER" && current.isActive && (role !== undefined && role !== "OWNER" || body.isActive === false);
      if (willLoseOwnerAccess) {
        const otherOwners = await transaction.adminUser.count({
          where: { id: { not: id }, role: "OWNER", isActive: true },
        });
        if (otherOwners === 0) throw new ApiInputError("At least one active owner account must remain.", 409);
      }
      return transaction.adminUser.update({
        where: { id },
        data: {
          ...(role === undefined ? {} : { role }),
          ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
          authVersion: { increment: 1 },
          ...(body.isActive === false
            ? { passwordResetTokens: { updateMany: { where: { usedAt: null }, data: { usedAt: new Date() } } } }
            : {}),
        },
        select: { id: true, email: true, username: true, name: true, role: true, isActive: true, createdAt: true },
      });
    }, { isolationLevel: "Serializable" });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await recordAdminActivity({
      action: "ACCOUNT_UPDATE",
      entity: "User account",
      entityId: user.id,
      itemLabel: `${user.name} (${user.email})`,
    });
    return NextResponse.json({ success: true, user });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Admin user update failed:", error);
  }
}

export async function DELETE(request: Request) {
  const authorization = await requireAdmin(request, true, "users:manage");
  if (authorization) return authorization;
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || id.length > 100) {
      return NextResponse.json({ error: "A valid user ID is required." }, { status: 400 });
    }
    const actor = await getAdminSession();
    if (!actor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const target = await prisma.$transaction(async (transaction) => {
      const account = await transaction.adminUser.findUnique({
        where: { id },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });
      if (!account) return null;
      if (actor.id === account.id) throw new ApiInputError("You cannot delete your own account.", 400);
      if (actor.role === "ADMIN" && account.role !== "MODERATOR") {
        throw new ApiInputError("Admins can only delete Moderator accounts.", 403);
      }
      if (account.role === "OWNER" && account.isActive) {
        const otherOwners = await transaction.adminUser.count({
          where: { id: { not: id }, role: "OWNER", isActive: true },
        });
        if (otherOwners === 0) {
          throw new ApiInputError("At least one active Owner account must remain.", 409);
        }
      }
      await transaction.adminUser.delete({ where: { id } });
      return account;
    }, { isolationLevel: "Serializable" });
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    await recordAdminActivity({
      action: "ACCOUNT_UPDATE",
      entity: "User account",
      entityId: target.id,
      itemLabel: `Deleted ${target.role} account ${target.email}`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Admin user deletion failed:", error);
  }
}
