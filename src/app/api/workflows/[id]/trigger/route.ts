import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { executeWorkflow, parseSteps, canAffordWorkflow } from "@/lib/workflow";

// Public webhook trigger — authenticated via per-workflow webhook token.
// POST /api/workflows/{id}/trigger
// Header: Authorization: Bearer whk_...
// Body:   { "input": "..." }
//
// Designed so external tools (Zapier, n8n, custom scripts) can fire a
// workflow without going through the Aether dashboard.

export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json(
      { error: "missing bearer token" },
      { status: 401 },
    );
  }

  const workflow = await prisma.workflow.findFirst({
    where: { id, webhookToken: token, trigger: "webhook" },
    include: { user: true },
  });
  if (!workflow) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (workflow.status === "archived") {
    return NextResponse.json({ error: "workflow is archived" }, { status: 409 });
  }

  const user = workflow.user;
  const body = await req.json().catch(() => ({}));
  const input = typeof body?.input === "string" ? body.input : "";

  const steps = parseSteps(workflow.steps);
  if (steps.length === 0) {
    return NextResponse.json({ error: "workflow has no steps" }, { status: 400 });
  }

  const budget = canAffordWorkflow(
    user.plan,
    user.runsUsedThisPeriod,
    user.referralBonusRuns ?? 0,
    steps.length,
  );
  if (!budget.ok) {
    return NextResponse.json(
      { error: "run limit reached", remaining: budget.remaining, needed: budget.needed },
      { status: 402 },
    );
  }

  const { runId, result } = await executeWorkflow({
    workflowId: workflow.id,
    userId: user.id,
    steps,
    initialInput: input,
    triggeredBy: "webhook",
  });

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
    totalCostCents: result.totalCostCents,
    durationMs: result.durationMs,
  });
}
