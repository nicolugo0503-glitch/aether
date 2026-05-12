import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 20 feedback submissions per hour per IP (generous but prevents spam)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (await isRateLimited(`feedback:${ip}`, 20, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait before trying again." }, { status: 429 });
  }

  try {
    const { rating, message, page } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }

    // Try to get the current user (optional — anonymous feedback is fine too)
    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      if (user) userId = user.id;
    } catch {}

    await prisma.feedback.create({
      data: {
        userId: userId ?? undefined,
        rating: Number(rating),
        message: message ? String(message).slice(0, 2000) : null,
        page: page ? String(page).slice(0, 200) : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback]", err);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }
}
