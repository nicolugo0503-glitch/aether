/**
 * POST /api/inbox/[id]/redraft
 * Regenerate the AI draft reply, optionally with a tone override.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redraftReply, type ReplyIntent } from "@/lib/reply-intelligence";

export const dynamic = "force-dynamic";

const Schema = z.object({
  tone: z.enum(["warm", "direct", "formal", "casual"]).optional(),
  senderContext: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const reply = await prisma.emailReply.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!reply) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const result = await redraftReply({
      body: reply.bodyText,
      subject: reply.subject ?? undefined,
      fromName: reply.fromName ?? undefined,
      intent: reply.intent as ReplyIntent,
      tone: parsed.data.tone,
      senderContext: parsed.data.senderContext,
    });
    const updated = await prisma.emailReply.update({
      where: { id: reply.id },
      data: {
        draftReply: result.draftReply,
        tokensIn: { increment: result.tokensIn },
        tokensOut: { increment: result.tokensOut },
        costCents: { increment: result.costCents },
      },
      select: { id: true, draftReply: true },
    });
    return NextResponse.json({ reply: updated });
  } catch {
    return NextResponse.json({ error: "redraft failed" }, { status: 500 });
  }
}
