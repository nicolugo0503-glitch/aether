import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true, name: true, role: true, description: true, model: true,
      scheduleEnabled: true, scheduleCron: true, scheduleInput: true,
      scheduleNextRun: true, scheduleTimezone: true,
      user: { select: { plan: true } },
    },
  });

  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const agent = await prisma.agent.findFirst({ where: { id, userId: user.id } });
  if (!agent) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.agent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
