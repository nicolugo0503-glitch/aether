import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { executeWorkflow, parseSteps, canAffordWorkflow } from "@/lib/workflow";

// Vercel: allow up to 5 minutes for a multi-step workflow run.
export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const workflow = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
  });
  if (!workflow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const input = typeof body?.input === "string" ? body.input : "";

  const steps = parseSteps(workflow.steps);
  if (steps.length === 0) {
    return NextResponse.json({ error: "workflow has no steps" }, { status: 400 });
  }

  // Each step consumes one agent run from the monthly quota.
  const budget = canAffordWorkflow(
    user.plan,
    user.runsUsedThisPeriod,
    user.referralBonusRuns ?? 0,
    steps.length,
  );
  if (!budget.ok) {
    return NextResponse.json(
      {
        error: "run limit reached",
        message: `This workflow has ${budget.needed} steps but you only have ${budget.remaining} runs left this period.`,
      },
      { status: 402 },
    );
  }

  try {
    const { runId, result } = await executeWorkflow({
      workflowId: workflow.id,
      userId: user.id,
      steps,
      initialInput: input,
      triggeredBy: "manual",
    });

    // Charge the user one run per executed (non-skipped) step.
    const executedSteps = result.stepResults.filter(s => s.status !== "skipped").length;
    if (executedSteps > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { runsUsedThisPeriod: { increment: executedSteps } },
      });
    }

    return NextResponse.json({
      runId,
      status: result.status,
      output: result.output,
      stepResults: result.stepResults,
      totalCostCents: result.totalCostCents,
      totalTokensIn: result.totalTokensIn,
      totalTokensOut: result.totalTokensOut,
      durationMs: result.durationMs,
      error: result.error,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
