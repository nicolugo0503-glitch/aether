import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// One-time migration endpoint — locked after tables were created.
export async function GET(_req: NextRequest) {
  return NextResponse.json({ message: "Migration already applied." }, { status: 410 });

  const results: Record<string, string> = {};

  // ── RateLimit table ───────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RateLimit" (
        "key"     TEXT NOT NULL,
        "count"   INTEGER NOT NULL DEFAULT 0,
        "resetAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
      )
    `);
    results.RateLimit = "ok";
  } catch (e: unknown) {
    results.RateLimit = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  // ── Feedback table ────────────────────────────────────────────────
  try {
    await prisma.$executeRawUnsafe(`
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
    // Add FK only if User table exists — wrapped in its own try
    try {
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'Feedback_userId_fkey'
          ) THEN
            ALTER TABLE "Feedback"
              ADD CONSTRAINT "Feedback_userId_fkey"
              FOREIGN KEY ("userId") REFERENCES "User"("id")
              ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$
      `);
    } catch (_fkErr) {
      // FK is optional — table still works without it
    }
    results.Feedback = "ok";
  } catch (e: unknown) {
    results.Feedback = `error: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ done: true, results });
}
