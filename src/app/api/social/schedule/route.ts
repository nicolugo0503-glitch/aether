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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { enabled, time, timezone, frequency, topic, platforms } = await req.json();

  // Calculate next run time based on selected time + timezone
  const nextRun = enabled ? computeNextRun(time, timezone, frequency) : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      scheduleEnabled:   enabled,
      scheduleTime:      time,
      scheduleTimezone:  timezone,
      scheduleFrequency: frequency,
      scheduleTopic:     topic || null,
      schedulePlatforms: JSON.stringify(platforms),
      scheduleNextRun:   nextRun,
    },
  });

  return NextResponse.json({ ok: true, nextRun });
}

function computeNextRun(time: string, timezone: string, frequency: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();

  // Get current time in user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value || "0");
  const year = get("year"), month = get("month") - 1, day = get("day");
  const curHour = get("hour"), curMin = get("minute");

  // Build today's target time in local timezone
  const target = new Date();
  target.setFullYear(year, month, day);
  target.setHours(hours, minutes, 0, 0);

  // Convert from user timezone to UTC
  const tzOffset = new Date(target.toLocaleString("en-US", { timeZone: timezone })).getTime() - target.getTime();
  const targetUTC = new Date(target.getTime() - tzOffset);

  // If target already passed today, move to next occurrence
  if (targetUTC <= now) {
    const daysToAdd = frequency === "daily" ? 1 : frequency === "every2days" ? 2 : 7;
    targetUTC.setDate(targetUTC.getDate() + daysToAdd);
  }

  return targetUTC;
}
