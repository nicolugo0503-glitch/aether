// PATCH  /api/campaigns/[id]/variants/[variantId]   → update a single variant
// DELETE /api/campaigns/[id]/variants/[variantId]   → delete a single variant

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string; variantId: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, variantId } = await ctx.params;

  const variant = await prisma.campaignVariant.findFirst({
    where: { id: variantId, campaignId: id, userId: user.id },
  });
  if (!variant) return NextResponse.json({ error: "variant not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string")            data.name = body.name.slice(0, 60);
  if (typeof body.angle === "string")           data.angle = body.angle.slice(0, 240);
  if (typeof body.subjectTemplate === "string") data.subjectTemplate = body.subjectTemplate.slice(0, 240);
  if (typeof body.bodyTemplate === "string")    data.bodyTemplate = body.bodyTemplate.slice(0, 3000);
  if (typeof body.tone === "string" && ["professional", "casual", "bold", "warm"].includes(body.tone))
    data.tone = body.tone;
  if (typeof body.weight === "number")          data.weight = Math.max(1, Math.min(100, Math.round(body.weight)));
  if (typeof body.active === "boolean")         data.active = body.active;
  if (typeof body.isControl === "boolean")      data.isControl = body.isControl;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no valid fields" }, { status: 400 });
  }

  // If setting isControl=true, clear other variants' control flag.
  if (data.isControl === true) {
    await prisma.campaignVariant.updateMany({
      where: { campaignId: id, id: { not: variantId } },
      data: { isControl: false },
    });
  }

  const updated = await prisma.campaignVariant.update({
    where: { id: variantId },
    data,
  });

  return NextResponse.json({ variant: updated });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, variantId } = await ctx.params;

  const variant = await prisma.campaignVariant.findFirst({
    where: { id: variantId, campaignId: id, userId: user.id },
  });
  if (!variant) return NextResponse.json({ error: "variant not found" }, { status: 404 });

  await prisma.campaignVariant.delete({ where: { id: variantId } });

  // If we just removed the winner or the control, clear winner pointer.
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (campaign?.abWinnerVariantId === variantId) {
    await prisma.campaign.update({
      where: { id },
      data: { abWinnerVariantId: null, abWinnerPickedAt: null },
    });
  }

  // If we removed the only control, promote whatever's left to control.
  if (variant.isControl) {
    const remaining = await prisma.campaignVariant.findFirst({
      where: { campaignId: id },
      orderBy: { label: "asc" },
    });
    if (remaining) {
      await prisma.campaignVariant.update({
        where: { id: remaining.id },
        data: { isControl: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
