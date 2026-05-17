import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { postToFacebook, postToInstagram, postToTwitter } from "@/lib/social";
import OpenAI from "openai";

// Vercel: allow up to 5 minutes for this cron job (image generation + multiple social posts)
export const maxDuration = 300;

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
  // Verify this is called by Vercel cron.
  // IMPORTANT: if CRON_SECRET is not set, reject ALL requests â never fall through to
  // "Bearer undefined" which would make any attacker request pass.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET env var not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dueUsers = await prisma.user.findMany({
    where: {
      scheduleEnabled: true,
      scheduleNextRun: { lte: now },
    },
  });

  const results = [];

  for (const user of dueUsers) {
    try {
      const planLimits = PLAN_LIMITS[toPlanKey(user.plan)];
      let platforms: string[];
      try { platforms = JSON.parse(user.schedulePlatforms || '["facebook","instagram"]'); }
      catch { platforms = ["facebook", "instagram"]; }
      const topic = user.scheduleTopic || RANDOM_TOPICS[Math.floor(Math.random() * RANDOM_TOPICS.length)];

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate caption + hashtags + image prompt
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

      let result: { caption?: string; hashtags?: string; imagePrompt?: string } = {};
      try { result = JSON.parse(completion.choices[0].message.content || "{}"); }
      catch { result = {}; }

      // Generate image (paid plans only)
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

      // Save post
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

      // Post to connected platforms
      let fbPostId = null, igPostId = null, xPostId = null, postError = null;
      const fullCaption = `${result.caption}\n\n${result.hashtags}`;

      if (platforms.includes("facebook") && user.fbPageId && user.fbPageToken) {
        try { fbPostId = await postToFacebook(user.fbPageId, user.fbPageToken, fullCaption, imageUrl ?? undefined); }
        catch (e: any) { postError = e.message; }
      }
      if (platforms.includes("instagram") && user.igUserId && user.fbPageToken) {
        try { igPostId = await postToInstagram(user.igUserId, user.fbPageToken, fullCaption, imageUrl ?? undefined); }
        catch (e: any) { postError = e.message; }
      }
      if (platforms.includes("x") && user.twitterApiKey && user.twitterApiSecret && user.twitterAccessToken && user.twitterAccessSecret) {
        try {
          const tweetText = fullCaption.length > 280 ? fullCaption.slice(0, 277) + "..." : fullCaption;
          xPostId = await postToTwitter(
            user.twitterApiKey,
            user.twitterApiSecret,
            user.twitterAccessToken,
            user.twitterAccessSecret,
            tweetText,
          );
        } catch (e: any) { postError = e.message; }
      }

      const posted = !!(fbPostId || igPostId || xPostId);
      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          fbPostId, igPostId, xPostId,
          status: posted ? "posted" : postError ? "error" : "draft",
          error: postError,
          postedAt: posted ? new Date() : null,
        },
      });

      // Schedule next run
      const daysToAdd = user.scheduleFrequency === "daily" ? 1 : user.scheduleFrequency === "every2days" ? 2 : 7;
      const nextRun = new Date(now);
      nextRun.setDate(nextRun.getDate() + daysToAdd);
      await prisma.user.update({
        where: { id: user.id },
        data: { scheduleNextRun: nextRun },
      });

      results.push({ userId: user.id, topic, posted });
    } catch (err: any) {
      results.push({ userId: user.id, error: err.message });
    }
  }

  return NextResponse.json({ processed: dueUsers.length, results });
}
