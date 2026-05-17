// GET    /api/deals/[id]   → deal + events timeline
// PATCH  /api/deals/[id]   → update fields / move stage / change value
// DELETE /api/deals/[id]
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGES, advanceStage, logEvent, type Stage } from "@/lib/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getDeal(userId: string, id: string) {
  return prisma.deal.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = await getDeal(user.id, id);
  if (!deal) return NextResponse.json({ error: "not found" }, { status: 404 });

  const events = await prisma.attributionEvent.findMany({
    where: { dealId: id, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const [agent, campaign, reply] = await Promise.all([
    deal.sourceAgentId
      ? prisma.agent.findUnique({ where: { id: deal.sourceAgentId }, select: { id: true, name: true, role: true } }).catch(() => null)
      : null,
    deal.sourceCampaignId
      ? prisma.campaign.findUnique({ where: { id: deal.sourceCampaignId }, select: { id: true, name: true } }).catch(() => null)
      : null,
    deal.sourceReplyId
      ? prisma.emailReply.findUnique({
          where: { id: deal.sourceReplyId },
          select: { id: true, subject: true, summary: true, intent: true, score: true },
        }).catch(() => null)
      : null,
  ]);

  return NextResponse.json({ deal, events, agent, campaign, reply });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    const deal = await getDeal(user.id, id);
    if (!deal) return NextResponse.json({ error: "not found" }, { status: 404 });

    const body = await req.json();

    if (body.stage && body.stage !== deal.stage) {
      if (!STAGES.includes(body.stage as Stage)) {
        return NextResponse.json({ error: "invalid stage" }, { status: 400 });
      }
      await advanceStage({
        userId: user.id, dealId: id,
        newStage: body.stage as Stage,
        closeReason: body.closeReason,
      });
    }

    const data: Record<string, unknown> = {};
    if (body.leadName !== undefined) data.leadName = body.leadName || null;
    if (body.company !== undefined) data.company = body.company || null;
    if (body.title !== undefined) data.title = body.title || null;
    if (body.linkedinUrl !== undefined) data.linkedinUrl = body.linkedinUrl || null;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.expectedCloseAt !== undefined) {
      data.expectedCloseAt = body.expectedCloseAt ? new Date(body.expectedCloseAt) : null;
    }
    if (body.positionRank !== undefined) data.positionRank = Math.round(Number(body.positionRank));

    let valueChanged = false;
    if (body.valueCents !== undefined) {
      const v = Math.max(0, Math.round(Number(body.valueCents) || 0));
      if (v !== deal.valueCents) { data.valueCents = v; valueChanged = true; }
    }
    if (body.probability !== undefined) {
      const p = Math.max(0, Math.min(100, Math.round(Number(body.probability))));
      data.probability = p;
      valueChanged = true;
    }
    if (valueChanged) {
      const v = (data.valueCents as number | undefined) ?? deal.valueCents;
      const p = (data.probability as number | undefined) ?? deal.probability;
      data.expectedRevenue = Math.round((v * p) / 100);
    }

    if (Object.keys(data).length) {
      await prisma.deal.update({ where: { id }, data });
      if (valueChanged) {
        await logEvent({
          userId: user.id, dealId: id, type: "VALUE_CHANGED",
          title: `Value updated`,
          detail: `valueCents=${data.valueCents ?? deal.valueCents}, probability=${data.probability ?? deal.probability}`,
        });
      }
    }

    const fresh = await getDeal(user.id, id);
    return NextResponse.json(fresh);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.deal.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
