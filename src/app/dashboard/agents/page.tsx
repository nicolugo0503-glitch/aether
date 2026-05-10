import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { HoloCard } from "@/app/dashboard/_components/holo-card";
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
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.6); }
          50%      { opacity:0.8; box-shadow:0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes orbit-ring {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbit-ring-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes glitch-title {
          0%,100% { text-shadow: none; clip-path: none; }
          2%       { text-shadow: -3px 0 #ec4899, 3px 0 #3b82f6; clip-path: inset(20% 0 60% 0); }
          4%       { text-shadow:  3px 0 #ec4899,-3px 0 #3b82f6; clip-path: inset(50% 0 30% 0); }
          6%       { text-shadow: none; clip-path: none; }
          94%      { clip-path: none; }
          96%      { text-shadow: -2px 0 #a78bfa; clip-path: inset(40% 0 40% 0); }
          98%      { text-shadow: none; clip-path: none; }
        }
        @keyframes scan-line {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes float-icon {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes hire-glow {
          0%,100% { box-shadow: 0 0 20px rgba(124,58,237,0.4), 0 4px 20px rgba(124,58,237,0.2); }
          50%      { box-shadow: 0 0 40px rgba(124,58,237,0.7), 0 4px 30px rgba(124,58,237,0.35); }
        }
        @keyframes neon-flicker {
          0%,100% { opacity: 1; }
          4%       { opacity: 0.8; }
          8%       { opacity: 1; }
          9%       { opacity: 0.7; }
          10%      { opacity: 1; }
        }
        @keyframes data-stream {
          0%   { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }
        @keyframes count-in {
          from { opacity: 0; transform: scale(0.7) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes border-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer-sweep {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes status-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }

        .agent-card {
          animation: agent-enter 0.5s cubic-bezier(0.16,1,0.3,1) both;
          position: relative; overflow: hidden;
          text-decoration: none; display: block;
        }
        .agent-card:nth-child(1) { animation-delay: 0.04s; }
        .agent-card:nth-child(2) { animation-delay: 0.10s; }
        .agent-card:nth-child(3) { animation-delay: 0.16s; }
        .agent-card:nth-child(4) { animation-delay: 0.22s; }
        .agent-card:nth-child(5) { animation-delay: 0.28s; }

        /* Scan line on hover */
        .agent-card-inner { position: relative; overflow: hidden; }
        .agent-card-inner::after {
          content: "";
          position: absolute;
          left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(124,58,237,0.8), rgba(167,139,250,1), rgba(124,58,237,0.8), transparent);
          transform: translateY(-100%);
          pointer-events: none;
          opacity: 0;
          z-index: 20;
        }
        .agent-card-wrap:hover .agent-card-inner::after {
          animation: scan-line 0.8s ease forwards;
        }

        .agent-arrow {
          transition: transform 0.2s ease, color 0.2s ease;
          color: #3f3f46;
        }
        .agent-card-wrap:hover .agent-arrow {
          transform: translateX(5px) translateY(-1px);
          color: #a78bfa;
        }

        .preset-chip {
          transition: all 0.18s ease;
          cursor: pointer;
        }
        .preset-chip:hover { transform: translateY(-2px) scale(1.02); }

        .hire-submit {
          transition: all 0.2s ease;
          animation: hire-glow 2.5s ease-in-out infinite;
        }
        .hire-submit:hover {
          transform: translateY(-2px) scale(1.01);
          animation: none;
          box-shadow: 0 0 50px rgba(124,58,237,0.8), 0 8px 30px rgba(124,58,237,0.4) !important;
        }

        .form-input {
          width: 100%;
          background: rgba(10,10,16,0.8);
          border: 1px solid rgba(124,58,237,0.2);
          border-radius: 8px;
          padding: 10px 14px 10px 28px;
          font-size: 13px;
          color: #e4e4e7;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          display: block;
          box-sizing: border-box;
          font-family: 'Courier New', 'Fira Code', monospace;
        }
        .form-input::placeholder { color: #3f3f46; }
        .form-input:focus {
          border-color: rgba(124,58,237,0.6);
          box-shadow: 0 0 0 2px rgba(124,58,237,0.15), 0 0 20px rgba(124,58,237,0.1), inset 0 0 20px rgba(124,58,237,0.03);
          background: rgba(10,5,30,0.9);
        }
        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 7px;
          font-family: 'Courier New', monospace;
        }
        .form-label::before {
          content: ">";
          color: #7c3aed;
          font-weight: 900;
        }
        .form-wrapper { position: relative; }
        .form-wrapper::before {
          content: "_";
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #7c3aed;
          font-size: 14px;
          pointer-events: none;
          font-family: monospace;
          z-index: 1;
        }

        .orbit-container { position: relative; display: flex; align-items: center; justify-content: center; }
        .orbit-ring-1 {
          position: absolute; inset: -14px; border-radius: 50%;
          border: 1px solid rgba(124,58,237,0.35);
          animation: orbit-ring 5s linear infinite;
        }
        .orbit-ring-1::before {
          content: "";
          position: absolute;
          width: 6px; height: 6px;
          background: #7c3aed;
          border-radius: 50%;
          top: -3px; left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 8px #7c3aed, 0 0 16px rgba(124,58,237,0.5);
        }
        .orbit-ring-2 {
          position: absolute; inset: -8px; border-radius: 50%;
          border: 1px dashed rgba(167,139,250,0.25);
          animation: orbit-ring-rev 3s linear infinite;
        }
        .orbit-ring-2::after {
          content: "";
          position: absolute;
          width: 4px; height: 4px;
          background: #a78bfa;
          border-radius: 50%;
          bottom: -2px; left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 6px #a78bfa;
        }

        .count-badge { animation: count-in 0.6s cubic-bezier(0.16,1,0.3,1) 0.1s both; }

        .status-bar-dot { animation: status-blink 1.5s ease-in-out infinite; }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            {/* Pulsing icon */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 16,
                background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(109,40,217,0.1))",
                border: "1px solid rgba(124,58,237,0.45)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 30px rgba(124,58,237,0.3), 0 0 60px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.07)",
                animation: "float-icon 3s ease-in-out infinite",
              }}>
                <Brain size={22} color="#a78bfa" />
              </div>
              <div style={{
                position: "absolute", inset: -4, borderRadius: 20,
                border: "1px solid rgba(124,58,237,0.2)",
                animation: "border-spin 8s linear infinite",
                background: "conic-gradient(from 0deg, rgba(124,58,237,0.4) 0deg, transparent 60deg, transparent 300deg, rgba(124,58,237,0.4) 360deg)",
              }} />
            </div>
            <div>
              <h1 style={{
                fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1,
                background: "linear-gradient(135deg, #fff 0%, #c4b5fd 40%, #a78bfa 70%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                animation: "glitch-title 8s ease-in-out infinite",
              }}>
                AI Employees
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                <span className="status-bar-dot" style={{
                  width: 6, height: 6, borderRadius: "50%", background: "#10b981",
                  boxShadow: "0 0 8px rgba(16,185,129,0.8)", display: "inline-block",
                }} />
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, fontFamily: "monospace" }}>
                  {agents.length} UNIT{agents.length !== 1 ? "S" : ""} ONLINE · AUTONOMOUS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orbital headcount display */}
        <div className="count-badge" style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "20px 28px", borderRadius: 20,
          background: "rgba(6,6,16,0.9)",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "0 0 60px rgba(124,58,237,0.08), inset 0 1px 0 rgba(124,58,237,0.1)",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, fontFamily: "monospace" }}>HEADCOUNT</span>

          {/* Orbital rings container */}
          <div className="orbit-container" style={{ width: 80, height: 80 }}>
            <div className="orbit-ring-1" />
            <div className="orbit-ring-2" />
            <div style={{
              textAlign: "center",
              width: 54, height: 54, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(124,58,237,0.2)",
              boxShadow: "inset 0 0 20px rgba(124,58,237,0.1)",
            }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{agents.length}</span>
              <span style={{ fontSize: 9, color: "#3f3f46" }}>/{limit}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 12, width: 80, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${usedPct}%`, borderRadius: 999,
              background: usedPct > 80 ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg,#7c3aed,#a855f7)",
              boxShadow: usedPct > 80 ? "0 0 8px rgba(239,68,68,0.6)" : "0 0 10px rgba(124,58,237,0.6)",
              transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </div>
      </div>

      {/* ── AGENT GRID ──────────────────────────────────────── */}
      {agents.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {agents.map((a, i) => {
            const initials = a.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
            const color    = PALETTE[i % PALETTE.length];
            return (
              <div key={a.id} className="agent-card agent-card-wrap" style={{ animationDelay: `${0.04 + i * 0.06}s` }}>
                <HoloCard style={{
                  background: "rgba(6,6,16,0.85)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 20,
                  boxShadow: `0 0 0 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}>
                  <Link href={`/dashboard/agents/${a.id}`} className="agent-card-inner" style={{
                    display: "block", textDecoration: "none", padding: "20px",
                    position: "relative", borderRadius: 20,
                  }}>
                    {/* Top accent bar */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "20px 20px 0 0",
                      background: `linear-gradient(90deg, ${color}dd, ${color}55, transparent)`,
                      boxShadow: `0 0 12px ${color}88`,
                    }} />

                    {/* Corner glow */}
                    <div style={{
                      position: "absolute", top: -20, left: -20, width: 100, height: 100,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
                      pointerEvents: "none",
                    }} />

                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative", zIndex: 1 }}>
                      {/* Avatar with rings */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: 50, height: 50, borderRadius: 15,
                          background: `linear-gradient(135deg, ${color}cc, ${color}66)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 16, fontWeight: 900, color: "#fff",
                          boxShadow: `0 0 24px ${color}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                        }}>
                          {initials}
                        </div>
                        {/* Online dot */}
                        <div style={{
                          position: "absolute", bottom: -2, right: -2,
                          width: 13, height: 13, borderRadius: "50%",
                          background: "#10b981", border: "2px solid #09090b",
                          boxShadow: "0 0 8px rgba(16,185,129,0.9), 0 0 16px rgba(16,185,129,0.4)",
                          animation: "pulse-dot 2.4s ease infinite",
                        }} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.name}
                          </h3>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: "2px 8px", borderRadius: 999, flexShrink: 0,
                            background: `${color}18`, color, border: `1px solid ${color}35`,
                            letterSpacing: "0.05em", textTransform: "uppercase",
                          }}>
                            {a.role}
                          </span>
                        </div>

                        {a.description && (
                          <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 10 }}>
                            {a.description}
                          </p>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "3px 9px", borderRadius: 999,
                            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                          }}>
                            <Zap size={9} color="#f59e0b" />
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", fontVariantNumeric: "tabular-nums", fontFamily: "monospace" }}>{a._count.runs} runs</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{
                              width: 5, height: 5, borderRadius: "50%", background: "#10b981",
                              display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.8)",
                              animation: "pulse-dot 2.2s ease infinite",
                            }} />
                            <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>ACTIVE</span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={16} className="agent-arrow" style={{ marginTop: 2, flexShrink: 0 }} />
                    </div>
                  </Link>
                </HoloCard>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          borderRadius: 24, padding: "80px 24px", textAlign: "center",
          background: "radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.08) 0%, rgba(6,6,16,0.8) 70%)",
          border: "1px dashed rgba(124,58,237,0.25)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Grid pattern */}
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
          }} />

          {/* Orbiting icon */}
          <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 20px" }}>
            <div className="orbit-container" style={{ width: 80, height: 80 }}>
              <div className="orbit-ring-1" />
              <div className="orbit-ring-2" />
              <div style={{
                width: 54, height: 54, borderRadius: "50%",
                background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 30px rgba(124,58,237,0.2), inset 0 0 20px rgba(124,58,237,0.1)",
                animation: "float-icon 3s ease-in-out infinite",
              }}>
                <Users size={24} color="#7c3aed" />
              </div>
            </div>
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 6, position: "relative" }}>No employees deployed</h3>
          <p style={{ fontSize: 13, color: "#52525b", position: "relative" }}>Hire your first AI employee using the terminal below.</p>
        </div>
      )}

      {/* ── HIRE FORM — TERMINAL ──────────────────────────── */}
      {agents.length < limit && (
        <div style={{
          borderRadius: 24, overflow: "hidden",
          background: "rgba(4,4,12,0.98)",
          border: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "0 0 80px rgba(124,58,237,0.08), 0 0 0 1px rgba(0,0,0,0.5), inset 0 1px 0 rgba(124,58,237,0.1)",
        }}>
          {/* Terminal header bar */}
          <div style={{
            padding: "12px 20px",
            borderBottom: "1px solid rgba(124,58,237,0.15)",
            background: "rgba(124,58,237,0.06)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            {/* Traffic lights */}
            <div style={{ display: "flex", gap: 6, marginRight: 4 }}>
              {["#ef4444","#f59e0b","#10b981"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}88` }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "#7c3aed", fontFamily: "monospace", fontWeight: 700, animation: "neon-flicker 6s ease-in-out infinite" }}>
              aether@workforce:~$ hire --new-employee
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <div className="status-bar-dot" style={{
                width: 6, height: 6, borderRadius: "50%", background: "#10b981",
                boxShadow: "0 0 6px rgba(16,185,129,0.8)",
              }} />
              <span style={{ fontSize: 10, color: "#10b981", fontFamily: "monospace", fontWeight: 700 }}>READY</span>
            </div>
          </div>

          {/* Grid background */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "linear-gradient(rgba(124,58,237,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.025) 1px, transparent 1px)",
              backgroundSize: "30px 30px",
              pointerEvents: "none",
            }} />

            <div style={{ padding: "24px" }}>
              {/* Role presets */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10, fontFamily: "monospace" }}>
                  <span style={{ color: "#7c3aed" }}>&gt;</span> SELECT ROLE TEMPLATE
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ROLE_PRESETS.map(p => (
                    <div key={p.label} className="preset-chip" style={{
                      padding: "8px 16px", borderRadius: 10,
                      background: `${p.color}0a`,
                      border: `1px solid ${p.color}25`,
                      boxShadow: `0 2px 16px ${p.color}0d`,
                    }}>
                      <span style={{ fontSize: 13 }}>{p.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: p.color, marginLeft: 6, fontFamily: "monospace" }}>{p.label}</span>
                      <span style={{ fontSize: 10, color: "#52525b", marginLeft: 6 }}>{p.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form action={createAgent} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, position: "relative", zIndex: 1 }}>
                <div>
                  <label className="form-label">Employee Name</label>
                  <div className="form-wrapper">
                    <input className="form-input" name="name" required placeholder="Nova — AI Outbound" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Role / Title</label>
                  <div className="form-wrapper">
                    <input className="form-input" name="role" required placeholder="SDR, Copywriter, Analyst" />
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Description</label>
                  <div className="form-wrapper">
                    <input className="form-input" name="description" placeholder="Brief description shown in the dashboard" />
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">
                    System Prompt
                    <span style={{ fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0, fontFamily: "inherit", fontSize: 10 }}>— defines behavior & personality</span>
                  </label>
                  <div className="form-wrapper" style={{ position: "relative" }}>
                    <textarea className="form-input" name="systemPrompt" required rows={5}
                      style={{ paddingLeft: 28 }}
                      placeholder="You are an expert SDR who specializes in cold outreach. Your goal is to..." />
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">
                    Knowledge / Playbook
                    <span style={{ fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0, fontFamily: "inherit", fontSize: 10 }}>(optional)</span>
                  </label>
                  <div className="form-wrapper">
                    <textarea className="form-input" name="knowledge" rows={4}
                      style={{ paddingLeft: 28 }}
                      placeholder="Paste company context, playbook, FAQs, pricing, or anything the agent should know..." />
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <button type="submit" className="hire-submit btn-shine" style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9,#5b21b6)",
                    color: "#fff", borderRadius: 14,
                    padding: "13px 28px", fontSize: 14, fontWeight: 800,
                    border: "1px solid rgba(167,139,250,0.2)",
                    cursor: "pointer",
                    position: "relative", overflow: "hidden",
                    letterSpacing: "0.02em",
                  }}>
                    <Plus size={16} />
                    DEPLOY EMPLOYEE
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── LIMIT REACHED ─────────────────────────────────── */}
      {agents.length >= limit && (
        <div style={{
          borderRadius: 20, padding: "20px 24px",
          display: "flex", alignItems: "center", gap: 16,
          background: "rgba(124,58,237,0.05)",
          border: "1px solid rgba(124,58,237,0.2)",
          boxShadow: "inset 0 1px 0 rgba(124,58,237,0.08), 0 0 40px rgba(124,58,237,0.05)",
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 20px rgba(124,58,237,0.2)",
          }}>
            <Activity size={20} color="#a78bfa" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}>Headcount limit reached</p>
            <p style={{ fontSize: 12, color: "#52525b" }}>You&apos;ve deployed {limit} of {limit} employees on your current plan.</p>
          </div>
          <Link href="/dashboard/billing" style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "10px 18px", borderRadius: 12,
            background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))",
            border: "1px solid rgba(124,58,237,0.35)",
            color: "#a78bfa", fontSize: 12, fontWeight: 800,
            textDecoration: "none", flexShrink: 0,
            transition: "all 0.2s ease",
            boxShadow: "0 0 20px rgba(124,58,237,0.15)",
          }}>
            <Sparkles size={13} />
            Upgrade Plan
          </Link>
        </div>
      )}
    </div>
  );
}
