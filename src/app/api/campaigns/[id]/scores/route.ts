// GET  /api/campaigns/[id]/scores      → list scores for one campaign
// PATCH /api/campaigns/[id]/scores     → update campaign scoring settings
//                                        body: { minScoreThreshold?: number, sortByScore?: boolean, scoringEnabled?: boolean }
// DELETE /api/campaigns/[id]/scores    → wipe stored scores

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  const rows = await prisma.leadScore.findMany({
    where: { campaignId: id },
    orderBy: { score: "desc" },
  });

  const scores = rows.map((r: any) => ({
    id: r.id,
    leadEmail: r.leadEmail,
    leadName: r.leadName,
    leadCompany: r.leadCompany,
    score: r.score,
    tier: r.tier,
    reasoning: r.reasoning,
    signals: safeJsonArr(r.signals),
    redFlags: safeJsonArr(r.redFlags),
    contacted: r.contacted,
    skipped: r.skipped,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      minScoreThreshold: campaign.minScoreThreshold,
      sortByScore: campaign.sortByScore,
      scoringEnabled: campaign.scoringEnabled,
    },
    summary: summarize(rows),
    scores,
  });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.minScoreThreshold === "number") {
    data.minScoreThreshold = Math.max(0, Math.min(100, Math.round(body.minScoreThreshold)));
  }
  if (typeof body.sortByScore === "boolean") data.sortByScore = body.sortByScore;
  if (typeof body.scoringEnabled === "boolean") data.scoringEnabled = body.scoringEnabled;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  const updated = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json({
    minScoreThreshold: updated.minScoreThreshold,
    sortByScore: updated.sortByScore,
    scoringEnabled: updated.scoringEnabled,
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  await prisma.leadScore.deleteMany({ where: { campaignId: id } });
  return NextResponse.json({ success: true });
}

function safeJsonArr(s: string | null | undefined): string[] {
  if (!s) return [];
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}

function summarize(rows: { score: number; tier: string }[]) {
  const total = rows.length;
  const hot  = rows.filter(r => r.tier === "HOT").length;
  const warm = rows.filter(r => r.tier === "WARM").length;
  const cold = rows.filter(r => r.tier === "COLD").length;
  const avg  = total === 0 ? 0 : Math.round(rows.reduce((a, r) => a + r.score, 0) / total);
  return { total, hot, warm, cold, avgScore: avg };
}
