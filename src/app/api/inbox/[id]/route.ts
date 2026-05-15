/**
 * GET    /api/inbox/[id]   — full reply (incl. body & draft)
 * PATCH  /api/inbox/[id]   — update status / pinned / draftReply
 * DELETE /api/inbox/[id]   — dismiss / soft-delete
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const reply = await prisma.emailReply.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!reply) return NextResponse.json({ error: "not found" }, { status: 404 });

  // First read transitions "new" → "read"
  if (reply.status === "new") {
    await prisma.emailReply.update({
      where: { id: reply.id },
      data: { status: "read" },
    });
    reply.status = "read";
  }

  return NextResponse.json({ reply });
}

const PatchSchema = z.object({
  status: z.enum(["new", "read", "actioned", "dismissed"]).optional(),
  pinned: z.boolean().optional(),
  draftReply: z.string().max(5000).optional(),
  intent: z
    .enum([
      "HOT", "INTERESTED", "OBJECTION", "NOT_NOW",
      "UNSUBSCRIBE", "OUT_OF_OFFICE", "WRONG_PERSON",
      "QUESTION", "SPAM", "UNCLASSIFIED",
    ])
    .optional(),
  markRepliedNow: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const existing = await prisma.emailReply.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
    if (parsed.data.status === "actioned") data.actionedAt = new Date();
  }
  if (parsed.data.pinned !== undefined) data.pinned = parsed.data.pinned;
  if (parsed.data.draftReply !== undefined) data.draftReply = parsed.data.draftReply;
  if (parsed.data.intent !== undefined) {
    data.intent = parsed.data.intent;
    if (parsed.data.intent === "HOT") data.hot = true;
  }
  if (parsed.data.markRepliedNow) {
    data.repliedAt = new Date();
    data.status = "actioned";
    data.actionedAt = new Date();
  }

  const updated = await prisma.emailReply.update({
    where: { id: existing.id },
    data,
  });

  return NextResponse.json({ reply: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const existing = await prisma.emailReply.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.emailReply.update({
    where: { id: existing.id },
    data: { status: "dismissed" },
  });

  return NextResponse.json({ ok: true });
}
