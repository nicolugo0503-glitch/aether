import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are Aria, Aether's helpful AI assistant. Aether is an AI automation platform that lets businesses deploy autonomous AI agents for social media, email marketing, and sales outreach.

Key facts about Aether:
- Aether lets you automate Instagram, Facebook, X (Twitter), and email campaigns — all without code
- Includes Ava, a pre-built AI SDR that writes personalized cold emails from lead lists
- Social media agent auto-generates captions, hashtags, and posts on a schedule
- Campaign agent runs bulk personalized email outreach via Resend
- All agents run 24/7 autonomously after setup

Pricing plans:
- Free: 25 runs/month, 1 agent — great for testing
- Starter ($39/month): 500 runs/month, 3 agents
- Growth ($99/month): 5,000 runs/month, 10 agents
- Scale ($299/month): 50,000 runs/month, unlimited agents

Setup takes about 10 minutes. Users connect their accounts (Meta, X, Resend) in Settings, then deploy agents.

Support email: support@useaether.net
Website: useaether.net

Be concise, friendly, and helpful. Answer questions about Aether's features, pricing, and setup. If someone asks something you don't know, suggest they email support@useaether.net. Keep responses short — 2-4 sentences max unless a detailed answer is truly needed.`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // 30 messages per hour per IP
  if (isRateLimited(`chat:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  const { messages } = await req.json().catch(() => ({ messages: [] }));
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: "Chat is currently unavailable. Please email support@useaether.net for help." });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-10), // Keep last 10 messages for context
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Try emailing support@useaether.net.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Something went wrong. Please try again or email support@useaether.net." });
  }
}
