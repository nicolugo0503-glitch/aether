import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { postToFacebook, postToInstagram } from "@/lib/social";
import OpenAI from "openai";

// Called daily by Vercel Cron at 9am UTC
// Generates + posts for all users who have social accounts connected + auto-post enabled

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fbPageId: { not: null } },
        { igUserId: { not: null } },
      ],
    },
  });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const results = [];

  for (const user of users) {
    if (!user.fbPageToken) continue;

    try {
      // Generate a post about Aether / AI productivity
      const topics = [
        "how AI is transforming business operations",
        "why automation saves 10+ hours per week",
        "the future of AI employees in small business",
        "how to grow your business with AI tools",
        "productivity tips using AI automation",
      ];
      const topic = topics[Math.floor(Math.random() * topics.length)];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.8,
        messages: [{
          role: "user",
          content: `Write an engaging social media post about: "${topic}". Return JSON with "caption" and "hashtags" fields.`,
        }],
        response_format: { type: "json_object" },
      });

      const content = JSON.parse(completion.choices[0].message.content || "{}");
      const fullCaption = `${content.caption}\n\n${content.hashtags}`;

      const post = await prisma.socialPost.create({
        data: {
          userId: user.id,
          topic,
          caption: content.caption || "",
          hashtags: content.hashtags || "",
          platforms: JSON.stringify(["facebook", "instagram"]),
          status: "posting",
        },
      });

      let fbId, igId;
      const errors = [];

      if (user.fbPageId) {
        try { fbId = await postToFacebook(user.fbPageId, user.fbPageToken, fullCaption); }
        catch (e: any) { errors.push(`FB: ${e.message}`); }
      }
      if (user.igUserId) {
        try { igId = await postToInstagram(user.igUserId, user.fbPageToken, fullCaption); }
        catch (e: any) { errors.push(`IG: ${e.message}`); }
      }

      await prisma.socialPost.update({
        where: { id: post.id },
        data: {
          status: errors.length === 0 ? "posted" : "partial",
          fbPostId: fbId || null,
          igPostId: igId || null,
          postedAt: new Date(),
          error: errors.length > 0 ? errors.join("; ") : null,
        },
      });

      results.push({ userId: user.id, status: "ok" });
    } catch (e: any) {
      results.push({ userId: user.id, status: "error", error: e.message });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
