import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { runAgent } from "@/lib/ai";

export const maxDuration = 300;
export const runtime = "nodejs";

function nextRunDate(cron: string): Date {
  const now = new Date();
  switch (cron) {
    case "every2days": return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    case "weekly":     return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:           return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET env var not configured" }, { status: 500 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const agents = await prisma.agent.findMany({
    where: { scheduleEnabled: true, scheduleNextRun: { lte: now } },
    include: { user: true },
  });

  const results = [];

  for (const agent of agents) {
    const user = agent.user;
    const planKey = toPlanKey(user.plan);

    if (planKey === "FREE") {
      await prisma.agent.update({ where: { id: agent.id }, data: { scheduleEnabled: false } });
      results.push({ agentId: agent.id, skipped: "free_plan" });
      continue;
    }

    const effectiveLimit = PLAN_LIMITS[planKey].monthlyRuns + (user.referralBonusRuns ?? 0);
    if (user.runsUsedThisPeriod >= effectiveLimit) {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { scheduleNextRun: nextRunDate(agent.scheduleCron ?? "daily") },
      });
      results.push({ agentId: agent.id, skipped: "run_limit_reached" });
      continue;
    }

    const input = agent.scheduleInput?.trim() || "Run your scheduled task.";
    const run = await prisma.run.create({
      data: { agentId: agent.id, userId: user.id, input, status: "running", triggeredBy: "cron" },
    });

    try {
      const { output, tokensIn, tokensOut, costCents } = await runAgent({
        systemPrompt: agent.systemPrompt,
        knowledge: agent.knowledge,
        input,
        model: agent.model,
        temperature: agent.temperature,
        memoryContext: agent.memoryContext || "",
        memoryEnabled: agent.memoryEnabled || false,
      });

      await prisma.run.update({
        where: { id: run.id },
        data: { output, tokensIn, tokensOut, costCents, status: "success", finishedAt: new Date() },
      });
      await prisma.user.update({ where: { id: user.id }, data: { runsUsedThisPeriod: { increment: 1 } } });
      results.push({ agentId: agent.id, runId: run.id, status: "success" });
    } catch (e: any) {
      await prisma.run.update({
        where: { id: run.id },
        data: { status: "error", error: String(e?.message ?? e), finishedAt: new Date() },
      });
      results.push({ agentId: agent.id, runId: run.id, status: "error", error: e?.message });
    }

    await prisma.agent.update({
      where: { id: agent.id },
      data: { scheduleNextRun: nextRunDate(agent.scheduleCron ?? "daily") },
    });
  }

  return NextResponse.json({ processed: agents.length, results });
}
