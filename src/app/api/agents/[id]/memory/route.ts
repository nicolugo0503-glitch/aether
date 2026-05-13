import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildMemoryContext } from "@/lib/agent-memory";

const MIN_RUNS_FOR_MEMORY = 3;
const MAX_RUNS_TO_ANALYZE = 25;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const agent = await prisma.agent.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true, name: true, memoryEnabled: true, memoryContext: true,
        memoryUpdatedAt: true, memoryRunCount: true,
        _count: { select: { runs: { where: { status: "success" } } } },
      },
    });
    if (!agent) return NextResponse.json({ error: "agent not found" }, { status: 404 });
    return NextResponse.json({
      memoryEnabled: agent.memoryEnabled,
      memoryContext: agent.memoryContext,
      memoryUpdatedAt: agent.memoryUpdatedAt,
      memoryRunCount: agent.memoryRunCount,
      totalSuccessRuns: agent._count.runs,
      canBuildMemory: agent._count.runs >= MIN_RUNS_FOR_MEMORY,
      minRunsRequired: MIN_RUNS_FOR_MEMORY,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action } = body as { action?: "refresh" | "toggle" | "clear"; enabled?: boolean };
    const agent = await prisma.agent.findFirst({ where: { id, userId: user.id } });
    if (!agent) return NextResponse.json({ error: "agent not found" }, { status: 404 });

    if (action === "toggle") {
      const { enabled } = body as { enabled?: boolean };
      await prisma.agent.update({
        where: { id },
        data: { memoryEnabled: enabled ?? !agent.memoryEnabled },
      });
      return NextResponse.json({ success: true, memoryEnabled: enabled ?? !agent.memoryEnabled });
    }

    if (action === "clear") {
      await prisma.agent.update({
        where: { id },
        data: { memoryContext: "", memoryUpdatedAt: null, memoryRunCount: 0, memoryEnabled: false },
      });
      return NextResponse.json({ success: true, cleared: true });
    }

    const runs = await prisma.run.findMany({
      where: { agentId: id, userId: user.id, status: "success" },
      orderBy: { createdAt: "desc" },
      take: MAX_RUNS_TO_ANALYZE,
      select: { input: true, output: true, status: true, createdAt: true },
    });

    if (runs.length < MIN_RUNS_FOR_MEMORY) {
      return NextResponse.json({
        error: `Need at least ${MIN_RUNS_FOR_MEMORY} successful runs to build memory. You have ${runs.length}.`,
        runsAvailable: runs.length, runsRequired: MIN_RUNS_FOR_MEMORY,
      }, { status: 400 });
    }

    const memoryContext = await buildMemoryContext(
      agent.name, agent.role, agent.systemPrompt,
      runs.map(r => ({
        input: r.input, output: r.output ?? "",
        status: r.status as "success" | "error", createdAt: r.createdAt,
      })),
    );

    if (!memoryContext.trim()) {
      return NextResponse.json({ error: "Failed to generate memory context" }, { status: 500 });
    }

    await prisma.agent.update({
      where: { id },
      data: { memoryContext, memoryUpdatedAt: new Date(), memoryRunCount: runs.length, memoryEnabled: true },
    });

    return NextResponse.json({ success: true, memoryContext, runsAnalyzed: runs.length, memoryUpdatedAt: new Date() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "memory refresh failed" }, { status: 500 });
  }
}
