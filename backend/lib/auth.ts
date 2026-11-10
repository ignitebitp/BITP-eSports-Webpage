import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "admin_session";
export const ADMIN_ROLES = ["OWNER", "ADMIN", "MODERATOR"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole);
}

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("ADMIN_JWT_SECRET must be set to at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminToken(payload: { id: string; email: string; role: AdminRole; authVersion: number }) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("bitpesports")
    .setAudience("bitpesports-admin")
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string) {
  try {
    const verified = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: "bitpesports",
      audience: "bitpesports-admin",
    });
    const { id, email, role, authVersion } = verified.payload;
    if (
      typeof id !== "string" ||
      typeof email !== "string" ||
      !isAdminRole(role) ||
      typeof authVersion !== "number"
    ) {
      return null;
    }
    return { id, email, role, authVersion };
  } catch {
    return null;
  }
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyAdminToken(token);
  if (!payload) return null;
  const user = await prisma.adminUser.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, username: true, name: true, role: true, isActive: true, mustSetPassword: true, authVersion: true },
  });
  if (!user || !user.isActive || user.mustSetPassword || user.authVersion !== payload.authVersion || !isAdminRole(user.role)) {
    return null;
  }
  return { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role, authVersion: user.authVersion };
}
