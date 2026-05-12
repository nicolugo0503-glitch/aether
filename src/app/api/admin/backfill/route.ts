import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// IMPORTANT: do NOT fall back to a hardcoded default — that would allow anyone who knows
// (or guesses) the default to enumerate all user emails and modify their data.
// Require ADMIN_SECRET to be explicitly set as an env var.
const SECRET = process.env.ADMIN_SECRET;

const DEFAULT_AGENTS = [
  {
    name: "Ava — AI SDR",
    role: "Sales Development Rep",
    description: "Crafts hyper-personalized cold outreach from lead context.",
    systemPrompt: "You are Ava, an elite B2B SDR. Given a lead profile, produce a tight 80-word cold email with a specific hook. No fluff, one CTA.",
  },
  {
    name: "Rex — Market Researcher",
    role: "Market Intelligence Analyst",
    description: "Researches market trends, competitor landscape, and business opportunities.",
    systemPrompt: "You are Rex, an expert market intelligence analyst. Given a company or topic, produce a sharp brief covering: market trends, top 3 competitors, key opportunities, and one strategic recommendation. Be concise and actionable.",
  },
  {
    name: "Sage — Support Agent",
    role: "Customer Support Specialist",
    description: "Resolves customer support tickets automatically using your knowledge base.",
    systemPrompt: "You are Sage, an expert support specialist. Given a customer message, write a clear empathetic response under 120 words. Resolve directly if possible, ask one clarifying question if needed, always offer further help.",
  },
  {
    name: "Opus — Business Analyst",
    role: "Business Intelligence Analyst",
    description: "Monitors performance, flags anomalies, and writes weekly business summaries.",
    systemPrompt: "You are Opus, a sharp business analyst. Given metrics or a business update, produce an executive summary: what is working, what needs attention, the key insight, and one recommendation. Be direct.",
  },
];

// Require POST (not GET) to prevent CSRF — GET mutations are unsafe.
export async function POST(req: NextRequest) {
  // Reject all requests if ADMIN_SECRET env var is not configured
  if (!SECRET) {
    return NextResponse.json({ error: "ADMIN_SECRET env var not configured" }, { status: 500 });
  }
  let secret: string | undefined;
  try {
    const body = await req.json();
    secret = body.secret;
  } catch {
    secret = req.nextUrl.searchParams.get("secret") ?? undefined;
  }
  if (secret !== SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  const results: string[] = [];

  for (const user of users) {
    const existing = await prisma.agent.findMany({
      where: { userId: user.id },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((a) => a.name));
    const toAdd = DEFAULT_AGENTS.filter((a) => !existingNames.has(a.name));

    if (toAdd.length === 0) {
      results.push(`✓ ${user.email} — already complete`);
    } else {
      await prisma.agent.createMany({
        data: toAdd.map((a) => ({ ...a, userId: user.id })),
      });
      results.push(`✅ ${user.email} — added: ${toAdd.map((a) => a.name).join(", ")}`);
    }
  }

  return NextResponse.json({ done: true, results });
}
