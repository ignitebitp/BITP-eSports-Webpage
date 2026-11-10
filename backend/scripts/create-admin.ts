import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { usernameFromEmail } from "../lib/username";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.ADMIN_NAME?.trim();
  const role = process.env.ADMIN_ROLE || "OWNER";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Set ADMIN_EMAIL to a valid email address.");
  }
  if (!name || name.length > 100) {
    throw new Error("Set ADMIN_NAME to a name no longer than 100 characters.");
  }
  if (!["OWNER", "ADMIN", "MODERATOR"].includes(role)) {
    throw new Error("ADMIN_ROLE must be OWNER, ADMIN, or MODERATOR.");
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    let username = existing.username;
    if (!username) {
      const base = usernameFromEmail(email);
      username = base;
      for (let suffix = 2; await prisma.adminUser.findUnique({ where: { username } }); suffix += 1) {
        const suffixText = String(suffix);
        username = `${base.slice(0, 30 - suffixText.length)}${suffixText}`;
      }
    }
    await prisma.adminUser.update({
      where: { id: existing.id },
      data: { role, username, authVersion: { increment: 1 } },
    });
    console.info(`Existing account role updated to ${role} and username assigned; its password was not changed.`);
  } else {
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 14 || Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("ADMIN_PASSWORD must be 14-72 bytes long when creating an account.");
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const base = usernameFromEmail(email);
    let username = base;
    for (let suffix = 2; await prisma.adminUser.findUnique({ where: { username } }); suffix += 1) {
      const suffixText = String(suffix);
      username = `${base.slice(0, 30 - suffixText.length)}${suffixText}`;
    }
    await prisma.adminUser.create({
      data: { email, username, name, password: passwordHash, role },
    });
    console.info(`Administrator account created with role ${role} and username assigned.`);
  }
}

createAdmin()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Administrator creation failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
