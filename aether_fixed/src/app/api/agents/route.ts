import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { z } from "zod";

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  description: z.string().optional(),
  systemPrompt: z.string().min(1),
  knowledge: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateAgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const count = await prisma.agent.count({ where: { userId: user.id } });
  if (count >= PLAN_LIMITS[toPlanKey(user.plan)].agents) {
    return NextResponse.json({ error: "agent limit reached" }, { status: 402 });
  }

  const agent = await prisma.agent.create({
    data: { userId: user.id, ...parsed.data },
  });
  return NextResponse.json({ agent }, { status: 201 });
}
