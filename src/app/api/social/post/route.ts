import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { postToSocial } from "@/lib/social";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { postId } = await req.json();
    if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

    const post = await prisma.socialPost.findFirst({ where: { id: postId, userId: user.id } });
    if (!post) return NextResponse.json({ error: "post not found" }, { status: 404 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.ayrshareProfileKey) {
      return NextResponse.json(
        { error: "No social accounts connected. Go to Settings to connect your accounts." },
        { status: 400 }
      );
    }

    const platforms: string[] = JSON.parse(post.platforms);
    const fullCaption = `${post.caption}\n\n${post.hashtags}`;

    const result = await postToSocial(
      dbUser.ayrshareProfileKey,
      fullCaption,
      platforms,
      post.imageUrl,
    );

    const hasErrors = result.errors && Object.keys(result.errors).length > 0;
    const postIds = result.postIds ?? {};
    const postedCount = Object.keys(postIds).length;
    const status = postedCount > 0 && !hasErrors ? "posted" : postedCount > 0 ? "partial" : "error";
    const errorMsg = hasErrors ? Object.entries(result.errors).map(([k, v]) => `${k}: ${v}`).join("; ") : null;

    await prisma.socialPost.update({
      where: { id: post.id },
      data: {
        status,
        postedAt: postedCount > 0 ? new Date() : null,
        error: errorMsg,
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
