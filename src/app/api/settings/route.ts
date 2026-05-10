import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/settings — return current user's integration settings (no secrets exposed in full)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({
    // Meta / Facebook
    fbPageId:    user.fbPageId    ?? "",
    fbPageToken: user.fbPageToken ? "••••••••" : "",
    igUserId:    user.igUserId    ?? "",

    // Twitter / X
    twitterApiKey:       user.twitterApiKey       ? "••••••••" : "",
    twitterApiSecret:    user.twitterApiSecret    ? "••••••••" : "",
    twitterAccessToken:  user.twitterAccessToken  ? "••••••••" : "",
    twitterAccessSecret: user.twitterAccessSecret ? "••••••••" : "",

    // Check which platforms are connected
    facebookConnected: !!(user.fbPageId && user.fbPageToken),
    instagramConnected: !!(user.igUserId && user.fbPageToken),
    twitterConnected: !!(
      user.twitterApiKey &&
      user.twitterApiSecret &&
      user.twitterAccessToken &&
      user.twitterAccessSecret
    ),
  });
}

// PATCH /api/settings — update social credentials
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();

  // Only update fields that are explicitly provided (non-empty string = update, empty string = keep old, null = clear)
  const updateData: Record<string, string | null> = {};

  const fields = [
    "fbPageId", "fbPageToken", "igUserId",
    "twitterApiKey", "twitterApiSecret",
    "twitterAccessToken", "twitterAccessSecret",
  ] as const;

  for (const field of fields) {
    if (field in body) {
      // Empty string = don't change. Null = clear. Actual value = update.
      if (body[field] !== "" && body[field] !== "••••••••") {
        updateData[field] = body[field] || null;
      }
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
