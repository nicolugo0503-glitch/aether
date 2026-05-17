// AI Predictive Churn Detection
// ─────────────────────────────────────────────────────────────
// Given a user, compute behavioral signals (run cadence, plan,
// setup completion, error rate, days since last activity, usage
// trend), then ask GPT-4o-mini to:
//   1. Score 30-day churn risk on a 0-100 scale
//   2. Bucket into a tier (CRITICAL/HIGH/MEDIUM/LOW/HEALTHY)
//   3. Explain the reasoning in 2-3 sentences
//   4. List the strongest red flags
//   5. Recommend a specific save action for the CSM team
//
// Designed to be cheap: one ~250-token completion per user.
// Cost target: < $0.001 per user per scan. A 10k-user base costs
// less than $10 to scan end-to-end with gpt-4o-mini.

import OpenAI from "openai";
import { prisma } from "./db";
import { DEFAULT_MODEL, estimateCostCents } from "./ai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "placeholder-set-in-vercel",
    });
  }
  return _openai;
}

export type ChurnTier = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "HEALTHY";
export type SaveActionType = "email" | "call" | "discount" | "tutorial" | "none";
export type SavePriority = "urgent" | "high" | "normal" | "low";

// ──────────────────────────────────────────────────────────────
// Signals — computed deterministically from the DB.
// These are what we feed to the model.
// ──────────────────────────────────────────────────────────────
export interface ChurnSignals {
  // Identity
  userId: string;
  email: string;

  // Plan / billing
  plan: string;                  // "FREE" | "STARTER" | "GROWTH" | "SCALE"
  isPaying: boolean;
  daysOnPlan: number;
  daysUntilRenewal: number | null;
  runsUsedThisPeriod: number;
  runsBudget: number;            // monthly plan cap (+ bonus runs)
  utilizationPct: number;        // runsUsed / runsBudget

  // Activity
  daysSinceLastRun: number | null;     // null if never ran
  daysSinceSignup: number;
  runsLast7Days: number;
  runsLast30Days: number;
  runsPrev30Days: number;              // 30-60d ago, for trend
  usageTrend: "growing" | "flat" | "declining" | "dormant" | "new";

  // Quality
  errorRateLast30Days: number;         // 0-1
  successfulRunsLast30Days: number;

  // Setup completeness (proxy for product engagement depth)
  setupScore: number;                  // 0-100
  hasIntegrations: boolean;            // resend or social configured
  agentCount: number;
  campaignCount: number;
  workflowCount: number;
  competitorCount: number;

  // Engagement breadth (how many features they've touched)
  featuresUsed: string[];

  // Onboarding
  onboardingComplete: boolean;
  emailVerified: boolean;
}

export interface ChurnPredictionResult {
  riskScore: number;                // 0-100
  riskTier: ChurnTier;
  reasoning: string;                // 2-3 sentences
  redFlags: string[];               // ≤5
  greenFlags: string[];             // ≤3
  saveAction: string;               // recommended specific play
  saveActionType: SaveActionType;
  savePriority: SavePriority;
  signals: ChurnSignals;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  model: string;
}

// ──────────────────────────────────────────────────────────────
// Signal extraction
// ──────────────────────────────────────────────────────────────
export async function computeChurnSignals(userId: string): Promise<ChurnSignals | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = new Date(now - 7 * day);
  const thirtyDaysAgo = new Date(now - 30 * day);
  const sixtyDaysAgo = new Date(now - 60 * day);

  // Fire all signal queries in parallel — never let a failed sub-query
  // crash the whole prediction; default to safe zero values.
  const [
    lastRun,
    runs7,
    runs30,
    runsPrev30,
    runs30Errors,
    runs30Success,
    agentCount,
    campaignCount,
    workflowCount,
    competitorCount,
    socialCount,
    inboxCount,
  ] = await Promise.all([
    prisma.run.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }).catch(() => null),
    prisma.run.count({ where: { userId, createdAt: { gte: sevenDaysAgo } } }).catch(() => 0),
    prisma.run.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }).catch(() => 0),
    prisma.run.count({
      where: { userId, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }).catch(() => 0),
    prisma.run.count({
      where: { userId, status: "error", createdAt: { gte: thirtyDaysAgo } },
    }).catch(() => 0),
    prisma.run.count({
      where: { userId, status: "success", createdAt: { gte: thirtyDaysAgo } },
    }).catch(() => 0),
    prisma.agent.count({ where: { userId } }).catch(() => 0),
    prisma.campaign.count({ where: { userId } }).catch(() => 0),
    prisma.workflow.count({ where: { userId } }).catch(() => 0),
    prisma.competitor.count({ where: { userId } }).catch(() => 0),
    prisma.socialPost.count({ where: { userId } }).catch(() => 0),
    prisma.emailReply.count({ where: { userId } }).catch(() => 0),
  ]);

  const daysSinceLastRun = lastRun
    ? Math.floor((now - lastRun.createdAt.getTime()) / day)
    : null;
  const daysSinceSignup = Math.max(0, Math.floor((now - user.createdAt.getTime()) / day));
  const daysUntilRenewal = user.planRenewsAt
    ? Math.floor((user.planRenewsAt.getTime() - now) / day)
    : null;

  // Trend bucket — compare last 30d to the 30d before that
  let usageTrend: ChurnSignals["usageTrend"] = "flat";
  if (daysSinceSignup < 14) {
    usageTrend = "new";
  } else if (runs30 === 0 && runsPrev30 > 0) {
    usageTrend = "dormant";
  } else if (runs30 === 0 && runsPrev30 === 0) {
    usageTrend = "dormant";
  } else if (runsPrev30 === 0) {
    usageTrend = runs30 > 0 ? "growing" : "flat";
  } else {
    const ratio = runs30 / Math.max(runsPrev30, 1);
    if (ratio >= 1.2) usageTrend = "growing";
    else if (ratio <= 0.6) usageTrend = "declining";
    else usageTrend = "flat";
  }

  const totalRuns30 = runs30Success + runs30Errors;
  const errorRate = totalRuns30 > 0 ? runs30Errors / totalRuns30 : 0;

  // Plan limits — local copy to avoid an import cycle with stripe.ts
  const PLAN_RUNS: Record<string, number> = {
    FREE:    20,
    STARTER: 500,
    GROWTH:  2500,
    SCALE:   10000,
  };
  const planKey = (user.plan || "FREE").toUpperCase();
  const baseLimit = PLAN_RUNS[planKey] ?? PLAN_RUNS.FREE;
  const runsBudget = baseLimit + (user.referralBonusRuns ?? 0);
  const utilizationPct = runsBudget > 0
    ? Math.min(100, Math.round((user.runsUsedThisPeriod / runsBudget) * 100))
    : 0;

  // Setup completeness — weighted checks for "did you actually configure the product?"
  const checks: Array<[string, boolean]> = [
    ["email_verified",     !!user.emailVerified],
    ["onboarding_done",    !!user.onboardingComplete],
    ["resend_configured",  !!user.resendApiKey],
    ["from_email_set",     !!user.fromEmail],
    ["social_configured",  !!(user.fbPageToken || user.twitterAccessToken)],
    ["serper_configured",  !!user.serperApiKey],
    ["has_agent",          agentCount > 0],
    ["has_campaign",       campaignCount > 0],
    ["has_workflow",       workflowCount > 0],
    ["has_competitor",     competitorCount > 0],
  ];
  const passed = checks.filter(([, v]) => v).length;
  const setupScore = Math.round((passed / checks.length) * 100);
  const hasIntegrations = !!(
    user.resendApiKey || user.fbPageToken || user.twitterAccessToken
  );

  const featuresUsed: string[] = [];
  if (agentCount > 0)      featuresUsed.push("agents");
  if (campaignCount > 0)   featuresUsed.push("campaigns");
  if (workflowCount > 0)   featuresUsed.push("workflows");
  if (competitorCount > 0) featuresUsed.push("competitors");
  if (socialCount > 0)     featuresUsed.push("social");
  if (inboxCount > 0)      featuresUsed.push("inbox");

  const isPaying = planKey !== "FREE";

  return {
    userId: user.id,
    email: user.email,
    plan: planKey,
    isPaying,
    daysOnPlan: daysSinceSignup,
    daysUntilRenewal,
    runsUsedThisPeriod: user.runsUsedThisPeriod,
    runsBudget,
    utilizationPct,
    daysSinceLastRun,
    daysSinceSignup,
    runsLast7Days: runs7,
    runsLast30Days: runs30,
    runsPrev30Days: runsPrev30,
    usageTrend,
    errorRateLast30Days: Math.round(errorRate * 1000) / 1000,
    successfulRunsLast30Days: runs30Success,
    setupScore,
    hasIntegrations,
    agentCount,
    campaignCount,
    workflowCount,
    competitorCount,
    featuresUsed,
    onboardingComplete: !!user.onboardingComplete,
    emailVerified: !!user.emailVerified,
  };
}

// ──────────────────────────────────────────────────────────────
// The prompt — terse, JSON-output, expert framing
// ──────────────────────────────────────────────────────────────
const CHURN_SYSTEM_PROMPT = `You are a senior SaaS Customer Success operator at "Aether", an AI-workforce platform.
Your job: predict each user's 30-day churn risk and recommend a specific save play for the CSM team.

Output a JSON object with this exact shape:
{
  "riskScore": <integer 0-100>,
  "riskTier": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "HEALTHY",
  "reasoning": "<2-3 sentence executive summary, concrete and specific>",
  "redFlags": ["<short signal>", ...],         // max 5, may be empty
  "greenFlags": ["<short signal>", ...],       // max 3, may be empty
  "saveAction": "<one specific, actionable next step a CSM should take>",
  "saveActionType": "email" | "call" | "discount" | "tutorial" | "none",
  "savePriority": "urgent" | "high" | "normal" | "low"
}

Risk rubric (anchor your scoring to these):
- 80-100 (CRITICAL): paying customer, declining/dormant usage, renewal approaching. Save now or lose them.
- 60-79  (HIGH):     low engagement, paid plan, incomplete setup, or trending down sharply.
- 40-59  (MEDIUM):   mixed signals — some activity but red flags present.
- 20-39  (LOW):      mostly healthy with one minor concern.
- 0-19   (HEALTHY):  active, growing, well-configured — leave alone.

Tier mapping is strict: derive tier from score.
- score >= 80 → "CRITICAL"
- score 60-79 → "HIGH"
- score 40-59 → "MEDIUM"
- score 20-39 → "LOW"
- score < 20  → "HEALTHY"

Critical rules:
- FREE-tier users with <14 days of tenure are "new", not "at risk" — score them LOW unless setup is abandoned entirely.
- Dormant paying customers approaching renewal are ALWAYS at minimum HIGH.
- A declining trend on a paid plan is more alarming than zero activity on FREE.
- Empty setup (no agents, no integrations) is the #1 leading indicator for FREE-tier churn.
- High error rate (>20%) is a red flag even if volume is high.
- Reward depth: users touching 3+ features rarely churn.

Save action guidance — be specific:
- "Send re-engagement email highlighting Workflows" is better than "send email".
- "Book a 1:1 onboarding call — they have 0 agents after 21 days" is better than "reach out".
- "Apply 20% retention discount before renewal in 5 days" for at-risk paid users.

Output ONLY the JSON object. No prose, no markdown fences.`;

function formatSignalsForPrompt(s: ChurnSignals): string {
  const lastRunLine = s.daysSinceLastRun === null
    ? "- Last run: NEVER"
    : `- Last run: ${s.daysSinceLastRun} days ago`;

  const renewalLine = s.daysUntilRenewal === null
    ? "- Renewal: n/a (no active subscription)"
    : `- Renewal: in ${s.daysUntilRenewal} days`;

  return [
    "USER SIGNALS:",
    `- Plan: ${s.plan} ${s.isPaying ? "(paying)" : "(free)"}`,
    `- Tenure: ${s.daysSinceSignup} days since signup`,
    renewalLine,
    `- Runs this period: ${s.runsUsedThisPeriod} / ${s.runsBudget} (${s.utilizationPct}% utilization)`,
    `- Runs last 7d: ${s.runsLast7Days}`,
    `- Runs last 30d: ${s.runsLast30Days} (prev 30d: ${s.runsPrev30Days}) → trend: ${s.usageTrend}`,
    lastRunLine,
    `- Error rate (30d): ${(s.errorRateLast30Days * 100).toFixed(1)}%`,
    `- Setup score: ${s.setupScore}/100  (verified=${s.emailVerified}, onboarded=${s.onboardingComplete}, integrations=${s.hasIntegrations})`,
    `- Resources: ${s.agentCount} agents, ${s.campaignCount} campaigns, ${s.workflowCount} workflows, ${s.competitorCount} competitors`,
    `- Features touched: ${s.featuresUsed.length ? s.featuresUsed.join(", ") : "(none)"}`,
    "",
    "Return the JSON prediction now.",
  ].join("\n");
}

// ──────────────────────────────────────────────────────────────
// Predict — single user
// ──────────────────────────────────────────────────────────────
export async function predictChurn(
  userId: string,
  opts: { model?: string } = {},
): Promise<ChurnPredictionResult | null> {
  const signals = await computeChurnSignals(userId);
  if (!signals) return null;

  const model = opts.model || DEFAULT_MODEL;
  const userMsg = formatSignalsForPrompt(signals);

  const completion = await getOpenAI().chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: CHURN_SYSTEM_PROMPT },
      { role: "user",   content: userMsg },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const tokensIn = completion.usage?.prompt_tokens ?? 0;
  const tokensOut = completion.usage?.completion_tokens ?? 0;

  let parsed: Partial<ChurnPredictionResult> = {};
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  const riskScore = clampInt(parsed.riskScore, 0, 100, 30);
  const riskTier = deriveTier(riskScore);
  const reasoning = typeof parsed.reasoning === "string" && parsed.reasoning.trim()
    ? parsed.reasoning.trim().slice(0, 480)
    : "No reasoning provided.";
  const redFlags = sanitizeStringArray(parsed.redFlags, 5);
  const greenFlags = sanitizeStringArray(parsed.greenFlags, 3);
  const saveAction = typeof parsed.saveAction === "string" && parsed.saveAction.trim()
    ? parsed.saveAction.trim().slice(0, 240)
    : "Monitor; no immediate action needed.";
  const saveActionType = normalizeSaveActionType(parsed.saveActionType);
  const savePriority = normalizeSavePriority(parsed.savePriority, riskTier);

  return {
    riskScore,
    riskTier,
    reasoning,
    redFlags,
    greenFlags,
    saveAction,
    saveActionType,
    savePriority,
    signals,
    tokensIn,
    tokensOut,
    costCents: estimateCostCents(model, tokensIn, tokensOut),
    model,
  };
}

// ──────────────────────────────────────────────────────────────
// Persist — write prediction to DB and update User snapshot fields
// ──────────────────────────────────────────────────────────────
export async function savePrediction(p: ChurnPredictionResult): Promise<void> {
  await prisma.$transaction([
    prisma.churnPrediction.create({
      data: {
        userId:         p.signals.userId,
        riskScore:      p.riskScore,
        riskTier:       p.riskTier,
        reasoning:      p.reasoning,
        redFlags:       JSON.stringify(p.redFlags),
        greenFlags:     JSON.stringify(p.greenFlags),
        saveAction:     p.saveAction,
        saveActionType: p.saveActionType,
        savePriority:   p.savePriority,
        signalsJson:    JSON.stringify(p.signals),
        model:          p.model,
        tokensIn:       p.tokensIn,
        tokensOut:      p.tokensOut,
        costCents:      p.costCents,
      },
    }),
    prisma.user.update({
      where: { id: p.signals.userId },
      data: {
        churnRiskScore:   p.riskScore,
        churnRiskTier:    p.riskTier,
        churnPredictedAt: new Date(),
      },
    }),
  ]);
}

// ──────────────────────────────────────────────────────────────
// Scan many users — bounded concurrency
// ──────────────────────────────────────────────────────────────
export interface ScanOptions {
  /** Only scan users updated/active within this many days. Default: 90. */
  activeWithinDays?: number;
  /** Max users per scan run. Default: 500. */
  maxUsers?: number;
  /** Concurrency for OpenAI calls. Default: 5. */
  concurrency?: number;
  /** Persist results to DB. Default: true. */
  persist?: boolean;
  /** Optional model override. */
  model?: string;
}

export interface ScanSummary {
  scanned: number;
  failed: number;
  byTier: Record<ChurnTier, number>;
  totalCostCents: number;
  totalTokensIn: number;
  totalTokensOut: number;
  durationMs: number;
}

export async function scanAllUsers(opts: ScanOptions = {}): Promise<ScanSummary> {
  const {
    activeWithinDays = 90,
    maxUsers = 500,
    concurrency = 5,
    persist = true,
    model,
  } = opts;

  const cutoff = new Date(Date.now() - activeWithinDays * 24 * 60 * 60 * 1000);
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: cutoff } },
    orderBy: { createdAt: "desc" },
    take: maxUsers,
    select: { id: true },
  });

  const t0 = Date.now();
  const summary: ScanSummary = {
    scanned: 0,
    failed: 0,
    byTier: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, HEALTHY: 0 },
    totalCostCents: 0,
    totalTokensIn: 0,
    totalTokensOut: 0,
    durationMs: 0,
  };

  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= users.length) return;
      const userId = users[idx].id;
      try {
        const result = await predictChurn(userId, { model });
        if (!result) { summary.failed++; continue; }
        if (persist) await savePrediction(result);
        summary.scanned++;
        summary.byTier[result.riskTier]++;
        summary.totalCostCents += result.costCents;
        summary.totalTokensIn  += result.tokensIn;
        summary.totalTokensOut += result.tokensOut;
      } catch {
        summary.failed++;
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, users.length) }, worker),
  );

  summary.durationMs = Date.now() - t0;
  return summary;
}

// ──────────────────────────────────────────────────────────────
// Tier presentation helpers — shared with dashboard page
// ──────────────────────────────────────────────────────────────
export function tierColor(tier: ChurnTier): { bg: string; fg: string; border: string; dot: string } {
  switch (tier) {
    case "CRITICAL": return { bg: "rgba(239,68,68,0.14)",   fg: "#fca5a5", border: "rgba(239,68,68,0.45)",   dot: "#ef4444" };
    case "HIGH":     return { bg: "rgba(249,115,22,0.13)",  fg: "#fdba74", border: "rgba(249,115,22,0.40)",  dot: "#f97316" };
    case "MEDIUM":   return { bg: "rgba(245,158,11,0.12)",  fg: "#fcd34d", border: "rgba(245,158,11,0.35)",  dot: "#f59e0b" };
    case "LOW":      return { bg: "rgba(124,58,237,0.12)",  fg: "#c4b5fd", border: "rgba(124,58,237,0.35)",  dot: "#7c3aed" };
    case "HEALTHY":  return { bg: "rgba(16,185,129,0.12)",  fg: "#6ee7b7", border: "rgba(16,185,129,0.35)",  dot: "#10b981" };
  }
}

export function tierLabel(tier: ChurnTier): string {
  if (tier === "CRITICAL") return "Critical";
  if (tier === "HIGH")     return "High risk";
  if (tier === "MEDIUM")   return "Medium";
  if (tier === "LOW")      return "Low";
  return "Healthy";
}

/* ── helpers ─────────────────────────────────────────────── */

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function deriveTier(score: number): ChurnTier {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "HEALTHY";
}

function sanitizeStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map(s => s.trim().slice(0, 140))
    .slice(0, max);
}

function normalizeSaveActionType(v: unknown): SaveActionType {
  const s = typeof v === "string" ? v.toLowerCase() : "";
  if (s === "email" || s === "call" || s === "discount" || s === "tutorial") return s;
  return "none";
}

function normalizeSavePriority(v: unknown, tier: ChurnTier): SavePriority {
  const s = typeof v === "string" ? v.toLowerCase() : "";
  if (s === "urgent" || s === "high" || s === "normal" || s === "low") return s as SavePriority;
  // Fall back to a sensible default keyed off tier
  if (tier === "CRITICAL") return "urgent";
  if (tier === "HIGH")     return "high";
  if (tier === "MEDIUM")   return "normal";
  return "low";
}
