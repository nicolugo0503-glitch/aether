/**
 * POST /api/deals/webhook
 *
 * Inbound webhook for marking deals won/lost or logging external events
 * (Calendly demo booked, Stripe payment succeeded, Zapier custom).
 *
 * Auth: Authorization: Bearer <user.attributionWebhookToken>
 *        OR ?token=<...>
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  STAGES, advanceStage, createDealFromReply, logEvent, verifyWebhookToken,
  type Stage, type EventType,
} from "@/lib/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STAGE_FOR_EVENT: Partial<Record<EventType, Stage>> = {
  DEMO_BOOKED: "DEMO",
  PROPOSAL_SENT: "PROPOSAL",
  DEAL_WON: "WON",
  DEAL_LOST: "LOST",
};

export async function POST(req: NextRequest) {
  const user = await verifyWebhookToken(req);
  if (!user) {
    return NextResponse.json({ error: "invalid attribution webhook token" }, { status: 401 });
  }

  let body: any = {};
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid JSON body" }, { status: 400 }); }

  // Stripe-style auto-detect
  if (!body.event && body.type && typeof body.type === "string") {
    if (body.type.includes("checkout.session.completed") || body.type.includes("invoice.paid")) {
      body.event = "DEAL_WON";
      const data = body.data?.object || {};
      body.leadEmail = body.leadEmail || data.customer_email || data.customer_details?.email;
      body.valueCents = body.valueCents ?? data.amount_total ?? data.amount_paid;
      body.currency = body.currency || data.currency?.toUpperCase();
      body.source = body.source || "stripe";
    }
  }

  // Calendly-style auto-detect
  if (!body.event && body.event_type && typeof body.event_type === "string") {
    if (body.event_type === "invitee.created") {
      body.event = "DEMO_BOOKED";
      const payload = body.payload || {};
      body.leadEmail = body.leadEmail || payload.email;
      body.leadName = body.leadName || payload.name;
      body.source = body.source || "calendly";
    }
  }

  const eventType = (body.event as EventType) || "NOTE";
  const leadEmail = (body.leadEmail || "").toString().toLowerCase().trim();
  const explicitDealId: string | undefined = body.dealId;

  if (!explicitDealId && !leadEmail) {
    return NextResponse.json({ error: "either dealId or leadEmail is required" }, { status: 400 });
  }

  let deal = explicitDealId
    ? await prisma.deal.findFirst({ where: { id: explicitDealId, userId: user.id } })
    : await prisma.deal.findFirst({
        where: { userId: user.id, leadEmail, stage: { notIn: ["WON", "LOST"] } },
        orderBy: { updatedAt: "desc" },
      });

  if (!deal && leadEmail) {
    const created = await createDealFromReply({
      userId: user.id,
      replyId: "webhook",
      fromEmail: leadEmail,
      fromName: body.leadName || null,
      subject: body.title || null,
      summary: body.detail || `Auto-created from ${body.source || "webhook"} event`,
      estimatedValueCents: Math.max(0, Math.round(Number(body.valueCents) || 0)),
    });
    deal = await prisma.deal.findUnique({ where: { id: created.dealId } });
  }
  if (!deal) return NextResponse.json({ error: "could not resolve deal" }, { status: 404 });

  if (body.valueCents != null) {
    const v = Math.max(0, Math.round(Number(body.valueCents) || 0));
    if (v > 0 && v !== deal.valueCents) {
      const p = deal.probability;
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          valueCents: v,
          currency: body.currency || deal.currency,
          expectedRevenue: Math.round((v * p) / 100),
        },
      });
    }
  }

  const targetStage = STAGE_FOR_EVENT[eventType];
  if (targetStage && targetStage !== deal.stage && STAGES.includes(targetStage)) {
    await advanceStage({
      userId: user.id, dealId: deal.id,
      newStage: targetStage,
      closeReason: body.detail || undefined,
    });
  }

  await logEvent({
    userId: user.id,
    dealId: deal.id,
    type: eventType,
    title: body.title || `${eventType} via ${body.source || "webhook"}`,
    detail: typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail ?? {}),
    valueCents: Math.max(0, Math.round(Number(body.valueCents) || 0)),
    source: body.source || "custom",
    metadata: { raw: body },
  });

  return NextResponse.json({ success: true, dealId: deal.id, stage: targetStage || deal.stage });
}
