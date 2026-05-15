/**
 * POST /api/inbox/[id]/send
 * Send the draft reply via the user's Resend API key.
 * After sending, marks the reply as actioned.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const Schema = z.object({
  body: z.string().min(1).max(20000),
  subject: z.string().max(400).optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { resendApiKey: true, fromEmail: true },
  });
  if (!dbUser?.resendApiKey || !dbUser?.fromEmail) {
    return NextResponse.json(
      { error: "Configure Resend API key + From email in Settings before sending." },
      { status: 400 },
    );
  }

  const reply = await prisma.emailReply.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!reply) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const subject = parsed.data.subject?.trim()
    || (reply.subject?.startsWith("Re:") ? reply.subject : `Re: ${reply.subject || "your message"}`);

  try {
    await sendEmail({
      apiKey: dbUser.resendApiKey,
      from: dbUser.fromEmail,
      to: reply.fromEmail,
      subject,
      body: parsed.data.body,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "send failed" },
      { status: 500 },
    );
  }

  const updated = await prisma.emailReply.update({
    where: { id: reply.id },
    data: {
      status: "actioned",
      actionedAt: new Date(),
      repliedAt: new Date(),
      draftReply: parsed.data.body,
    },
    select: { id: true, status: true, repliedAt: true },
  });

  return NextResponse.json({ ok: true, reply: updated });
}
