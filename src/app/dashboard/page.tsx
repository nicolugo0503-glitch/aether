import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { centsToUSD, formatDate } from "@/lib/utils";
import {
  Bot, Play, Gauge, TrendingUp, TrendingDown, Minus,
  ChevronRight, Settings, Megaphone, Share2,
  ArrowUpRight, Clock, CheckCircle2, XCircle, Loader2,
  Plus, Sparkles, Activity, ListChecks, CreditCard, Zap,
} from "lucide-react";
import { Aurora }          from "./_components/aurora";
import { ParticleCanvas } from "./_components/particle-canvas";
import { Sparkline }       from "./_components/sparkline";
import { AnimatedCounter } from "./_components/animated-counter";
import { LiveFeed }        from "./_components/live-feed";
import { CommandPalette }  from "./_components/command-palette";
import { AiAssistant }     from "./_components/ai-assistant";

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

  const limits      = PLAN_LIMITS[toPlanKey(user.plan)];
  const displayName = user.name || user.email.split("@")[0];
  const initials    = displayName[0].toUpperCase();
  const totalCost   = totals._sum.costCents ?? 0;
  const successCount = totals._count ?? 0;
  const seed        = user.id.charCodeAt(0) + user.id.charCodeAt(1);
  const isPro       = user.plan !== "FREE";
  const runsUsed    = user.runsUsedThisPeriod ?? 0;
  const pct         = Math.min((runsUsed / limits.monthlyRuns) * 100, 100);
  const barColor    = pct > 80 ? "#ef4444" : pct > 60 ? "#f59e0b" : "#7c3aed";

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const agentStubs = agents.map(a => ({ id: a.id, name: a.name, role: a.role }));

  const STAT_CARDS = [
    { label: "AI Employees",     value: agentCount,                         suffix: `/ ${limits.agents}`,       icon: Bot,          iconColor: "#7c3aed", spark: genSparkline(seed,      10, "up"),   sparkColor: "#7c3aed", trend: "up"   as const, trendLabel: "+2 this week", href: "/dashboard/agents"  },
    { label: "Successful Runs",  value: successCount,                       suffix: "",                          icon: CheckCircle2, iconColor: "#10b981", spark: genSparkline(seed + 3,  10, "up"),   sparkColor: "#10b981", trend: "up"   as const, trendLabel: "all time",     href: "/dashboard/runs"    },
    { label: "Runs This Period", value: runsUsed,                           suffix: `/ ${limits.monthlyRuns}`,  icon: Activity,     iconColor: "#f59e0b", spark: genSparkline(seed + 7,  10, "flat"), sparkColor: "#f59e0b", trend: "flat" as const, trendLabel: "this month",   href: "/dashboard/runs"    },
    { label: "Est. Spend",       value: Math.round(totalCost / 100),        suffix: "",    prefix: "$",          icon: TrendingUp,   iconColor: "#ec4899", spark: genSparkline(seed + 11, 10, "up"),   sparkColor: "#ec4899", trend: "up"   as const, trendLabel: "lifetime",     href: "/dashboard/billing" },
  ];

  return (
    <>
      <CommandPalette agents={agentStubs} />
      <AiAssistant />

      <style>{`
        @keyframes liveDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          50% { opacity: 0.7; box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes statIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes borderGlow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes shimmerCard {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(300%) skewX(-15deg); }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes gridFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .stat-card {
          animation: statIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
          position: relative;
          overflow: hidden;
        }
        .stat-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
          transform: translateX(-100%) skewX(-15deg);
          transition: none;
        }
        .stat-card:hover::before {
          animation: shimmerCard 0.7s ease forwards;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          transition: transform 0.2s ease;
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.12s; }
        .stat-card:nth-child(3) { animation-delay: 0.19s; }
        .stat-card:nth-child(4) { animation-delay: 0.26s; }

        .hero-in { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .feed-in { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .sidebar-in { animation: slideUp 0.6s cubic-bezier(0.16,1,0.3,1) 0.3s both; }

        .quick-tile {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .quick-tile::after {
          content: "";
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .quick-tile:hover { transform: translateY(-2px) scale(1.02); }
        .quick-tile-purple:hover { box-shadow: 0 8px 32px rgba(124,58,237,0.25), 0 0 0 1px rgba(124,58,237,0.35) !important; }
        .quick-tile-pink:hover   { box-shadow: 0 8px 32px rgba(236,72,153,0.25), 0 0 0 1px rgba(236,72,153,0.35) !important; }
        .quick-tile-blue:hover   { box-shadow: 0 8px 32px rgba(59,130,246,0.25), 0 0 0 1px rgba(59,130,246,0.35) !important; }
        .quick-tile-green:hover  { box-shadow: 0 8px 32px rgba(16,185,129,0.25), 0 0 0 1px rgba(16,185,129,0.35) !important; }

        .agent-row { transition: background 0.15s ease; }
        .agent-row:hover { background: rgba(255,255,255,0.04) !important; }

        .nav-pill {
          transition: all 0.18s ease;
        }
        .nav-pill:hover {
          color: #fff !important;
          background: rgba(124,58,237,0.12) !important;
          border-color: rgba(124,58,237,0.3) !important;
          box-shadow: 0 0 12px rgba(124,58,237,0.2);
        }

        .hire-btn:hover {
          box-shadow: 0 0 28px rgba(124,58,237,0.55) !important;
          transform: translateY(-1px);
        }
        .hire-btn { transition: all 0.2s ease; }
      `}</style>

      <div className="relative min-h-screen">
        <Aurora />
        <ParticleCanvas />

        <div className="relative z-10" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── HERO ─────────────────────────────────────────── */}
          <div className="hero-in" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar with pulse ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 0 1px rgba(124,58,237,0.4), 0 0 30px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15)",
                }}>
                  {initials}
                </div>
                {/* Live ring */}
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#10b981",
                  border: "2px solid #000",
                  boxShadow: "0 0 8px rgba(16,185,129,0.7)",
                  animation: "liveDot 2s ease infinite",
                }} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: "#52525b", fontWeight: 500, marginBottom: 2, letterSpacing: "0.03em" }}>
                  {greeting},
                </p>
                <h1 style={{
                  fontSize: 28, fontWeight: 900, letterSpacing: "-0.6px", lineHeight: 1,
                  background: "linear-gradient(135deg, #ffffff 0%, #a78bfa 50%, #818cf8 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  {displayName}
                </h1>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* ⌘K */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 13px", borderRadius: 10,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <kbd style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px" }}>⌘K</kbd>
                <span style={{ fontSize: 11, color: "#3f3f46" }}>Search</span>
              </div>
              {/* Status chip */}
              <div style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 10,
                background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "liveDot 1.8s ease infinite" }} />
                <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600, letterSpacing: "0.03em" }}>SYSTEMS LIVE</span>
              </div>
              {/* CTA */}
              <Link href="/dashboard/agents" className="hire-btn" style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "#fff", borderRadius: 11, padding: "8px 18px",
                fontSize: 12, fontWeight: 700,
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                textDecoration: "none",
              }}>
                <Plus size={13} />
                Hire AI Employee
              </Link>
            </div>
          </div>

          {/* ── STAT CARDS ───────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {STAT_CARDS.map((s, idx) => {
              const TrendIcon = s.trend === "up" ? TrendingUp : s.trend === "down" ? TrendingDown : Minus;
              const tc = s.trend === "up" ? "#10b981" : s.trend === "down" ? "#ef4444" : "#71717a";
              return (
                <Link key={s.label} href={s.href} className="stat-card" style={{
                  display: "block", textDecoration: "none",
                  background: "rgba(255,255,255,0.022)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 18, padding: "20px 20px 16px",
                  position: "relative", overflow: "hidden",
                }}>
                  {/* Top colored accent line */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${s.iconColor}, ${s.iconColor}00)`,
                    borderRadius: "18px 18px 0 0",
                  }} />
                  {/* Ambient radial */}
                  <div style={{
                    position: "absolute", top: -40, left: -20, width: 140, height: 140,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${s.iconColor}14 0%, transparent 70%)`,
                    pointerEvents: "none",
                  }} />

                  <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Icon + label row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                      <div>
                        <p style={{
                          fontSize: 9, fontWeight: 700, color: "#52525b",
                          textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
                        }}>{s.label}</p>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                          {s.prefix && <span style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{s.prefix}</span>}
                          <span style={{ fontSize: 34, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-1px" }}>
                            <AnimatedCounter value={s.value} />
                          </span>
                          {s.suffix && <span style={{ fontSize: 13, fontWeight: 400, color: "#3f3f46" }}>{s.suffix}</span>}
                        </div>
                      </div>
                      <div style={{
                        width: 38, height: 38, borderRadius: 12,
                        background: `${s.iconColor}16`,
                        border: `1px solid ${s.iconColor}28`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 0 16px ${s.iconColor}20`,
                      }}>
                        <s.icon size={17} color={s.iconColor} />
                      </div>
                    </div>

                    {/* Sparkline + trend */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 10, color: tc, fontWeight: 600,
                        background: `${tc}12`, border: `1px solid ${tc}20`,
                        borderRadius: 999, padding: "2px 8px",
                      }}>
                        <TrendIcon size={10} color={tc} />
                        {s.trendLabel}
                      </div>
                      <Sparkline values={s.spark} color={s.sparkColor} width={80} height={28} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── MAIN GRID ────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>

            {/* ── LIVE FEED ── */}
            <div className="feed-in" style={{
              borderRadius: 20, overflow: "hidden",
              background: "rgba(255,255,255,0.018)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Feed header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 9,
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Play size={12} color="#a78bfa" />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Live Run Feed</span>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                        borderRadius: 999, padding: "2px 8px",
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "liveDot 1.8s ease infinite" }} />
                        <span style={{ fontSize: 9, color: "#10b981", fontWeight: 700, letterSpacing: "0.06em" }}>LIVE</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 10, color: "#3f3f46", marginTop: 1 }}>{allCount} total executions</p>
                  </div>
                </div>
                <Link href="/dashboard/runs" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "#52525b", textDecoration: "none",
                  padding: "4px 10px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                  transition: "all 0.15s",
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

            {/* ── RIGHT SIDEBAR ── */}
            <div className="sidebar-in" style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Quick Actions */}
              <div style={{
                borderRadius: 18, overflow: "hidden",
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Sparkles size={13} color="#a78bfa" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Quick Access</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10 }}>
                  {[
                    { href: "/dashboard/agents",    icon: Bot,       label: "AI Employees", color: "#7c3aed", cls: "quick-tile-purple" },
                    { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns",    color: "#ec4899", cls: "quick-tile-pink" },
                    { href: "/dashboard/social",    icon: Share2,    label: "Social Media", color: "#3b82f6", cls: "quick-tile-blue" },
                    { href: "/dashboard/settings",  icon: Settings,  label: "Settings",     color: "#10b981", cls: "quick-tile-green" },
                  ].map(q => (
                    <Link key={q.href} href={q.href} className={`quick-tile ${q.cls}`} style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                      borderRadius: 12, padding: "13px 12px",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      textDecoration: "none",
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 9,
                        background: `${q.color}14`,
                        border: `1px solid ${q.color}25`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 12px ${q.color}18`,
                      }}>
                        <q.icon size={13} color={q.color} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#d4d4d8", lineHeight: 1 }}>{q.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Workforce */}
              <div style={{
                borderRadius: 18, overflow: "hidden",
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Bot size={13} color="#a78bfa" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Workforce</span>
                  </div>
                  <Link href="/dashboard/agents" style={{ fontSize: 10, color: "#52525b", textDecoration: "none" }}>View all</Link>
                </div>

                {agents.length === 0 ? (
                  <div style={{ padding: "22px 16px", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#52525b", marginBottom: 8 }}>No AI employees yet.</p>
                    <Link href="/dashboard/agents" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>+ Hire your first</Link>
                  </div>
                ) : (
                  agents.slice(0, 4).map((a, i) => (
                    <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="agent-row" style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 14px",
                      borderBottom: "1px solid rgba(255,255,255,0.028)",
                      textDecoration: "none",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `linear-gradient(135deg, ${COLORS[i % COLORS.length][0]}, ${COLORS[i % COLORS.length][1]})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 900, color: "#fff",
                        boxShadow: `0 0 12px ${COLORS[i % COLORS.length][0]}40`,
                      }}>
                        {a.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                        <div style={{ fontSize: 10, color: "#52525b" }}>{a.role}</div>
                      </div>
                      <div style={{
                        width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                        background: "#10b981",
                        boxShadow: "0 0 6px rgba(16,185,129,0.6)",
                        animation: "liveDot 2.2s ease infinite",
                      }} />
                    </Link>
                  ))
                )}
              </div>

              {/* Usage */}
              <div style={{
                borderRadius: 18,
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "16px 16px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Gauge size={13} color="#71717a" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.06em" }}>Usage</span>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 10px",
                    color: isPro ? "#a78bfa" : "#71717a",
                    background: isPro ? "rgba(124,58,237,0.14)" : "rgba(113,113,122,0.1)",
                    border: `1px solid ${isPro ? "rgba(124,58,237,0.22)" : "rgba(113,113,122,0.16)"}`,
                    letterSpacing: "0.05em",
                  }}>
                    {user.plan}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#52525b", marginBottom: 7 }}>
                  <span>Runs this period</span>
                  <span style={{ color: "#d4d4d8", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{runsUsed} / {limits.monthlyRuns}</span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.05)", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{
                    height: "100%", width: `${pct}%`, borderRadius: 999,
                    background: pct > 80 ? "linear-gradient(90deg,#ef4444,#f97316)" : pct > 60 ? "linear-gradient(90deg,#f59e0b,#f97316)" : `linear-gradient(90deg,${barColor},#a855f7)`,
                    boxShadow: `0 0 8px ${barColor}55`,
                    transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>

                {!isPro && (
                  <Link href="/dashboard/billing" className="btn-shine" style={{
                    display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 6,
                    borderRadius: 10, padding: "9px 0",
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    boxShadow: "0 0 16px rgba(124,58,237,0.35)",
                    textDecoration: "none",
                    position: "relative", overflow: "hidden",
                  }}>
                    <Sparkles size={11} />
                    Upgrade to Pro
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── STATUS BAR ───────────────────────────────────── */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingBottom: 8 }}>
            {[
              { href: "/dashboard/runs",      icon: ListChecks, label: "All Runs" },
              { href: "/dashboard/campaigns", icon: Megaphone,  label: "Campaigns" },
              { href: "/dashboard/social",    icon: Share2,     label: "Social" },
              { href: "/dashboard/billing",   icon: CreditCard, label: "Billing" },
              { href: "/dashboard/settings",  icon: Settings,   label: "Settings" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="nav-pill" style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px", borderRadius: 9,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
                fontSize: 11, color: "#71717a", textDecoration: "none",
              }}>
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
  ["#7c3aed", "#6d28d9"],
  ["#ec4899", "#db2777"],
  ["#3b82f6", "#2563eb"],
  ["#10b981", "#059669"],
];
