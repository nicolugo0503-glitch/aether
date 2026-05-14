import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scanCompetitor } from "@/lib/competitor";

export const maxDuration = 300;
export const runtime = "nodejs";

// Hard cap per cron tick — keeps a runaway workspace from monopolizing
// the function. Anything not scanned will be picked up next tick.
const MAX_PER_RUN = 25;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET env var not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await prisma.competitor.findMany({
    where: {
      enabled: true,
      OR: [
        { nextScanAt: { lte: now } },
        { nextScanAt: null },
      ],
    },
    orderBy: { nextScanAt: "asc" },
    take: MAX_PER_RUN,
    select: { id: true },
  });

  const results: Array<{ id: string; ok: boolean; changed: boolean; severity?: string; error?: string }> = [];

  for (const c of due) {
    try {
      const r = await scanCompetitor(c.id);
      results.push({
        id: c.id,
        ok: r.ok,
        changed: r.changed,
        severity: r.severity,
        error: r.error,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({ id: c.id, ok: false, changed: false, error: msg });
    }
  }

  return NextResponse.json({
    processed: results.length,
    queued: due.length,
    changesDetected: results.filter((r) => r.changed).length,
    results,
  });
}
