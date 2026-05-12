import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    enabled:   user.scheduleEnabled,
    time:      user.scheduleTime,
    timezone:  user.scheduleTimezone,
    frequency: user.scheduleFrequency,
    topic:     user.scheduleTopic ?? "",
    platforms: JSON.parse(user.schedulePlatforms || '["facebook","instagram"]'),
    nextRun:   user.scheduleNextRun,
  });
}

const VALID_FREQUENCIES = ["daily", "every2days", "weekly"] as const;
const MAX_TOPIC_LENGTH = 200;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { enabled, time, timezone, frequency, topic, platforms } = body as Record<string, unknown>;

  // Input validation
  if (enabled !== undefined && typeof enabled !== "boolean") {
    return NextResponse.json({ error: "enabled must be a boolean" }, { status: 400 });
  }
  if (time !== undefined && (typeof time !== "string" || !/^\d{2}:\d{2}$/.test(time as string))) {
    return NextResponse.json({ error: "time must be HH:MM" }, { status: 400 });
  }
  if (timezone !== undefined && typeof timezone === "string") {
    try { Intl.DateTimeFormat(undefined, { timeZone: timezone as string }); }
    catch { return NextResponse.json({ error: "Invalid timezone" }, { status: 400 }); }
  }
  if (frequency !== undefined && !VALID_FREQUENCIES.includes(frequency as typeof VALID_FREQUENCIES[number])) {
    return NextResponse.json({ error: "frequency must be daily, every2days, or weekly" }, { status: 400 });
  }
  if (topic !== undefined && typeof topic === "string" && (topic as string).length > MAX_TOPIC_LENGTH) {
    return NextResponse.json({ error: `topic must be under ${MAX_TOPIC_LENGTH} characters` }, { status: 400 });
  }
  if (platforms !== undefined && !Array.isArray(platforms)) {
    return NextResponse.json({ error: "platforms must be an array" }, { status: 400 });
  }
  const allowedPlatforms = ["facebook", "instagram", "x"];
  if (Array.isArray(platforms) && !platforms.every(p => allowedPlatforms.includes(p))) {
    return NextResponse.json({ error: "platforms must be facebook, instagram, or x" }, { status: 400 });
  }

  // Calculate next run time based on selected time + timezone
  const nextRun = enabled ? computeNextRun(time as string, timezone as string, frequency as string) : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      scheduleEnabled:   enabled as boolean,
      scheduleTime:      time as string,
      scheduleTimezone:  timezone as string,
      scheduleFrequency: frequency as string,
      scheduleTopic:     (topic as string) || null,
      schedulePlatforms: JSON.stringify(platforms),
      scheduleNextRun:   nextRun,
    },
  });

  return NextResponse.json({ ok: true, nextRun });
}

/**
 * Returns the next UTC Date at which the user's scheduled time falls.
 * Uses formatToParts exclusively (no locale-string parsing) for reliable timezone math.
 */
function computeNextRun(time: string, timezone: string, frequency: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();

  const fmt = (tz: string) => new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  // Extract current date/time components in user's timezone
  const parts = fmt(timezone).formatToParts(now);
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? "0");
  const year = get("year"), month = get("month") - 1, day = get("day");
  const curHour = get("hour"), curMin = get("minute");

  // Has today's target time already passed in the user's timezone?
  const todayPassed = curHour > hours || (curHour === hours && curMin >= minutes);
  const daysToAdd = frequency === "daily" ? 1 : frequency === "every2days" ? 2 : 7;
  const targetDay = day + (todayPassed ? daysToAdd : 0);

  // Treat the desired local date/time as UTC (naive), then correct for the tz offset.
  // This avoids unreliable locale-string parsing while remaining DST-aware.
  const naive = new Date(Date.UTC(year, month, targetDay, hours, minutes, 0));

  // Find what time naive (UTC) appears as in the target timezone
  const tzParts = fmt(timezone).formatToParts(naive);
  const tz = (t: string) => parseInt(tzParts.find(p => p.type === t)?.value ?? "0");
  const offsetMs = naive.getTime()
    - Date.UTC(tz("year"), tz("month") - 1, tz("day"), tz("hour"), tz("minute"), tz("second"));

  const targetUTC = new Date(naive.getTime() + offsetMs);

  // Safety net: if still in the past (e.g. DST edge), advance by one frequency period
  if (targetUTC <= now) {
    targetUTC.setUTCDate(targetUTC.getUTCDate() + daysToAdd);
  }

  return targetUTC;
}
