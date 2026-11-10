import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function recordAdminActivity(input: {
  action: "CREATE" | "UPDATE" | "DELETE" | "INVITE" | "ACCOUNT_UPDATE" | "PROFILE_UPDATE" | "PASSWORD_CHANGE";
  entity: string;
  entityId?: string;
  itemLabel: string;
}) {
  const actor = await getAdminSession();
  if (!actor) throw new Error("Authenticated admin session is required to record activity.");

  await prisma.adminActivity.create({
    data: {
      actorId: actor.id,
      actorUsername: actor.username,
      actorName: actor.name,
      actorEmail: actor.email,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      itemLabel: input.itemLabel.slice(0, 200),
    },
  });
}
