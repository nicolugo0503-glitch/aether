import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import {
  Bot, Gauge, TrendingUp, TrendingDown, Minus,
  ChevronRight, Settings, Megaphone, Share2,
  CheckCircle2, Plus, Sparkles,
  Activity, ListChecks, CreditCard, BarChart3,
} from "lucide-react";
import { Aurora }          from "./_components/aurora";
import { ParticleCanvas } from "./_components/particle-canvas";
import { Sparkline }       from "./_components/sparkline";
import { AnimatedCounter } from "./_components/animated-counter";
import { LiveFeed, type FeedItem } from "./_components/live-feed";
import { CommandPalette }  from "./_components/command-palette";
import { Typewriter }      from "./_components/typewriter";

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

  const [agents, recentRuns, totals, allCount, agentCount, recentSocial] = await Promise.all([
    prisma.agent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }).catch(() => []),
    prisma.run.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { agent: true } }).catch(() => []),
    prisma.run.aggregate({ where: { userId: user.id, status: "success" }, _sum: { tokensIn: true, tokensOut: true, costCents: true }, _count: true }).catch(() => ({ _sum: { tokensIn: null, tokensOut: null, costCents: null }, _count: 0 })),
    prisma.run.count({ where: { userId: user.id } }).catch(() => 0),
    prisma.agent.count({ where: { userId: user.id } }).catch(() => 0),
    prisma.socialPost.findMany({ where: { userId: user.id, status: { not: "draft" } }, orderBy: { createdAt: "desc" }, take: 6 }).catch(() => []),
  ]);

  function agentColor(name: string): string {
    const n = name.toLowerCase();
    if (n.includes("ava"))  return "#7c3aed";
    if (n.includes("rex"))  return "#0891b2";
    if (n.includes("sage")) return "#059669";
    if (n.includes("opus")) return "#f59e0b";
    return "#8b5cf6";
  }

  const feedEvents: FeedItem[] = [
    ...recentRuns.map(r => ({
      id: r.id,
      type: "run" as const,
      agentName: r.agent.name.split("—")[0].trim(),
      agentColor: agentColor(r.agent.name),
      description: r.input.length > 90 ? r.input.slice(0, 87) + "…" : r.input,
      status: (r.status === "success" ? "success" : r.status === "error" ? "error" : "running") as FeedItem["status"],
      ts: r.createdAt.getTime(),
      costCents: r.costCents,
    })),
    ...recentSocial.map(p => {
      const platforms = (() => { try { return (JSON.parse(p.platforms) as string[]).join(", "); } catch { return ""; } })();
      const st: FeedItem["status"] = p.status === "posted" ? "posted" : p.status === "partial" ? "partial" : p.status === "error" ? "error" : "running";
      return {
        id: p.id,
        type: "social" as const,
        agentName: "Social",
        agentColor: "#ec4899",
        description: p.topic.length > 90 ? p.topic.slice(0, 87) + "…" : p.topic,
        status: st,
        ts: (p.postedAt ?? p.createdAt).getTime(),
        platforms,
      };
    }),
  ].sort((a, b) => b.ts - a.ts).slice(0, 14);

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

      <style>{`
        @keyframes liveDot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.5); }
          50% { opacity:0.7; box-shadow:0 0 0 6px rgba(16,185,129,0); }
        }
        @keyframes dataIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
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
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes statusIn {
          from { opacity:0; transform:translateX(-8px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes barGrow {
          from { width: 0; }
          to   { width: ${pct}%; }
        }

        .stat-card {
          animation: dataIn 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        .stat-card:nth-child(1) { animation-delay: 0.04s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.16s; }
        .stat-card:nth-child(4) { animation-delay: 0.22s; }

        .agent-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          text-decoration: none;
          transition: background 0.15s ease;
          position: relative;
        }
        .agent-row:hover { background: rgba(124,58,237,0.06); }
        .agent-row:hover .row-chevron { color: #a78bfa; transform: translateX(3px); }
        .row-chevron { transition: all 0.2s ease; color: #3f3f46; }

        .quick-tile:hover {
          background: rgba(255,255,255,0.04) !important;
          border-color: rgba(255,255,255,0.1) !important;
          transform: translateY(-1px);
        }
        .quick-tile { transition: all 0.18s ease; }

        .hire-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 36px rgba(124,58,237,0.65) !important;
        }
        .hire-btn { transition: all 0.2s ease; }

        .nav-chip:hover {
          color: #fff !important;
          background: rgba(124,58,237,0.12) !important;
          border-color: rgba(124,58,237,0.3) !important;
        }
        .nav-chip { transition: all 0.18s ease; }

        .usage-bar {
          height: 4px; border-radius: 999px;
          background: linear-gradient(90deg, #7c3aed, #ec4899);
          animation: barGrow 1.2s cubic-bezier(0.16,1,0.3,1) both 0.6s;
        }
      `}</style>

      <div className="relative min-h-screen">
        <Aurora />
        <ParticleCanvas />

        <div className="relative z-10" style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* HEADER */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 16, flexWrap: "wrap", animation: "statusIn 0.5s ease both",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  position: "absolute", inset: -8, borderRadius: "50%",
                  border: "1px solid rgba(124,58,237,0.25)",
                  animation: "pulse-ring 3s ease-out infinite",
                }} />
                <div style={{
                  position: "absolute", inset: -16, borderRadius: "50%",
                  border: "1px solid rgba(124,58,237,0.1)",
                  animation: "pulse-ring 3s ease-out infinite 1s",
                }} />
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 0 2px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.35)",
                  position: "relative", zIndex: 1,
                  animation: "glitch 8s ease-in-out infinite",
                }}>
                  {initials}
                </div>
                <div style={{
                  position: "absolute", bottom: -2, right: -2, zIndex: 2,
                  width: 13, height: 13, borderRadius: "50%",
                  background: "#10b981", border: "2px solid #000",
                  boxShadow: "0 0 8px rgba(16,185,129,0.8)",
                  animation: "liveDot 2s ease infinite",
                }} />
              </div>

              <div>
                <p style={{ fontSize: 11, color: "#52525b", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 3, textTransform: "uppercase" }}>
                  {greeting}
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.8px", lineHeight: 1, marginBottom: 6 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "3px 10px", borderRadius: 999,
                    background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "liveDot 1.8s ease infinite", flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: "#10b981", fontWeight: 800, letterSpacing: "0.1em" }}>SYSTEMS ONLINE</span>
                  </div>
                  <div style={{
                    padding: "3px 10px", borderRadius: 999,
                    background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)",
                    fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.08em",
                  }}>
                    {agentCount} AGENT{agentCount !== 1 ? "S" : ""} ACTIVE
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="hidden sm:flex" style={{
                alignItems: "center", gap: 6,
                padding: "8px 12px", borderRadius: 10,
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <kbd style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 4, padding: "1px 6px" }}>⌘K</kbd>
                <span style={{ fontSize: 11, color: "#3f3f46" }}>Command</span>
              </div>
              <Link href="/dashboard/agents" className="hire-btn" style={{
                display: "flex", alignItems: "center", gap: 7,
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "#fff", borderRadius: 12, padding: "10px 20px",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.01em",
                boxShadow: "0 0 28px rgba(124,58,237,0.4)",
                textDecoration: "none", position: "relative", overflow: "hidden",
              }}>
                <Plus size={13} />
                Hire AI Employee
              </Link>
            </div>
          </div>

          {/* STAT CARDS */}
          <div className="dash-stat-grid">
            {STAT_CARDS.map((s, i) => {
              const TI = s.trend === "up" ? TrendingUp : s.trend === "down" ? TrendingDown : Minus;
              const tc = s.trend === "up" ? "#10b981" : s.trend === "down" ? "#ef4444" : "#71717a";
              return (
                <div key={s.label} className="stat-card">
                  <Link href={s.href} style={{
                    display: "block", textDecoration: "none",
                    borderRadius: 20, padding: "22px 22px 18px",
                    position: "relative", overflow: "hidden",
                    background: "rgba(255,255,255,0.028)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderLeft: `3px solid ${s.color}`,
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)`,
                    transition: "box-shadow 0.2s ease",
                  }}>
                    <div style={{
                      position: "absolute", top: -40, right: -40, width: 120, height: 120,
                      borderRadius: "50%",
                      background: `radial-gradient(circle, ${s.color}12 0%, transparent 70%)`,
                      pointerEvents: "none",
                    }} />

                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em" }}>{s.label}</span>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                          background: `${s.color}14`, border: `1px solid ${s.color}22`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <s.icon size={15} color={s.color} />
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 14 }}>
                        {s.prefix && <span style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.prefix}</span>}
                        <span style={{ fontSize: 48, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-2px" }}>
                          <AnimatedCounter value={s.value} />
                        </span>
                        {s.suffix && <span style={{ fontSize: 13, color: "#3f3f46", fontWeight: 500 }}>{s.suffix}</span>}
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 10, color: tc, fontWeight: 700,
                          background: `${tc}10`, border: `1px solid ${tc}20`,
                          borderRadius: 999, padding: "2px 8px",
                        }}>
                          <TI size={10} color={tc} />
                          {s.trendLabel}
                        </div>
                        <Sparkline values={s.spark} color={s.color} width={80} height={28} />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* MAIN GRID */}
          <div className="dash-main-grid">

            {/* LIVE ACTIVITY FEED */}
            <div style={{
              borderRadius: 20, overflow: "hidden",
              background: "rgba(255,255,255,0.022)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(0,0,0,0.15)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Activity size={13} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Live Activity</div>
                    <div style={{ fontSize: 10, color: "#3f3f46", marginTop: 1 }}>{allCount + recentSocial.length} total events recorded</div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                    borderRadius: 999, padding: "3px 9px",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "liveDot 1.8s ease infinite", flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#10b981", letterSpacing: "0.1em" }}>LIVE</span>
                  </div>
                </div>
                <Link href="/dashboard/runs" style={{
                  display: "flex", alignItems: "center", gap: 4,
                  fontSize: 11, color: "#52525b", textDecoration: "none",
                  padding: "5px 12px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.02)",
                }}>
                  View all <ChevronRight size={11} />
                </Link>
              </div>
              <LiveFeed initialEvents={feedEvents} />
            </div>

            {/* SIDEBAR */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Quick Actions */}
              <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "rgba(255,255,255,0.022)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(0,0,0,0.15)",
                }}>
                  <Sparkles size={11} color="#a78bfa" />
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#d4d4d8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Access</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10 }}>
                  {[
                    { href: "/dashboard/agents",    icon: Bot,       label: "AI Employees", color: "#7c3aed" },
                    { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns",    color: "#ec4899" },
                    { href: "/dashboard/social",    icon: Share2,    label: "Social Media", color: "#3b82f6" },
                    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics",    color: "#f59e0b" },
                  ].map(q => (
                    <Link key={q.href} href={q.href} className="quick-tile" style={{
                      display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                      borderRadius: 12, padding: "13px 12px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                      textDecoration: "none",
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 9,
                        background: `${q.color}12`, border: `1px solid ${q.color}20`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 0 12px ${q.color}14`,
                      }}>
                        <q.icon size={14} color={q.color} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#d4d4d8" }}>{q.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Workforce */}
              <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "rgba(255,255,255,0.022)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(0,0,0,0.15)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Bot size={11} color="#a78bfa" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#d4d4d8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Workforce</span>
                  </div>
                  <Link href="/dashboard/agents" style={{ fontSize: 10, color: "#52525b", textDecoration: "none" }}>View all</Link>
                </div>

                {agents.length === 0 ? (
                  <div style={{ padding: "28px 16px", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#52525b", marginBottom: 10 }}>No AI employees yet.</p>
                    <Link href="/dashboard/agents" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 700 }}>+ Hire your first</Link>
                  </div>
                ) : (
                  agents.slice(0, 4).map((a, i) => (
                    <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="agent-row">
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `linear-gradient(135deg, ${COLORS[i % COLORS.length][0]}, ${COLORS[i % COLORS.length][1]})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 900, color: "#fff",
                        boxShadow: `0 0 14px ${COLORS[i % COLORS.length][0]}50`,
                      }}>
                        {a.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name.split("—")[0].trim()}</div>
                        <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>{a.role}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                          animation: "liveDot 2.2s ease infinite",
                        }} />
                        <ChevronRight size={12} className="row-chevron" />
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Usage */}
              <div style={{
                borderRadius: 20, overflow: "hidden",
                background: "rgba(255,255,255,0.022)",
                border: "1px solid rgba(255,255,255,0.07)",
                padding: "14px 16px 16px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Gauge size={11} color="#71717a" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#d4d4d8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Usage</span>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "2px 9px",
                    letterSpacing: "0.06em",
                    color: isPro ? "#a78bfa" : "#71717a",
                    background: isPro ? "rgba(124,58,237,0.12)" : "rgba(113,113,122,0.1)",
                    border: `1px solid ${isPro ? "rgba(124,58,237,0.2)" : "rgba(113,113,122,0.15)"}`,
                  }}>
                    {user.plan}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-1px" }}>{runsUsed}</span>
                  <span style={{ fontSize: 13, color: "#3f3f46" }}>/ {effectiveRunLimit} runs</span>
                </div>

                <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.06)", marginBottom: 12, overflow: "hidden" }}>
                  <div className="usage-bar" style={{ width: `${pct}%` }} />
                </div>

                <div style={{ fontSize: 10, color: "#52525b", marginBottom: isPro ? 0 : 12 }}>
                  {Math.round(pct)}% of monthly limit used
                </div>

                {!isPro && (
                  <Link href="/dashboard/billing" style={{
                    display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 6,
                    borderRadius: 10, padding: "9px 0",
                    background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    boxShadow: "0 0 20px rgba(124,58,237,0.3)",
                    textDecoration: "none",
                    marginTop: 4,
                  }}>
                    <Sparkles size={11} />
                    Upgrade to Pro
                  </Link>
                )}
              </div>

            </div>
          </div>

          {/* BOTTOM NAV */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingBottom: 8 }}>
            {[
              { href: "/dashboard/runs",      icon: ListChecks, label: "All Runs" },
              { href: "/dashboard/analytics", icon: BarChart3,  label: "Analytics" },
              { href: "/dashboard/campaigns", icon: Megaphone,  label: "Campaigns" },
              { href: "/dashboard/social",    icon: Share2,     label: "Social" },
              { href: "/dashboard/billing",   icon: CreditCard, label: "Billing" },
              { href: "/dashboard/settings",  icon: Settings,   label: "Settings" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="nav-chip" style={{
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
  ["#7c3aed","#6d28d9"],
  ["#ec4899","#db2777"],
  ["#3b82f6","#2563eb"],
  ["#10b981","#059669"],
];
