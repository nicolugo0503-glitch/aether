"use client";
import { Check } from "lucide-react";

const AGENTS = [
  {
    name: "Ava",
    role: "AI SDR",
    emoji: "⚡",
    color: "#7c3aed",
    desc: "Writes hyper-personalized cold emails from lead profiles. Books 3x more demos than manual outreach — while you sleep.",
    skills: ["Cold outreach", "Lead research", "Follow-ups"],
    preview: "Sent 847 personalized emails this morning. 12 replies received. 3 demos booked.",
    metric: "847",
    metricLabel: "emails sent today",
  },
  {
    name: "Rex",
    role: "Researcher",
    emoji: "🔍",
    color: "#0891b2",
    desc: "Produces market briefs, competitor teardowns, and account research reports in minutes, not days.",
    skills: ["Market research", "Competitor intel", "Reports"],
    preview: "Completed research on 14 Series B accounts. Full brief ready in your dashboard.",
    metric: "14",
    metricLabel: "accounts researched",
  },
  {
    name: "Sage",
    role: "Support Rep",
    emoji: "💬",
    color: "#059669",
    desc: "Resolves 60%+ of support tickets automatically using your knowledge base. Escalates only when humans are truly needed.",
    skills: ["Ticket resolution", "FAQ answers", "Escalation"],
    preview: "Resolved 6 support tickets in the last hour. CSAT score: 4.9/5. Zero escalations.",
    metric: "60%",
    metricLabel: "tickets auto-resolved",
  },
  {
    name: "Opus",
    role: "Ops Analyst",
    emoji: "📊",
    color: "#d97706",
    desc: "Monitors dashboards, flags anomalies, and writes executive summaries every week — without being asked.",
    skills: ["Monitoring", "Anomaly detection", "Summaries"],
    preview: "Flagged a 23% drop in email open rate. Root cause identified. Weekly report ready.",
    metric: "23%",
    metricLabel: "anomaly detected",
  },
];

export function AgentsShowcase() {
  return (
    <div className="grid md:grid-cols-2 gap-5">
      {AGENTS.map((agent) => (
        <div
          key={agent.name}
          className="group rounded-3xl p-7 md:p-8 flex flex-col gap-6 relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
            (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${agent.color}12`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
            (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
          }}
        >
          {/* Top color bar */}
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${agent.color}70, transparent)` }} />

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
                style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}35` }}>
                {agent.emoji}
              </div>
              <div>
                <h3 className="text-white font-black text-2xl leading-none mb-1">{agent.name}</h3>
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: agent.color }}>{agent.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full shrink-0"
              style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30` }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: agent.color }} />
              Active
            </div>
          </div>

          {/* Description */}
          <p className="text-zinc-300 text-base leading-relaxed">{agent.desc}</p>

          {/* Skills */}
          <div className="flex flex-wrap gap-2">
            {agent.skills.map(s => (
              <div key={s} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium"
                style={{ background: `${agent.color}10`, color: agent.color, border: `1px solid ${agent.color}25` }}>
                <Check className="h-3 w-3" />
                {s}
              </div>
            ))}
          </div>

          {/* Live metric + preview */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="rounded-2xl px-4 py-3"
              style={{ background: `${agent.color}08`, border: `1px solid ${agent.color}20` }}>
              <div className="text-2xl font-black text-white">{agent.metric}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{agent.metricLabel}</div>
            </div>
            <div className="rounded-2xl px-4 py-3"
              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[10px] text-zinc-700 uppercase tracking-widest mb-1.5">Live</div>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{agent.preview}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
