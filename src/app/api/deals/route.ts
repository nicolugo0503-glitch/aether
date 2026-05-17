// GET  /api/deals          → list deals (?stage=, ?q=, ?limit=)
// POST /api/deals          → create a new deal manually
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGES, STAGE_PROBABILITY, logEvent, type Stage } from "@/lib/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const stageParam = sp.get("stage");
  const q = sp.get("q")?.trim();
  const limit = Math.min(parseInt(sp.get("limit") || "500", 10) || 500, 1000);

  const where: any = { userId: user.id };
  if (stageParam && STAGES.includes(stageParam as Stage)) where.stage = stageParam;
  if (q) {
    where.OR = [
      { leadEmail: { contains: q, mode: "insensitive" } },
      { leadName: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
    ];
  }

  const deals = await prisma.deal.findMany({
    where,
    orderBy: [{ stage: "asc" }, { positionRank: "asc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return NextResponse.json(deals);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = await req.json();
    const leadEmail = String(body.leadEmail || "").trim().toLowerCase();
    if (!leadEmail || !leadEmail.includes("@")) {
      return NextResponse.json({ error: "valid leadEmail required" }, { status: 400 });
    }

    const stage = (STAGES.includes(body.stage) ? body.stage : "NEW") as Stage;
    const valueCents = Math.max(0, Math.round(Number(body.valueCents) || 0));
    const probability = body.probability != null
      ? Math.max(0, Math.min(100, Math.round(Number(body.probability))))
      : STAGE_PROBABILITY[stage];

    const deal = await prisma.deal.create({
      data: {
        userId: user.id,
        leadEmail,
        leadName: body.leadName || null,
        company: body.company || null,
        title: body.title || null,
        linkedinUrl: body.linkedinUrl || null,
        stage,
        valueCents,
        currency: body.currency || "USD",
        probability,
        expectedRevenue: Math.round((valueCents * probability) / 100),
        sourceAgentId: body.sourceAgentId || null,
        sourceCampaignId: body.sourceCampaignId || null,
        sourceRunId: body.sourceRunId || null,
        sourceType: body.sourceType || "manual",
        notes: body.notes || "",
        expectedCloseAt: body.expectedCloseAt ? new Date(body.expectedCloseAt) : null,
        eventCount: 1,
        lastEventAt: new Date(),
      },
    });

    await logEvent({
      userId: user.id,
      dealId: deal.id,
      type: "NOTE",
      title: `Deal created — ${deal.leadName || deal.leadEmail}`,
      detail: deal.notes || "",
    });

    return NextResponse.json(deal);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
