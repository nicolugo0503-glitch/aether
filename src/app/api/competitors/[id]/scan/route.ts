import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scanCompetitor } from "@/lib/competitor";

export const maxDuration = 60;

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;

  const comp = await prisma.competitor.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!comp) return NextResponse.json({ error: "not found" }, { status: 404 });

  const result = await scanCompetitor(id);
  return NextResponse.json(result);
}
