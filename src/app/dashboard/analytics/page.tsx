import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import Link from "next/link";
import {
  TrendingUp, Bot, Share2, Mail, Zap, CheckCircle2,
  XCircle, BarChart3, DollarSign, Activity, ArrowLeft,
} from "lucide-react";

export const metadata = { title: "Analytics | Aether" };

/* ── helpers ─────────────────────────────────────────────── */
function fmt(n: number, decimals = 0) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(decimals);
}

function dayLabel(d: Date) {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
}

/* ── SVG bar chart ───────────────────────────────────────── */
function BarChart({
  data, color, height = 80, label,
}: {
  data: number[];
  color: string;
  height?: number;
  label: (i: number) => string;
}) {
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`bar-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const barH = (v / max) * (height - 4);
        const x = i * w + w * 0.12;
        const bw = w * 0.76;
        return (
          <g key={i}>
            <rect
              x={x} y={height - barH} width={bw} height={barH}
              rx="2" fill={`url(#bar-${color.replace("#","")})`}
            />
          </g>
        );
      })}
    </svg>
  );
}

/* ── SVG area chart ──────────────────────────────────────── */
function AreaChart({ data, color, height = 80 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - (v / max) * (height - 6) - 3;
    return `${x},${y}`;
  });
  const area = `0,${height} ${pts.join(" ")} 100,${height}`;
  const line = pts.join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id={`area-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#area-${color.replace("#","")})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── page ─────────────────────────────────────────────────── */
export default async function AnalyticsPage() {
  const user = (await getCurrentUser())!;

  const now   = new Date();
  const d30   = new Date(now.getTime() - 30 * 86400_000);
  const d7    = new Date(now.getTime() - 7  * 86400_000);

  const [
    allRuns, agents, socialPosts, campaigns,
    totals30, totals7, prevTotals7,
  ] = await Promise.all([
    prisma.run.findMany({
      where: { userId: user.id, createdAt: { gte: d30 } },
      select: { createdAt: true, status: true, costCents: true, tokensIn: true, tokensOut: true, agentId: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.agent.findMany({
      where: { userId: user.id },
      include: {
        runs: {
          where: { createdAt: { gte: d30 } },
          select: { status: true, costCents: true },
        },
      },
    }),
    prisma.socialPost.findMany({
      where: { userId: user.id, createdAt: { gte: d30 } },
      select: { createdAt: true, status: true, platforms: true },
    }),
    prisma.campaign.findMany({
      where: { userId: user.id },
      select: { name: true, status: true, results: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.run.aggregate({
      where: { userId: user.id, createdAt: { gte: d30 } },
      _sum: { costCents: true, tokensIn: true, tokensOut: true },
      _count: true,
    }),
    prisma.run.aggregate({
      where: { userId: user.id, createdAt: { gte: d7 }, status: "success" },
      _count: true,
    }),
    prisma.run.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(now.getTime() - 14 * 86400_000), lt: d7 },
        status: "success",
      },
      _count: true,
    }),
  ]);

  const limits = PLAN_LIMITS[toPlanKey(user.plan)];

  // ── Group runs by day (last 30 days) ─────────────────────
  const dayMap: Record<string, { runs: number; success: number; cost: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { runs: 0, success: 0, cost: 0 };
  }
  for (const r of allRuns) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (dayMap[key]) {
      dayMap[key].runs++;
      if (r.status === "success") dayMap[key].success++;
      dayMap[key].cost += r.costCents;
    }
  }
  const days       = Object.keys(dayMap).sort();
  const runsPerDay = days.map(d => dayMap[d].runs);
  const costPerDay = days.map(d => dayMap[d].cost / 100);

  // Last 7 days labels
  const last7Days = days.slice(-7).map(d => dayLabel(new Date(d)));

  // ── Overall stats ─────────────────────────────────────────
  const totalRuns    = totals30._count;
  const totalCost    = (totals30._sum.costCents ?? 0) / 100;
  const successRuns  = allRuns.filter(r => r.status === "success").length;
  const errorRuns    = allRuns.filter(r => r.status === "error").length;
  const successRate  = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
  const totalTokens  = (totals30._sum.tokensIn ?? 0) + (totals30._sum.tokensOut ?? 0);
  const postedSocial = socialPosts.filter(p => p.status === "posted").length;

  // Week-over-week change
  const wow = prevTotals7._count > 0
    ? Math.round(((totals7._count - prevTotals7._count) / prevTotals7._count) * 100)
    : totals7._count > 0 ? 100 : 0;

  // ── Agent leaderboard ─────────────────────────────────────
  const agentStats = agents
    .map(a => ({
      name: a.name.split("—")[0].trim(),
      color: a.name.toLowerCase().includes("ava")  ? "#7c3aed"
           : a.name.toLowerCase().includes("rex")  ? "#0891b2"
           : a.name.toLowerCase().includes("sage") ? "#059669"
           : a.name.toLowerCase().includes("opus") ? "#f59e0b"
           : "#8b5cf6",
      total:   a.runs.length,
      success: a.runs.filter(r => r.status === "success").length,
      cost:    a.runs.reduce((s, r) => s + r.costCents, 0) / 100,
    }))
    .filter(a => a.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxAgentRuns = Math.max(...agentStats.map(a => a.total), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Link href="/dashboard" style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
        }}>
          <ArrowLeft size={15} color="#71717a" />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
            Analytics
          </h1>
          <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>Last 30 days · real-time</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 999,
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981" }}>LIVE</span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-stat-grid" style={{ display: "grid" }}>
        {[
          {
            label: "Total Runs",    value: fmt(totalRuns), icon: Activity,     color: "#7c3aed",
            sub: `${fmt(totals7._count)} this week`,
            badge: wow !== 0 ? `${wow > 0 ? "+" : ""}${wow}% WoW` : "flat",
            badgeColor: wow > 0 ? "#10b981" : wow < 0 ? "#ef4444" : "#71717a",
          },
          {
            label: "Success Rate",  value: `${successRate}%`, icon: CheckCircle2, color: "#10b981",
            sub: `${fmt(successRuns)} succeeded`,
            badge: `${fmt(errorRuns)} errors`,
            badgeColor: errorRuns > 0 ? "#ef4444" : "#10b981",
          },
          {
            label: "Est. Cost",     value: `$${totalCost.toFixed(2)}`, icon: DollarSign,  color: "#f59e0b",
            sub: `${fmt(totalTokens)} tokens`,
            badge: totalRuns > 0 ? `$${(totalCost / totalRuns).toFixed(3)}/run` : "$0/run",
            badgeColor: "#f59e0b",
          },
          {
            label: "Posts Published", value: fmt(postedSocial), icon: Share2, color: "#ec4899",
            sub: `of ${fmt(socialPosts.length)} created`,
            badge: socialPosts.length > 0 ? `${Math.round((postedSocial / socialPosts.length) * 100)}% posted` : "0% posted",
            badgeColor: "#ec4899",
          },
        ].map(card => (
          <div key={card.label} style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "18px 18px 14px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, ${card.color}, ${card.color}00)`,
            }} />
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{card.label}</p>
                <p style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>{card.value}</p>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${card.color}15`, border: `1px solid ${card.color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <card.icon size={16} color={card.color} />
              </div>
            </div>
            <p style={{ fontSize: 10, color: "#52525b", marginBottom: 6 }}>{card.sub}</p>
            <div style={{
              display: "inline-flex", alignItems: "center",
              fontSize: 9, fontWeight: 700, color: card.badgeColor,
              background: `${card.badgeColor}12`, border: `1px solid ${card.badgeColor}25`,
              borderRadius: 999, padding: "2px 7px",
            }}>
              {card.badge}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Runs over 30 days */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "18px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Runs · 30 days</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{fmt(totalRuns)}</p>
            </div>
            <BarChart3 size={16} color="#7c3aed" />
          </div>
          <BarChart data={runsPerDay} color="#7c3aed" height={80} label={i => days[i]} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {[0,7,14,21,29].map(i => (
              <span key={i} style={{ fontSize: 9, color: "#3f3f46" }}>{new Date(days[i]).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
            ))}
          </div>
        </div>

        {/* Cost over 30 days */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, padding: "18px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>Cost · 30 days</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>${totalCost.toFixed(2)}</p>
            </div>
            <DollarSign size={16} color="#f59e0b" />
          </div>
          <AreaChart data={costPerDay} color="#f59e0b" height={80} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {[0,7,14,21,29].map(i => (
              <span key={i} style={{ fontSize: 9, color: "#3f3f46" }}>{new Date(days[i]).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Agent Leaderboard + Social Breakdown ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Agent Leaderboard */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <Bot size={13} color="#a78bfa" />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Agent Leaderboard</span>
            <span style={{ marginLeft: "auto", fontSize: 9, color: "#3f3f46" }}>Last 30 days</span>
          </div>
          {agentStats.length === 0 ? (
            <div style={{ padding: "32px 18px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#52525b" }}>No agent runs yet. Deploy an agent to see stats.</p>
            </div>
          ) : agentStats.map((a, i) => (
            <div key={a.name} style={{
              padding: "12px 18px",
              borderBottom: i < agentStats.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: `${a.color}20`, border: `1px solid ${a.color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 900, color: a.color,
                }}>
                  {a.name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7" }}>{a.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{a.total} runs</span>
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${(a.total / maxAgentRuns) * 100}%`,
                  background: `linear-gradient(90deg, ${a.color}, ${a.color}88)`,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 5 }}>
                <span style={{ fontSize: 9, color: "#10b981" }}>✓ {a.success} success</span>
                {a.total - a.success > 0 && <span style={{ fontSize: 9, color: "#ef4444" }}>✗ {a.total - a.success} error</span>}
                <span style={{ fontSize: 9, color: "#52525b", marginLeft: "auto" }}>${a.cost.toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Social + Run breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Success vs Error */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <TrendingUp size={13} color="#a78bfa" />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Run Breakdown</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Success", count: successRuns, color: "#10b981", icon: CheckCircle2 },
                { label: "Error",   count: errorRuns,   color: "#ef4444", icon: XCircle      },
                { label: "Other",   count: Math.max(0, totalRuns - successRuns - errorRuns), color: "#71717a", icon: Zap },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, margin: "0 auto 8px",
                    background: `${item.color}12`, border: `1px solid ${item.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <item.icon size={16} color={item.color} />
                  </div>
                  <p style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{fmt(item.count)}</p>
                  <p style={{ fontSize: 10, color: "#52525b" }}>{item.label}</p>
                </div>
              ))}
            </div>
            {/* Success rate bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: "#52525b" }}>Success rate</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: successRate >= 80 ? "#10b981" : successRate >= 50 ? "#f59e0b" : "#ef4444" }}>{successRate}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3, width: `${successRate}%`,
                  background: successRate >= 80 ? "linear-gradient(90deg,#10b981,#059669)" : successRate >= 50 ? "linear-gradient(90deg,#f59e0b,#d97706)" : "linear-gradient(90deg,#ef4444,#dc2626)",
                }} />
              </div>
            </div>
          </div>

          {/* Social stats */}
          <div style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: "16px 18px",
            flex: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Share2 size={13} color="#ec4899" />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>Social Media</span>
              <Link href="/dashboard/social" style={{ marginLeft: "auto", fontSize: 10, color: "#52525b", textDecoration: "none" }}>View →</Link>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "Created",  count: socialPosts.length, color: "#7c3aed" },
                { label: "Posted",   count: postedSocial,       color: "#10b981" },
                { label: "Drafts",   count: socialPosts.filter(p => p.status === "draft").length, color: "#52525b" },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>{fmt(item.count)}</p>
                  <p style={{ fontSize: 10, color: item.color }}>{item.label}</p>
                </div>
              ))}
            </div>
            {/* Campaigns */}
            {campaigns.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Mail size={11} color="#0891b2" />
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent Campaigns</span>
                </div>
                {campaigns.slice(0, 3).map(c => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                      background: c.status === "completed" ? "#10b981" : c.status === "running" ? "#f59e0b" : "#52525b",
                    }} />
                    <span style={{ fontSize: 11, color: "#a1a1aa", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                    <span style={{ fontSize: 10, color: "#3f3f46" }}>
                      {(() => { try { return (JSON.parse(c.results) as unknown[]).length; } catch { return 0; } })()} sent
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
