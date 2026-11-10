import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminPasswordEmailConfigured, sendAdminPasswordEmail } from "@/lib/admin-email";
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const ipLimit = await checkPersistentRateLimit(`password-reset:${requestIdentifier(request)}`, 5, 60 * 60_000);
    if (!ipLimit.success) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    const body = await readJsonObject(request, 2_048);
    const email = requiredText(body.email, "Email", 254).toLowerCase();
    if (!EMAIL_PATTERN.test(email)) throw new ApiInputError("Enter a valid email address.");
    if (!isAdminPasswordEmailConfigured()) {
      return NextResponse.json({ error: "Password reset email is temporarily unavailable." }, { status: 503 });
    }
    const emailKey = createHash("sha256").update(email).digest("hex");
    if (!(await checkPersistentRateLimit(`password-reset-email:${emailKey}`, 3, 60 * 60_000)).success) {
      return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
    }

    const user = await prisma.adminUser.findUnique({ where: { email, isActive: true } });
    if (user) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await prisma.$transaction(async (transaction) => {
        await transaction.passwordResetToken.updateMany({
          where: { userId: user.id, purpose: "RESET", usedAt: null },
          data: { usedAt: new Date() },
        });
        await transaction.passwordResetToken.create({
          data: { userId: user.id, tokenHash, purpose: "RESET", expiresAt: new Date(Date.now() + 30 * 60_000) },
        });
      });
      try {
        await sendAdminPasswordEmail(user.email, token, "reset");
      } catch (error) {
        console.error("Password reset email delivery failed:", error instanceof Error ? error.name : "Unknown error");
      }
    }
    return NextResponse.json({ success: true, message: "If an active account exists for that email, password instructions will be sent." });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Password reset request failed:", error);
  }
}
