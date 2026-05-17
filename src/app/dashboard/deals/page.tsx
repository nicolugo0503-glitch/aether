import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  pipelineStats, attributionByAgent,
  STAGES, STAGE_LABELS, STAGE_COLORS,
  type Stage,
} from "@/lib/attribution";
import DealsClient from "./deals-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revenue Pipeline | Aether" };

export default async function DealsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [deals, stats, agents, agentsList] = await Promise.all([
    prisma.deal.findMany({
      where: { userId: user.id },
      orderBy: [{ stage: "asc" }, { positionRank: "asc" }, { updatedAt: "desc" }],
      take: 1000,
    }),
    pipelineStats(user.id),
    attributionByAgent(user.id),
    prisma.agent.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, role: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <DealsClient
      initialDeals={deals.map((d) => ({
        ...d,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        closedAt: d.closedAt?.toISOString() || null,
        lastEventAt: d.lastEventAt?.toISOString() || null,
        expectedCloseAt: d.expectedCloseAt?.toISOString() || null,
      }))}
      initialStats={stats}
      initialAgents={agents}
      agentsList={agentsList}
      stages={STAGES as unknown as Stage[]}
      stageLabels={STAGE_LABELS}
      stageColors={STAGE_COLORS}
    />
  );
}
