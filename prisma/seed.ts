import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "demo@aether.ai" },
    update: {},
    create: {
      email: "demo@aether.ai",
      name: "Demo Founder",
      passwordHash,
      plan: "GROWTH",
    },
  });

  await prisma.agent.createMany({
    data: [
      {
        userId: user.id,
        name: "Ava — AI SDR",
        role: "Sales Development Rep",
        description:
          "Researches inbound leads and drafts hyper-personalized first-touch emails.",
        systemPrompt:
          "You are Ava, an elite B2B SDR. Given a lead profile, produce a tight 80-word cold email with a specific hook based on the lead's recent activity. No fluff, one CTA.",
        tools: JSON.stringify(["web_search", "enrich_lead"]),
        knowledge:
          "Our product: Aether — hire autonomous AI employees. ICP: Series A-C B2B SaaS. Differentiator: per-seat AI with verticalized playbooks.",
      },
      {
        userId: user.id,
        name: "Rex — AI Researcher",
        role: "Research Analyst",
        description:
          "Deep-researches companies, markets, or people and returns briefs.",
        systemPrompt:
          "You are Rex, a senior equity research analyst. Produce crisp, sourced market briefs with 1) TL;DR 2) Key numbers 3) Risks 4) Sources.",
        tools: JSON.stringify(["web_search"]),
      },
      {
        userId: user.id,
        name: "Sage — AI Support",
        role: "Tier-1 Support Rep",
        description:
          "Answers customer questions from your knowledge base and escalates when unsure.",
        systemPrompt:
          "You are Sage, a friendly tier-1 support rep. Answer only from the provided knowledge. If the answer isn't there, say 'Let me get a human teammate' and tag the ticket.",
      },
    ],
  });

  console.log("Seeded user demo@aether.ai / demo1234");
}

main().finally(() => prisma.$disconnect());
