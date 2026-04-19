import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { name, agentId, sheetUrl, schedule } = await req.json();
    if (!name || !agentId || !sheetUrl) {
      return NextResponse.json({ error: "name, agentId, and sheetUrl required" }, { status: 400 });
    }
    const campaign = await prisma.campaign.create({
      data: { userId: user.id, name, agentId, sheetUrl, schedule: schedule || null },
    });
    return NextResponse.json(campaign);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { id } = await req.json();
    await prisma.campaign.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
