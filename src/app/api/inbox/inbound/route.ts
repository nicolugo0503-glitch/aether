/**
 * POST /api/inbox/inbound
 * Inbound email reply webhook.
 *
 * Each user has a unique per-user webhook token (User.inboxWebhookToken).
 * The provider (Resend Inbound, Postmark, SendGrid Parse, or a generic
 * Make.com / Zapier pipe) posts here with either:
 *
 *   - Authorization: Bearer <user.inboxWebhookToken>      (preferred)
 *   - ?token=<user.inboxWebhookToken>                     (query string fallback)
 *
 * The body is parsed flexibly to handle the major provider shapes.
 * Replies are then classified by GPT-4o-mini and persisted to EmailReply.
 *
 * If the reply is hot AND the user opted in (inboxNotifyHot=true) AND
 * they have a Resend API key configured, we email them a short "🔥 hot
 * reply from {name}" notification with the AI summary + suggested action.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { classifyReply, parseInboundEmail } from "@/lib/reply-intelligence";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── extract token ──────────────────────────────────────────
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;
  const tokenFromQuery = req.nextUrl.searchParams.get("token");
  const token = bearer || tokenFromQuery;

  if (!token) {
    return NextResponse.json({ error: "missing inbox token" }, { status: 401 });
  }

  const user = await prisma.user.findFirst({
    where: { inboxWebhookToken: token },
    select: {
      id: true,
      email: true,
      fromEmail: true,
      resendApiKey: true,
      inboxNotifyHot: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "invalid inbox token" }, { status: 401 });
  }

  // ── parse body (JSON or form) ─────────────────────────────
  let payload: unknown = {};
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      payload = Object.fromEntries(fd.entries());
    } else {
      // Try JSON first, then text
      try { payload = await req.json(); } catch {
        const text = await req.text();
        payload = { text };
      }
    }
  } catch {
    payload = {};
  }

  const parsed = parseInboundEmail(payload);
  if (!parsed) {
    return NextResponse.json(
      { error: "could not parse inbound email — expected { from, subject, text/html } envelope" },
      { status: 400 },
    );
  }

  // ── try to match to a campaign by recipient address ───────
  let campaignId: string | null = null;
  try {
    if (parsed.toEmail && parsed.toEmail === user.fromEmail) {
      // Most recent active campaign — best-effort attribution
      const c = await prisma.campaign.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true },
      });
      campaignId = c?.id ?? null;
    }
  } catch { /* non-fatal */ }

  // ── classify ──────────────────────────────────────────────
  let classification;
  try {
    classification = await classifyReply({
      body: parsed.bodyText,
      subject: parsed.subject,
      fromName: parsed.fromName,
      fromEmail: parsed.fromEmail,
    });
  } catch (e) {
    // Don't drop the reply — still store it as UNCLASSIFIED so the user sees it.
    classification = {
      intent: "UNCLASSIFIED" as const,
      sentiment: "neutral" as const,
      urgency: "normal" as const,
      score: 50,
      summary: "AI classification failed — review manually.",
      suggestedAction: "Read the reply and respond.",
      draftReply: "",
      tags: [],
      hot: false,
      tokensIn: 0,
      tokensOut: 0,
      costCents: 0,
    };
  }

  // ── persist ───────────────────────────────────────────────
  const reply = await prisma.emailReply.create({
    data: {
      userId: user.id,
      campaignId,
      fromEmail: parsed.fromEmail,
      fromName: parsed.fromName ?? null,
      toEmail: parsed.toEmail ?? null,
      subject: parsed.subject ?? null,
      bodyText: parsed.bodyText,
      bodyHtml: parsed.bodyHtml ?? null,
      messageId: parsed.messageId ?? null,
      inReplyTo: parsed.inReplyTo ?? null,
      threadId: parsed.threadId ?? null,
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
    select: { id: true, hot: true, intent: true, score: true },
  });

  // ── hot reply notification (best-effort) ──────────────────
  if (classification.hot && user.inboxNotifyHot && user.resendApiKey && user.fromEmail) {
    const fromName = parsed.fromName || parsed.fromEmail;
    try {
      await sendEmail({
        apiKey: user.resendApiKey,
        from: user.fromEmail,
        to: user.email,
        subject: `🔥 Hot reply from ${fromName}`,
        body:
`A new HOT reply just landed in your Aether inbox.

From: ${fromName} <${parsed.fromEmail}>
Subject: ${parsed.subject || "(no subject)"}
AI score: ${classification.score}/100

What they said (summary):
${classification.summary}

Suggested next step:
${classification.suggestedAction}

Open it in your inbox:
${process.env.NEXTAUTH_URL || "https://useaether.ai"}/dashboard/inbox/${reply.id}

— Aether`,
      });
      await prisma.emailReply.update({
        where: { id: reply.id },
        data: { notifiedAt: new Date() },
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({
    ok: true,
    replyId: reply.id,
    intent: reply.intent,
    score: reply.score,
    hot: reply.hot,
  });
}

// Allow simple GET pings for webhook setup verification.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ ok: false, error: "missing token" }, { status: 401 });
  }
  const user = await prisma.user.findFirst({
    where: { inboxWebhookToken: token },
    select: { id: true },
  });
  return NextResponse.json({ ok: !!user });
}
