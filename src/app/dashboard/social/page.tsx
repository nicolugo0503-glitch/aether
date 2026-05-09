import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Share2, Bot, Plus, ChevronRight, ArrowUpRight,
  Twitter, Instagram, Linkedin, Youtube,
  FileText, Clock, CheckCircle2, XCircle, Loader2,
} from "lucide-react";

export const metadata = { title: "Social Media | Aether Dashboard" };

const PLATFORMS = [
  { id: "twitter",   label: "Twitter / X",  icon: Twitter,   color: "#e7e9ea", bg: "#e7e9ea14" },
  { id: "instagram", label: "Instagram",     icon: Instagram, color: "#e1306c", bg: "#e1306c14" },
  { id: "linkedin",  label: "LinkedIn",      icon: Linkedin,  color: "#0a66c2", bg: "#0a66c214" },
  { id: "youtube",   label: "YouTube",       icon: Youtube,   color: "#ff0000", bg: "#ff000014" },
];

function statusStyle(status: string) {
  switch (status.toUpperCase()) {
    case "SUCCESS":
    case "COMPLETED": return { icon: CheckCircle2, color: "#10b981", label: "Completed" };
    case "FAILED":
    case "ERROR":     return { icon: XCircle,      color: "#ef4444", label: "Failed" };
    case "RUNNING":   return { icon: Loader2,      color: "#f59e0b", label: "Running" };
    default:          return { icon: Clock,         color: "#71717a", label: status };
  }
}

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function SocialPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    include: { _count: { select: { runs: true } } },
    orderBy: { createdAt: "desc" },
  });

  const recentRuns = await prisma.run.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { agent: true },
  });

  const completedRuns = recentRuns.filter(r =>
    r.status.toUpperCase() === "SUCCESS" || r.status.toUpperCase() === "COMPLETED"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 14px rgba(59,130,246,0.35)"
            }}>
              <Share2 size={16} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.4px" }}>
              Social Media
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#52525b" }}>
            Use your AI employees to draft content, then copy-paste to your platforms.
          </p>
        </div>

        <Link
          href="/dashboard/agents"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "#fff", borderRadius: 11, padding: "9px 16px",
            fontSize: 13, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 0 14px rgba(124,58,237,0.38)",
          }}
        >
          <Plus size={14} />
          Create Post
        </Link>
      </div>

      {/* How it works */}
      <div style={{
        borderRadius: 16, padding: "20px 24px",
        background: "rgba(59,130,246,0.05)",
        border: "1px solid rgba(59,130,246,0.15)",
      }}>
        <p style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          How to create a social post
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { step: "1", text: "Go to AI Employees and pick any agent" },
            { step: "2", text: "Run it with your topic (e.g. \"Write a LinkedIn post about our product launch\")" },
            { step: "3", text: "Copy the AI-generated draft and paste into your platform" },
          ].map(({ step, text }) => (
            <div key={step} style={{
              display: "flex", alignItems: "center", gap: 10, flex: "1 1 260px",
              padding: "10px 14px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#60a5fa",
              }}>
                {step}
              </div>
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Platform targets */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
          Platforms you can post to
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
          {PLATFORMS.map(({ id, label, icon: Icon, color, bg }) => (
            <div key={id} style={{
              padding: "14px 16px", borderRadius: 12,
              background: bg, border: `1px solid ${color}22`,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <Icon size={18} color={color} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#d4d4d8" }}>{label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 8 }}>
          Direct publishing integrations coming soon. For now, copy AI-generated drafts and post manually.
        </p>
      </div>

      {/* Your AI writers */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Your AI employees
          </h2>
          <Link href="/dashboard/agents" style={{ fontSize: 12, color: "#52525b", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
            Manage <ChevronRight size={12} />
          </Link>
        </div>

        {agents.length === 0 ? (
          <div style={{
            padding: "36px 24px", textAlign: "center", borderRadius: 14,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <Bot size={28} color="#3f3f46" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 500, marginBottom: 6 }}>No AI employees yet</p>
            <p style={{ fontSize: 12, color: "#52525b", marginBottom: 16 }}>Hire an agent to start drafting social content.</p>
            <Link href="/dashboard/agents" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              color: "#fff", borderRadius: 10, padding: "8px 16px",
              fontSize: 12, fontWeight: 700, textDecoration: "none",
            }}>
              <Plus size={13} /> Hire your first agent
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {agents.map((agent, i) => {
              const COLORS = [
                ["#7c3aed","#6d28d9"], ["#ec4899","#db2777"],
                ["#3b82f6","#2563eb"], ["#10b981","#059669"],
              ];
              const [c1, c2] = COLORS[i % COLORS.length];
              return (
                <Link
                  key={agent.id}
                  href={`/dashboard/agents/${agent.id}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                    borderRadius: 12, background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.06)", textDecoration: "none",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `linear-gradient(135deg, ${c1}, ${c2})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 900, color: "#fff",
                  }}>
                    {agent.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: "#71717a" }}>{agent.role}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a1a1aa" }}>{agent._count.runs}</div>
                    <div style={{ fontSize: 10, color: "#52525b" }}>runs</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent drafts from runs */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Recent AI drafts
            </h2>
            <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 2 }}>
              Every completed run is a potential post. Open a run to copy the output.
            </p>
          </div>
          <Link href="/dashboard/runs" style={{ fontSize: 12, color: "#52525b", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
            All runs <ChevronRight size={12} />
          </Link>
        </div>

        {recentRuns.length === 0 ? (
          <div style={{
            padding: "36px 24px", textAlign: "center", borderRadius: 14,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <FileText size={28} color="#3f3f46" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 500, marginBottom: 4 }}>No drafts yet</p>
            <p style={{ fontSize: 12, color: "#52525b" }}>Run an agent with a social media brief to generate your first draft.</p>
          </div>
        ) : (
          <div style={{
            borderRadius: 14, overflow: "hidden",
            background: "rgba(255,255,255,0.018)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            {recentRuns.map((run, i) => {
              const { icon: SIcon, color, label } = statusStyle(run.status);
              return (
                <Link
                  key={run.id}
                  href={`/dashboard/runs`}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", textDecoration: "none",
                    borderBottom: i < recentRuns.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `${color}14`, border: `1px solid ${color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <SIcon size={14} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 1 }}>
                      {run.agent?.name ?? "Agent"} — run
                    </div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{timeAgo(run.createdAt)}</div>
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600, color,
                    padding: "3px 10px", borderRadius: 20,
                    background: `${color}12`, border: `1px solid ${color}22`,
                  }}>
                    {label}
                  </div>
                  <ArrowUpRight size={13} color="#3f3f46" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats — real ones only */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
        {[
          { label: "Total agents", value: agents.length, color: "#7c3aed" },
          { label: "Total runs", value: recentRuns.length, color: "#3b82f6" },
          { label: "Completed", value: completedRuns.length, color: "#10b981" },
          { label: "Platforms", value: PLATFORMS.length, color: "#f59e0b" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            padding: "16px", borderRadius: 12,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
