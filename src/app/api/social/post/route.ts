import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postToFacebook, postToInstagram, postToTwitter } from "@/lib/social";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

    const post = await prisma.socialPost.findFirst({ where: { id: postId, userId: user.id } });
    if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return NextResponse.json({ error: "user not found" }, { status: 404 });

    const platforms: string[] = JSON.parse(post.platforms);
    const fullCaption = `${post.caption}\n\n${post.hashtags}`;
    const results: Record<string, string> = {};
    const errors: string[] = [];

    // Post to Facebook
    if (platforms.includes("facebook") && dbUser.fbPageId && dbUser.fbPageToken) {
      try {
        results.facebook = await postToFacebook(
          dbUser.fbPageId,
          dbUser.fbPageToken,
          fullCaption,
          post.imageUrl ?? undefined,
        );
      } catch (e: any) {
        errors.push(`Facebook: ${e.message}`);
      }
    }

    // Post to Instagram
    if (platforms.includes("instagram") && dbUser.igUserId && dbUser.fbPageToken) {
      try {
        results.instagram = await postToInstagram(
          dbUser.igUserId,
          dbUser.fbPageToken,
          fullCaption,
          post.imageUrl ?? undefined,
        );
      } catch (e: any) {
        errors.push(`Instagram: ${e.message}`);
      }
    }

    // Post to X / Twitter
    if (
      platforms.includes("x") &&
      dbUser.twitterApiKey &&
      dbUser.twitterApiSecret &&
      dbUser.twitterAccessToken &&
      dbUser.twitterAccessSecret
    ) {
      try {
        // X has a 280 character limit — truncate if needed
        const tweetText = fullCaption.length > 280
          ? fullCaption.slice(0, 277) + "..."
          : fullCaption;
        results.x = await postToTwitter(
          dbUser.twitterApiKey,
          dbUser.twitterApiSecret,
          dbUser.twitterAccessToken,
          dbUser.twitterAccessSecret,
          tweetText,
        );
      } catch (e: any) {
        errors.push(`X/Twitter: ${e.message}`);
      }
    }

    const postedCount = Object.keys(results).length;
    const status =
      errors.length === 0 && postedCount > 0 ? "posted" :
      postedCount > 0 ? "partial" : "error";

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status,
        fbPostId: results.facebook ?? null,
        igPostId: results.instagram ?? null,
        xPostId: results.x ?? null,
        postedAt: new Date(),
        error: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    return NextResponse.json({ success: true, results, errors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
