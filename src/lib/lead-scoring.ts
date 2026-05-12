// AI Lead Scoring Engine
// ─────────────────────────────────────────────────────────────
// Given a lead (name, email, company, optional web research),
// asks GPT-4o-mini to grade the lead on a 1–100 scale.
//
// Returns a structured score + tier (HOT/WARM/COLD), reasoning,
// positive signals, and red flags — so users can prioritize
// outreach to the hottest prospects and skip dead-end leads.
//
// Designed to be cheap: one ~150-token completion per lead.

import OpenAI from "openai";
import type { Lead } from "./sheets";
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

export type LeadTier = "HOT" | "WARM" | "COLD";

export interface LeadScoreResult {
  score: number;            // 1–100
  tier: LeadTier;           // HOT >= 75, WARM 40–74, COLD < 40
  reasoning: string;        // 1–2 sentence explanation
  signals: string[];        // positive buying signals (≤4)
  redFlags: string[];       // concerns / disqualifiers (≤3)
  tokensIn: number;
  tokensOut: number;
  costCents: number;
}

export interface ScoreLeadParams {
  lead: Lead;
  /** Optional ICP description from the campaign / agent (e.g. "B2B SaaS founders, 10-200 employees, US-based"). */
  idealCustomerProfile?: string;
  /** Optional web-research blurb about the company (e.g. from Serper). */
  webResearch?: string;
  /** Override model. */
  model?: string;
}

const SCORING_SYSTEM_PROMPT = `You are an elite B2B sales analyst grading inbound leads for outreach prioritization.

Given a single lead, output a JSON object with this exact shape:
{
  "score": <integer 1-100>,
  "tier": "HOT" | "WARM" | "COLD",
  "reasoning": "<1-2 sentence why this score>",
  "signals": ["<positive signal>", ...],   // max 4, may be empty
  "redFlags": ["<concern>", ...]            // max 3, may be empty
}

Scoring rubric:
- 85-100 (HOT): Decision-maker title at a target-fit company with clear buying signals.
- 60-84  (WARM): Reasonable fit, missing one or two strong signals.
- 30-59  (COLD): Marginal fit — wrong role, wrong size, or weak signals.
- 1-29   (DEAD): Almost certainly a waste — generic emails, no company, irrelevant industry.

Tier mapping:
- score >= 75 → "HOT"
- score 40-74 → "WARM"
- score < 40  → "COLD"

Rules:
- Be honest. Most leads are not HOT.
- Penalize generic/free-mail addresses (gmail/yahoo/hotmail) when context suggests B2B.
- Reward title keywords like CEO, Founder, VP, Head of, Director.
- If web research shows recent funding, hiring spree, product launch, or relevant pain points — that's HOT.
- Output ONLY the JSON object. No prose, no markdown fences.`;

export async function scoreLead(params: ScoreLeadParams): Promise<LeadScoreResult> {
  const { lead, idealCustomerProfile, webResearch, model = DEFAULT_MODEL } = params;

  const userMsg = [
    "LEAD:",
    `- Name: ${lead.name || "(unknown)"}`,
    `- Email: ${lead.email || "(unknown)"}`,
    lead.company ? `- Company: ${lead.company}` : null,
    lead.title ? `- Title: ${lead.title}` : null,
    lead.industry ? `- Industry: ${lead.industry}` : null,
    lead.website ? `- Website: ${lead.website}` : null,
    lead.linkedin ? `- LinkedIn: ${lead.linkedin}` : null,
    idealCustomerProfile ? `\nIDEAL CUSTOMER PROFILE:\n${idealCustomerProfile}` : null,
    webResearch ? `\nWEB RESEARCH:\n${webResearch.slice(0, 1200)}` : null,
    "\nReturn the JSON score now.",
  ].filter(Boolean).join("\n");

  const completion = await getOpenAI().chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SCORING_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const tokensIn = completion.usage?.prompt_tokens ?? 0;
  const tokensOut = completion.usage?.completion_tokens ?? 0;

  let parsed: Partial<LeadScoreResult> = {};
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  const score = clampInt(parsed.score, 1, 100, 50);
  const tier = deriveTier(score, parsed.tier as LeadTier | undefined);
  const reasoning = typeof parsed.reasoning === "string" && parsed.reasoning.trim()
    ? parsed.reasoning.trim().slice(0, 280)
    : "No reasoning provided.";
  const signals = sanitizeStringArray(parsed.signals, 4);
  const redFlags = sanitizeStringArray(parsed.redFlags, 3);

  return {
    score,
    tier,
    reasoning,
    signals,
    redFlags,
    tokensIn,
    tokensOut,
    costCents: estimateCostCents(model, tokensIn, tokensOut),
  };
}

/** Score many leads with limited concurrency. */
export async function scoreLeadsBatch(
  leads: Lead[],
  opts: Omit<ScoreLeadParams, "lead"> = {},
  concurrency = 4,
): Promise<Array<LeadScoreResult & { lead: Lead }>> {
  const out: Array<LeadScoreResult & { lead: Lead }> = new Array(leads.length);
  let i = 0;

  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= leads.length) return;
      try {
        const r = await scoreLead({ ...opts, lead: leads[idx] });
        out[idx] = { ...r, lead: leads[idx] };
      } catch {
        out[idx] = {
          lead: leads[idx],
          score: 50,
          tier: "WARM",
          reasoning: "Scoring failed — defaulted to neutral.",
          signals: [],
          redFlags: ["Scoring API error"],
          tokensIn: 0,
          tokensOut: 0,
          costCents: 0,
        };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, leads.length) }, worker));
  return out;
}

export function tierColor(tier: LeadTier): { bg: string; fg: string; border: string } {
  if (tier === "HOT")  return { bg: "rgba(239,68,68,0.12)",  fg: "#f87171", border: "rgba(239,68,68,0.35)" };
  if (tier === "WARM") return { bg: "rgba(245,158,11,0.12)", fg: "#fbbf24", border: "rgba(245,158,11,0.35)" };
  return                       { bg: "rgba(113,113,122,0.12)", fg: "#a1a1aa", border: "rgba(113,113,122,0.35)" };
}

/* ── helpers ─────────────────────────────────────────────── */

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function deriveTier(score: number, claimed?: LeadTier): LeadTier {
  // Always derive from score for consistency, but honor sensible claims.
  if (score >= 75) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

function sanitizeStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map(s => s.trim().slice(0, 120))
    .slice(0, max);
}
