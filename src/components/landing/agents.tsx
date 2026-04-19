"use client";
import { Check } from "lucide-react";

const AGENTS = [
  { name: "Ava", role: "AI SDR", emoji: "⚡", color: "#7c3aed", desc: "Writes hyper-personalized cold emails from lead profiles. Books 3x more demos.", skills: ["Cold outreach","Lead research","Follow-ups"] },
  { name: "Rex", role: "Researcher", emoji: "🔍", color: "#0891b2", desc: "Produces market briefs, competitor teardowns, and reports in minutes.", skills: ["Market research","Competitor intel","Reports"] },
  { name: "Sage", role: "Support Rep", emoji: "💬", color: "#059669", desc: "Resolves 60%+ of support tickets automatically using your knowledge base.", skills: ["Ticket resolution","FAQ answers","Escalation"] },
  { name: "Opus", role: "Ops Analyst", emoji: "📊", color: "#d97706", desc: "Monitors dashboards, flags anomalies, writes weekly exec summaries.", skills: ["Monitoring","Anomaly detection","Summaries"] },
];

function AgentCard({ agent }: { agent: typeof AGENTS[0] }) {
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    e.currentTarget.style.transform = `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg) translateZ(8px)`;
  };
  const handleLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  };

  return (
    <div
      className="rounded-3xl p-6 flex flex-col cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl"
          style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}30` }}>
          {agent.emoji}
        </div>
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
          style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30` }}>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: agent.color }} />
          Active
        </div>
      </div>
      <h3 className="text-white font-bold text-xl">{agent.name}</h3>
      <p className="text-zinc-500 text-xs mb-3 font-medium">{agent.role}</p>
      <p className="text-zinc-400 text-sm flex-1 mb-5 leading-relaxed">{agent.desc}</p>
      <div className="space-y-1.5">
        {agent.skills.map(s => (
          <div key={s} className="flex items-center gap-2 text-xs text-zinc-500">
            <Check className="h-3 w-3 shrink-0" style={{ color: agent.color }} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentsShowcase() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {AGENTS.map(agent => <AgentCard key={agent.name} agent={agent} />)}
    </div>
  );
}
