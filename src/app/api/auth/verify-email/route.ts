import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/db";
import { processReferralBonus, ensureReferralCode } from "@/lib/referral";

const authSecret = process.env.AUTH_SECRET;
if (!authSecret) {
  throw new Error(
    "[Aether] AUTH_SECRET environment variable is not set. " +
    "Generate a strong random value and add it to your Vercel environment variables.",
  );
}
const SECRET = new TextEncoder().encode(authSecret);
const COOKIE_NAME = "aether_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://www.useaether.net";

  if (!token) {
    return NextResponse.redirect(`${base}/verify-email/invalid`);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      return NextResponse.redirect(`${base}/verify-email/invalid`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerifyToken: null },
    });

    // Generate referral code + process referral bonus (fire-and-forget)
    ensureReferralCode(user.id).catch(console.error);
    processReferralBonus(user.id).catch(console.error);

    // Build JWT
    const jwt = await new SignJWT({ sub: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${MAX_AGE_SECONDS}s`)
      .sign(SECRET);

    // Set the cookie directly on the redirect response
    // Redirect new users to onboarding; already-onboarded users go straight to dashboard
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id }, select: { onboardingComplete: true } });
    const destination = updatedUser?.onboardingComplete ? `${base}/dashboard` : `${base}/onboarding`;
    const response = NextResponse.redirect(destination);
    response.cookies.set(COOKIE_NAME, jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });

    return response;
  } catch (err) {
    console.error("verify-email error:", err);
    return NextResponse.redirect(`${base}/verify-email/invalid`);
  }
}
