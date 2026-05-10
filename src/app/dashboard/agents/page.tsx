import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Plus, Bot, ChevronRight, Zap, Users, Sparkles, Brain, Activity } from "lucide-react";

async function createAgent(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const count = await prisma.agent.count({ where: { userId: user.id } });
  const limit = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  if (count >= limit) redirect("/dashboard/billing?error=agent_limit");

  const agent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") || "New Agent"),
      role: String(formData.get("role") || "Specialist"),
      description: String(formData.get("description") || ""),
      systemPrompt: String(
        formData.get("systemPrompt") || "You are a helpful specialist.",
      ),
      knowledge: String(formData.get("knowledge") || ""),
    },
  });
  redirect(`/dashboard/agents/${agent.id}`);
}

const ROLE_PRESETS = [
  { label: "SDR",        desc: "Cold outreach & lead qualification", color: "#7c3aed", icon: "🎯" },
  { label: "Copywriter", desc: "Emails, ads, landing pages",         color: "#ec4899", icon: "✍️" },
  { label: "Analyst",    desc: "Data research & insights",           color: "#3b82f6", icon: "📊" },
  { label: "Support",    desc: "Customer service & FAQs",            color: "#10b981", icon: "💬" },
];

const PALETTE = ["#7c3aed","#0ea5e9","#10b981","#f59e0b","#ec4899","#06b6d4"];

export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  const limit   = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  const usedPct = Math.min(100, (agents.length / limit) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <style>{`
        @keyframes agent-enter {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmer-sweep {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          50% { opacity: 0.7; box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes orbit-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-icon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes hire-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(124,58,237,0.35); }
          50% { box-shadow: 0 0 40px rgba(124,58,237,0.65); }
        }
        @keyframes border-animate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes count-in {
          from { opacity: 0; transform: scale(0.8) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .agent-card {
          animation: agent-enter 0.45s cubic-bezier(0.16,1,0.3,1) both;
          position: relative; overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          text-decoration: none;
          display: block;
        }
        .agent-card:nth-child(1) { animation-delay: 0.04s; }
        .agent-card:nth-child(2) { animation-delay: 0.09s; }
        .agent-card:nth-child(3) { animation-delay: 0.14s; }
        .agent-card:nth-child(4) { animation-delay: 0.19s; }
        .agent-card:nth-child(5) { animation-delay: 0.24s; }

        .agent-card:hover {
          transform: translateY(-4px) scale(1.01);
        }
        .agent-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%);
          transform: translateX(-100%) skewX(-12deg);
          z-index: 2;
          pointer-events: none;
        }
        .agent-card:hover::before {
          animation: shimmer-sweep 0.6s ease forwards;
        }
        .agent-card .agent-arrow {
          transition: transform 0.2s ease, color 0.2s ease;
          color: #3f3f46;
        }
        .agent-card:hover .agent-arrow { transform: translateX(5px) translateY(-1px); color: #a78bfa; }

        .preset-chip {
          transition: all 0.18s ease;
          cursor: pointer;
        }
        .preset-chip:hover { transform: translateY(-2px); }

        .hire-submit {
          transition: all 0.2s ease;
          animation: hire-glow 3s ease-in-out infinite;
        }
        .hire-submit:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(124,58,237,0.65) !important;
          animation: none;
        }

        .count-badge {
          animation: count-in 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both;
        }

        .form-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #e4e4e7;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          display: block;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input::placeholder { color: #3f3f46; }
        .form-input:focus {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12), 0 0 16px rgba(124,58,237,0.1);
          background: rgba(124,58,237,0.04);
        }
        .form-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 7px;
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            {/* Animated icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(109,40,217,0.1))",
              border: "1px solid rgba(124,58,237,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 20px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
              animation: "float-icon 3s ease-in-out infinite",
            }}>
              <Bot size={20} color="#a78bfa" />
            </div>
            <div>
              <h1 style={{
                fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1,
                background: "linear-gradient(135deg, #fff 0%, #a78bfa 60%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                AI Employees
              </h1>
              <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>
                Your autonomous workforce — always on, never tired.
              </p>
            </div>
          </div>
        </div>

        {/* Headcount badge */}
        <div className="count-badge" style={{
          display: "flex", flexDirection: "column", alignItems: "flex-end",
          padding: "14px 20px", borderRadius: 16,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Headcount</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 36, fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>{agents.length}</span>
            <span style={{ fontSize: 14, color: "#3f3f46" }}>/ {limit}</span>
          </div>
          <div style={{ marginTop: 8, width: 100, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${usedPct}%`, borderRadius: 999,
              background: usedPct > 80 ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg,#7c3aed,#a855f7)",
              boxShadow: usedPct > 80 ? "0 0 8px rgba(239,68,68,0.5)" : "0 0 8px rgba(124,58,237,0.5)",
              transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </div>
      </div>

      {/* ── AGENT GRID ──────────────────────────────────────── */}
      {agents.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {agents.map((a, i) => {
            const initials = a.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
            const color    = PALETTE[i % PALETTE.length];
            return (
              <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="agent-card" style={{
                background: "rgba(255,255,255,0.022)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 18, padding: "20px 20px",
              }}>
                {/* Ambient corner glow */}
                <div style={{
                  position: "absolute", top: -30, left: -20, width: 120, height: 120,
                  borderRadius: "50%", opacity: 0,
                  background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
                }} className="agent-glow" />
                {/* Top accent bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "18px 18px 0 0",
                  background: `linear-gradient(90deg, ${color}cc, ${color}00)`,
                }} />

                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative", zIndex: 1 }}>
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `linear-gradient(135deg, ${color}cc, ${color}77)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 15, fontWeight: 900, color: "#fff",
                      boxShadow: `0 0 20px ${color}44, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}>
                      {initials}
                    </div>
                    {/* Online dot */}
                    <div style={{
                      position: "absolute", bottom: -1, right: -1,
                      width: 12, height: 12, borderRadius: "50%",
                      background: "#10b981", border: "2px solid #09090b",
                      boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                      animation: "pulse-dot 2.4s ease infinite",
                    }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.name}
                      </h3>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999, flexShrink: 0,
                        background: `${color}15`, color, border: `1px solid ${color}30`,
                        letterSpacing: "0.03em",
                      }}>
                        {a.role}
                      </span>
                    </div>

                    {a.description && (
                      <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {a.description}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 999,
                        background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                      }}>
                        <Zap size={10} color="#f59e0b" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>{a._count.runs} runs</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block",
                          boxShadow: "0 0 6px rgba(16,185,129,0.6)",
                          animation: "pulse-dot 2.2s ease infinite",
                        }} />
                        <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>Active</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="agent-arrow" style={{ marginTop: 2, flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{
          borderRadius: 20, padding: "64px 24px", textAlign: "center",
          background: "rgba(255,255,255,0.015)",
          border: "1px dashed rgba(124,58,237,0.2)",
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 30px rgba(124,58,237,0.15)",
            animation: "float-icon 3s ease-in-out infinite",
          }}>
            <Users size={28} color="#7c3aed" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>No employees hired yet</h3>
          <p style={{ fontSize: 13, color: "#52525b" }}>Hire your first AI employee using the form below.</p>
        </div>
      )}

      {/* ── HIRE FORM ──────────────────────────────────────── */}
      {agents.length < limit && (
        <div style={{
          borderRadius: 20, overflow: "hidden",
          background: "rgba(6,6,10,0.95)",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "0 0 60px rgba(124,58,237,0.08), inset 0 1px 0 rgba(124,58,237,0.08)",
        }}>
          {/* Form header */}
          <div style={{
            padding: "18px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "linear-gradient(90deg, rgba(124,58,237,0.08) 0%, transparent 60%)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 14px rgba(124,58,237,0.3)",
            }}>
              <Plus size={15} color="#a78bfa" />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>
                Hire a New AI Employee
              </h2>
              <p style={{ fontSize: 11, color: "#52525b", marginTop: 1 }}>
                Deployed instantly — available 24 / 7
              </p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <Sparkles size={12} color="#a78bfa" />
              <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>AI-Powered</span>
            </div>
          </div>

          <div style={{ padding: "24px 24px" }}>
            {/* Role presets */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>
                Quick Role Presets
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ROLE_PRESETS.map(p => (
                  <div key={p.label} className="preset-chip" style={{
                    padding: "8px 14px", borderRadius: 10,
                    background: `${p.color}0d`,
                    border: `1px solid ${p.color}25`,
                    boxShadow: `0 2px 12px ${p.color}10`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</span>
                    <span style={{ fontSize: 11, color: "#52525b", marginLeft: 6 }}>· {p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form action={createAgent} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="form-label">Name</label>
                <input className="form-input" name="name" required placeholder="e.g. Nova — AI Outbound" />
              </div>
              <div>
                <label className="form-label">Role</label>
                <input className="form-input" name="role" required placeholder="e.g. SDR, Copywriter" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Description</label>
                <input className="form-input" name="description" placeholder="Brief description shown in the UI" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">
                  System Prompt
                  <span style={{ marginLeft: 6, fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>— defines your employee&apos;s behavior</span>
                </label>
                <textarea className="form-input" name="systemPrompt" required rows={5}
                  placeholder="You are an expert SDR who specializes in cold outreach. Your goal is to..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">
                  Knowledge / Playbook
                  <span style={{ marginLeft: 6, fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                </label>
                <textarea className="form-input" name="knowledge" rows={4}
                  placeholder="Paste company context, playbook, FAQs, pricing, or anything the agent should know..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" className="hire-submit btn-shine" style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  color: "#fff", borderRadius: 12,
                  padding: "11px 24px", fontSize: 13, fontWeight: 700,
                  border: "none", cursor: "pointer",
                  position: "relative", overflow: "hidden",
                }}>
                  <Plus size={15} />
                  Hire Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIMIT REACHED ─────────────────────────────────── */}
      {agents.length >= limit && (
        <div style={{
          borderRadius: 18, padding: "18px 22px",
          display: "flex", alignItems: "center", gap: 16,
          background: "rgba(124,58,237,0.06)",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "inset 0 1px 0 rgba(124,58,237,0.08)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={18} color="#a78bfa" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>Headcount full</p>
            <p style={{ fontSize: 12, color: "#52525b" }}>You&apos;ve hired {limit} of {limit} employees on your plan.</p>
          </div>
          <Link href="/dashboard/billing" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa", fontSize: 12, fontWeight: 700,
            textDecoration: "none", flexShrink: 0,
            transition: "all 0.2s ease",
          }}>
            <Sparkles size={12} />
            Upgrade
          </Link>
        </div>
      )}
    </div>
  );
}
