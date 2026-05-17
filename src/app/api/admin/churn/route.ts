import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { predictChurn, savePrediction, scanAllUsers, type ChurnTier } from "@/lib/churn";

// AI Predictive Churn Detection — admin API
// ─────────────────────────────────────────────────────────────
// Gated by ADMIN_SECRET. Supports two passing modes:
//   - Authorization: Bearer <ADMIN_SECRET>
//   - ?secret=<ADMIN_SECRET>          (query param, convenient for dashboards)
//
// GET    /api/admin/churn               → latest prediction per user (sorted, with stats)
// POST   /api/admin/churn?action=scan   → re-scan active users now
// POST   /api/admin/churn?action=user&userId=<id>  → re-predict one user

export const runtime = "nodejs";
export const maxDuration = 300;

function authorize(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_SECRET env var not configured" },
      { status: 500 },
    );
  }
  const header = req.headers.get("authorization") || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const queryParam = req.nextUrl.searchParams.get("secret") || "";
  if (bearer !== expected && queryParam !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// GET — fetch latest snapshot per user, with rollup stats
// ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const unauth = authorize(req);
  if (unauth) return unauth;

  const tierFilter = (req.nextUrl.searchParams.get("tier") || "").toUpperCase();
  const limit = Math.min(
    500,
    Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "200", 10) || 200),
  );

  try {
    // Pull every User that has a churn snapshot, sorted by risk.
    const users = await prisma.user.findMany({
      where: {
        churnPredictedAt: { not: null },
        ...(["CRITICAL", "HIGH", "MEDIUM", "LOW", "HEALTHY"].includes(tierFilter)
          ? { churnRiskTier: tierFilter }
          : {}),
      },
      orderBy: [{ churnRiskScore: "desc" }, { churnPredictedAt: "desc" }],
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        createdAt: true,
        planRenewsAt: true,
        runsUsedThisPeriod: true,
        churnRiskScore: true,
        churnRiskTier: true,
        churnPredictedAt: true,
      },
    });

    // For each user, attach latest prediction details (reasoning, saveAction, flags).
    const predictions = await prisma.churnPrediction.findMany({
      where: { userId: { in: users.map(u => u.id) } },
      orderBy: { createdAt: "desc" },
    });
    const latestById = new Map<string, typeof predictions[number]>();
    for (const p of predictions) {
      if (!latestById.has(p.userId)) latestById.set(p.userId, p);
    }

    const rows = users.map(u => {
      const p = latestById.get(u.id);
      return {
        userId: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        createdAt: u.createdAt,
        planRenewsAt: u.planRenewsAt,
        runsUsedThisPeriod: u.runsUsedThisPeriod,
        riskScore: u.churnRiskScore ?? 0,
        riskTier: (u.churnRiskTier ?? "HEALTHY") as ChurnTier,
        predictedAt: u.churnPredictedAt,
        reasoning:      p?.reasoning ?? "",
        saveAction:     p?.saveAction ?? "",
        saveActionType: p?.saveActionType ?? "none",
        savePriority:   p?.savePriority ?? "low",
        redFlags:    safeParseArray(p?.redFlags),
        greenFlags:  safeParseArray(p?.greenFlags),
        reviewed:    p?.reviewed ?? false,
        reviewerNote: p?.reviewerNote ?? "",
        outcome:     p?.outcome ?? null,
      };
    });

    // Rollup stats
    const totals = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: { not: "FREE" } } }),
      prisma.user.count({ where: { churnRiskTier: "CRITICAL" } }),
      prisma.user.count({ where: { churnRiskTier: "HIGH" } }),
      prisma.user.count({ where: { churnRiskTier: "MEDIUM" } }),
      prisma.user.count({ where: { churnRiskTier: "LOW" } }),
      prisma.user.count({ where: { churnRiskTier: "HEALTHY" } }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers:    totals[0],
        payingUsers:   totals[1],
        critical:      totals[2],
        high:          totals[3],
        medium:        totals[4],
        low:           totals[5],
        healthy:       totals[6],
        analyzed:      users.length,
      },
      rows,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// ──────────────────────────────────────────────────────────────
// POST — run a new scan, or re-predict a single user
// ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const unauth = authorize(req);
  if (unauth) return unauth;

  const action = req.nextUrl.searchParams.get("action") || "scan";

  try {
    if (action === "user") {
      const userId = req.nextUrl.searchParams.get("userId") || "";
      if (!userId) {
        return NextResponse.json({ error: "userId required" }, { status: 400 });
      }
      const result = await predictChurn(userId);
      if (!result) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      await savePrediction(result);
      return NextResponse.json({ ok: true, prediction: {
        riskScore: result.riskScore,
        riskTier:  result.riskTier,
        reasoning: result.reasoning,
        redFlags:  result.redFlags,
        greenFlags: result.greenFlags,
        saveAction: result.saveAction,
        saveActionType: result.saveActionType,
        savePriority:   result.savePriority,
        costCents: result.costCents,
      }});
    }

    if (action === "review") {
      // Mark a prediction as reviewed (CSM workflow)
      const id = req.nextUrl.searchParams.get("predictionId") || "";
      const outcome = req.nextUrl.searchParams.get("outcome") || "";
      const note = req.nextUrl.searchParams.get("note") || "";
      if (!id) return NextResponse.json({ error: "predictionId required" }, { status: 400 });
      await prisma.churnPrediction.update({
        where: { id },
        data: {
          reviewed: true,
          reviewedAt: new Date(),
          reviewerNote: note.slice(0, 600),
          outcome: ["saved", "churned", "still_at_risk"].includes(outcome) ? outcome : null,
        },
      });
      return NextResponse.json({ ok: true });
    }

    // Default: full scan
    const maxUsers = Math.min(
      2000,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("max") || "500", 10) || 500),
    );
    const concurrency = Math.min(
      10,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("c") || "5", 10) || 5),
    );
    const activeWithinDays = Math.min(
      365,
      Math.max(1, parseInt(req.nextUrl.searchParams.get("days") || "90", 10) || 90),
    );

    const summary = await scanAllUsers({
      maxUsers,
      concurrency,
      activeWithinDays,
      persist: true,
    });
    return NextResponse.json({ ok: true, summary });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
}

function safeParseArray(v: string | null | undefined): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter(s => typeof s === "string") : [];
  } catch {
    return [];
  }
}
