import { prisma } from "@/lib/db";

export const REFERRAL_BONUS_RUNS = 25; // bonus runs for both referrer and referee

/**
 * Generate a unique 8-character referral code for a user.
 * Uses the user's cuid prefix + random chars to ensure uniqueness.
 */
export function generateReferralCode(userId: string): string {
  const base = userId.slice(-4).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${base}${rand}`;
}

/**
 * Ensure a user has a referral code. Creates one if missing.
 * Returns the code.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
  if (user?.referralCode) return user.referralCode;

  // Generate a unique code (retry if collision)
  let code: string;
  let attempts = 0;
  do {
    code = generateReferralCode(userId) + (attempts > 0 ? attempts : "");
    attempts++;
    const existing = await prisma.user.findUnique({ where: { referralCode: code } });
    if (!existing) break;
  } while (attempts < 10);

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code! } });
  return code!;
}

/**
 * Get referral stats for a user.
 */
export async function getReferralStats(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralBonusRuns: true },
  });

  if (!user) return { code: null, bonusRuns: 0, referredCount: 0, pendingBonus: 0 };

  const referralCode = user.referralCode ?? (await ensureReferralCode(userId));

  // Count users who signed up with this code
  const referredUsers = await prisma.user.findMany({
    where: { referredBy: referralCode },
    select: { id: true, name: true, email: true, createdAt: true, emailVerified: true },
    orderBy: { createdAt: "desc" },
  });

  const verifiedCount = referredUsers.filter(u => u.emailVerified).length;

  return {
    code: referralCode,
    bonusRuns: user.referralBonusRuns,
    referredCount: referredUsers.length,
    verifiedReferrals: verifiedCount,
    referredUsers,
  };
}

/**
 * Process a referral when a new user verifies their email.
 * Awards bonus runs to both the new user and the referrer.
 */
export async function processReferralBonus(newUserId: string) {
  const newUser = await prisma.user.findUnique({
    where: { id: newUserId },
    select: { referredBy: true, referralBonusRuns: true },
  });

  if (!newUser?.referredBy) return; // no referral

  const referrer = await prisma.user.findUnique({
    where: { referralCode: newUser.referredBy },
    select: { id: true },
  });

  if (!referrer) return;

  // Award bonus to both in parallel
  await Promise.all([
    // Referrer gets +25 runs
    prisma.user.update({
      where: { id: referrer.id },
      data: {
        referralBonusRuns: { increment: REFERRAL_BONUS_RUNS },
        runsUsedThisPeriod: { decrement: REFERRAL_BONUS_RUNS }, // effectively adds runs
      },
    }),
    // New user gets +25 runs
    prisma.user.update({
      where: { id: newUserId },
      data: {
        referralBonusRuns: { increment: REFERRAL_BONUS_RUNS },
        runsUsedThisPeriod: { decrement: REFERRAL_BONUS_RUNS },
      },
    }),
  ]).catch(console.error);
}
