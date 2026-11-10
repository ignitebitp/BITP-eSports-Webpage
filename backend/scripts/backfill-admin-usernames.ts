import { PrismaClient } from "@prisma/client";
import { usernameFromEmail } from "../lib/username";

const prisma = new PrismaClient();

async function backfillAdminUsernames() {
  const users = await prisma.adminUser.findMany({
    where: {
      OR: [
        { username: null, isActive: true, mustSetPassword: false },
        { role: "EDITOR" },
      ],
    },
    select: { id: true, email: true, username: true, role: true },
  });

  for (const user of users) {
    let username = user.username;
    if (!username) {
      const base = usernameFromEmail(user.email);
      username = base;
      for (let suffix = 2; await prisma.adminUser.findUnique({ where: { username } }); suffix += 1) {
        const suffixText = String(suffix);
        username = `${base.slice(0, 30 - suffixText.length)}${suffixText}`;
      }
    }
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { username, ...(user.role === "EDITOR" ? { role: "MODERATOR" } : {}) },
    });
  }

  console.info(`Assigned usernames to ${users.length} existing active admin account(s).`);
}

backfillAdminUsernames()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "Admin username backfill failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
