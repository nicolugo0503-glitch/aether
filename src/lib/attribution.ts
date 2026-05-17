// ─────────────────────────────────────────────────────────────────────
// Revenue Attribution Engine
//
// Connects every meaningful AI action (campaigns sent, replies detected,
// posts published, workflow steps) to a `Deal` in the sales pipeline so
// users can see actual $ ROI per AI employee.
// ─────────────────────────────────────────────────────────────────────

import crypto from "crypto";
import type { NextRequest } from "next/server";
import { prisma } from "./db";

export const STAGES = [
  "NEW", "CONTACTED", "QUALIFIED", "DEMO", "PROPOSAL", "WON", "LOST",
] as const;
export type Stage = (typeof STAGES)[number];

export const OPEN_STAGES: Stage[] = ["NEW", "CONTACTED", "QUALIFIED", "DEMO", "PROPOSAL"];
export const CLOSED_STAGES: Stage[] = ["WON", "LOST"];

export const STAGE_LABELS: Record<Stage, string> = {
  NEW: "New", CONTACTED: "Contacted", QUALIFIED: "Qualified",
  DEMO: "Demo", PROPOSAL: "Proposal", WON: "Won", LOST: "Lost",
};

export const STAGE_COLORS: Record<Stage, string> = {
  NEW: "#64748b", CONTACTED: "#6366f1", QUALIFIED: "#7c3aed",
  DEMO: "#f59e0b", PROPOSAL: "#06b6d4", WON: "#10b981", LOST: "#ef4444",
};

export const STAGE_PROBABILITY: Record<Stage, number> = {
  NEW: 5, CONTACTED: 15, QUALIFIED: 35, DEMO: 55,
  PROPOSAL: 75, WON: 100, LOST: 0,
};

export type EventType =
  | "EMAIL_SENT" | "EMAIL_OPENED" | "EMAIL_CLICKED" | "EMAIL_REPLIED"
  | "DEMO_BOOKED" | "DEMO_HELD" | "PROPOSAL_SENT"
  | "DEAL_WON" | "DEAL_LOST"
  | "AGENT_RUN" | "SOCIAL_POST_PUBLISHED" | "COMPETITOR_ALERT"
  | "NOTE" | "STAGE_CHANGED" | "VALUE_CHANGED" | "WEBHOOK";

export interface LogEventParams {
  userId: string;
  dealId?: string | null;
  type: EventType;
  title: string;
  detail?: string;
  agentId?: string | null;
  runId?: string | null;
  campaignId?: string | null;
  replyId?: string | null;
  workflowRunId?: string | null;
  valueCents?: number;
  source?: "internal" | "calendly" | "stripe" | "zapier" | "custom";
  metadata?: Record<string, unknown>;
}

export async function logEvent(p: LogEventParams) {
  try {
    const ev = await prisma.attributionEvent.create({
      data: {
        userId: p.userId,
        dealId: p.dealId ?? null,
        type: p.type,
        title: p.title.slice(0, 240),
        detail: (p.detail ?? "").slice(0, 4000),
        agentId: p.agentId ?? null,
        runId: p.runId ?? null,
        campaignId: p.campaignId ?? null,
        replyId: p.replyId ?? null,
        workflowRunId: p.workflowRunId ?? null,
        valueCents: p.valueCents ?? 0,
        source: p.source ?? "internal",
        metadata: JSON.stringify(p.metadata ?? {}),
      },
    });

    if (p.dealId) {
      await prisma.deal.update({
        where: { id: p.dealId },
        data: { eventCount: { increment: 1 }, lastEventAt: new Date() },
      }).catch(() => null);
    }
    return ev;
  } catch (err) {
    console.error("[attribution] logEvent failed:", err);
    return null;
  }
}

export interface CreateDealFromReplyParams {
  userId: string;
  replyId: string;
  fromEmail: string;
  fromName?: string | null;
  subject?: string | null;
  summary?: string;
  campaignId?: string | null;
  estimatedValueCents?: number;
}

export async function createDealFromReply(p: CreateDealFromReplyParams) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const existing = await prisma.deal.findFirst({
    where: {
      userId: p.userId,
      leadEmail: p.fromEmail,
      stage: { in: OPEN_STAGES as unknown as string[] },
      createdAt: { gte: ninetyDaysAgo },
    },
    select: { id: true },
  });

  if (existing) {
    await logEvent({
      userId: p.userId,
      dealId: existing.id,
      type: "EMAIL_REPLIED",
      title: `HOT reply from ${p.fromName || p.fromEmail}`,
      detail: p.summary || "",
      replyId: p.replyId,
      campaignId: p.campaignId ?? null,
    });
    return { dealId: existing.id, created: false };
  }

  let agentId: string | null = null;
  if (p.campaignId) {
    const c = await prisma.campaign
      .findUnique({ where: { id: p.campaignId }, select: { agentId: true } })
      .catch(() => null);
    agentId = c?.agentId ?? null;
  }

  const valueCents = p.estimatedValueCents ?? 0;
  const probability = STAGE_PROBABILITY.QUALIFIED;

  const deal = await prisma.deal.create({
    data: {
      userId: p.userId,
      leadEmail: p.fromEmail,
      leadName: p.fromName || null,
      stage: "QUALIFIED",
      valueCents,
      probability,
      expectedRevenue: Math.round((valueCents * probability) / 100),
      sourceType: "hot_reply",
      sourceReplyId: p.replyId,
      sourceCampaignId: p.campaignId ?? null,
      sourceAgentId: agentId,
      qualifiedAt: new Date(),
      notes: p.summary ? `Auto-created from HOT reply.\n\n${p.summary}` : "Auto-created from HOT reply.",
      eventCount: 1,
      lastEventAt: new Date(),
    },
  });

  await logEvent({
    userId: p.userId,
    dealId: deal.id,
    type: "EMAIL_REPLIED",
    title: `HOT reply from ${p.fromName || p.fromEmail}`,
    detail: [`Subject: ${p.subject || "(no subject)"}`, p.summary ? `\nAI summary: ${p.summary}` : ""].join(""),
    replyId: p.replyId,
    campaignId: p.campaignId ?? null,
    agentId,
  });

  return { dealId: deal.id, created: true };
}

export async function advanceStage(opts: {
  userId: string; dealId: string; newStage: Stage; closeReason?: string;
}) {
  const deal = await prisma.deal.findFirst({ where: { id: opts.dealId, userId: opts.userId } });
  if (!deal) throw new Error("Deal not found");

  const now = new Date();
  const update: Record<string, unknown> = {
    stage: opts.newStage,
    probability: STAGE_PROBABILITY[opts.newStage],
    expectedRevenue: Math.round((deal.valueCents * STAGE_PROBABILITY[opts.newStage]) / 100),
    daysInStage: 0,
  };

  if (opts.newStage === "CONTACTED" && !deal.contactedAt) update.contactedAt = now;
  if (opts.newStage === "QUALIFIED" && !deal.qualifiedAt) update.qualifiedAt = now;
  if (opts.newStage === "DEMO" && !deal.demoBookedAt) update.demoBookedAt = now;
  if (opts.newStage === "PROPOSAL" && !deal.proposalAt) update.proposalAt = now;
  if (opts.newStage === "WON" || opts.newStage === "LOST") {
    update.closedAt = now;
    if (opts.closeReason) update.closeReason = opts.closeReason;
  }

  const updated = await prisma.deal.update({ where: { id: opts.dealId }, data: update });

  await logEvent({
    userId: opts.userId,
    dealId: opts.dealId,
    type: opts.newStage === "WON" ? "DEAL_WON" : opts.newStage === "LOST" ? "DEAL_LOST" : "STAGE_CHANGED",
    title: `Stage: ${deal.stage} → ${opts.newStage}`,
    detail: opts.closeReason || "",
    valueCents: opts.newStage === "WON" ? deal.valueCents : 0,
  });

  return updated;
}

export async function pipelineStats(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { userId },
    select: { stage: true, valueCents: true, expectedRevenue: true, closedAt: true, sourceType: true },
  });

  const byStage: Record<string, { count: number; valueCents: number }> = {};
  for (const s of STAGES) byStage[s] = { count: 0, valueCents: 0 };

  let openPipelineCents = 0, forecastCents = 0;
  let wonCents = 0, lostCents = 0, wonCount = 0, lostCount = 0;
  let aiSourcedCount = 0, aiSourcedRevenueCents = 0;

  for (const d of deals) {
    byStage[d.stage] ||= { count: 0, valueCents: 0 };
    byStage[d.stage].count += 1;
    byStage[d.stage].valueCents += d.valueCents;
    if (OPEN_STAGES.includes(d.stage as Stage)) {
      openPipelineCents += d.valueCents;
      forecastCents += d.expectedRevenue;
    }
    if (d.stage === "WON") { wonCents += d.valueCents; wonCount += 1; }
    if (d.stage === "LOST") { lostCents += d.valueCents; lostCount += 1; }
    if (d.sourceType !== "manual") {
      aiSourcedCount += 1;
      if (d.stage === "WON") aiSourcedRevenueCents += d.valueCents;
    }
  }

  const winRate = wonCount + lostCount > 0
    ? Math.round((wonCount / (wonCount + lostCount)) * 100)
    : 0;

  return {
    total: deals.length, byStage,
    openPipelineCents, forecastCents,
    wonCents, lostCents, wonCount, lostCount, winRate,
    aiSourcedCount, aiSourcedRevenueCents,
  };
}

export async function attributionByAgent(userId: string) {
  const deals = await prisma.deal.findMany({
    where: { userId, sourceAgentId: { not: null } },
    select: { sourceAgentId: true, stage: true, valueCents: true, expectedRevenue: true },
  });

  const acc: Record<string, {
    agentId: string; deals: number; wonRevenueCents: number;
    openPipelineCents: number; forecastCents: number;
  }> = {};

  for (const d of deals) {
    const aid = d.sourceAgentId!;
    acc[aid] ||= { agentId: aid, deals: 0, wonRevenueCents: 0, openPipelineCents: 0, forecastCents: 0 };
    acc[aid].deals += 1;
    if (d.stage === "WON") acc[aid].wonRevenueCents += d.valueCents;
    if (OPEN_STAGES.includes(d.stage as Stage)) {
      acc[aid].openPipelineCents += d.valueCents;
      acc[aid].forecastCents += d.expectedRevenue;
    }
  }

  const agentIds = Object.keys(acc);
  if (agentIds.length === 0) return [];

  const agents = await prisma.agent.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true, role: true },
  });
  const nameMap = new Map(agents.map((a) => [a.id, a]));

  return agentIds.map((id) => ({
    ...acc[id],
    agentName: nameMap.get(id)?.name || "Unknown agent",
    agentRole: nameMap.get(id)?.role || "",
  })).sort((a, b) => b.wonRevenueCents - a.wonRevenueCents);
}

export async function verifyWebhookToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
  const tokenFromQuery = req.nextUrl.searchParams.get("token");
  const token = bearer || tokenFromQuery;
  if (!token) return null;
  return prisma.user.findFirst({
    where: { attributionWebhookToken: token },
    select: { id: true, email: true },
  });
}

export function generateWebhookToken(): string {
  return "atok_" + crypto.randomBytes(24).toString("hex");
}

export function formatMoney(cents: number, currency = "USD"): string {
  const dollars = cents / 100;
  if (Math.abs(dollars) >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (Math.abs(dollars) >= 1_000)     return `$${(dollars / 1_000).toFixed(1)}K`;
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency, maximumFractionDigits: 0,
  }).format(dollars);
}

export function stageColor(stage: string): string {
  return STAGE_COLORS[stage as Stage] || "#64748b";
}
