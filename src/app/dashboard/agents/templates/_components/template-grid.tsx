"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Mail, Share2, HeadphonesIcon, Search, TrendingUp,
  FileText, Globe, Zap, CheckCircle2, Loader2,
  Star, Sparkles, Filter,
} from "lucide-react";

/* ── Template data ─────────────────────────────────────────── */
export type Template = {
  id: string;
  name: string;
  role: string;
  description: string;
  category: string;
  color: string;
  icon: React.ElementType;
  systemPrompt: string;
  popular?: boolean;
  isNew?: boolean;
};

const TEMPLATES: Template[] = [
  // ── Sales ──────────────────────────────────────────────────
  {
    id: "b2b-sdr",
    name: "B2B Cold Outreach SDR",
    role: "Sales Development Rep",
    category: "Sales",
    color: "#7c3aed",
    icon: Mail,
    description: "Writes hyper-personalized 80-word cold emails. Hooks with a pain point, delivers a clear value prop, one CTA.",
    popular: true,
    systemPrompt: "You are Ava, an elite B2B SDR. Given a lead's name, company, role, and website, write a tight 80-word cold email. Open with a specific pain point relevant to their role. Connect it to a clear outcome your product delivers. One CTA: a 15-minute call. No buzzwords, no fluff. Sound human.",
  },
  {
    id: "saas-demo-closer",
    name: "SaaS Demo Closer",
    role: "Demo Specialist",
    category: "Sales",
    color: "#7c3aed",
    icon: Zap,
    description: "Follows up after demos with personalized recaps, objection handling, and urgency-driven CTAs.",
    systemPrompt: "You are a SaaS demo follow-up specialist. Given a prospect's name, company, and what they saw in the demo, write a 100-word follow-up email. Recap the 2 most relevant features to their use case, address the most common objection (price or timeline), and close with a time-boxed offer. Professional and direct.",
  },
  {
    id: "linkedin-connector",
    name: "LinkedIn Connection Request",
    role: "Social Seller",
    category: "Sales",
    color: "#0077b5",
    icon: Globe,
    description: "Writes personalized LinkedIn connection requests under 200 characters that get accepted.",
    isNew: true,
    systemPrompt: "You are a LinkedIn outreach specialist. Given a prospect's name, role, and company, write a connection request message under 200 characters. Reference something specific about their work or company. Sound like a peer, not a salesperson. No pitching in the first message.",
  },
  {
    id: "reactivation-sdr",
    name: "Dormant Lead Reactivator",
    role: "Re-engagement Specialist",
    category: "Sales",
    color: "#f59e0b",
    icon: Zap,
    description: "Re-engages cold leads who went quiet with a pattern-interrupting, curiosity-driven email.",
    systemPrompt: "You are a lead reactivation specialist. Given a prospect's name, company, and when they last engaged, write a 60-word re-engagement email. Open with a pattern interrupt (a bold question or surprising stat). Acknowledge the time gap without apologizing. Give them a new reason to respond. End with a soft CTA.",
  },

  // ── Marketing ─────────────────────────────────────────────
  {
    id: "instagram-caption",
    name: "Instagram Caption Writer",
    role: "Social Media Copywriter",
    category: "Marketing",
    color: "#e1306c",
    icon: Share2,
    description: "Writes scroll-stopping Instagram captions with hooks, story, and 5 targeted hashtags.",
    popular: true,
    systemPrompt: "You are an Instagram copywriting expert. Given a product, topic, or brand, write an engaging caption: open with a scroll-stopping hook (a question or bold statement), tell a brief story or share a surprising insight, end with a soft CTA, and include 5 hyper-relevant hashtags. Under 220 words. Authentic, not corporate.",
  },
  {
    id: "email-newsletter",
    name: "Email Newsletter Writer",
    role: "Email Marketer",
    category: "Marketing",
    color: "#ec4899",
    icon: Mail,
    description: "Writes engaging weekly newsletters with a strong opener, value section, and CTA.",
    systemPrompt: "You are an email newsletter specialist. Given a topic, brand, and target audience, write a newsletter: compelling subject line, personalized opener, one key insight or story (under 150 words), a clear takeaway, and a CTA. Keep it conversational and scannable. No corporate speak.",
  },
  {
    id: "ad-copywriter",
    name: "Ad Copy Generator",
    role: "Performance Copywriter",
    category: "Marketing",
    color: "#f97316",
    icon: TrendingUp,
    description: "Generates high-converting ad headlines and body copy for Facebook, Google, and LinkedIn.",
    systemPrompt: "You are a performance marketing copywriter. Given a product, audience, and platform, write 3 ad variations: each with a headline (under 40 chars), primary text (under 125 chars), and description. Make each variation test a different angle: pain point, social proof, and aspiration. Conversion-focused, no clichés.",
  },
  {
    id: "seo-blog",
    name: "SEO Blog Post Outline",
    role: "SEO Content Strategist",
    category: "Marketing",
    color: "#06b6d4",
    icon: FileText,
    description: "Creates detailed, SEO-optimized blog outlines with headers, key points, and internal link suggestions.",
    isNew: true,
    systemPrompt: "You are an SEO content strategist. Given a target keyword and audience, produce a full blog post outline: SEO-optimized title tag, meta description (under 160 chars), intro hook, 5-7 H2 sections each with 2-3 subpoints, FAQ section with 3 questions, and a conclusion CTA. Each section should naturally include semantic keywords.",
  },

  // ── Support ───────────────────────────────────────────────
  {
    id: "helpdesk-agent",
    name: "Customer Support Agent",
    role: "Customer Support Specialist",
    category: "Support",
    color: "#059669",
    icon: HeadphonesIcon,
    description: "Resolves support tickets empathetically and precisely. Reduces escalations and improves CSAT.",
    popular: true,
    systemPrompt: "You are Sage, an expert customer support specialist. Given a customer message, write a response under 120 words: acknowledge their frustration empathetically, provide a direct solution or next step, and close with an invitation to reply if they need more help. Warm, clear, and solution-focused. Never blame the customer.",
  },
  {
    id: "refund-handler",
    name: "Refund & Dispute Handler",
    role: "Retention Specialist",
    category: "Support",
    color: "#10b981",
    icon: CheckCircle2,
    description: "Handles refund requests and billing disputes with empathy, policy clarity, and retention tactics.",
    systemPrompt: "You are a customer retention specialist. Given a refund or dispute request, write a response: acknowledge the frustration, explain the policy clearly without being robotic, offer an alternative (credit, exchange, or exception if warranted), and close with a retention-focused message. Under 130 words. Human and fair.",
  },
  {
    id: "onboarding-guide",
    name: "User Onboarding Guide",
    role: "Customer Success Specialist",
    category: "Support",
    color: "#0891b2",
    icon: Zap,
    description: "Writes personalized onboarding emails and in-app guidance that drives activation.",
    systemPrompt: "You are a customer success onboarding specialist. Given a new user's name, product they signed up for, and their stated goal, write an onboarding email: warm welcome, 3 quick-start steps they should take today, a tip that delivers immediate value, and a direct reply CTA. Under 150 words. Energetic and helpful.",
  },

  // ── Research ──────────────────────────────────────────────
  {
    id: "market-analyst",
    name: "Market Research Analyst",
    role: "Market Intelligence Analyst",
    category: "Research",
    color: "#0891b2",
    icon: Search,
    description: "Produces sharp market briefs: trends, competitors, opportunities, and a strategic recommendation.",
    popular: true,
    systemPrompt: "You are Rex, an expert market intelligence analyst. Given a company, product, or industry, produce a 200-word brief: top 3 market trends, key competitors and their positioning, one untapped opportunity, and a specific strategic recommendation. Data-driven, no fluff. Executive-ready.",
  },
  {
    id: "competitor-intel",
    name: "Competitor Intelligence Agent",
    role: "Competitive Analyst",
    category: "Research",
    color: "#7c3aed",
    icon: Search,
    description: "Analyzes competitors' positioning, pricing, and weaknesses to find your winning angle.",
    systemPrompt: "You are a competitive intelligence analyst. Given a competitor's name, write a 150-word brief: their core value proposition, target customer, pricing model, 3 strengths, 2 clear weaknesses, and one specific angle we can use to position against them in sales or marketing. Be precise and actionable.",
  },
  {
    id: "trend-spotter",
    name: "Trend Spotter",
    role: "Trend Analyst",
    category: "Research",
    color: "#f59e0b",
    icon: TrendingUp,
    description: "Identifies emerging trends in any industry before they hit the mainstream.",
    isNew: true,
    systemPrompt: "You are a trend intelligence analyst. Given an industry or topic, produce a 150-word brief: 3 emerging trends (not the obvious ones), what's driving each trend, which segment will feel it first, and one early-mover opportunity. Bold, forward-looking, and specific. No generic predictions.",
  },

  // ── Operations ────────────────────────────────────────────
  {
    id: "executive-summary",
    name: "Executive Summary Writer",
    role: "Business Analyst",
    category: "Operations",
    color: "#f59e0b",
    icon: FileText,
    description: "Transforms raw data and updates into crisp executive summaries with clear action items.",
    systemPrompt: "You are Opus, a sharp business analyst. Given a set of metrics, updates, or business context, write an executive summary under 150 words: what is working (top wins), what needs attention (risks or gaps), the single most important insight, and one recommended action. Direct, no corporate jargon. Board-room ready.",
  },
  {
    id: "meeting-notes",
    name: "Meeting Notes Summarizer",
    role: "Executive Assistant",
    category: "Operations",
    color: "#8b5cf6",
    icon: FileText,
    description: "Converts raw meeting notes into structured summaries with decisions, action items, and owners.",
    systemPrompt: "You are an expert executive assistant. Given raw meeting notes or a transcript, produce a structured summary: meeting title and date, attendees, 3-5 key discussion points, decisions made, action items with owner and deadline if mentioned, and next steps. Concise, scannable, and accurate. Under 200 words.",
  },
  {
    id: "proposal-writer",
    name: "Business Proposal Writer",
    role: "Proposal Specialist",
    category: "Operations",
    color: "#6d28d9",
    icon: FileText,
    description: "Writes persuasive business proposals that convert prospects into clients.",
    systemPrompt: "You are a business proposal specialist. Given a client's problem, your solution, and pricing, write a proposal structure: executive summary (problem + solution), your approach (3 key steps), why us (3 differentiators), investment (price framing — lead with ROI), and next step CTA. Professional, confident, and client-focused. Under 250 words.",
  },
];

const CATEGORIES = ["All", "Sales", "Marketing", "Support", "Research", "Operations"];

/* ── Install action ──────────────────────────────────────── */
async function installTemplate(templateId: string) {
  const res = await fetch("/api/agents/install-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ templateId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to install template");
  }
  return res.json();
}

/* ── Template card ───────────────────────────────────────── */
function TemplateCard({
  t, canAdd, installed, onInstall,
}: {
  t: Template;
  canAdd: boolean;
  installed: boolean;
  onInstall: (id: string) => void;
}) {
  const Icon = t.icon;
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16, padding: "18px 18px 14px",
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 12,
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${t.color}40`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 24px ${t.color}12`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Top colour bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${t.color}, ${t.color}00)`,
      }} />

      {/* Badges */}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 4 }}>
        {t.popular && (
          <span style={{
            fontSize: 8, fontWeight: 800, color: "#f59e0b",
            background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 999, padding: "2px 6px", letterSpacing: "0.06em",
          }}>★ POPULAR</span>
        )}
        {t.isNew && (
          <span style={{
            fontSize: 8, fontWeight: 800, color: "#10b981",
            background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: 999, padding: "2px 6px", letterSpacing: "0.06em",
          }}>NEW</span>
        )}
      </div>

      {/* Icon + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `${t.color}15`, border: `1px solid ${t.color}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 14px ${t.color}20`,
        }}>
          <Icon size={17} color={t.color} />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", lineHeight: 1.2 }}>{t.name}</p>
          <p style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>{t.role}</p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: 11, color: "#71717a", lineHeight: 1.5, flex: 1 }}>{t.description}</p>

      {/* Category chip + install button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, color: t.color,
          background: `${t.color}12`, border: `1px solid ${t.color}22`,
          borderRadius: 999, padding: "2px 8px",
        }}>{t.category}</span>

        {installed ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 size={12} color="#10b981" />
            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Deployed</span>
          </div>
        ) : (
          <button
            onClick={() => canAdd && onInstall(t.id)}
            disabled={!canAdd}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "6px 12px", borderRadius: 8,
              background: canAdd ? `${t.color}18` : "rgba(255,255,255,0.04)",
              border: `1px solid ${canAdd ? t.color + "40" : "rgba(255,255,255,0.06)"}`,
              color: canAdd ? t.color : "#3f3f46",
              fontSize: 11, fontWeight: 700, cursor: canAdd ? "pointer" : "not-allowed",
              transition: "all 0.15s",
            }}
          >
            <Zap size={10} />
            {canAdd ? "Deploy" : "Upgrade"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export function TemplateGrid({ canAdd }: { canAdd: boolean }) {
  const router = useRouter();
  const [category, setCategory] = useState("All");
  const [search, setSearch]     = useState("");
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled]   = useState<Set<string>>(new Set());
  const [error, setError]           = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = TEMPLATES.filter(t => {
    const matchCat  = category === "All" || t.category === category;
    const matchSrch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
                      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSrch;
  });

  function handleInstall(templateId: string) {
    if (installing) return;
    setInstalling(templateId);
    setError(null);
    startTransition(async () => {
      try {
        const data = await installTemplate(templateId);
        setInstalled(prev => new Set([...prev, templateId]));
        // Navigate to the new agent after a short delay
        if (data.agentId) {
          setTimeout(() => router.push(`/dashboard/agents/${data.agentId}`), 800);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setInstalling(null);
      }
    });
  }

  return (
    <>
      {/* Search + filter bar */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={13} color="#52525b" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            style={{
              width: "100%", padding: "9px 12px 9px 32px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, color: "#fff", fontSize: 12,
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)} style={{
              padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              background: category === cat ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${category === cat ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`,
              color: category === cat ? "#a78bfa" : "#71717a",
            }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "10px 14px", borderRadius: 10,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
          color: "#fca5a5", fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {/* Installing spinner overlay message */}
      {installing && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10,
          background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <Loader2 size={13} color="#a78bfa" style={{ animation: "spin 1s linear infinite" }} />
          <span style={{ fontSize: 12, color: "#a78bfa" }}>
            Deploying {TEMPLATES.find(t => t.id === installing)?.name}…
          </span>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* Stats bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 11, color: "#52525b" }}>
          <span style={{ color: "#a78bfa", fontWeight: 700 }}>{filtered.length}</span> templates
          {category !== "All" && ` in ${category}`}
        </span>
        {installed.size > 0 && (
          <span style={{ fontSize: 11, color: "#10b981" }}>
            <CheckCircle2 size={10} style={{ display: "inline", marginRight: 3 }} />
            {installed.size} deployed this session
          </span>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <Sparkles size={28} color="#3f3f46" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "#52525b", fontSize: 13 }}>No templates match your search.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map(t => (
            <TemplateCard
              key={t.id}
              t={t}
              canAdd={canAdd}
              installed={installed.has(t.id)}
              onInstall={handleInstall}
            />
          ))}
        </div>
      )}
    </>
  );
}
