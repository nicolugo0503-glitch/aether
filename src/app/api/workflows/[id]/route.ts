import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { serializeSteps, nextScheduledRunDate, type WorkflowStep } from "@/lib/workflow";
import crypto from "crypto";

const StepSchema = z.object({
  id: z.string().min(1),
  agentId: z.string().min(1),
  name: z.string().min(1),
  inputTemplate: z.string(),
  stopOnError: z.boolean().optional(),
  condition: z
    .object({
      kind: z.enum(["contains", "notContains", "matches"]),
      value: z.string(),
      target: z.string().optional(),
    })
    .optional(),
});

const UpdateWorkflowSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(800).nullable().optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  steps: z.array(StepSchema).optional(),
  trigger: z.enum(["manual", "schedule", "webhook"]).optional(),
  scheduleEnabled: z.boolean().optional(),
  scheduleCron: z.enum(["daily", "every2days", "weekly"]).nullable().optional(),
  scheduleInput: z.string().nullable().optional(),
  scheduleTimezone: z.string().optional(),
  regenerateWebhookToken: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const workflow = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
  });
  if (!workflow) return NextResponse.json({ error: "not found" }, { status: 404 });

  const recentRuns = await prisma.workflowRun.findMany({
    where: { workflowId: id },
    orderBy: { createdAt: "desc" },
    take: 25,
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
    },
  });

  // Hydrate available agents so the editor can wire steps.
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, role: true, model: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ workflow, recentRuns, agents });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.workflow.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.trigger !== undefined) data.trigger = parsed.data.trigger;

  if (parsed.data.steps !== undefined) {
    // Ownership check on referenced agents.
    const agentIds = Array.from(new Set(parsed.data.steps.map(s => s.agentId)));
    if (agentIds.length) {
      const owned = await prisma.agent.findMany({
        where: { id: { in: agentIds }, userId: user.id },
        select: { id: true },
      });
      if (owned.length !== agentIds.length) {
        return NextResponse.json(
          { error: "one or more agents do not belong to you" },
          { status: 400 },
        );
      }
    }
    data.steps = serializeSteps(parsed.data.steps as WorkflowStep[]);
  }

  if (parsed.data.scheduleEnabled !== undefined) {
    data.scheduleEnabled = parsed.data.scheduleEnabled;
    if (parsed.data.scheduleEnabled) {
      data.scheduleNextRun = nextScheduledRunDate(
        parsed.data.scheduleCron ?? existing.scheduleCron ?? "daily",
      );
    } else {
      data.scheduleNextRun = null;
    }
  }
  if (parsed.data.scheduleCron !== undefined) data.scheduleCron = parsed.data.scheduleCron;
  if (parsed.data.scheduleInput !== undefined) data.scheduleInput = parsed.data.scheduleInput;
  if (parsed.data.scheduleTimezone !== undefined) data.scheduleTimezone = parsed.data.scheduleTimezone;

  if (parsed.data.regenerateWebhookToken) {
    data.webhookToken = `whk_${crypto.randomBytes(24).toString("hex")}`;
  }

  const workflow = await prisma.workflow.update({
    where: { id },
    data,
  });

  return NextResponse.json({ workflow });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const workflow = await prisma.workflow.findFirst({ where: { id, userId: user.id } });
  if (!workflow) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.workflow.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
