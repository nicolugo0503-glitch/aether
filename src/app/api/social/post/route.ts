import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postToFacebook, postToInstagram } from "@/lib/social";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

    const post = await prisma.socialPost.findFirst({ where: { id: postId, userId: user.id } });
    if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

    const platforms: string[] = JSON.parse(post.platforms);
    const fullCaption = `${post.caption}\n\n${post.hashtags}`;
    const results: Record<string, string> = {};
    const errors: string[] = [];

    // Post to Facebook
    if (platforms.includes("facebook") && user.fbPageId && user.fbPageToken) {
      try {
        const fbId = await postToFacebook(user.fbPageId, user.fbPageToken, fullCaption);
        results.facebook = fbId;
      } catch (e: any) {
        errors.push(`Facebook: ${e.message}`);
      }
    }

    // Post to Instagram
    if (platforms.includes("instagram") && user.igUserId && user.fbPageToken) {
      try {
        const igId = await postToInstagram(user.igUserId, user.fbPageToken, fullCaption);
        results.instagram = igId;
      } catch (e: any) {
        errors.push(`Instagram: ${e.message}`);
      }
    }

    const status = errors.length === 0 ? "posted" : results.facebook || results.instagram ? "partial" : "error";

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status,
        fbPostId: results.facebook || null,
        igPostId: results.instagram || null,
        postedAt: new Date(),
        error: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    return NextResponse.json({ success: true, results, errors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
