import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { postToSocial } from "@/lib/social";
import OpenAI from "openai";

const RANDOM_TOPICS = [
  "How AI is changing the way businesses hire",
  "5 ways automation saves you 10+ hours a week",
  "Why the future of work is AI-powered",
  "How to scale your business without hiring more staff",
  "The secret to growing on social media in 2025",
  "What smart entrepreneurs do differently",
  "How to turn your expertise into automated income",
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueUsers = await prisma.user.findMany({
    where: { scheduleEnabled: true, scheduleNextRun: { lte: now } },
  });

  const results = [];

  for (const user of dueUsers) {
    try {
      if (!user.ayrshareProfileKey) {
        results.push({ userId: user.id, error: "No social accounts connected" });
        continue;
      }

      const planLimits = PLAN_LIMITS[toPlanKey(user.plan)];
      const platforms: string[] = JSON.parse(user.schedulePlatforms || '["facebook","instagram"]');
      const topic = user.scheduleTopic || RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [{
          role: "user",
          content: `You are a social media expert. Create an engaging professional post about: "${topic}"
Return ONLY JSON:
{
  "caption": "2-4 sentences, no hashtags",
  "hashtags": "#tag1 #tag2 #tag3 #tag4 #tag5",
  "imagePrompt": "vivid DALL-E prompt, max 120 chars, no text in image"
}`,
        }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      let imageUrl: string | null = null;
      if (planLimits.images) {
        try {
          const imgRes = await openai.images.generate({
            model: "dall-e-3",
            prompt: `${result.imagePrompt}. No text, no words, no letters anywhere in the image.`,
            size: "1024x1024",
            quality: "standard",
            n: 1,
          });
          imageUrl = imgRes.data[0]?.url ?? null;
        } catch { /* skip on failure */ }
      }

      const post = await prisma.socialPost.create({
        data: {
          userId: user.id,
          topic,
          caption: result.caption || "",
          hashtags: result.hashtags || "",
          platforms: JSON.stringify(platforms),
          imageUrl,
          status: "draft",
        },
      });

      const fullCaption = `${result.caption}\n\n${result.hashtags}`;
      const postResult = await postToSocial(user.ayrshareProfileKey, fullCaption, platforms, imageUrl);

      const postIds = postResult.postIds ?? {};
      const posted = Object.keys(postIds).length > 0;
      const postError = postResult.errors ? Object.values(postResult.errors).join("; ") : null;

      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: posted ? "posted" : postError ? "error" : "draft",
          error: postError,
          postedAt: posted ? new Date() : null,
        },
      });

      const daysToAdd = user.scheduleFrequency === "daily" ? 1 : user.scheduleFrequency === "every2days" ? 2 : 7;
      const nextRun = new Date(now);
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      await prisma.user.update({ where: { id: user.id }, data: { scheduleNextRun: nextRun } });

      results.push({ userId: user.id, topic, posted });
    } catch (err: any) {
      results.push({ userId: user.id, error: err.message });
    }
  }

  return NextResponse.json({ processed: dueUsers.length, results });
}
