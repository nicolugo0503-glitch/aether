// AI Competitor Intelligence Tracker
// ─────────────────────────────────────────────────────────────
// Fetches a competitor URL, extracts main text, hashes it,
// diffs against the last snapshot, and uses GPT to summarize
// what changed and why it matters.
//
// Designed to be cheap: only one ~250-token completion per
// scan, and only when a meaningful diff is detected.

import crypto from "crypto";
import OpenAI from "openai";
import { estimateCostCents, DEFAULT_MODEL } from "./ai";
import { prisma } from "./db";
import { sendEmail } from "./email";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "placeholder-set-in-vercel",
    });
  }
  return _openai;
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type CompetitorCategory =
  | "pricing"
  | "homepage"
  | "blog"
  | "careers"
  | "product"
  | "general";

export type ChangeSeverity = "low" | "medium" | "high" | "critical";

export interface FetchResult {
  content: string;       // extracted main text
  contentHash: string;   // sha256
  httpStatus: number;
  byteSize: number;
  fetchedAt: Date;
}

export interface ChangeAnalysis {
  summary: string;          // 1–2 sentence headline
  details: string;          // longer analysis: what + why it matters
  severity: ChangeSeverity;
  signals: string[];        // tags like ["pricing","new-feature","hiring"]
  tokensIn: number;
  tokensOut: number;
  costCents: number;
}

// ─────────────────────────────────────────────────────────────
// Fetch + extract
// ─────────────────────────────────────────────────────────────

const MAX_CONTENT_CHARS = 30_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; AetherBot/1.0; +https://aether.ai/bot)";

/**
 * Strip HTML noise (scripts, styles, nav/footer chrome) and collapse
 * to clean readable text. Keeps blocks separated by single newlines
 * so the diff stays line-oriented.
 */
export function extractText(html: string): string {
  let s = html;

  // Drop entire script / style / noscript blocks.
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  s = s.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  // Convert block-level boundaries to newlines BEFORE stripping tags.
  s = s.replace(/<(br|p|div|li|h[1-6]|tr|section|article|header|footer)\b[^>]*>/gi, "\n");
  s = s.replace(/<\/(p|div|li|h[1-6]|tr|section|article|header|footer)>/gi, "\n");

  // Strip remaining tags.
  s = s.replace(/<[^>]+>/g, " ");

  // Decode the handful of entities that matter.
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, " ");

  // Collapse whitespace per line; drop empties.
  const lines = s
    .split(/\n+/)
    .map((l) => l.replace(/[ \t\f\v]+/g, " ").trim())
    .filter(Boolean);

  return lines.join("\n").slice(0, MAX_CONTENT_CHARS);
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Fetch a URL and extract its main text content.
 * Returns a FetchResult; throws on network / non-2xx error.
 */
export async function fetchCompetitor(url: string): Promise<FetchResult> {
  // Validate before hitting the network.
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new Error("Only http(s) URLs are supported");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const raw = await res.text();
  const content = extractText(raw);
  return {
    content,
    contentHash: sha256(content),
    httpStatus: res.status,
    byteSize: raw.length,
    fetchedAt: new Date(),
  };
}

// ─────────────────────────────────────────────────────────────
// Diff
// ─────────────────────────────────────────────────────────────

export interface DiffResult {
  changed: boolean;
  charsAdded: number;
  charsRemoved: number;
  /** Materiality: 0–1. Below ~0.005 we treat as noise (timestamps, view counters). */
  materiality: number;
  /** Compact diff blob to feed to the LLM. */
  diffSummary: string;
}

/**
 * Cheap line-set diff. Good enough to identify what is new / removed
 * for an LLM to summarize, without pulling in a diff library.
 */
export function diffContent(before: string, after: string): DiffResult {
  if (!before) {
    return {
      changed: !!after,
      charsAdded: after.length,
      charsRemoved: 0,
      materiality: after.length > 0 ? 1 : 0,
      diffSummary: `ADDED:\n${after.slice(0, 6000)}`,
    };
  }
  if (before === after) {
    return { changed: false, charsAdded: 0, charsRemoved: 0, materiality: 0, diffSummary: "" };
  }

  const beforeLines = new Set(before.split("\n"));
  const afterLines = new Set(after.split("\n"));

  const added: string[] = [];
  const removed: string[] = [];

  for (const l of afterLines) if (!beforeLines.has(l)) added.push(l);
  for (const l of beforeLines) if (!afterLines.has(l)) removed.push(l);

  const charsAdded = added.reduce((a, b) => a + b.length, 0);
  const charsRemoved = removed.reduce((a, b) => a + b.length, 0);
  const denom = Math.max(before.length, after.length, 1);
  const materiality = (charsAdded + charsRemoved) / denom;

  // Sort longest-first — the meaty lines tend to matter most.
  added.sort((a, b) => b.length - a.length);
  removed.sort((a, b) => b.length - a.length);

  const diffSummary = [
    added.length ? `ADDED (${added.length} lines):\n${added.slice(0, 40).join("\n").slice(0, 4000)}` : "",
    removed.length ? `\nREMOVED (${removed.length} lines):\n${removed.slice(0, 40).join("\n").slice(0, 2000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    changed: charsAdded + charsRemoved > 0,
    charsAdded,
    charsRemoved,
    materiality,
    diffSummary,
  };
}

// Anything below 0.4% net change is treated as cosmetic noise
// (a/b copy tests, view counters, dynamic timestamps).
export const NOISE_THRESHOLD = 0.004;

// ─────────────────────────────────────────────────────────────
// AI summarization
// ─────────────────────────────────────────────────────────────

const ANALYSIS_SYSTEM_PROMPT = `You are an elite competitive intelligence analyst at a top-tier strategy firm.

You are given a DIFF showing what changed on a competitor's web page since the last snapshot. Your job: tell the operator (a founder or growth lead) what changed and why it matters.

Output a STRICT JSON object with this exact shape:
{
  "summary":  "<single sentence — what is the headline change?>",
  "details":  "<2-4 sentences — what specifically changed and the strategic implication. Cite numbers if they appear in the diff.>",
  "severity": "low" | "medium" | "high" | "critical",
  "signals":  ["<tag>", "<tag>"]
}

Severity rubric (be honest, do not inflate):
- critical: pricing change, new pricing tier, acquisition/funding announcement, major product launch, leadership change.
- high: new feature shipped, new positioning/messaging pivot, careers page shows aggressive hiring surge, new comparison page targeting us.
- medium: meaningful content updates, new blog post on strategic topic, expanded customer list, new integration.
- low: copy tweaks, layout changes, cosmetic refinement, footer/legal updates.

Allowed signal tags (pick the 1-3 most relevant):
"pricing", "new-feature", "messaging", "hiring", "fundraising", "launch",
"customer-logo", "integration", "content", "comparison", "leadership", "legal", "other"

Rules:
- Be specific. "Updated homepage" is useless — say WHAT updated.
- If the diff is noisy (timestamps, view counters, single character tweaks), severity is "low".
- If you can't tell what's meaningful, severity is "low" and summary is "Minor cosmetic change."
- Output ONLY the JSON. No prose, no markdown fences.`;

export interface AnalyzeChangeParams {
  competitorName: string;
  category: string;
  focus?: string | null;
  url: string;
  diff: DiffResult;
  model?: string;
}

export async function analyzeChange(
  params: AnalyzeChangeParams
): Promise<ChangeAnalysis> {
  const { competitorName, category, focus, url, diff, model = DEFAULT_MODEL } = params;

  const userMsg = [
    `COMPETITOR: ${competitorName}`,
    `URL: ${url}`,
    `PAGE CATEGORY: ${category}`,
    focus ? `OPERATOR FOCUS: ${focus}` : null,
    `CHARS ADDED: ${diff.charsAdded}`,
    `CHARS REMOVED: ${diff.charsRemoved}`,
    "",
    "DIFF:",
    diff.diffSummary.slice(0, 6000),
    "",
    "Return the JSON analysis now.",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await getOpenAI().chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const tokensIn = completion.usage?.prompt_tokens ?? 0;
  const tokensOut = completion.usage?.completion_tokens ?? 0;

  let parsed: {
    summary?: string;
    details?: string;
    severity?: string;
    signals?: string[];
  } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const severity = normalizeSeverity(parsed.severity);
  const signals = Array.isArray(parsed.signals)
    ? parsed.signals.filter((s) => typeof s === "string").slice(0, 5)
    : [];

  return {
    summary: (parsed.summary || "Change detected.").slice(0, 280),
    details: (parsed.details || "").slice(0, 2000),
    severity,
    signals,
    tokensIn,
    tokensOut,
    costCents: estimateCostCents(model, tokensIn, tokensOut),
  };
}

function normalizeSeverity(s: unknown): ChangeSeverity {
  const v = String(s || "").toLowerCase();
  if (v === "critical" || v === "high" || v === "medium" || v === "low") return v;
  return "low";
}

// ─────────────────────────────────────────────────────────────
// Cadence helpers
// ─────────────────────────────────────────────────────────────

export function nextScanFor(frequency: string, from: Date = new Date()): Date {
  const d = new Date(from);
  switch (frequency) {
    case "hourly":
      d.setHours(d.getHours() + 1);
      break;
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "daily":
    default:
      d.setDate(d.getDate() + 1);
      break;
  }
  return d;
}

// ─────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────

export function severityColor(severity: string): {
  text: string;
  bg: string;
  border: string;
} {
  switch (severity) {
    case "critical":
      return { text: "#fca5a5", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.35)" };
    case "high":
      return { text: "#fdba74", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.35)" };
    case "medium":
      return { text: "#fcd34d", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.30)" };
    case "low":
    default:
      return { text: "#a3a3a3", bg: "rgba(163,163,163,0.06)", border: "rgba(163,163,163,0.20)" };
  }
}

export function severityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

// ─────────────────────────────────────────────────────────────
// Full scan pipeline: fetch → diff → analyze → persist → notify
// ─────────────────────────────────────────────────────────────

export interface ScanResult {
  competitorId: string;
  ok: boolean;
  changed: boolean;
  severity?: ChangeSeverity;
  summary?: string;
  changeId?: string;
  error?: string;
}

export async function scanCompetitor(competitorId: string): Promise<ScanResult> {
  const comp = await prisma.competitor.findUnique({
    where: { id: competitorId },
    include: { user: true },
  });
  if (!comp) {
    return { competitorId, ok: false, changed: false, error: "competitor not found" };
  }

  // 1) Fetch.
  let fetched: FetchResult;
  try {
    fetched = await fetchCompetitor(comp.url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.competitor.update({
      where: { id: comp.id },
      data: {
        lastError: msg.slice(0, 500),
        lastFetchedAt: new Date(),
        totalScans: { increment: 1 },
        nextScanAt: nextScanFor(comp.frequency),
      },
    });
    return { competitorId, ok: false, changed: false, error: msg };
  }

  // 2) Snapshot row (always).
  await prisma.competitorSnapshot.create({
    data: {
      competitorId: comp.id,
      content: fetched.content,
      contentHash: fetched.contentHash,
      httpStatus: fetched.httpStatus,
      byteSize: fetched.byteSize,
    },
  });

  // 3) Diff against previous content.
  const diff = diffContent(comp.lastContent || "", fetched.content);

  // First-ever fetch is a baseline, not a "change".
  const isFirstScan = !comp.lastHash;
  const isNoise = diff.materiality < NOISE_THRESHOLD;

  if (isFirstScan || !diff.changed || isNoise) {
    await prisma.competitor.update({
      where: { id: comp.id },
      data: {
        lastContent: fetched.content.slice(0, 10_000),
        lastHash: fetched.contentHash,
        lastFetchedAt: fetched.fetchedAt,
        lastError: null,
        totalScans: { increment: 1 },
        nextScanAt: nextScanFor(comp.frequency),
      },
    });
    return { competitorId, ok: true, changed: false };
  }

  // 4) AI analysis.
  let analysis: ChangeAnalysis;
  try {
    analysis = await analyzeChange({
      competitorName: comp.name,
      category: comp.category,
      focus: comp.focus,
      url: comp.url,
      diff,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await prisma.competitor.update({
      where: { id: comp.id },
      data: {
        lastError: `AI analysis failed: ${msg.slice(0, 400)}`,
        lastFetchedAt: fetched.fetchedAt,
        totalScans: { increment: 1 },
        nextScanAt: nextScanFor(comp.frequency),
      },
    });
    return { competitorId, ok: false, changed: false, error: msg };
  }

  // 5) Persist change + roll competitor state forward.
  const change = await prisma.competitorChange.create({
    data: {
      competitorId: comp.id,
      userId: comp.userId,
      summary: analysis.summary,
      details: analysis.details,
      severity: analysis.severity,
      signals: JSON.stringify(analysis.signals),
      beforeHash: comp.lastHash,
      afterHash: fetched.contentHash,
      charsAdded: diff.charsAdded,
      charsRemoved: diff.charsRemoved,
      tokensIn: analysis.tokensIn,
      tokensOut: analysis.tokensOut,
      costCents: analysis.costCents,
    },
  });

  await prisma.competitor.update({
    where: { id: comp.id },
    data: {
      lastContent: fetched.content.slice(0, 10_000),
      lastHash: fetched.contentHash,
      lastFetchedAt: fetched.fetchedAt,
      lastChangeAt: fetched.fetchedAt,
      lastError: null,
      lastSeverity: analysis.severity,
      lastSummary: analysis.summary,
      totalScans: { increment: 1 },
      totalChanges: { increment: 1 },
      nextScanAt: nextScanFor(comp.frequency),
    },
  });

  // 6) Optional email notification.
  if (comp.notifyEmail && shouldEmailFor(analysis.severity)) {
    try {
      await notifyByEmail(comp.user, comp, change.id, analysis);
      await prisma.competitorChange.update({
        where: { id: change.id },
        data: { emailedAt: new Date() },
      });
    } catch {
      // Soft-fail: never let an email error nuke a successful scan.
    }
  }

  return {
    competitorId,
    ok: true,
    changed: true,
    severity: analysis.severity,
    summary: analysis.summary,
    changeId: change.id,
  };
}

function shouldEmailFor(severity: ChangeSeverity): boolean {
  return severity === "high" || severity === "critical";
}

type EmailableUser = {
  email: string;
  name: string | null;
  resendApiKey: string | null;
  fromEmail: string | null;
};

async function notifyByEmail(
  user: EmailableUser,
  comp: { name: string; url: string; id: string },
  changeId: string,
  analysis: ChangeAnalysis,
) {
  const apiKey = user.resendApiKey || process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const from = user.fromEmail || process.env.RESEND_FROM || "Aether <alerts@aether.ai>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aether.ai";
  const link = `${appUrl}/dashboard/competitors/${comp.id}?change=${changeId}`;

  const severityTag = analysis.severity.toUpperCase();
  const subject = `[${severityTag}] ${comp.name}: ${analysis.summary.slice(0, 80)}`;
  const body = [
    `Aether detected a change on ${comp.name}.`,
    "",
    `Severity: ${severityTag}`,
    `Page: ${comp.url}`,
    "",
    `What changed:`,
    analysis.summary,
    "",
    analysis.details,
    "",
    `Open in Aether: ${link}`,
    "",
    `— Aether Competitor Intelligence`,
  ].join("\n");

  await sendEmail({ apiKey, from, to: user.email, subject, body });
}

