import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { runAgent } from "@/lib/ai";

// Vercel: allow up to 5 minutes for this cron job
export const maxDuration = 300;
export const runtime = "nodejs";

function nextRunDate(cron: string): Date {
  const now = new Date();
  switch (cron) {
    case "every2days": return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    case "weekly":     return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:           return new Date(now.getTime() + 24 * 60 * 60 * 1000); // daily
  }
}

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel cron.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET env var not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all agents due for a scheduled run
  const agents = await prisma.agent.findMany({
    where: {
      scheduleEnabled: true,
      scheduleNextRun: { lte: now },
    },
    include: { user: true },
  });

  const results = [];

  for (const agent of agents) {
    const user = agent.user;
    const planKey = toPlanKey(user.plan);

    // Free plan cannot use scheduled runs — disable and skip
    if (planKey === "FREE") {
      await prisma.agent.update({
        where: { id: agent.id },
        data: { scheduleEnabled: false },
      });
      results.push({ agentId: agent.id, skipped: "free_plan" });
      continue;
    }

    // Check monthly run limit
    const effectiveLimit =
      PLAN_LIMITS[planKey].monthlyRuns + (user.referralBonusRuns ?? 0);
    if (user.runsUsedThisPeriod >= effectiveLimit) {
      // Advance the next-run date so we don't hammer the DB every hour
      await prisma.agent.update({
        where: { id: agent.id },
        data: { scheduleNextRun: nextRunDate(agent.scheduleCron ?? "daily") },
      });
      results.push({ agentId: agent.id, skipped: "run_limit_reached" });
      continue;
    }

    const input = agent.scheduleInput?.trim() || "Run your scheduled task.";

    // Create run record
    const run = await prisma.run.create({
      data: {
        agentId: agent.id,
        userId: user.id,
        input,
        status: "running",
        triggeredBy: "cron",
      },
    });

    try {
      const { output, tokensIn, tokensOut, costCents } = await runAgent({
        systemPrompt: agent.systemPrompt,
        knowledge: agent.knowledge,
        input,
        model: agent.model,
        temperature: agent.temperature,
      });

      await prisma.run.update({
        where: { id: run.id },
        data: { output, tokensIn, tokensOut, costCents, status: "success", finishedAt: new Date() },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { runsUsedThisPeriod: { increment: 1 } },
      });

      results.push({ agentId: agent.id, runId: run.id, status: "success" });
    } catch (e: any) {
      await prisma.run.update({
        where: { id: run.id },
        data: {
          status: "error",
          error: String(e?.message ?? e),
          finishedAt: new Date(),
        },
      });
      results.push({ agentId: agent.id, runId: run.id, status: "error", error: e?.message });
    }

    // Advance to next scheduled run regardless of success/failure
    await prisma.agent.update({
      where: { id: agent.id },
      data: { scheduleNextRun: nextRunDate(agent.scheduleCron ?? "daily") },
    });
  }

  return NextResponse.json({ processed: agents.length, results });
}
