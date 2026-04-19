// Simple in-memory rate limiter
// Works per Vercel instance — good enough to block brute-force bursts

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

/**
 * @param key      Unique key (e.g. "login:127.0.0.1")
 * @param limit    Max allowed hits
 * @param windowMs Window length in ms (default 15 min)
 * @returns true if the request should be blocked
 */
export function isRateLimited(key: string, limit: number, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) return true;
  return false;
}
