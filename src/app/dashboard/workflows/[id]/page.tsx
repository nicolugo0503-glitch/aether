import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseSteps } from "@/lib/workflow";
import { WorkflowEditor } from "../_components/workflow-editor";

export const dynamic = "force-dynamic";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { id } = await params;

  const workflow = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
  });
  if (!workflow) notFound();

  const [agents, recentRuns] = await Promise.all([
    prisma.agent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, role: true, model: true },
    }),
    prisma.workflowRun.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        input: true,
        output: true,
        totalCostCents: true,
        totalTokensIn: true,
        totalTokensOut: true,
        durationMs: true,
        triggeredBy: true,
        createdAt: true,
        finishedAt: true,
        stepResults: true,
      },
    }),
  ]);

  const steps = parseSteps(workflow.steps);

  return (
    <div className="max-w-7xl mx-auto">
      <WorkflowEditor
        workflowId={workflow.id}
        initial={{
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          trigger: workflow.trigger,
          steps,
          scheduleEnabled: workflow.scheduleEnabled,
          scheduleCron: workflow.scheduleCron,
          scheduleInput: workflow.scheduleInput,
          webhookToken: workflow.webhookToken,
          totalRuns: workflow.totalRuns,
          successfulRuns: workflow.successfulRuns,
          totalCostCents: workflow.totalCostCents,
        }}
        agents={agents}
        recentRuns={recentRuns.map(r => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
          finishedAt: r.finishedAt ? r.finishedAt.toISOString() : null,
        }))}
      />
    </div>
  );
}
