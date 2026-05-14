import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nextScanFor } from "@/lib/competitor";

const CategoryEnum = z.enum([
  "pricing",
  "homepage",
  "blog",
  "careers",
  "product",
  "general",
]);

const FrequencyEnum = z.enum(["hourly", "daily", "weekly"]);

const CreateSchema = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url(),
  category: CategoryEnum.optional(),
  focus: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  frequency: FrequencyEnum.optional(),
  notifyEmail: z.boolean().optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const competitors = await prisma.competitor.findMany({
    where: { userId: user.id },
    orderBy: [{ lastChangeAt: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      url: true,
      category: true,
      focus: true,
      enabled: true,
      frequency: true,
      notifyEmail: true,
      lastFetchedAt: true,
      lastChangeAt: true,
      lastSeverity: true,
      lastSummary: true,
      lastError: true,
      totalScans: true,
      totalChanges: true,
      nextScanAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const unreadChanges = await prisma.competitorChange.count({
    where: { userId: user.id, read: false },
  });

  return NextResponse.json({ competitors, unreadChanges });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const u = new URL(parsed.data.url);
  if (!/^https?:$/.test(u.protocol)) {
    return NextResponse.json({ error: "only http(s) URLs are supported" }, { status: 400 });
  }

  const frequency = parsed.data.frequency || "daily";

  const competitor = await prisma.competitor.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      url: parsed.data.url,
      category: parsed.data.category || "general",
      focus: parsed.data.focus ?? null,
      notes: parsed.data.notes ?? null,
      frequency,
      notifyEmail: parsed.data.notifyEmail ?? true,
      // Queue the first scan immediately.
      nextScanAt: new Date(),
    },
  });

  return NextResponse.json({ competitor });
}
