import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/ai";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { input } = await req.json().catch(() => ({ input: "" }));
  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "input required" }, { status: 400 });
  }

  if (user.runsUsedThisPeriod >= PLAN_LIMITS[toPlanKey(user.plan)].monthlyRuns) {
    return NextResponse.json({ error: "run limit reached" }, { status: 402 });
  }

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
  });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  const run = await prisma.run.create({
    data: { agentId: agent.id, userId: user.id, input, status: "running" },
  });

  try {
    const result = await runAgent({
      systemPrompt: agent.systemPrompt,
      knowledge: agent.knowledge,
      input,
      model: agent.model,
      temperature: agent.temperature,
    });
    await prisma.run.update({
      where: { id: run.id },
      data: {
        ...result,
        status: "success",
        finishedAt: new Date(),
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { runsUsedThisPeriod: { increment: 1 } },
    });
    return NextResponse.json({ runId: run.id, ...result });
  } catch (e: any) {
    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "error",
        error: String(e?.message || e),
        finishedAt: new Date(),
      },
    });
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
