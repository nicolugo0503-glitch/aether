// GET    /api/campaigns/[id]/variants               → list variants + computed stats + A/B config
// POST   /api/campaigns/[id]/variants               → create a single variant manually
// PATCH  /api/campaigns/[id]/variants               → update A/B config flags on the parent campaign
// DELETE /api/campaigns/[id]/variants               → delete ALL variants for this campaign

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeVariantStats, type WinnerMetric, type VariantInput } from "@/lib/ab-testing";

type Ctx = { params: Promise<{ id: string }> };

const VALID_METRICS: WinnerMetric[] = ["reply_rate", "hot_reply_rate", "open_rate", "click_rate"];

function toVariantInput(v: any): VariantInput {
  return {
    id: v.id,
    label: v.label,
    name: v.name,
    isControl: v.isControl,
    isWinner: v.isWinner,
    active: v.active,
    sentCount: v.sentCount,
    openedCount: v.openedCount,
    clickedCount: v.clickedCount,
    repliedCount: v.repliedCount,
    hotRepliedCount: v.hotRepliedCount,
    errorCount: v.errorCount,
  };
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: { variants: { orderBy: { label: "asc" } } },
  });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  const metric = (campaign.abWinnerMetric || "reply_rate") as WinnerMetric;
  const inputs: VariantInput[] = campaign.variants.map(toVariantInput);
  const stats = computeVariantStats(inputs, metric, campaign.abConfidence || 95);

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      abTestEnabled: campaign.abTestEnabled,
      abAutoPickWinner: campaign.abAutoPickWinner,
      abMinSampleSize: campaign.abMinSampleSize,
      abConfidence: campaign.abConfidence,
      abWinnerMetric: campaign.abWinnerMetric,
      abWinnerVariantId: campaign.abWinnerVariantId,
      abWinnerPickedAt: campaign.abWinnerPickedAt,
    },
    variants: campaign.variants.map((v: any) => ({
      id: v.id,
      label: v.label,
      name: v.name,
      angle: v.angle,
      subjectTemplate: v.subjectTemplate,
      bodyTemplate: v.bodyTemplate,
      tone: v.tone,
      weight: v.weight,
      active: v.active,
      isControl: v.isControl,
      isWinner: v.isWinner,
      sentCount: v.sentCount,
      openedCount: v.openedCount,
      clickedCount: v.clickedCount,
      repliedCount: v.repliedCount,
      hotRepliedCount: v.hotRepliedCount,
      errorCount: v.errorCount,
      createdAt: v.createdAt,
    })),
    stats,
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: { variants: true },
  });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  if (campaign.variants.length >= 4) {
    return NextResponse.json({ error: "Max 4 variants per campaign" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const usedLabels = new Set(campaign.variants.map((v: any) => v.label));
  const nextLabel = ["A", "B", "C", "D"].find(l => !usedLabels.has(l)) || "X";

  const variant = await prisma.campaignVariant.create({
    data: {
      campaignId: campaign.id,
      userId: user.id,
      label: (body.label || nextLabel).slice(0, 2),
      name: (body.name || `Variant ${nextLabel}`).slice(0, 60),
      angle: (body.angle || "").slice(0, 240),
      subjectTemplate: (body.subjectTemplate || "Quick note for {{firstName}}").slice(0, 240),
      bodyTemplate: (body.bodyTemplate || "Hi {{firstName}},\n\n— Sent via Aether").slice(0, 3000),
      tone: ["professional", "casual", "bold", "warm"].includes(body.tone) ? body.tone : "professional",
      weight: typeof body.weight === "number" ? Math.max(1, Math.min(100, body.weight)) : 50,
      isControl: campaign.variants.length === 0,   // first variant becomes control
      active: true,
    },
  });

  return NextResponse.json({ variant });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.abTestEnabled === "boolean")    data.abTestEnabled = body.abTestEnabled;
  if (typeof body.abAutoPickWinner === "boolean") data.abAutoPickWinner = body.abAutoPickWinner;
  if (typeof body.abMinSampleSize === "number")
    data.abMinSampleSize = Math.max(5, Math.min(500, Math.round(body.abMinSampleSize)));
  if (typeof body.abConfidence === "number" && [90, 95, 99].includes(body.abConfidence))
    data.abConfidence = body.abConfidence;
  if (typeof body.abWinnerMetric === "string" && VALID_METRICS.includes(body.abWinnerMetric as WinnerMetric))
    data.abWinnerMetric = body.abWinnerMetric;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  const updated = await prisma.campaign.update({ where: { id }, data });
  return NextResponse.json({
    abTestEnabled: updated.abTestEnabled,
    abAutoPickWinner: updated.abAutoPickWinner,
    abMinSampleSize: updated.abMinSampleSize,
    abConfidence: updated.abConfidence,
    abWinnerMetric: updated.abWinnerMetric,
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({ where: { id, userId: user.id } });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  await prisma.campaignVariant.deleteMany({ where: { campaignId: id } });
  await prisma.campaign.update({
    where: { id },
    data: { abWinnerVariantId: null, abWinnerPickedAt: null },
  });
  return NextResponse.json({ success: true });
}
