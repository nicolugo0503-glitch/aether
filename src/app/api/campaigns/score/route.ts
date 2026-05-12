// POST /api/campaigns/score
// ─────────────────────────────────────────────────────────────
// Preview-score the leads in a campaign's Google Sheet WITHOUT
// burning email runs. Persists scores to LeadScore so the
// dashboard can render the breakdown.
//
// Body: { campaignId: string, icp?: string, refresh?: boolean }

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readSheetLeads } from "@/lib/sheets";
import { scoreLeadsBatch } from "@/lib/lead-scoring";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";

// Cap how many leads we'll score in a single preview call.
// Scoring is cheap (~$0.0001 per lead) but we still don't want to nuke a free tier.
const MAX_PREVIEW_LEADS = 200;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { campaignId, icp, refresh } = body as {
      campaignId?: string; icp?: string; refresh?: boolean;
    };
    if (!campaignId) return NextResponse.json({ error: "campaignId required" }, { status: 400 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: user.id },
    });
    if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

    const agent = await prisma.agent.findFirst({ where: { id: campaign.agentId, userId: user.id } });

    // If we already have scores and the caller didn't ask for a refresh, just return them.
    if (!refresh) {
      const existing = await prisma.leadScore.findMany({
        where: { campaignId: campaign.id },
        orderBy: { score: "desc" },
      });
      if (existing.length > 0) {
        return NextResponse.json({
          cached: true,
          scores: existing.map(serialize),
          summary: summarize(existing),
        });
      }
    } else {
      // Refresh: wipe previous scores.
      await prisma.leadScore.deleteMany({ where: { campaignId: campaign.id } });
    }

    const allLeads = await readSheetLeads(campaign.sheetUrl);
    if (allLeads.length === 0) {
      return NextResponse.json({ error: "No valid leads found in sheet" }, { status: 400 });
    }

    // Lead-scoring quota — coarsely tied to plan. We don't charge a run per score,
    // but we cap free tier to a reasonable preview size.
    const planLimits = PLAN_LIMITS[toPlanKey(user.plan)];
    const previewCap = Math.min(MAX_PREVIEW_LEADS, Math.max(25, planLimits.monthlyRuns * 2));
    const leads = allLeads.slice(0, previewCap);

    // Use the agent's description / role as ICP context if none was provided.
    const idealCustomerProfile =
      (icp && icp.trim()) ||
      (agent?.description && agent.description.trim()) ||
      `Target customer for the "${agent?.role || "outreach"}" agent.`;

    const scored = await scoreLeadsBatch(leads, { idealCustomerProfile }, 4);

    // Persist.
    await prisma.$transaction(
      scored.map(s =>
        prisma.leadScore.create({
          data: {
            campaignId: campaign.id,
            userId: user.id,
            leadEmail: s.lead.email,
            leadName: s.lead.name || "",
            leadCompany: s.lead.company || null,
            score: s.score,
            tier: s.tier,
            reasoning: s.reasoning,
            signals: JSON.stringify(s.signals),
            redFlags: JSON.stringify(s.redFlags),
          },
        })
      )
    );

    const rows = await prisma.leadScore.findMany({
      where: { campaignId: campaign.id },
      orderBy: { score: "desc" },
    });

    return NextResponse.json({
      cached: false,
      scoredCount: scored.length,
      skippedFromSheet: Math.max(0, allLeads.length - leads.length),
      scores: rows.map(serialize),
      summary: summarize(rows),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "scoring failed" }, { status: 500 });
  }
}

function serialize(r: any) {
  return {
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
  };
}

function safeJsonArr(s: string | null | undefined): string[] {
  if (!s) return [];
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
}

function summarize(rows: { score: number; tier: string }[]) {
  const total = rows.length;
  const hot = rows.filter(r => r.tier === "HOT").length;
  const warm = rows.filter(r => r.tier === "WARM").length;
  const cold = rows.filter(r => r.tier === "COLD").length;
  const avg = total === 0 ? 0 : Math.round(rows.reduce((a, r) => a + r.score, 0) / total);
  return { total, hot, warm, cold, avgScore: avg };
}
