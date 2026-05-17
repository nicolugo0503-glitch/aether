import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { STAGES, STAGE_LABELS, STAGE_COLORS } from "@/lib/attribution";
import DealDetailClient from "./detail-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deal | Aether" };

export default async function DealDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const deal = await prisma.deal.findFirst({ where: { id, userId: user.id } });
  if (!deal) notFound();

  const [events, agent, campaign, reply] = await Promise.all([
    prisma.attributionEvent.findMany({
      where: { dealId: id, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    deal.sourceAgentId
      ? prisma.agent.findUnique({ where: { id: deal.sourceAgentId }, select: { id: true, name: true, role: true } })
      : null,
    deal.sourceCampaignId
      ? prisma.campaign.findUnique({ where: { id: deal.sourceCampaignId }, select: { id: true, name: true } })
      : null,
    deal.sourceReplyId
      ? prisma.emailReply.findUnique({
          where: { id: deal.sourceReplyId },
          select: { id: true, subject: true, summary: true, intent: true, score: true },
        }).catch(() => null)
      : null,
  ]);

  return (
    <DealDetailClient
      deal={{
        ...deal,
        createdAt: deal.createdAt.toISOString(),
        updatedAt: deal.updatedAt.toISOString(),
        closedAt: deal.closedAt?.toISOString() || null,
        lastEventAt: deal.lastEventAt?.toISOString() || null,
        expectedCloseAt: deal.expectedCloseAt?.toISOString() || null,
        contactedAt: deal.contactedAt?.toISOString() || null,
        qualifiedAt: deal.qualifiedAt?.toISOString() || null,
        demoBookedAt: deal.demoBookedAt?.toISOString() || null,
        proposalAt: deal.proposalAt?.toISOString() || null,
      }}
      events={events.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
      agent={agent}
      campaign={campaign}
      reply={reply}
      stages={STAGES as unknown as string[]}
      stageLabels={STAGE_LABELS}
      stageColors={STAGE_COLORS}
    />
  );
}
