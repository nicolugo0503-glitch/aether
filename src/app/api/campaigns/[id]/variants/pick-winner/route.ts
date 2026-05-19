// POST /api/campaigns/[id]/variants/pick-winner
//
// Modes:
//   1. { variantId: "..." }  → force-elect a specific variant as winner
//   2. { auto: true }        → try auto-pick using configured min sample + confidence
//   3. { reset: true }       → clear the current winner (resume the test)
//
// When a winner is set:
//   - campaign.abWinnerVariantId is set
//   - campaign.abWinnerPickedAt is stamped
//   - the chosen variant is marked isWinner=true
//   - all other variants are marked active=false so they stop receiving sends
//
// Subsequent campaign runs route 100% of leads to the winner.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pickWinner, type WinnerMetric, type VariantInput } from "@/lib/ab-testing";

type Ctx = { params: Promise<{ id: string }> };

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

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
    include: { variants: true },
  });
  if (!campaign) return NextResponse.json({ error: "campaign not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // ── Reset ──────────────────────────────────────────────────
  if (body.reset === true) {
    await prisma.$transaction([
      prisma.campaignVariant.updateMany({
        where: { campaignId: id },
        data: { isWinner: false, active: true },
      }),
      prisma.campaign.update({
        where: { id },
        data: { abWinnerVariantId: null, abWinnerPickedAt: null },
      }),
    ]);
    return NextResponse.json({ success: true, reset: true });
  }

  // ── Force-pick by ID ──────────────────────────────────────
  if (typeof body.variantId === "string") {
    const target = campaign.variants.find((v: any) => v.id === body.variantId);
    if (!target) return NextResponse.json({ error: "variant not in campaign" }, { status: 404 });

    await prisma.$transaction([
      prisma.campaignVariant.updateMany({
        where: { campaignId: id },
        data: { isWinner: false, active: false },
      }),
      prisma.campaignVariant.update({
        where: { id: target.id },
        data: { isWinner: true, active: true },
      }),
      prisma.campaign.update({
        where: { id },
        data: { abWinnerVariantId: target.id, abWinnerPickedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      winnerId: target.id,
      winnerLabel: target.label,
      reason: "Manual pick by user.",
    });
  }

  // ── Auto-pick ─────────────────────────────────────────────
  if (body.auto === true) {
    const metric = (campaign.abWinnerMetric || "reply_rate") as WinnerMetric;
    const result = pickWinner(
      campaign.variants.map(toVariantInput),
      metric,
      campaign.abMinSampleSize || 20,
      campaign.abConfidence || 95,
    );

    if (!result.winnerId) {
      return NextResponse.json({
        success: false,
        winnerId: null,
        reason: result.reason,
        stats: result.stats,
      });
    }

    const winner = campaign.variants.find((v: any) => v.id === result.winnerId)!;
    await prisma.$transaction([
      prisma.campaignVariant.updateMany({
        where: { campaignId: id },
        data: { isWinner: false, active: false },
      }),
      prisma.campaignVariant.update({
        where: { id: winner.id },
        data: { isWinner: true, active: true },
      }),
      prisma.campaign.update({
        where: { id },
        data: { abWinnerVariantId: winner.id, abWinnerPickedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      winnerId: winner.id,
      winnerLabel: winner.label,
      reason: result.reason,
      stats: result.stats,
    });
  }

  return NextResponse.json(
    { error: "Provide one of: { variantId }, { auto: true }, { reset: true }" },
    { status: 400 },
  );
}
