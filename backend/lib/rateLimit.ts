import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

interface RateLimitRecord {
  count: number;
  expiresAt: number;
}

const store = new Map<string, RateLimitRecord>();
const MAX_RECORDS = 10_000;

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || record.expiresAt <= now) {
    if (store.size >= MAX_RECORDS) {
      for (const [storedKey, storedRecord] of store) {
        if (storedRecord.expiresAt <= now) store.delete(storedKey);
      }
      if (store.size >= MAX_RECORDS) {
        return { success: false, remaining: 0 };
      }
    }
    store.set(key, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: Math.max(0, limit - 1) };
  }

  if (record.count >= limit) return { success: false, remaining: 0 };

  record.count += 1;
  return { success: true, remaining: Math.max(0, limit - record.count) };
}

export async function checkPersistentRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; remaining: number }> {
  const hashedKey = createHash("sha256").update(key).digest("hex");
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "AuthRateLimit" AS current ("key", "windowStartedAt", "count", "updatedAt")
    VALUES (${hashedKey}, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN current."windowStartedAt" <= CURRENT_TIMESTAMP - (${windowMs} * INTERVAL '1 millisecond') THEN 1
        ELSE current."count" + 1
      END,
      "windowStartedAt" = CASE
        WHEN current."windowStartedAt" <= CURRENT_TIMESTAMP - (${windowMs} * INTERVAL '1 millisecond') THEN CURRENT_TIMESTAMP
        ELSE current."windowStartedAt"
      END,
      "updatedAt" = CURRENT_TIMESTAMP
    RETURNING "count"
  `;
  const count = rows[0]?.count;

  if (count === undefined) throw new Error("Persistent authentication rate limiter returned no counter.");

  if (Math.random() < 0.01) {
    await prisma.authRateLimit.deleteMany({
      where: { windowStartedAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } },
    });
  }

  return { success: count <= limit, remaining: Math.max(0, limit - count) };
}
