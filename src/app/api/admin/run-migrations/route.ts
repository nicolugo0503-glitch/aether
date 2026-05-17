import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Schema-sync migration endpoint.
 * Adds ALL columns that may be missing from the production User table
 * due to schema additions post-initial deploy.
 *
 * Call once: GET /api/admin/run-migrations?secret=<ADMIN_SECRET>
 */
export async function GET(req: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return NextResponse.json({ error: "ADMIN_SECRET env var not configured" }, { status: 500 });
  }
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== adminSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  // Helper: run a raw SQL statement and record result
  async function run(label: string, sql: string) {
    try {
      await prisma.$executeRawUnsafe(sql);
      results[label] = "ok";
    } catch (e: unknown) {
      results[label] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // ── RateLimit table ────────────────────────────────────────────────
  await run("RateLimit_table", `
    CREATE TABLE IF NOT EXISTS "RateLimit" (
      "key"     TEXT NOT NULL,
      "count"   INTEGER NOT NULL DEFAULT 0,
      "resetAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
    )
  `);

  // ── Feedback table ─────────────────────────────────────────────────
  await run("Feedback_table", `
    CREATE TABLE IF NOT EXISTS "Feedback" (
      "id"        TEXT NOT NULL,
      "userId"    TEXT,
      "rating"    INTEGER NOT NULL,
      "message"   TEXT,
      "page"      TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
    )
  `);

  // ── User columns — Stripe ──────────────────────────────────────────
  await run("User.stripeCustomerId",     `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId"     TEXT`);
  await run("User.stripeSubscriptionId", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT`);
  await run("User.plan",                 `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan"                 TEXT NOT NULL DEFAULT 'FREE'`);
  await run("User.planRenewsAt",         `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "planRenewsAt"         TIMESTAMP(3)`);
  await run("User.runsUsedThisPeriod",   `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "runsUsedThisPeriod"   INTEGER NOT NULL DEFAULT 0`);

  // ── User columns — Integration keys ───────────────────────────────
  await run("User.resendApiKey",  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resendApiKey"  TEXT`);
  await run("User.serperApiKey",  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "serperApiKey"  TEXT`);
  await run("User.fromEmail",     `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fromEmail"     TEXT`);

  // ── User columns — Social (Meta) ───────────────────────────────────
  await run("User.fbPageToken",   `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fbPageToken"   TEXT`);
  await run("User.fbPageId",      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fbPageId"      TEXT`);
  await run("User.igUserId",      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "igUserId"      TEXT`);

  // ── User columns — Social (Twitter/X) ────────────────────────────
  await run("User.twitterApiKey",       `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitterApiKey"       TEXT`);
  await run("User.twitterApiSecret",    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitterApiSecret"    TEXT`);
  await run("User.twitterAccessToken",  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitterAccessToken"  TEXT`);
  await run("User.twitterAccessSecret", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitterAccessSecret" TEXT`);

  // ── User columns — Referral system ────────────────────────────────
  await run("User.referralCode",      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode"      TEXT`);
  await run("User.referredBy",        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredBy"        TEXT`);
  await run("User.referralBonusRuns", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralBonusRuns" INTEGER NOT NULL DEFAULT 0`);

  // ── User columns — Onboarding ─────────────────────────────────────
  await run("User.onboardingComplete", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingComplete" BOOLEAN NOT NULL DEFAULT false`);

  // ── User columns — Email verification ─────────────────────────────
  await run("User.emailVerified",    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified"    BOOLEAN NOT NULL DEFAULT false`);
  await run("User.emailVerifyToken", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerifyToken" TEXT`);

  // ── User columns — Password reset ─────────────────────────────────
  await run("User.resetToken",       `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken"       TEXT`);
  await run("User.resetTokenExpiry", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3)`);

  // ── User columns — Social auto-schedule ───────────────────────────
  await run("User.scheduleEnabled",   `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scheduleEnabled"   BOOLEAN NOT NULL DEFAULT false`);
  await run("User.scheduleTime",      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scheduleTime"      TEXT NOT NULL DEFAULT '09:00'`);
  await run("User.scheduleTimezone",  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scheduleTimezone"  TEXT NOT NULL DEFAULT 'UTC'`);
  await run("User.scheduleFrequency", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scheduleFrequency" TEXT NOT NULL DEFAULT 'daily'`);
  await run("User.scheduleTopic",     `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scheduleTopic"     TEXT`);
  await run("User.schedulePlatforms", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "schedulePlatforms" TEXT NOT NULL DEFAULT '["facebook","instagram"]'`);
  await run("User.scheduleNextRun",   `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scheduleNextRun"   TIMESTAMP(3)`);

  // ── User columns — name ───────────────────────────────────────────
  await run("User.name", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT`);

  // ── Unique indexes (idempotent) ────────────────────────────────────
  await run("idx_User_referralCode",      `CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key"      ON "User"("referralCode") WHERE "referralCode" IS NOT NULL`);
  await run("idx_User_stripeCustomerId",  `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeCustomerId_key"  ON "User"("stripeCustomerId") WHERE "stripeCustomerId" IS NOT NULL`);
  await run("idx_User_stripeSubId",       `CREATE UNIQUE INDEX IF NOT EXISTS "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId") WHERE "stripeSubscriptionId" IS NOT NULL`);
  await run("idx_User_emailVerifyToken",  `CREATE UNIQUE INDEX IF NOT EXISTS "User_emailVerifyToken_key"  ON "User"("emailVerifyToken") WHERE "emailVerifyToken" IS NOT NULL`);
  await run("idx_User_resetToken",        `CREATE UNIQUE INDEX IF NOT EXISTS "User_resetToken_key"        ON "User"("resetToken") WHERE "resetToken" IS NOT NULL`);

  // ── Workspace table ────────────────────────────────────────────────
  await run("Workspace_table", `
    CREATE TABLE IF NOT EXISTS "Workspace" (
      "id"        TEXT NOT NULL,
      "name"      TEXT NOT NULL,
      "ownerId"   TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
    )
  `);
  await run("Workspace_ownerId_unique", `
    CREATE UNIQUE INDEX IF NOT EXISTS "Workspace_ownerId_key" ON "Workspace"("ownerId")
  `);
  await run("Workspace_ownerId_fkey", `
    DO $$ BEGIN
      ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey"
        FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // ── WorkspaceMember table ──────────────────────────────────────────
  await run("WorkspaceMember_table", `
    CREATE TABLE IF NOT EXISTS "WorkspaceMember" (
      "id"          TEXT NOT NULL,
      "workspaceId" TEXT NOT NULL,
      "userId"      TEXT NOT NULL,
      "role"        TEXT NOT NULL DEFAULT 'member',
      "joinedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
    )
  `);
  await run("WorkspaceMember_unique", `
    CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceMember_workspaceId_userId_key"
      ON "WorkspaceMember"("workspaceId", "userId")
  `);
  await run("WorkspaceMember_workspaceId_fkey", `
    DO $$ BEGIN
      ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await run("WorkspaceMember_userId_fkey", `
    DO $$ BEGIN
      ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // ── WorkspaceInvite table ──────────────────────────────────────────
  await run("WorkspaceInvite_table", `
    CREATE TABLE IF NOT EXISTS "WorkspaceInvite" (
      "id"          TEXT NOT NULL,
      "workspaceId" TEXT NOT NULL,
      "email"       TEXT NOT NULL,
      "role"        TEXT NOT NULL DEFAULT 'member',
      "token"       TEXT NOT NULL,
      "invitedById" TEXT NOT NULL,
      "expiresAt"   TIMESTAMP(3) NOT NULL,
      "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id")
    )
  `);
  await run("WorkspaceInvite_token_unique", `
    CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token")
  `);
  await run("WorkspaceInvite_workspaceId_email_unique", `
    CREATE UNIQUE INDEX IF NOT EXISTS "WorkspaceInvite_workspaceId_email_key"
      ON "WorkspaceInvite"("workspaceId", "email")
  `);
  await run("WorkspaceInvite_workspaceId_fkey", `
    DO $$ BEGIN
      ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  // -- AI Predictive Churn Detection -- User snapshot columns
  await run("User.churnRiskScore",   `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "churnRiskScore"   INTEGER`);
  await run("User.churnRiskTier",    `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "churnRiskTier"    TEXT`);
  await run("User.churnPredictedAt", `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "churnPredictedAt" TIMESTAMP(3)`);

  // -- AI Predictive Churn Detection -- ChurnPrediction table
  await run("ChurnPrediction_table", `
    CREATE TABLE IF NOT EXISTS "ChurnPrediction" (
      "id"             TEXT NOT NULL,
      "userId"         TEXT NOT NULL,
      "riskScore"      INTEGER NOT NULL,
      "riskTier"       TEXT NOT NULL,
      "reasoning"      TEXT NOT NULL,
      "redFlags"       TEXT NOT NULL DEFAULT '[]',
      "greenFlags"     TEXT NOT NULL DEFAULT '[]',
      "saveAction"     TEXT NOT NULL DEFAULT '',
      "saveActionType" TEXT NOT NULL DEFAULT 'none',
      "savePriority"   TEXT NOT NULL DEFAULT 'normal',
      "signalsJson"    TEXT NOT NULL DEFAULT '{}',
      "model"          TEXT NOT NULL DEFAULT 'gpt-4o-mini',
      "tokensIn"       INTEGER NOT NULL DEFAULT 0,
      "tokensOut"      INTEGER NOT NULL DEFAULT 0,
      "costCents"      INTEGER NOT NULL DEFAULT 0,
      "reviewed"       BOOLEAN NOT NULL DEFAULT false,
      "reviewedAt"     TIMESTAMP(3),
      "reviewerNote"   TEXT NOT NULL DEFAULT '',
      "outcome"        TEXT,
      "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ChurnPrediction_pkey" PRIMARY KEY ("id")
    )
  `);
  await run("ChurnPrediction_userId_fkey", `
    DO $$ BEGIN
      ALTER TABLE "ChurnPrediction" ADD CONSTRAINT "ChurnPrediction_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);
  await run("idx_ChurnPrediction_user_created", `
    CREATE INDEX IF NOT EXISTS "ChurnPrediction_userId_createdAt_idx"
      ON "ChurnPrediction"("userId", "createdAt" DESC)
  `);
  await run("idx_ChurnPrediction_riskScore", `
    CREATE INDEX IF NOT EXISTS "ChurnPrediction_riskScore_idx"
      ON "ChurnPrediction"("riskScore" DESC)
  `);
  await run("idx_ChurnPrediction_tier_created", `
    CREATE INDEX IF NOT EXISTS "ChurnPrediction_riskTier_createdAt_idx"
      ON "ChurnPrediction"("riskTier", "createdAt" DESC)
  `);

  const errorCount = Object.values(results).filter(v => v.startsWith("error")).length;
  return NextResponse.json({ done: true, errorCount, results });
}
