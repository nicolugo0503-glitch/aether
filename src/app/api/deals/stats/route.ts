// GET /api/deals/stats — pipeline totals + per-agent attribution
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { pipelineStats, attributionByAgent } from "@/lib/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [stats, agents] = await Promise.all([
    pipelineStats(user.id),
    attributionByAgent(user.id),
  ]);
  return NextResponse.json({ stats, agents });
}
