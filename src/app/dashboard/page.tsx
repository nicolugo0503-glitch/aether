import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { centsToUSD, formatDate } from "@/lib/utils";
import {
  Bot, Play, Gauge, TrendingUp, TrendingDown, Minus,
  ChevronRight, Settings, Megaphone, Share2,
  ArrowUpRight, Clock, CheckCircle2, XCircle, Loader2,
  Plus, Sparkles, Activity, ListChecks, CreditCard,
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

  const [agents, recentRuns, totals, allCount] = await Promise.all([
    prisma.agent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.run.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10, include: { agent: true } }),
    prisma.run.aggregate({ where: { userId: user.id, status: "success" }, _sum: { tokensIn: true, tokensOut: true, costCents: true }, _count: true }),
    prisma.run.count({ where: { userId: user.id } }),
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
    { label: "AI Employees",    value: agents.length,    suffix: ` / ${limits.agents}`, icon: Bot,          iconColor: "#7c3aed", spark: genSparkline(seed,     10, "up"),   sparkColor: "#7c3aed", trend: "up"   as const, trendLabel: "+2 this week", href: "/dashboard/agents"  },
    { label: "Successful Runs", value: successCount,     suffix: "",                    icon: CheckCircle2, iconColor: "#10b981", spark: genSparkline(seed + 3, 10, "up"),   sparkColor: "#10b981", trend: "up"   as const, trendLabel: "all time",     href: "/dashboard/runs"    },
    { label: "Runs This Period", value: runsUsed,        suffix: ` / ${limits.monthlyRuns}`, icon: Activity, iconColor: "#f59e0b", spark: genSparkline(seed + 7, 10, "flat"), sparkColor: "#f59e0b", trend: "flat" as const, trendLabel: "this month",   href: "/dashboard/runs"    },
    { label: "Est. Spend",      value: Math.round(totalCost / 100), prefix: "$", suffix: "", icon: TrendingUp, iconColor: "#ec4899", spark: genSparkline(seed + 11,10, "up"),  sparkColor: "#ec4899", trend: "up"   as const, trendLabel: "lifetime",     href: "/dashboard/billing" },
  ];

  return (
    <>
      {/* Global overlays */}
      <CommandPalette agents={agentStubs} />
      <AiAssistant />

      <div className="relative min-h-screen">
        {/* Background layers */}
        <Aurora />
        <ParticleCanvas />

        <div className="relative z-10 space-y-7">

          {/* ── HERO ── */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg,#7c3aed,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", boxShadow: "0 0 20px rgba(124,58,237,0.5), 0 0 44px rgba(124,58,237,0.18)", flexShrink: 0 }}>
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#52525b" }}>{greeting},</p>
                  <h1 className="font-black text-white leading-tight" style={{ fontSize: 22, letterSpacing: "-0.5px" }}>
                    {displayName}
                  </h1>
                </div>
              </div>
              <p className="text-sm ml-[54px]" style={{ color: "#52525b" }}>
                Your AI workforce is live.
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              {/* ⌘K hint */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", cursor: "default" }}>
                <kbd style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 5px", fontFamily: "inherit" }}>⌘K</kbd>
                <span style={{ fontSize: 11, color: "#3f3f46" }}>Search</span>
              </div>
              <Link
                href="/dashboard/agents"
                style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", borderRadius: 11, padding: "8px 16px", fontSize: 12, fontWeight: 700, boxShadow: "0 0 14px rgba(124,58,237,0.38)", textDecoration: "none" }}
              >
                <Plus size={14} />
                Hire AI Employee
              </Link>
            </div>
          </div>

          {/* ── STAT CARDS ── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STAT_CARDS.map(s => {
              const TrendIcon = s.trend === "up" ? TrendingUp : s.trend === ("down" as string) ? TrendingDown : Minus;
              const tc = s.trend === "up" ? "#10b981" : s.trend === ("down" as string) ? "#ef4444" : "#71717a";
              return (
                <div key={s.label} style={{ borderRadius: 16 }}>
                  <Link
                    href={s.href}
                    style={{ display: "block", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 18, textDecoration: "none", position: "relative", overflow: "hidden" }}
                  >
                    {/* ambient glow */}
                    <div style={{ position: "absolute", inset: 0, borderRadius: 16, background: `radial-gradient(circle at 15% 15%, ${s.iconColor}12 0%, transparent 55%)`, pointerEvents: "none" }} />

                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                        <div>
                          <p style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 600, marginBottom: 4 }}>{s.label}</p>
                          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                            {s.prefix ?? ""}
                            <AnimatedCounter value={s.value} />
                            <span style={{ fontSize: 12, fontWeight: 400, color: "#52525b" }}>{s.suffix}</span>
                          </div>
                        </div>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${s.iconColor}14`, border: `1px solid ${s.iconColor}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <s.icon size={15} color={s.iconColor} />
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: tc }}>
                          <TrendIcon size={11} color={tc} />
                          {s.trendLabel}
                        </div>
                        <Sparkline values={s.spark} color={s.sparkColor} width={80} height={26} />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* ── MAIN GRID ── */}
          <div className="grid gap-5 lg:grid-cols-3">

            {/* Live Feed — 2 cols */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Play size={14} color="#a78bfa" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Live Run Feed</span>
                  <span style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.04)", borderRadius: 999, padding: "1px 8px" }}>{allCount} total</span>
                  {/* live indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "liveDot 1.8s ease infinite" }} />
                    <span style={{ fontSize: 9, color: "#10b981", fontWeight: 600, letterSpacing: "0.05em" }}>LIVE</span>
                  </div>
                </div>
                <Link href="/dashboard/runs" style={{ fontSize: 11, color: "#52525b", display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              {recentRuns.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <Sparkles size={18} color="#7c3aed" />
                  </div>
                  <p style={{ fontSize: 13, color: "#d4d4d8", fontWeight: 500, marginBottom: 4 }}>No runs yet</p>
                  <p style={{ fontSize: 12, color: "#52525b" }}>Your AI employees await their first assignment.</p>
                </div>
              ) : (
                <LiveFeed initialCount={recentRuns.length} />
              )}
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Quick Actions */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <Sparkles size={14} color="#a78bfa" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Quick Actions</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, padding: 10 }}>
                  {[
                    { href: "/dashboard/agents",    icon: Bot,         label: "AI Employees", color: "#7c3aed" },
                    { href: "/dashboard/campaigns", icon: Megaphone,   label: "Campaigns",    color: "#ec4899" },
                    { href: "/dashboard/social",    icon: Share2,      label: "Social Media", color: "#3b82f6" },
                    { href: "/dashboard/settings",  icon: Settings,    label: "Settings",     color: "#10b981" },
                  ].map(q => (
                    <Link
                      key={q.href}
                      href={q.href}
                      className="dash-quick-link"
                      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 7, borderRadius: 11, padding: "11px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", transition: "transform 0.15s" }}
                    >
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: `${q.color}12`, border: `1px solid ${q.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <q.icon size={12} color={q.color} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#d4d4d8" }}>{q.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Workforce */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Bot size={14} color="#a78bfa" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Your Workforce</span>
                  </div>
                  <Link href="/dashboard/agents" style={{ fontSize: 11, color: "#52525b", textDecoration: "none" }}>View all</Link>
                </div>

                {agents.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center" }}>
                    <p style={{ fontSize: 12, color: "#52525b", marginBottom: 10 }}>No AI employees yet.</p>
                    <Link href="/dashboard/agents" style={{ fontSize: 12, color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>+ Hire your first agent</Link>
                  </div>
                ) : (
                  agents.slice(0, 4).map((a, i) => (
                    <Link
                      key={a.id}
                      href={`/dashboard/agents/${a.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", textDecoration: "none" }}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${COLORS[i % COLORS.length][0]}, ${COLORS[i % COLORS.length][1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
                        {a.name[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{a.name}</div>
                        <div style={{ fontSize: 10, color: "#52525b" }}>{a.role}</div>
                      </div>
                      <ArrowUpRight size={12} color="#3f3f46" />
                    </Link>
                  ))
                )}
              </div>

              {/* Plan / Usage */}
              <div className="rounded-2xl" style={{ background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.06)", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#fff" }}>
                    <Gauge size={14} color="#71717a" />
                    Usage
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isPro ? "#a78bfa" : "#71717a", background: isPro ? "rgba(124,58,237,0.14)" : "rgba(113,113,122,0.1)", border: `1px solid ${isPro ? "rgba(124,58,237,0.22)" : "rgba(113,113,122,0.16)"}`, borderRadius: 999, padding: "2px 9px" }}>
                    {user.plan}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#52525b", marginBottom: 5 }}>
                  <span>Runs this period</span>
                  <span style={{ color: "#fff", fontWeight: 500 }}>{runsUsed} / {limits.monthlyRuns}</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: barColor, boxShadow: `0 0 6px ${barColor}55`, transition: "width 1s ease" }} />
                </div>

                {!isPro && (
                  <Link
                    href="/dashboard/billing"
                    style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, padding: "8px 0", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", fontSize: 12, fontWeight: 700, boxShadow: "0 0 14px rgba(124,58,237,0.3)", textDecoration: "none" }}
                  >
                    <Sparkles size={12} />
                    Upgrade Plan
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ── BOTTOM NAV STRIP ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 8 }}>
            {[
              { href: "/dashboard/runs",     icon: ListChecks, label: "All Runs" },
              { href: "/dashboard/campaigns",icon: Megaphone,  label: "Campaigns" },
              { href: "/dashboard/social",   icon: Share2,     label: "Social" },
              { href: "/dashboard/billing",  icon: CreditCard, label: "Billing" },
              { href: "/dashboard/settings", icon: Settings,   label: "Settings" },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="dash-nav-link"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 13px", borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", fontSize: 11, color: "#71717a", textDecoration: "none", transition: "all 0.15s" }}
              >
                <item.icon size={12} />
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

      <style>{`
        @keyframes liveDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          50% { opacity: 0.6; box-shadow: 0 0 0 4px rgba(16,185,129,0); }
        }
        .dash-quick-link:hover { transform: scale(1.03); }
        .dash-nav-link:hover { color: #fff !important; border-color: rgba(124,58,237,0.25) !important; }
      `}</style>
    </>
  );
}

// ── Agent avatar gradient pairs ──────────────────────────────────
const COLORS = [
  ["#7c3aed", "#6d28d9"],
  ["#ec4899", "#db2777"],
  ["#3b82f6", "#2563eb"],
  ["#10b981", "#059669"],
];
