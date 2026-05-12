import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import {
  Bot, Play, Gauge, TrendingUp, TrendingDown, Minus,
  ChevronRight, Settings, Megaphone, Share2,
  ArrowUpRight, CheckCircle2, Plus, Sparkles,
  Activity, ListChecks, CreditCard, Zap,
} from "lucide-react";
import { Aurora }          from "./_components/aurora";
import { ParticleCanvas } from "./_components/particle-canvas";
import { Sparkline }       from "./_components/sparkline";
import { AnimatedCounter } from "./_components/animated-counter";
import { LiveFeed }        from "./_components/live-feed";
import { CommandPalette }  from "./_components/command-palette";
import { AiAssistant }     from "./_components/ai-assistant";
import { HoloCard }        from "./_components/holo-card";
import { Typewriter }      from "./_components/typewriter";
import { RadialGauge }     from "./_components/radial-gauge";

function genSparkline(seed: number, n = 10, trend: "up" | "down" | "flat" = "up") {
  const pts: number[] = [];
  let v = 30 + (seed % 20);
  for (let i = 0; i < n; i++) {
    const noise = ((seed * (i + 1) * 1234567) % 13) - 6;
    v += trend === "up" ? 2 + noise * 0.4 : trend === "down" ? -1 + noise * 0.4 : noise;
    pts.push(Math.max(5, Math.min(95, v)));
  }
  return pts;
}

export default async function DashboardHome() {
  const user = (await getCurrentUser())!;

  const [agents, recentRuns, totals, allCount, agentCount] = await Promise.all([
    prisma.agent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.run.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { agent: true } }),
    prisma.run.aggregate({ where: { userId: user.id, status: "success" }, _sum: { tokensIn: true, tokensOut: true, costCents: true }, _count: true }),
    prisma.run.count({ where: { userId: user.id } }),
    prisma.agent.count({ where: { userId: user.id } }),
  ]);

  const limits       = PLAN_LIMITS[toPlanKey(user.plan)];
  const displayName  = user.name || user.email.split("@")[0];
  const initials     = displayName[0].toUpperCase();
  const totalCost    = totals._sum.costCents ?? 0;
  const successCount = totals._count ?? 0;
  const seed         = user.id.charCodeAt(0) + user.id.charCodeAt(1);
  const isPro        = user.plan !== "FREE";
  const runsUsed     = user.runsUsedThisPeriod ?? 0;
  const effectiveRunLimit = limits.monthlyRuns + (user.referralBonusRuns ?? 0);
  const pct          = Math.min((runsUsed / effectiveRunLimit) * 100, 100);
  const hour         = new Date().getHours();
  const greeting     = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const agentStubs   = agents.map(a => ({ id: a.id, name: a.name, role: a.role }));

  const STAT_CARDS = [
    { label: "AI Employees",     value: agentCount,                  suffix: `/ ${limits.agents}`,       icon: Bot,          color: "#7c3aed", spark: genSparkline(seed,      10, "up"),   trend: "up"   as const, trendLabel: "active now",   href: "/dashboard/agents"  },
    { label: "Successful Runs",  value: successCount,                suffix: "",                          icon: CheckCircle2, color: "#10b981", spark: genSparkline(seed + 3,  10, "up"),   trend: "up"   as const, trendLabel: "all time",     href: "/dashboard/runs"    },
    { label: "Runs This Period", value: runsUsed,                    suffix: `/ ${effectiveRunLimit}`,   icon: Activity,     color: "#f59e0b", spark: genSparkline(seed + 7,  10, "flat"), trend: "flat" as const, trendLabel: "this period",  href: "/dashboard/runs"    },
    { label: "Est. Spend",       value: Math.round(totalCost / 100), suffix: "",   prefix: "$",          icon: TrendingUp,   color: "#ec4899", spark: genSparkline(seed + 11, 10, "up"),   trend: "up"   as const, trendLabel: "lifetime",     href: "/dashboard/billing" },
  ];

  return (
    <>
      <CommandPalette agents={agentStubs} />
      <AiAssistant />

      <style>{`
        @keyframes liveDot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.5); }
          50% { opacity:0.7; box-shadow:0 0 0 6px rgba(16,185,129,0); }
        }
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes dataIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes borderRotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-5px); }
        }
        @keyframes glitch {
          0%,94%,100% { text-shadow: none; }
          95% { text-shadow: 2px 0 #ec4899, -2px 0 #00d4ff; }
          97% { text-shadow: -2px 0 #ec4899, 2px 0 #00d4ff; }
        }
        @keyframes beamSweep {
          0%   { opacity: 0; transform: translateY(-100%); }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; transform: translateY(200%); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes statusIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .stat-holo {
          animation: dataIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        .stat-holo:nth-child(1) { animation-delay: 0.04s; }
        .stat-holo:nth-child(2) { animation-delay: 0.10s; }
        .stat-holo:nth-child(3) { animation-delay: 0.16s; }
        .stat-holo:nth-child(4) { animation-delay: 0.22s; }

        .agent-row-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.025);
          text-decoration: none;
          transition: background 0.15s ease;
          position: relative; overflow: hidden;
        }
        .agent-row-link:hover { background: rgba(124,58,237,0.07); }
        .agent-row-link:hover .agent-chevron { color: #a78bfa; transform: translateX(3px); }
        .agent-chevron { transition: all 0.2s ease; color: #3f3f46; }

        .quick-nav-link {
          display: flex; align-items: center; gap: 5px;
          padding: 6px 12px; border-radius: 9px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.05);
          font-size: 11px; color: #71717a; text-decoration: none;
          transition: all 0.18s ease; position: relative; overflow: hidden;
        }
        .quick-nav-link:hover {
          color: #fff;
          background: rgba(124,58,237,0.12);
          border-color: rgba(124,58,237,0.3);
          box-shadow: 0 0 14px rgba(124,58,237,0.2);
        }

        .hire-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 32px rgba(124,58,237,0.6) !important;
        }
        .hire-cta { transition: all 0.2s ease; }

        .card-glass {
          background: rgba(255,255,255,0.022);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
        }
      `}</style>

      <div className="relative min-h-screen">
        <Aurora />
        <ParticleCanvas />

        <div className="relative z-10" style={{ display: "flex", flexDirection: "column", gap: 26 }}>

          {/* ═══════════════════════════════════════
              HERO — COMMAND CENTER HEADER
          ═══════════════════════════════════════ */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", animation: "statusIn 0.6s ease both" }}>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar with animated pulse rings */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {/* Outer pulse ring */}
                <div style={{
                  position: "absolute", inset: -10, borderRadius: "50%",
                  border: "1px solid rgba(124,58,237,0.3)",
                  animation: "pulse-ring 2.8s ease-out infinite",
                }} />
                <div style={{
                  position: "absolute", inset: -18, borderRadius: "50%",
                  border: "1px solid rgba(124,58,237,0.15)",
                  animation: "pulse-ring 2.8s ease-out infinite 0.9s",
                }} />
                <div style={{
                  width: 54, height: 54, borderRadius: 18,
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 0 2px rgba(124,58,237,0.5), 0 0 40px rgba(124,58,237,0.4)",
                  position: "relative", zIndex: 1,
                  animation: "glitch 8s ease-in-out infinite",
                }}>
                  {initials}
                </div>
                <div style={{
                  position: "absolute", bottom: -3, right: -3, zIndex: 2,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#10b981", border: "2.5px solid #000",
                  boxShadow: "0 0 8px rgba(16,185,129,0.8)",
                  animation: "liveDot 2s ease infinite",
                }} />
              </div>

              <div>
                <p style={{ fontSize: 11, color: "#52525b", fontWeight: 600, letterSpacing: "0.04em", marginBottom: 3 }}>
                  {greeting} —
                </p>
                <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.7px", lineHeight: 1 }}>
                  <Typewriter
                    text={displayName}
                    speed={60}
                    style={{
                      background: "linear-gradient(135deg, #ffffff 0%, #c4b5fd 40%, #818cf8 70%, #e879f9 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  />
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 999,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "liveDot 1.8s ease infinite" }} />
                    <span style={{ fontSize: 9, color: "#10b981", fontWeight: 800, letterSpacing: "0.1em" }}>SYSTEMS ONLINE</span>
                  </div>
                  <div style={{
                    padding: "3px 10px", borderRadius: 999,
                    background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                    fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.08em",
                  }}>
                    {agentCount} AGENT{agentCount !== 1 ? "S" : ""} ACTIVE
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 13px", borderRadius: 11,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <kbd style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 6px" }}>⌘K</kbd>
                <span style={{ fontSize: 11, color: "#3f3f46" }}>Command</span>
              </div>
              <Link href="/dashboard/agents" className="hire-cta btn-shine" style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "#fff", borderRadius: 12, padding: "9px 18px",
                fontSize: 12, fontWeight: 700,
                boxShadow: "0 0 24px rgba(124,58,237,0.45)",
                textDecoration: "none", position: "relative", overflow: "hidden",
              }}>
                <Plus size={13} />
                Hire AI Employee
              </Link>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              HOLOGRAPHIC STAT CARDS
          ═══════════════════════════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {STAT_CARDS.map((s, i) => {
              const TI = s.trend === "up" ? TrendingUp : s.trend === "down" ? TrendingDown : Minus;
              const tc = s.trend === "up" ? "#10b981" : s.trend === "down" ? "#ef4444" : "#71717a";
              return (
                <div key={s.label} className="stat-holo">
                  <HoloCard style={{ display: "block", borderRadius: 18 }}>
                    <Link href={s.href} style={{
                      display: "block", textDecoration: "none",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      borderRadius: 18, padding: "20px 20px 16px",
                      position: "relative", overflow: "hidden",
                    }}>
                      {/* Colored top bar */}
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: "18px 18px 0 0",
                        background: `linear-gradient(90deg, ${s.color}, ${s.color}00)`,
                      }} />
                      {/* Ambient glow */}
                      <div style={{
                        position: "absolute", top: -50, left: -30, width: 160, height: 160,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${s.color}18 0%, transparent 70%)`,
                        pointerEvents: "none",
                      }} />

                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                          <div>
                            <p style={{ fontSize: 9, fontWeight: 800, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>{s.label}</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                              {s.prefix && <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{s.prefix}</span>}
                              <span style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-1.5px" }}>
                                <AnimatedCounter value={s.value} />
                              </span>
                              {s.suffix && <span style={{ fontSize: 12, color: "#3f3f46" }}>{s.suffix}</span>}
                            </div>
                          </div>
                          <div style={{
                            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                            background: `${s.color}16`, border: `1px solid ${s.color}28`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: `0 0 18px ${s.color}22`,
                          }}>
                            <s.icon size={18} color={s.color} />
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                          <div style={{
                            display: "flex", alignItems: "center", gap: 4,
                            fontSize: 10, color: tc, fontWeight: 700,
                            background: `${tc}10`, border: `1px solid ${tc}22`,
                            borderRadius: 999, padding: "2px 8px",
                          }}>
                            <TI size={10} color={tc} />
                            {s.trendLabel}
                          </div>
                          <Sparkline values={s.spark} color={s.color} width={80} height={28} />
                        </div>
                      </div>
                    </Link>
                  </HoloCard>
                </div>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════
              MAIN GRID — LIVE FEED + SIDEBAR
          ═══════════════════════════════════════ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 14 }}>

            {/* LIVE FEED */}
            <div className="card-glass" style={{ borderRadius: 20, overflow: "hidden", position: "relative" }}>
              {/* Header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {/* Terminal prompt */}
                  <div style={{
                    fontFamily: "monospace", fontSize: 12, color: "#10b981", letterSpacing: "0.02em",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <span style={{ color: "#a78bfa" }}>$</span>
                    <span>aether</span>
                    <span style={{ color: "#52525b" }}>--watch</span>
                    <span style={{ color: "#f59e0b" }}>--live</span>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 999, padding: "2px 8px",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "liveDot 1.8s ease infinite" }} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#10b981", letterSpacing: "0.08em" }}>LIVE</span>
                  </div>
                  <span style={{ fontSize: 10, color: "#3f3f46", fontFamily: "monospace" }}>{allCount} executions</span>
                </div>
                <Link href="/dashboard/runs" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "#52525b", textDecoration: "none",
                  padding: "4px 10px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}>
                  View all <ChevronRight size={11} />
                </Link>
              </div>

              {recentRuns.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
                    boxShadow: "0 0 30px rgba(124,58,237,0.15)",
                    animation: "floatY 3s ease-in-out infinite",
                  }}>
                    <Sparkles size={22} color="#7c3aed" />
                  </div>
                  <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 600, marginBottom: 5 }}>No runs yet</p>
                  <p style={{ fontSize: 12, color: "#52525b" }}>Your AI employees await their first assignment.</p>
                </div>
              ) : (
                <LiveFeed initialCount={recentRuns.length} />
              )}
            </div>

            {/* SIDEBAR */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Quick Actions — 2x2 tiles */}
              <div className="card-glass" style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Sparkles size={12} color="#a78bfa" />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Access</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: 8 }}>
                  {[
                    { href: "/dashboard/agents",    icon: Bot,       label: "AI Employees", color: "#7c3aed" },
                    { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns",    color: "#ec4899" },
                    { href: "/dashboard/social",    icon: Share2,    label: "Social Media", color: "#3b82f6" },
                    { href: "/dashboard/settings",  icon: Settings,  label: "Settings",     color: "#10b981" },
                  ].map(q => (
                    <HoloCard key={q.href} intensity={10} style={{ borderRadius: 12 }}>
                      <Link href={q.href} style={{
                        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 7,
                        borderRadius: 12, padding: "12px 11px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        textDecoration: "none",
                      }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: `${q.color}14`, border: `1px solid ${q.color}22`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          boxShadow: `0 0 10px ${q.color}18`,
                        }}>
                          <q.icon size={13} color={q.color} />
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#d4d4d8" }}>{q.label}</span>
                      </Link>
                    </HoloCard>
                  ))}
                </div>
              </div>

              {/* Workforce */}
              <div className="card-glass" style={{ overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Bot size={12} color="#a78bfa" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Workforce</span>
                  </div>
                  <Link href="/dashboard/agents" style={{ fontSize: 10, color: "#52525b", textDecoration: "none" }}>View all</Link>
                </div>
                {agents.length === 0 ? (
                  <div style={{ padding: "22px 14px", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#52525b", marginBottom: 8 }}>No AI employees yet.</p>
                    <Link href="/dashboard/agents" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>+ Hire your first</Link>
                  </div>
                ) : (
                  agents.slice(0, 4).map((a, i) => (
                    <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="agent-row-link">
                      <div style={{
                        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                        background: `linear-gradient(135deg, ${COLORS[i % COLORS.length][0]}, ${COLORS[i % COLORS.length][1]})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 900, color: "#fff",
                        boxShadow: `0 0 12px ${COLORS[i % COLORS.length][0]}44`,
                      }}>
                        {a.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                        <div style={{ fontSize: 10, color: "#52525b" }}>{a.role}</div>
                      </div>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                        animation: "liveDot 2.2s ease infinite",
                        flexShrink: 0,
                      }} />
                      <ChevronRight size={12} className="agent-chevron" />
                    </Link>
                  ))
                )}
              </div>

              {/* Radial Usage Gauge */}
              <div className="card-glass" style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Gauge size={12} color="#71717a" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Usage</span>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "2px 9px",
                    letterSpacing: "0.06em",
                    color: isPro ? "#a78bfa" : "#71717a",
                    background: isPro ? "rgba(124,58,237,0.14)" : "rgba(113,113,122,0.1)",
                    border: `1px solid ${isPro ? "rgba(124,58,237,0.22)" : "rgba(113,113,122,0.16)"}`,
                  }}>
                    {user.plan}
                  </span>
                </div>

                <RadialGauge value={runsUsed} max={effectiveRunLimit} label="runs" size={110} />

                {!isPro && (
                  <Link href="/dashboard/billing" className="btn-shine" style={{
                    display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 6,
                    borderRadius: 10, padding: "8px 0",
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    boxShadow: "0 0 16px rgba(124,58,237,0.35)",
                    textDecoration: "none", position: "relative", overflow: "hidden",
                  }}>
                    <Sparkles size={11} />
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════
              BOTTOM NAV STRIP
          ═══════════════════════════════════════ */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingBottom: 8 }}>
            {[
              { href: "/dashboard/runs",      icon: ListChecks, label: "All Runs" },
              { href: "/dashboard/campaigns", icon: Megaphone,  label: "Campaigns" },
              { href: "/dashboard/social",    icon: Share2,     label: "Social" },
              { href: "/dashboard/billing",   icon: CreditCard, label: "Billing" },
              { href: "/dashboard/settings",  icon: Settings,   label: "Settings" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="quick-nav-link">
                <item.icon size={11} />
                {item.label}
              </Link>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#3f3f46" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "liveDot 2s ease infinite" }} />
              All systems operational
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

const COLORS = [
  ["#7c3aed","#6d28d9"],
  ["#ec4899","#db2777"],
  ["#3b82f6","#2563eb"],
  ["#10b981","#059669"],
];
