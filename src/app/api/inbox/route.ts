/**
 * GET  /api/inbox        — list current user's replies (filterable)
 * POST /api/inbox        — manually insert a reply (used by the "test" button in the UI)
 *
 * Query params (GET):
 *   intent=HOT|INTERESTED|...        filter by intent
 *   status=new|read|actioned|dismissed
 *   hot=1                            only hot replies
 *   limit=50                         default 50, max 200
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { classifyReply } from "@/lib/reply-intelligence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const intent = sp.get("intent") || undefined;
  const status = sp.get("status") || undefined;
  const hot = sp.get("hot") === "1" ? true : undefined;
  const limit = Math.min(200, Math.max(1, parseInt(sp.get("limit") || "50", 10) || 50));

  const where: Record<string, unknown> = { userId: user.id };
  if (intent) where.intent = intent;
  if (status) where.status = status;
  if (hot !== undefined) where.hot = hot;

  const [replies, totalNew, totalHot] = await Promise.all([
    prisma.emailReply.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { receivedAt: "desc" }],
      take: limit,
      select: {
        id: true, fromEmail: true, fromName: true, subject: true,
        intent: true, sentiment: true, urgency: true, score: true,
        summary: true, suggestedAction: true, tags: true,
        status: true, pinned: true, hot: true,
        receivedAt: true, actionedAt: true, repliedAt: true,
      },
    }),
    prisma.emailReply.count({ where: { userId: user.id, status: "new" } }),
    prisma.emailReply.count({ where: { userId: user.id, hot: true, status: { not: "actioned" } } }),
  ]);

  return NextResponse.json({ replies, totalNew, totalHot });
}

const TestSchema = z.object({
  fromEmail: z.string().email(),
  fromName: z.string().max(120).optional(),
  subject: z.string().max(400).optional(),
  body: z.string().min(1).max(20000),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = TestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  let classification;
  try {
    classification = await classifyReply({
      body: parsed.data.body,
      subject: parsed.data.subject,
      fromName: parsed.data.fromName,
      fromEmail: parsed.data.fromEmail,
    });
  } catch {
    return NextResponse.json({ error: "AI classification failed" }, { status: 500 });
  }

  const reply = await prisma.emailReply.create({
    data: {
      userId: user.id,
      fromEmail: parsed.data.fromEmail,
      fromName: parsed.data.fromName ?? null,
      subject: parsed.data.subject ?? null,
      bodyText: parsed.data.body,
      intent: classification.intent,
      sentiment: classification.sentiment,
      urgency: classification.urgency,
      score: classification.score,
      summary: classification.summary,
      suggestedAction: classification.suggestedAction,
      draftReply: classification.draftReply,
      tags: JSON.stringify(classification.tags),
      hot: classification.hot,
      tokensIn: classification.tokensIn,
      tokensOut: classification.tokensOut,
      costCents: classification.costCents,
      status: "new",
    },
    select: { id: true, intent: true, hot: true, score: true },
  });

  return NextResponse.json({ reply, classification });
}
