import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  executeWorkflow,
  parseSteps,
  canAffordWorkflow,
  nextScheduledRunDate,
} from "@/lib/workflow";
import { toPlanKey } from "@/lib/stripe";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET env var not configured" },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueWorkflows = await prisma.workflow.findMany({
    where: {
      status: "active",
      scheduleEnabled: true,
      scheduleNextRun: { lte: now },
    },
    include: { user: true },
  });

  const results: Array<Record<string, unknown>> = [];

  for (const workflow of dueWorkflows) {
    const user = workflow.user;
    const planKey = toPlanKey(user.plan);

    if (planKey === "FREE") {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { scheduleEnabled: false },
      });
      results.push({ workflowId: workflow.id, skipped: "free_plan" });
      continue;
    }

    const steps = parseSteps(workflow.steps);
    if (steps.length === 0) {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { scheduleNextRun: nextScheduledRunDate(workflow.scheduleCron) },
      });
      results.push({ workflowId: workflow.id, skipped: "no_steps" });
      continue;
    }

    const budget = canAffordWorkflow(
      user.plan,
      user.runsUsedThisPeriod,
      user.referralBonusRuns ?? 0,
      steps.length,
    );
    if (!budget.ok) {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { scheduleNextRun: nextScheduledRunDate(workflow.scheduleCron) },
      });
      results.push({ workflowId: workflow.id, skipped: "run_limit" });
      continue;
    }

    try {
      const { result } = await executeWorkflow({
        workflowId: workflow.id,
        userId: user.id,
        steps,
        initialInput: workflow.scheduleInput || "",
        triggeredBy: "cron",
      });

      const executedSteps = result.stepResults.filter(s => s.status !== "skipped").length;
      if (executedSteps > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: { runsUsedThisPeriod: { increment: executedSteps } },
        });
      }

      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { scheduleNextRun: nextScheduledRunDate(workflow.scheduleCron) },
      });

      results.push({
        workflowId: workflow.id,
        status: result.status,
        steps: result.stepResults.length,
      });
    } catch (e: unknown) {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { scheduleNextRun: nextScheduledRunDate(workflow.scheduleCron) },
      });
      results.push({
        workflowId: workflow.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
