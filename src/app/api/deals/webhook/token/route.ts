// GET  /api/deals/webhook/token — fetch current token
// POST /api/deals/webhook/token — generate/rotate token
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateWebhookToken } from "@/lib/attribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { attributionWebhookToken: true },
  });
  return NextResponse.json({ token: fresh?.attributionWebhookToken || null });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const token = generateWebhookToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { attributionWebhookToken: token },
  });
  return NextResponse.json({ token });
}
