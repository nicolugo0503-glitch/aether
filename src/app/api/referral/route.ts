import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getReferralStats, ensureReferralCode } from "@/lib/referral";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure user has a referral code
  await ensureReferralCode(user.id);

  const stats = await getReferralStats(user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.useaether.net";

  return NextResponse.json({
    ...stats,
    referralUrl: `${appUrl}/signup?ref=${stats.code}`,
  });
}
