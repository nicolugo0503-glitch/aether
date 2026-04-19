import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { topic, tone = "professional", platforms = ["facebook", "instagram"] } = await req.json();
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Step 1 — Generate caption + hashtags + image prompt
    const textPrompt = `You are a social media expert. Create an engaging ${tone} social media post about: "${topic}"

Return ONLY a JSON object with these fields:
{
  "caption": "the post text (2-4 sentences, engaging, no hashtags here)",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5",
  "imagePrompt": "a vivid DALL-E image prompt that visually represents this post topic (max 120 chars, no text/words in image, photorealistic or clean graphic style)"
}

Keep caption under 200 words. Make it feel authentic, not like an ad.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "user", content: textPrompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");

    // Step 2 — Generate image with DALL-E 3
    let imageUrl: string | null = null;
    try {
      const dallePrompt = result.imagePrompt
        ? `${result.imagePrompt}. No text, no words, no letters anywhere in the image.`
        : `High quality professional image representing: ${topic}. No text, clean composition, vibrant.`;

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: dallePrompt,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      });

      imageUrl = imageResponse.data[0]?.url ?? null;
    } catch {
      // Image generation failed — post continues without image
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

    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
