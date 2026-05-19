// POST /api/campaigns/[id]/variants/generate
//
// Body: { basePrompt: string, numVariants?: 2|3|4, audience?: string, replaceExisting?: boolean }
//
// Uses GPT-4o-mini to produce 2-4 genuinely different email variants
// (different angle, hook, tone) from a single user prompt, then
// persists them as CampaignVariant rows. The first variant is
// marked isControl. By default, this replaces any existing variants
// for the campaign — pass replaceExisting=false to append.

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateVariants } from "@/lib/ab-testing";

type Ctx = { params: Promise<{ id: string }> };

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
  const basePrompt = (body.basePrompt || "").toString().trim();
  if (!basePrompt) {
    return NextResponse.json({ error: "basePrompt is required" }, { status: 400 });
  }

  const numVariants = Math.min(4, Math.max(2, Number(body.numVariants) || 2));
  const audience = (body.audience || "").toString().slice(0, 500);
  const replaceExisting = body.replaceExisting !== false; // default true

  const agent = await prisma.agent.findFirst({
    where: { id: campaign.agentId, userId: user.id },
    select: { name: true, role: true, description: true },
  });

  let generation;
  try {
    generation = await generateVariants({
      basePrompt,
      productName: "Aether",
      numVariants,
      audience: audience || (agent?.description || ""),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "AI generation failed: " + (err.message || "unknown") },
      { status: 502 },
    );
  }

  // Persist
  await prisma.$transaction(async (tx: any) => {
    if (replaceExisting) {
      await tx.campaignVariant.deleteMany({ where: { campaignId: campaign.id } });
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { abWinnerVariantId: null, abWinnerPickedAt: null },
      });
    }

    const startingIdx = replaceExisting ? 0 : campaign.variants.length;
    const labels = ["A", "B", "C", "D"];

    for (let i = 0; i < generation.variants.length; i++) {
      const v = generation.variants[i];
      const label = labels[startingIdx + i] || v.label;
      await tx.campaignVariant.create({
        data: {
          campaignId: campaign.id,
          userId: user.id,
          label,
          name: v.name,
          angle: v.angle,
          subjectTemplate: v.subjectTemplate,
          bodyTemplate: v.bodyTemplate,
          tone: v.tone,
          weight: Math.floor(100 / generation.variants.length),
          isControl: startingIdx + i === 0,
          active: true,
        },
      });
    }

    // Auto-enable A/B testing the first time variants are generated.
    if (!campaign.abTestEnabled) {
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { abTestEnabled: true },
      });
    }
  });

  const variants = await prisma.campaignVariant.findMany({
    where: { campaignId: campaign.id },
    orderBy: { label: "asc" },
  });

  return NextResponse.json({
    success: true,
    variants,
    cost: { tokensIn: generation.tokensIn, tokensOut: generation.tokensOut, costCents: generation.costCents },
  });
}
