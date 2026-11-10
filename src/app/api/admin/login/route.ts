import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createAdminToken, isAdminRole, setAdminSessionCookie } from "@/lib/auth";
import { checkPersistentRateLimit } from "@/lib/rateLimit";
import { createHash } from "node:crypto";
import {
  inputErrorResponse,
  isCrossOriginRequest,
  readJsonObject,
  requestIdentifier,
  requiredText,
  safeServerError,
} from "@/lib/api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_PASSWORD_HASH = "$2b$10$5HPkhMnvfP7vmjg/cGH22eUxYETRT46rbWNbpJR.qIMMXEw/oYzvO";

export async function POST(request: Request) {
  if (isCrossOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const ipLimit = await checkPersistentRateLimit(`login-ip:${requestIdentifier(request)}`, 20, 15 * 60_000);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
    const body = await readJsonObject(request, 2_048);
    const identifier = requiredText(body.identifier ?? body.email, "Email or username", 254).toLowerCase();
    const identifierKey = createHash("sha256").update(identifier).digest("hex");
    const accountLimit = await checkPersistentRateLimit(`login-account:${identifierKey}`, 10, 15 * 60_000);
    if (!accountLimit.success) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }
    if (typeof body.password !== "string" || !body.password.length || Buffer.byteLength(body.password, "utf8") > 72) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    const password = body.password;
    if (!EMAIL_PATTERN.test(identifier) && !/^[a-z0-9][a-z0-9._-]{2,29}$/.test(identifier)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });
    const valid = await verifyPassword(password, admin?.password ?? DUMMY_PASSWORD_HASH);
    if (!valid || !admin || !admin.isActive || admin.mustSetPassword || !isAdminRole(admin.role)) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await createAdminToken({
      id: admin.id,
      email: admin.email,
      role: admin.role,
      authVersion: admin.authVersion,
    });
    await setAdminSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { id: admin.id, email: admin.email, username: admin.username, name: admin.name, role: admin.role },
    });
  } catch (error) {
    const inputResponse = inputErrorResponse(error);
    if (inputResponse) return inputResponse;
    return safeServerError("Admin login failed:", error);
  }
}
