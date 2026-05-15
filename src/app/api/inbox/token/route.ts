/**
 * GET  /api/inbox/token   — return current user's webhook token + URL
 * POST /api/inbox/token   — rotate webhook token (issue a new one)
 */

import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function newToken(): string {
  return "inb_" + randomBytes(24).toString("base64url");
}

function baseUrl(): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://useaether.ai"
  ).replace(/\/$/, "");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { inboxWebhookToken: true, inboxNotifyHot: true },
  });
  if (!dbUser) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Lazy-issue a token on first request
  if (!dbUser.inboxWebhookToken) {
    const token = newToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { inboxWebhookToken: token },
    });
    dbUser = { ...dbUser, inboxWebhookToken: token };
  }

  return NextResponse.json({
    token: dbUser.inboxWebhookToken,
    webhookUrl: `${baseUrl()}/api/inbox/inbound?token=${dbUser.inboxWebhookToken}`,
    notifyHot: dbUser.inboxNotifyHot,
  });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = newToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { inboxWebhookToken: token },
  });
  return NextResponse.json({
    token,
    webhookUrl: `${baseUrl()}/api/inbox/inbound?token=${token}`,
  });
}
