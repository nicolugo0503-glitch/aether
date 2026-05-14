import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const UpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  url: z.string().url().optional(),
  category: z.enum(["pricing", "homepage", "blog", "careers", "product", "general"]).optional(),
  focus: z.string().max(500).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  enabled: z.boolean().optional(),
  frequency: z.enum(["hourly", "daily", "weekly"]).optional(),
  notifyEmail: z.boolean().optional(),
});

async function loadOwned(userId: string, id: string) {
  return prisma.competitor.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const competitor = await loadOwned(user.id, id);
  if (!competitor) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [changes, snapshotCount] = await Promise.all([
    prisma.competitorChange.findMany({
      where: { competitorId: id },
      orderBy: { detectedAt: "desc" },
      take: 100,
      select: {
        id: true,
        summary: true,
        details: true,
        severity: true,
        signals: true,
        charsAdded: true,
        charsRemoved: true,
        read: true,
        pinned: true,
        emailedAt: true,
        detectedAt: true,
      },
    }),
    prisma.competitorSnapshot.count({ where: { competitorId: id } }),
  ]);

  return NextResponse.json({ competitor, changes, snapshotCount });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await loadOwned(user.id, id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const competitor = await prisma.competitor.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ competitor });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await loadOwned(user.id, id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.competitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
