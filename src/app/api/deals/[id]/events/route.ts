// POST /api/deals/[id]/events  → add a manual note / event to a deal
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logEvent, type EventType } from "@/lib/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED: EventType[] = [
  "EMAIL_SENT", "EMAIL_OPENED", "EMAIL_CLICKED", "EMAIL_REPLIED",
  "DEMO_BOOKED", "DEMO_HELD", "PROPOSAL_SENT", "NOTE",
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id } = await params;
    const deal = await prisma.deal.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!deal) return NextResponse.json({ error: "deal not found" }, { status: 404 });

    const body = await req.json();
    const type = (ALLOWED.includes(body.type) ? body.type : "NOTE") as EventType;
    const title = String(body.title || "").slice(0, 240).trim() || "Note added";
    const detail = String(body.detail || "");
    const valueCents = Math.max(0, Math.round(Number(body.valueCents) || 0));

    const ev = await logEvent({
      userId: user.id, dealId: id, type, title, detail, valueCents,
    });
    return NextResponse.json(ev);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
