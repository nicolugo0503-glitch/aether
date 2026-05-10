/**
 * Cross-instance rate limiter backed by Postgres (via Prisma).
 * Unlike an in-memory Map, this persists across Vercel serverless invocations
 * so brute-force protection actually works in production.
 *
 * SETUP: run `npx prisma db push` once after deploying to create the RateLimit table.
 *
 * Falls back to in-memory if the DB query fails (e.g. table not yet created).
 */
import { prisma } from "./db";

// In-memory fallback — used only when DB is unavailable
type Entry = { count: number; resetAt: number };
const fallbackStore = new Map<string, Entry>();

/**
 * @param key      Unique key (e.g. "login:127.0.0.1")
 * @param limit    Max allowed hits in the window
 * @param windowMs Window length in ms (default 15 min)
 * @returns true if the request should be blocked
 */
export async function isRateLimited(
  key: string,
  limit: number,
  windowMs = 15 * 60 * 1000,
): Promise<boolean> {
  const resetAt = new Date(Date.now() + windowMs);

  try {
    // Atomic upsert: create entry or increment counter; reset window if expired
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimit" (key, count, "resetAt")
      VALUES (${key}, 1, ${resetAt})
      ON CONFLICT (key) DO UPDATE
        SET
          count   = CASE WHEN "RateLimit"."resetAt" < NOW() THEN 1     ELSE "RateLimit".count + 1 END,
          "resetAt" = CASE WHEN "RateLimit"."resetAt" < NOW() THEN ${resetAt} ELSE "RateLimit"."resetAt"  END
      RETURNING count
    `;
    return (rows[0]?.count ?? 0) > limit;
  } catch {
    // DB unavailable — fall back to per-instance in-memory store
    const now = Date.now();
    const entry = fallbackStore.get(key);
    if (!entry || entry.resetAt < now) {
      fallbackStore.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }
    entry.count += 1;
    return entry.count > limit;
  }
}
