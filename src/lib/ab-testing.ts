// ─────────────────────────────────────────────────────────────
// Automated A/B Testing Engine
//
// Aether campaigns can run up to 4 email variants in parallel.
// This module:
//   1. Generates 2-4 distinct variants from a single base prompt
//      using GPT-4o-mini (different angles / hooks / tones).
//   2. Assigns a lead to a variant on send (weighted round-robin).
//   3. Computes per-variant performance — sent, open, click,
//      reply, hot-reply rates, lift vs. control, and a
//      two-proportion z-test for statistical significance.
//   4. Picks a winner once min-sample + confidence thresholds
//      are met (or honors a manual pick).
//   5. Substitutes {{name}} / {{firstName}} / {{company}} /
//      {{email}} tokens in the variant templates.
//
// Designed so a single campaign run can become a self-optimizing
// outreach engine — Aether learns which message wins and routes
// the rest of the leads to it automatically.
// ─────────────────────────────────────────────────────────────

import OpenAI from "openai";
import { estimateCostCents, DEFAULT_MODEL } from "./ai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "placeholder-set-in-vercel",
    });
  }
  return _openai;
}

// ─── Types ──────────────────────────────────────────────────

export type WinnerMetric =
  | "reply_rate"
  | "hot_reply_rate"
  | "open_rate"
  | "click_rate";

export interface VariantTemplate {
  label: string;          // "A" | "B" | "C" | "D"
  name: string;           // "Pain-point hook"
  angle: string;          // 1-line strategy
  subjectTemplate: string;
  bodyTemplate: string;
  tone: "professional" | "casual" | "bold" | "warm";
}

export interface GenerateVariantsParams {
  basePrompt: string;            // user description: "intro Aether to founders, lead with time savings"
  productName?: string;          // e.g. "Aether"
  numVariants?: number;          // default 2, max 4
  audience?: string;             // optional ICP blurb
  model?: string;
}

export interface GenerateVariantsResult {
  variants: VariantTemplate[];
  tokensIn: number;
  tokensOut: number;
  costCents: number;
}

export interface VariantStats {
  id: string;
  label: string;
  name: string;
  isControl: boolean;
  isWinner: boolean;
  active: boolean;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  hotReplied: number;
  errors: number;
  openRate: number;          // 0-100
  clickRate: number;
  replyRate: number;
  hotReplyRate: number;
  liftVsControl: number | null;   // pct points vs control on the chosen metric (null if no control / no data)
  pValue: number | null;          // two-proportion z-test p-value vs control (null if no control)
  isSignificant: boolean;         // vs control on chosen metric at the configured confidence
  metricValue: number;            // value of chosen metric (0-100)
}

export interface VariantInput {
  id: string;
  label: string;
  name: string;
  isControl: boolean;
  isWinner: boolean;
  active: boolean;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  hotRepliedCount: number;
  errorCount: number;
}

// ─── Variant generation (AI) ────────────────────────────────

const GEN_SYSTEM_PROMPT = `You are a world-class B2B cold-email copywriter running an A/B test for an AI-workforce SaaS company.

You will receive:
- A base prompt describing what the user wants to pitch.
- The number of distinct variants requested (2-4).

Output: a JSON object of shape
{
  "variants": [
    {
      "label": "A" | "B" | "C" | "D",
      "name": "<3-5 word human label, e.g. 'Pain-point opener'>",
      "angle": "<one sentence describing this variant's strategy>",
      "subjectTemplate": "<email subject, can use {{firstName}} {{company}} tokens>",
      "bodyTemplate": "<5-9 line plain-text email body, can use {{name}} {{firstName}} {{company}} {{email}} tokens, ends with a signoff line>",
      "tone": "professional" | "casual" | "bold" | "warm"
    },
    ...
  ]
}

CRITICAL RULES — these are what makes an A/B test meaningful:
1. Each variant must take a GENUINELY DIFFERENT strategic approach. Examples of distinct angles:
   - Variant A: pain-point hook (lead with the cost of the problem)
   - Variant B: social proof (lead with a peer/customer logo)
   - Variant C: ultra-short / conversational (3 sentences max, low-effort feel)
   - Variant D: bold claim / contrarian (provocative one-liner opener)
2. Subject lines must differ in style — never just paraphrase each other.
3. NO marketing fluff, NO emojis, NO ALL CAPS.
4. Each body is 5-9 lines. Real humans, real punctuation.
5. Every variant must use {{firstName}} once and feel personalized.
6. End each body with a single clear call-to-action line.
7. Output ONLY the JSON. No markdown fences, no commentary.`;

export async function generateVariants(
  params: GenerateVariantsParams,
): Promise<GenerateVariantsResult> {
  const {
    basePrompt,
    productName = "our platform",
    numVariants = 2,
    audience = "",
    model = DEFAULT_MODEL,
  } = params;

  const n = Math.min(4, Math.max(2, numVariants));

  const userMsg = [
    `Product: ${productName}`,
    audience ? `Audience / ICP: ${audience}` : "",
    `Base prompt: ${basePrompt}`,
    `Generate exactly ${n} variants, labeled ${["A", "B", "C", "D"].slice(0, n).join(", ")}.`,
  ].filter(Boolean).join("\n");

  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model,
    temperature: 0.85,                     // high — we want creative divergence
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: GEN_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  let parsed: { variants?: VariantTemplate[] } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { variants: [] };
  }

  const tokensIn = completion.usage?.prompt_tokens ?? 0;
  const tokensOut = completion.usage?.completion_tokens ?? 0;
  const costCents = estimateCostCents(model, tokensIn, tokensOut);

  const validTones = new Set(["professional", "casual", "bold", "warm"]);
  const cleaned: VariantTemplate[] = (parsed.variants || [])
    .slice(0, n)
    .map((v, idx) => ({
      label: (v.label || ["A", "B", "C", "D"][idx]).slice(0, 2).toUpperCase(),
      name: (v.name || `Variant ${["A", "B", "C", "D"][idx]}`).slice(0, 60),
      angle: (v.angle || "").slice(0, 240),
      subjectTemplate: (v.subjectTemplate || "Quick note for {{firstName}}").slice(0, 240),
      bodyTemplate: (v.bodyTemplate || "Hi {{firstName}},\n\nWanted to reach out.\n\n—").slice(0, 3000),
      tone: validTones.has(v.tone) ? v.tone : "professional",
    }));

  if (cleaned.length === 0) {
    // Defensive fallback so the UI never sees an empty result.
    cleaned.push({
      label: "A",
      name: "Default",
      angle: "Direct, professional intro",
      subjectTemplate: "Quick question, {{firstName}}",
      bodyTemplate:
        "Hi {{firstName}},\n\nI saw what {{company}} is doing and wanted to reach out. " +
        "Would love 15 minutes to share an idea that's helped similar teams.\n\nWorth a quick chat?\n\n— Sent via Aether",
      tone: "professional",
    });
  }

  return { variants: cleaned, tokensIn, tokensOut, costCents };
}

// ─── Variant selection at send time ─────────────────────────

interface PickContext {
  activeVariants: VariantInput[];
  abWinnerVariantId?: string | null;
}

/**
 * Pick the variant a lead should receive.
 *
 * If a winner has been locked in, always return it.
 * Otherwise distribute by weight using sentCount — the variant
 * furthest from its target share gets the next send. This is
 * deterministic and avoids the streaks pure-random assignment
 * produces on small batches.
 */
export function pickVariant(
  ctx: PickContext,
  weightsById: Record<string, number>,
): VariantInput | null {
  const active = ctx.activeVariants.filter(v => v.active);
  if (active.length === 0) return null;

  // Winner locked → always route there.
  if (ctx.abWinnerVariantId) {
    const w = ctx.activeVariants.find(v => v.id === ctx.abWinnerVariantId);
    if (w && w.active) return w;
  }

  if (active.length === 1) return active[0];

  const totalWeight = active.reduce((sum, v) => sum + (weightsById[v.id] ?? 50), 0) || 1;
  const totalSent   = active.reduce((sum, v) => sum + v.sentCount, 0);

  // Find variant whose current share is furthest below its target share.
  let pick: VariantInput = active[0];
  let worstDeficit = -Infinity;
  for (const v of active) {
    const target = (weightsById[v.id] ?? 50) / totalWeight;
    const current = totalSent === 0 ? 0 : v.sentCount / totalSent;
    const deficit = target - current;
    if (deficit > worstDeficit) {
      worstDeficit = deficit;
      pick = v;
    }
  }
  return pick;
}

// ─── Template substitution ──────────────────────────────────

export interface RenderContext {
  name?: string;
  email?: string;
  company?: string;
  customFields?: Record<string, string | undefined>;
}

export function renderTemplate(tpl: string, ctx: RenderContext): string {
  const name = (ctx.name || "").trim();
  const firstName = name.split(/\s+/)[0] || "there";
  const company = (ctx.company || "").trim();
  const email = (ctx.email || "").trim();

  const replacements: Record<string, string> = {
    name: name || "there",
    firstName,
    first_name: firstName,
    company: company || "your team",
    email,
    ...(ctx.customFields || {}),
  };

  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => {
    const k = String(key);
    if (k in replacements && replacements[k] !== undefined) return String(replacements[k]);
    return ""; // unknown token → empty (safer than leaving raw "{{x}}" in an outbound email)
  });
}

// ─── Stats + significance ───────────────────────────────────

function rate(num: number, denom: number): number {
  if (denom <= 0) return 0;
  return (num / denom) * 100;
}

function metricCount(v: VariantInput, metric: WinnerMetric): number {
  switch (metric) {
    case "reply_rate":     return v.repliedCount;
    case "hot_reply_rate": return v.hotRepliedCount;
    case "open_rate":      return v.openedCount;
    case "click_rate":     return v.clickedCount;
  }
}

function confidenceZ(confidencePct: number): number {
  if (confidencePct >= 99) return 2.576;
  if (confidencePct >= 95) return 1.96;
  if (confidencePct >= 90) return 1.645;
  return 1.96;
}

/** Standard normal CDF approximation (Abramowitz & Stegun 26.2.17). */
function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

/**
 * Two-proportion z-test (two-sided). Returns p-value.
 * Null hypothesis: control rate == variant rate.
 */
function twoProportionPValue(
  successA: number,
  totalA: number,
  successB: number,
  totalB: number,
): number | null {
  if (totalA < 1 || totalB < 1) return null;
  const pA = successA / totalA;
  const pB = successB / totalB;
  const pPool = (successA + successB) / (totalA + totalB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / totalA + 1 / totalB));
  if (se === 0) return null;
  const z = (pB - pA) / se;
  const p = 2 * (1 - normalCdf(Math.abs(z)));
  return Math.max(0, Math.min(1, p));
}

export function computeVariantStats(
  variants: VariantInput[],
  metric: WinnerMetric,
  confidencePct: number,
): VariantStats[] {
  const control = variants.find(v => v.isControl) || variants[0];

  return variants.map(v => {
    const metricValue = (() => {
      switch (metric) {
        case "reply_rate":     return rate(v.repliedCount, v.sentCount);
        case "hot_reply_rate": return rate(v.hotRepliedCount, v.sentCount);
        case "open_rate":      return rate(v.openedCount, v.sentCount);
        case "click_rate":     return rate(v.clickedCount, v.sentCount);
      }
    })();

    let liftVsControl: number | null = null;
    let pValue: number | null = null;
    let isSignificant = false;

    if (control && control.id !== v.id) {
      const controlValue = (() => {
        switch (metric) {
          case "reply_rate":     return rate(control.repliedCount, control.sentCount);
          case "hot_reply_rate": return rate(control.hotRepliedCount, control.sentCount);
          case "open_rate":      return rate(control.openedCount, control.sentCount);
          case "click_rate":     return rate(control.clickedCount, control.sentCount);
        }
      })();
      liftVsControl = metricValue - controlValue;
      pValue = twoProportionPValue(
        metricCount(control, metric),
        control.sentCount,
        metricCount(v, metric),
        v.sentCount,
      );
      const alpha = 1 - confidencePct / 100;
      if (pValue !== null && pValue < alpha) isSignificant = true;
    }

    return {
      id: v.id,
      label: v.label,
      name: v.name,
      isControl: v.isControl,
      isWinner: v.isWinner,
      active: v.active,
      sent: v.sentCount,
      opened: v.openedCount,
      clicked: v.clickedCount,
      replied: v.repliedCount,
      hotReplied: v.hotRepliedCount,
      errors: v.errorCount,
      openRate: round(rate(v.openedCount, v.sentCount), 1),
      clickRate: round(rate(v.clickedCount, v.sentCount), 1),
      replyRate: round(rate(v.repliedCount, v.sentCount), 1),
      hotReplyRate: round(rate(v.hotRepliedCount, v.sentCount), 1),
      liftVsControl: liftVsControl === null ? null : round(liftVsControl, 1),
      pValue: pValue === null ? null : round(pValue, 4),
      isSignificant,
      metricValue: round(metricValue, 1),
    };
  });
}

function round(n: number, decimals: number): number {
  const k = Math.pow(10, decimals);
  return Math.round(n * k) / k;
}

// ─── Winner election ────────────────────────────────────────

export interface WinnerPickResult {
  winnerId: string | null;
  reason: string;
  stats: VariantStats[];
}

/**
 * Determine whether a winner can be auto-elected.
 *
 *  - Every variant must have at least `minSampleSize` sends.
 *  - At least one non-control variant must be statistically
 *    significantly different from control on the chosen metric.
 *  - The winner is the variant with the highest metricValue among
 *    those that pass significance (or, if NONE are significant but
 *    we still have plenty of data, the variant whose lift is at
 *    least 5pp and has >= 2x minSample sends).
 */
export function pickWinner(
  variants: VariantInput[],
  metric: WinnerMetric,
  minSampleSize: number,
  confidencePct: number,
): WinnerPickResult {
  const stats = computeVariantStats(variants, metric, confidencePct);

  const allActive = variants.filter(v => v.active);
  if (allActive.length < 2) {
    return { winnerId: null, reason: "Need at least 2 active variants.", stats };
  }

  const underSampled = allActive.find(v => v.sentCount < minSampleSize);
  if (underSampled) {
    return {
      winnerId: null,
      reason: `Variant ${underSampled.label} only has ${underSampled.sentCount}/${minSampleSize} sends. Keep running.`,
      stats,
    };
  }

  const significant = stats.filter(s => s.isSignificant && !s.isControl);
  if (significant.length > 0) {
    const top = [...significant].sort((a, b) => b.metricValue - a.metricValue)[0];
    return {
      winnerId: top.id,
      reason: `Variant ${top.label} beats control with ${confidencePct}% confidence (p=${top.pValue}).`,
      stats,
    };
  }

  // Practical-significance fallback when we have lots of data but
  // the p-value stayed above threshold.
  const big = stats.filter(s =>
    !s.isControl &&
    (variants.find(v => v.id === s.id)?.sentCount ?? 0) >= minSampleSize * 2 &&
    (s.liftVsControl ?? 0) >= 5,
  );
  if (big.length > 0) {
    const top = [...big].sort((a, b) => (b.liftVsControl ?? 0) - (a.liftVsControl ?? 0))[0];
    return {
      winnerId: top.id,
      reason: `Variant ${top.label} leads by ${top.liftVsControl}pp on ${minSampleSize * 2}+ sends. Practical significance.`,
      stats,
    };
  }

  return {
    winnerId: null,
    reason: "No variant is statistically distinguishable from control yet — keep running.",
    stats,
  };
}
