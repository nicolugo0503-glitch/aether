/**
 * Smart Inbox — AI Reply Intelligence
 * ─────────────────────────────────────────────────────────────
 * Given an inbound email reply, asks GPT-4o-mini to:
 *   1. Classify intent (HOT / INTERESTED / OBJECTION / NOT_NOW /
 *      UNSUBSCRIBE / OUT_OF_OFFICE / WRONG_PERSON / QUESTION / SPAM)
 *   2. Score 1–100 ("how worth your time" composite)
 *   3. Summarize in 1–2 sentences
 *   4. Suggest a concrete next action
 *   5. Draft a tasteful reply the user can edit & send
 *
 * Designed to be cheap: one ~250-token completion per reply.
 */

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

export type ReplyIntent =
  | "HOT"
  | "INTERESTED"
  | "OBJECTION"
  | "NOT_NOW"
  | "UNSUBSCRIBE"
  | "OUT_OF_OFFICE"
  | "WRONG_PERSON"
  | "QUESTION"
  | "SPAM"
  | "UNCLASSIFIED";

export type Sentiment = "positive" | "neutral" | "negative";
export type Urgency = "low" | "normal" | "high";

export interface ReplyClassification {
  intent: ReplyIntent;
  sentiment: Sentiment;
  urgency: Urgency;
  score: number;            // 1-100
  summary: string;          // 1-2 sentence summary
  suggestedAction: string;  // 1 short imperative line
  draftReply: string;       // pre-written reply
  tags: string[];           // 1-4 short tags
  hot: boolean;             // shortcut for HOT or score >= 80
  tokensIn: number;
  tokensOut: number;
  costCents: number;
}

export interface ClassifyReplyParams {
  /** Body of the reply we received. Plain text preferred — HTML works too. */
  body: string;
  /** Optional subject line of the reply (e.g. "Re: Quick question"). */
  subject?: string;
  /** Optional name of the person who replied. */
  fromName?: string;
  /** Optional address of the person who replied. */
  fromEmail?: string;
  /** Optional context — the original outbound email body we sent. */
  originalEmail?: string;
  /** Optional: what business / product is the user selling. Shapes tone of drafted reply. */
  senderContext?: string;
  /** Override model. */
  model?: string;
}

const SYSTEM_PROMPT = `You are an elite revenue-operations analyst triaging inbound email replies for a busy founder running cold outreach.

Given a single reply, output a JSON object with this EXACT shape (no extra keys, no markdown):
{
  "intent":          "HOT" | "INTERESTED" | "OBJECTION" | "NOT_NOW" | "UNSUBSCRIBE" | "OUT_OF_OFFICE" | "WRONG_PERSON" | "QUESTION" | "SPAM",
  "sentiment":       "positive" | "neutral" | "negative",
  "urgency":         "low" | "normal" | "high",
  "score":           <integer 1-100>,
  "summary":         "<1-2 sentence neutral summary of what the lead said>",
  "suggestedAction": "<one short imperative line — what should the user do next>",
  "draftReply":      "<a tasteful, brief, human-sounding reply the user can send>",
  "tags":            ["<short kebab-case tag>", ...]
}

Intent rubric (pick the SINGLE best fit):
- HOT             → explicit buying signal: "let's get on a call", "send pricing", "what's your demo link", "yes I'm interested". Score 85-100.
- INTERESTED      → curious but not committed: "tell me more", "what does it do exactly?", "we might be interested in Q3". Score 65-84.
- QUESTION        → asking a clarifying question that needs an answer before progressing. Score 55-75.
- OBJECTION       → pushback ("too expensive", "we already use X", "we tried something like this"). Score 40-60.
- NOT_NOW         → polite deferral ("circle back in 6 months", "not a priority right now"). Score 25-45.
- OUT_OF_OFFICE   → auto-reply / OOO. Score 5-15.
- WRONG_PERSON    → "you want Sarah in marketing, not me" / "I'm not the buyer". Score 20-35.
- UNSUBSCRIBE     → "remove me", "stop emailing", "unsubscribe". Score 1-10.
- SPAM            → bounce, mailer-daemon, autoresponder unrelated to lead. Score 1-5.

Rules:
- score is a COMPOSITE: how valuable is it for the founder to look at this reply right now?
- urgency = "high" only when the reply asks for action within a clear short timeframe ("today", "by EOD", "tomorrow").
- draftReply: under 90 words, no exclamation marks, no fake enthusiasm, no signature block. Start mid-thought (no "Hi NAME,").
  - For HOT/INTERESTED → propose a concrete next step (15-min call, share link, send pricing).
  - For QUESTION → answer if obvious, else acknowledge and promise a fast follow-up.
  - For OBJECTION → empathize in 1 line, then offer a tiny concession or proof point.
  - For NOT_NOW → graciously accept, offer to follow up at the stated time.
  - For UNSUBSCRIBE / OOO / SPAM / WRONG_PERSON → leave draftReply EMPTY ("").
- tags: 1-4 short kebab-case tags like ["pricing-question","decision-maker","budget-objection"].
- Output ONLY the JSON. No prose, no markdown fences.`;

export async function classifyReply(
  params: ClassifyReplyParams,
): Promise<ReplyClassification> {
  const {
    body,
    subject,
    fromName,
    fromEmail,
    originalEmail,
    senderContext,
    model = DEFAULT_MODEL,
  } = params;

  const userMsg = [
    "INBOUND REPLY:",
    fromName ? `- From name: ${fromName}` : null,
    fromEmail ? `- From email: ${fromEmail}` : null,
    subject ? `- Subject: ${subject}` : null,
    `- Body:\n${body.trim().slice(0, 4000)}`,
    senderContext ? `\nSENDER CONTEXT (what the founder sells):\n${senderContext.slice(0, 600)}` : null,
    originalEmail ? `\nORIGINAL EMAIL WE SENT (for context):\n${originalEmail.slice(0, 1200)}` : null,
    "\nReturn the JSON classification now.",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await getOpenAI().chat.completions.create({
    model,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMsg },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const tokensIn = completion.usage?.prompt_tokens ?? 0;
  const tokensOut = completion.usage?.completion_tokens ?? 0;

  let parsed: Partial<ReplyClassification> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const intent = sanitizeIntent(parsed.intent);
  const sentiment = sanitizeSentiment(parsed.sentiment);
  const urgency = sanitizeUrgency(parsed.urgency);
  const score = clampInt(parsed.score, 1, 100, defaultScoreFor(intent));
  const summary = sanitizeStr(parsed.summary, 320, "No summary generated.");
  const suggestedAction = sanitizeStr(parsed.suggestedAction, 160, suggestedActionFor(intent));
  const draftReply = (intent === "UNSUBSCRIBE" || intent === "OUT_OF_OFFICE" || intent === "SPAM" || intent === "WRONG_PERSON")
    ? ""
    : sanitizeStr(parsed.draftReply, 1500, "");
  const tags = sanitizeStringArray(parsed.tags, 4);

  const hot = intent === "HOT" || score >= 80;

  return {
    intent,
    sentiment,
    urgency,
    score,
    summary,
    suggestedAction,
    draftReply,
    tags,
    hot,
    tokensIn,
    tokensOut,
    costCents: estimateCostCents(model, tokensIn, tokensOut),
  };
}

/**
 * Re-draft only the reply — used when the user wants a fresh take on the
 * AI suggestion. Cheaper than a full re-classification.
 */
export async function redraftReply(params: {
  body: string;
  subject?: string;
  fromName?: string;
  intent: ReplyIntent;
  tone?: "warm" | "direct" | "formal" | "casual";
  senderContext?: string;
  model?: string;
}): Promise<{ draftReply: string; tokensIn: number; tokensOut: number; costCents: number }> {
  const { body, subject, fromName, intent, tone = "warm", senderContext, model = DEFAULT_MODEL } = params;

  const system = `You are an expert at writing short, human, founder-grade email replies. Tone: ${tone}.
Write a reply under 90 words. No exclamation marks. No greeting line ("Hi X,") and no signature block — only the reply body itself. No fake enthusiasm.
Intent of the inbound reply: ${intent}.`;

  const user = [
    fromName ? `Person who replied: ${fromName}` : null,
    subject ? `Subject: ${subject}` : null,
    `Reply we received:\n${body.trim().slice(0, 3000)}`,
    senderContext ? `\nContext (what we sell):\n${senderContext.slice(0, 500)}` : null,
    "\nWrite the reply now.",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await getOpenAI().chat.completions.create({
    model,
    temperature: 0.6,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const draftReply = (completion.choices[0]?.message?.content ?? "").trim().slice(0, 1500);
  const tokensIn = completion.usage?.prompt_tokens ?? 0;
  const tokensOut = completion.usage?.completion_tokens ?? 0;

  return {
    draftReply,
    tokensIn,
    tokensOut,
    costCents: estimateCostCents(model, tokensIn, tokensOut),
  };
}

/* ── visual helpers (used in dashboard) ─────────────────────── */

export function intentColor(intent: ReplyIntent): { bg: string; fg: string; border: string } {
  switch (intent) {
    case "HOT":
      return { bg: "rgba(239,68,68,0.14)", fg: "#fb7185", border: "rgba(239,68,68,0.35)" };
    case "INTERESTED":
      return { bg: "rgba(34,197,94,0.12)", fg: "#4ade80", border: "rgba(34,197,94,0.35)" };
    case "QUESTION":
      return { bg: "rgba(124,58,237,0.14)", fg: "#a78bfa", border: "rgba(124,58,237,0.35)" };
    case "OBJECTION":
      return { bg: "rgba(245,158,11,0.12)", fg: "#fbbf24", border: "rgba(245,158,11,0.35)" };
    case "NOT_NOW":
      return { bg: "rgba(59,130,246,0.12)", fg: "#60a5fa", border: "rgba(59,130,246,0.35)" };
    case "OUT_OF_OFFICE":
      return { bg: "rgba(148,163,184,0.10)", fg: "#94a3b8", border: "rgba(148,163,184,0.30)" };
    case "WRONG_PERSON":
      return { bg: "rgba(168,85,247,0.10)", fg: "#c084fc", border: "rgba(168,85,247,0.30)" };
    case "UNSUBSCRIBE":
      return { bg: "rgba(244,63,94,0.10)", fg: "#f43f5e", border: "rgba(244,63,94,0.30)" };
    case "SPAM":
      return { bg: "rgba(113,113,122,0.10)", fg: "#71717a", border: "rgba(113,113,122,0.30)" };
    default:
      return { bg: "rgba(113,113,122,0.10)", fg: "#a1a1aa", border: "rgba(113,113,122,0.30)" };
  }
}

export function intentLabel(intent: ReplyIntent): string {
  switch (intent) {
    case "HOT": return "Hot";
    case "INTERESTED": return "Interested";
    case "QUESTION": return "Question";
    case "OBJECTION": return "Objection";
    case "NOT_NOW": return "Not now";
    case "OUT_OF_OFFICE": return "Out of office";
    case "WRONG_PERSON": return "Wrong person";
    case "UNSUBSCRIBE": return "Unsubscribe";
    case "SPAM": return "Spam";
    default: return "Unclassified";
  }
}

/* ── private helpers ────────────────────────────────────────── */

const VALID_INTENTS: ReadonlyArray<ReplyIntent> = [
  "HOT", "INTERESTED", "OBJECTION", "NOT_NOW",
  "UNSUBSCRIBE", "OUT_OF_OFFICE", "WRONG_PERSON",
  "QUESTION", "SPAM", "UNCLASSIFIED",
];

function sanitizeIntent(v: unknown): ReplyIntent {
  if (typeof v !== "string") return "UNCLASSIFIED";
  const up = v.toUpperCase().replace(/[- ]/g, "_");
  return (VALID_INTENTS as readonly string[]).includes(up) ? (up as ReplyIntent) : "UNCLASSIFIED";
}

function sanitizeSentiment(v: unknown): Sentiment {
  if (v === "positive" || v === "neutral" || v === "negative") return v;
  return "neutral";
}

function sanitizeUrgency(v: unknown): Urgency {
  if (v === "low" || v === "normal" || v === "high") return v;
  return "normal";
}

function sanitizeStr(v: unknown, max: number, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  if (!t) return fallback;
  return t.slice(0, max);
}

function sanitizeStringArray(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40))
    .filter((s) => s.length > 0)
    .slice(0, max);
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function defaultScoreFor(intent: ReplyIntent): number {
  switch (intent) {
    case "HOT": return 92;
    case "INTERESTED": return 75;
    case "QUESTION": return 65;
    case "OBJECTION": return 50;
    case "NOT_NOW": return 35;
    case "WRONG_PERSON": return 25;
    case "OUT_OF_OFFICE": return 10;
    case "UNSUBSCRIBE": return 5;
    case "SPAM": return 3;
    default: return 50;
  }
}

function suggestedActionFor(intent: ReplyIntent): string {
  switch (intent) {
    case "HOT": return "Reply now — propose a 15-min call this week.";
    case "INTERESTED": return "Send a short value bullet + soft ask for time.";
    case "QUESTION": return "Answer the question concisely, then re-propose next step.";
    case "OBJECTION": return "Acknowledge the concern, offer a 1-line proof point.";
    case "NOT_NOW": return "Accept gracefully, set a reminder for the stated date.";
    case "OUT_OF_OFFICE": return "Snooze until they're back.";
    case "WRONG_PERSON": return "Ask politely for the right contact.";
    case "UNSUBSCRIBE": return "Remove from all lists immediately.";
    case "SPAM": return "Ignore / delete.";
    default: return "Review and decide manually.";
  }
}

/* ── webhook payload parser ─────────────────────────────────── */

/**
 * Best-effort parser for the most common inbound-email webhook payloads:
 *   - Resend Inbound (https://resend.com/docs/dashboard/webhooks/inbound)
 *   - SendGrid Inbound Parse
 *   - Postmark Inbound
 *   - Generic { from, to, subject, text, html } envelopes
 *
 * Returns null when the body doesn't look like an email at all.
 */
export interface ParsedInboundEmail {
  fromEmail: string;
  fromName?: string;
  toEmail?: string;
  subject?: string;
  bodyText: string;
  bodyHtml?: string;
  messageId?: string;
  inReplyTo?: string;
  threadId?: string;
}

export function parseInboundEmail(raw: unknown): ParsedInboundEmail | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  // Resend / Postmark style — top-level fields
  const fromRaw =
    pickString(obj, ["from", "FromFull", "sender"]) ??
    pickFromObject(obj.from) ??
    pickFromObject(obj.FromFull) ??
    null;
  const toRaw =
    pickString(obj, ["to", "ToFull"]) ??
    pickFromObject(obj.to) ??
    null;

  // SendGrid Parse sends fields like { from: "Name <a@b.com>", email: "...", text: "..." }
  const subject = pickString(obj, ["subject", "Subject"]) ?? undefined;
  const text =
    pickString(obj, ["text", "TextBody", "plain", "body", "stripped-text"]) ??
    pickStringFromNested(obj, ["text"]) ??
    "";
  const html =
    pickString(obj, ["html", "HtmlBody"]) ??
    pickStringFromNested(obj, ["html"]) ??
    undefined;
  const messageId = pickString(obj, ["messageId", "MessageID", "Message-Id"]) ?? undefined;
  const inReplyTo = pickString(obj, ["inReplyTo", "InReplyTo", "In-Reply-To"]) ?? undefined;
  const threadId = pickString(obj, ["threadId", "ThreadId"]) ?? undefined;

  if (!fromRaw) return null;
  const { email: fromEmail, name: fromName } = splitAddress(fromRaw);
  if (!fromEmail) return null;

  const { email: toEmail } = toRaw ? splitAddress(toRaw) : { email: undefined };

  const bodyText = (text || stripHtml(html || "") || "").trim();
  if (!bodyText) return null;

  return {
    fromEmail,
    fromName,
    toEmail,
    subject,
    bodyText: bodyText.slice(0, 16000),
    bodyHtml: html ? html.slice(0, 32000) : undefined,
    messageId,
    inReplyTo,
    threadId,
  };
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickFromObject(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const email = typeof o.email === "string" ? o.email : typeof o.Email === "string" ? o.Email : null;
  const name = typeof o.name === "string" ? o.name : typeof o.Name === "string" ? o.Name : null;
  if (!email) return null;
  return name ? `${name} <${email}>` : email;
}

function pickStringFromNested(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = pickString(v as Record<string, unknown>, keys);
      if (found) return found;
    }
  }
  return null;
}

function splitAddress(raw: string): { email: string | null; name?: string } {
  const m = raw.match(/^\s*(?:"?([^"<]+?)"?\s*)?<([^>]+)>\s*$/);
  if (m) return { name: (m[1] || "").trim() || undefined, email: m[2].trim() };
  if (raw.includes("@")) return { email: raw.trim() };
  return { email: null };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
