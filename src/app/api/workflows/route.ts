import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { serializeSteps, type WorkflowStep } from "@/lib/workflow";
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

const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(800).optional(),
  steps: z.array(StepSchema).default([]),
  trigger: z.enum(["manual", "schedule", "webhook"]).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const workflows = await prisma.workflow.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      steps: true,
      trigger: true,
      scheduleEnabled: true,
      scheduleCron: true,
      scheduleNextRun: true,
      totalRuns: true,
      successfulRuns: true,
      totalCostCents: true,
      lastRunAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ workflows });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CreateWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  // Verify all referenced agents belong to this user.
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

  const trigger = parsed.data.trigger ?? "manual";
  const webhookToken =
    trigger === "webhook"
      ? `whk_${crypto.randomBytes(24).toString("hex")}`
      : null;

  const workflow = await prisma.workflow.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      trigger,
      steps: serializeSteps(parsed.data.steps as WorkflowStep[]),
      webhookToken,
    },
  });

  return NextResponse.json({ workflow }, { status: 201 });
}
