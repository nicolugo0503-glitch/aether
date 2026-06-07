import type { CSSProperties } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import {
  Bot, Gauge, TrendingUp, ChevronRight, Settings, Megaphone, Share2,
  CheckCircle2, Plus, Sparkles, Activity, ListChecks, CreditCard, BarChart3,
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
  }h
  return pts;
}

const AGENT_COLORS: [string, string][] = [
  ["#7c3aed", "#a78bfa"],
  ["#0891b2", "#67e8f9"],
  ["#059669", "#34d399"],
  ["#f59e0b", "#fcd34d"],
  ["#ec4899", "#f9a8d4"],
];

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
      agentName: r.agent.name.split("â")[0].trim(),
      agentColor: agentColor(r.agent.name),
      description: r.input.length > 90 ? r.input.slice(0, 87) + "â¦" : r.input,
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
        description: p.topic.length > 90 ? p.topic.slice(0, 87) + "â¦" : p.topic,
        status: st,
        ts: (p.postedAt ?? p.createdAt).getTime(),
        platforms,
      };
    }),
  ].sort((a, b) => b.ts - a.ts).slice(0, 14);

  const limits            = PLAN_LIMITS[toPlanKey(user.plan)];
  const displayName       = user.name || user.email.split("@")[0];
  const initials          = displayName[0].toUpperCase();
  const totalCost         = totals._sum.costCents ?? 0;
  const successCount      = totals._count ?? 0;
  const seed              = user.id.charCodeAt(0) + user.id.charCodeAt(1);
  const isPro             = user.plan !== "FREE";
  const runsUsed          = user.runsUsedThisPeriod ?? 0;
  const effectiveRunLimit = limits.monthlyRuns + (user.referralBonusRuns ?? 0);
  const pct               = Math.min((runsUsed / effectiveRunLimit) * 100, 100);
  const hour              = new Date().getHours();
  const greeting          = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const agentStubs        = agents.map(a => ({ id: a.id, name: a.name, role: a.role }));
  const successRate        = allCount > 0 ? Math.round((successCount / allCount) * 100) : 0;

  // SVG ring geometry
  const R = 34, CIRC = 2 * Math.PI * R;
  const dash = (pct / 100) * CIRC;

  const STAT_CARDS = [
    { label: "AI Employees",     value: agentCount,                  suffix: `/${limits.agents}`,       prefix: "",  icon: Bot,          color: "#7c3aed", spark: genSparkling(seed,      10, "up"),   href: "/dashboard/agents"  },
    { label: "Successful Runs",  value: successCount,                suffix: "",                          prefix: "",  icon: CheckCircle2, color: "#10b981", spark: genSparkline(seed + 3,  10, "up"),   href: "/dashboard/runs"    },
    { label: "Runs This Period", value: runsUsed,                    suffix: `/${effectiveRunLimit}`,    prefix: "",  icon: Activity,     color: "#f59e0b", spark: genSparkline(seed + 7,  10, "flat"), href: "/dashboard/runs"    },
    { label: "Est. Spend",       value: Math.round(totalCost / 100), suffix: "",                          prefix: "$", icon: TrendingUp,   color: "#ec4899", spark: genSparkline(seed + 11, 10, "up"),   href: "/dashboard/billing" },
  ];

  return (
    <>
      <CommandPalette agents={agentStubs} />

      <style>{`
        @keyframes liveDot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.5); }
          50%      { opacity:0.7; box-shadow:0 0 0 6px rgba(16,185,129,0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes glitch {
          0%,94%,100% { text-shadow:none; }
          95%  { text-shadow: 2px 0 #ec4899, -2px 0 #00d4ff; }
          97%  { text-shadow:-2px 0 #ec4899,  2px 0 #00d4ff; }
        }
        @keyframes pulse-ring {
          0%   { transform:scale(1);   opacity:0.6; }
          100% { transform:scale(1.9); opacity:0; }
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(10px) scale(0.98); }
          to   { opacity:1; transform:translateY(0)    scale(1); }
        }
        @keyframes ring-fill {
          from { stroke-dashoffset: ${CIRC}; }
          to   { stroke-dashoffset: ${CIRC - dash}; }
        }
        @keyframes agentPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
          50%     { box-shadow: 0 0 20px 4px rgba(124,58,237,0.22); }
        }
        @keyframes heroNum {
          from { opacity:0; transform:scale(0.88); }
          to   { opacity:1; transform:scale(1); }
        }

        /* ââ Layout shell ââ */
        .cmd-page { display:flex; flex-direction:column; gap:20px; padding-bottom:40px; }

        /* ââ Header ââ */
        .cmd-header {
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          animation: fadeUp 0.4s ease both;
        }
        .cmd-header-left  { display:flex; align-items:center; gap:14px; flex:1; min-width:0; }
        .cmd-header-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .cmd-kbd-hint { display:none; }
        @media(min-width:580px){ .cmd-kbd-hint { display:flex; align-items:center; gap:6px; } }
        .hire-btn { transition:all 0.2s ease; }
        .hire-btn:hover { transform:translateY(-2px); box-shadow:0 0 36px rgba(124,58,237,0.65) !important; }
        .hire-label-full  { display:none; }
        .hire-label-short { display:inline; }
        @media(min-width:400px){ .hire-label-full { display:inline; } .hire-label-short { display:none; } }

        /* ââ Hero banner ââ */
        .cmd-hero {
          border-radius:22px;
          background:linear-gradient(135deg,rgba(124,58,237,0.09) 0%,rgba(236,72,153,0.05) 100%);
          border:1px solid rgba(124,58,237,0.16);
          padding:clamp(18px,4vw,32px);
          display:flex; align-items:center; gap:clamp(14px,3vw,32px); flex-wrap:wrap;
          animation: fadeUp 0.4s ease 0.06s both;
        }
        .hero-main { flex:1 1 140px; min-width:0; }
        .hero-count {
          font-size:clamp(54px,12vw,90px); font-weight:900; line-height:1; letter-spacing:-3px;
          background:linear-gradient(135deg,#fff 0%,#c4b5fd 40%,#818cf8 70%,#e879f9 100%);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          animation:heroNum 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both, glitch 9s ease-in-out 2s infinite;
        }
        .hero-stats { display:flex; gap:10px; flex-wrap:wrap; flex-shrink:0; }
        .hero-pill {
          border-radius:14px; padding:12px 16px; min-width:82px; text-align:center;
          background:rgba(0,0,0,0.22); border:1px solid rgba(255,255,255,0.06);
          transition:border-color 0.18s ease;
        }
        .hero-pill:hover { border-color:rgba(255,255,255,0.12); }

        /* ââ Stat cards ââ */
        .cmd-stats {
          display:flex; gap:10px; overflow-x:auto; scroll-snap-type:x mandatory;
          -webkit-overflow-scrolling:touch; scrollbar-width:none;
          animation: fadeUp 0.4s ease 0.1s both;
        }
        .cmd-stats::-webkit-scrollbar { display:none; }
        @media(min-width:640px)  { .cmd-stats { display:grid; grid-template-columns:repeat(2,1fr); overflow:visible; } }
        @media(min-width:1060px) { .cmd-stats { grid-template-columns:repeat(4,1fr); } }
        .cmd-stat-card {
          scroll-snap-align:start; flex:0 0 158px;
          border-radius:18px; padding:16px; text-decoration:none;
          background:rgba(255,255,255,0.026); border:1px solid rgba(255,255,255,0.07);
          transition:transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
          animation: cardIn 0.4s ease both;
          border-left-width:3px; border-left-style:solid;
        }
        @media(min-width:640px){ .cmd-stat-card { flex:none; } }
        .cmd-stat-card:hover { transform:translateY(-3px); box-shadow:0 10px 36px rgba(0,0,0,0.32); }

        /* ââ Workforce ââ */
        .cmd-section-hd {
          display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;
        }
        .cmd-workforce-grid {
          display:grid; grid-template-columns:repeat(2,1fr); gap:10px;
          animation: fadeUp 0.4s ease 0.18s both;
        }
        @media(min-width:600px)  { .cmd-workforce-grid { grid-template-columns:repeat(3,1fr); } }
        @media(min-width:900px)  { .cmd-workforce-grid { grid-template-columns:repeat(4,1fr); } }
        @media(min-width:1200px) { .cmd-workforce-grid { grid-template-columns:repeat(5,1fr); } }
        .agent-card {
          border-radius:16px; padding:14px 12px;
          background:rgba(255,255,255,0.024); border:1px solid rgba(255,255,255,0.07);
          text-decoration:none; display:flex; flex-direction:column; gap:9px;
          transition:all 0.18s ease; animation: cardIn 0.4s ease both;
        }
        .agent-card:hover {
          border-color:rgba(124,58,237,0.32); background:rgba(124,58,237,0.05);
          transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.28);
        }
        .agent-card-empty {
          border-style:dashed; border-color:rgba(124,58,237,0.18) !important;
          align-items:center; justify-content:center; min-height:110px;
        }
        .agent-card-empty:hover { border-color:rgba(124,58,237,0.4) !important; }

        /* ââ Main content row ââ */
        .cmd-main { display:flex; flex-direction:column; gap:16px; animation: fadeUp 0.4s ease 0.24s both; }
        @media(min-width:860px) {
          .cmd-main { flex-direction:row; align-items:flex-start; }
          .cmd-ops   { flex:1 1 0; min-width:0; }
          .cmd-panel { flex:0 0 296px; }
        }
        @media(min-width:1100px) { .cmd-main .cmd-panel { flex:0 0 328px; } }

        /* ââ Panel cards ââ */
        .panel-card {
          border-radius:18px; overflow:hidden;
          background:rgba(255,255,255,0.022); border:1px solid rgba(255,255,255,0.07);
          margin-bottom:12px;
        }
        .panel-card:last-child { margin-bottom:0; }
        .panel-hd {
          display:flex; align-items:center; justify-content:space-between;
          padding:11px 15px; border-bottom:1px solid rgba(255,255,255,0.05);
          background:rgba(0,0,0,0.14);
        }
        .panel-hd-left { display:flex; align-items:center; gap:7px; }

        /* ââ Usage ring ââ */
        .usage-ring-bg  { stroke:rgba(255,255,255,0.06); }
        .usage-ring-fg  {
          stroke:url(#usageGrad);
          stroke-dasharray:${CIRC};
          stroke-dashoffset:${CIRC};
          stroke-linecap:round;
          transform:rotate(-90deg); transform-origin:50% 50%;
          animation:ring-fill 1.5s cubic-bezier(0.16,1,0.3,1) 0.5s forwards;
        }

        /* ââ Quick access tiles ââ */
        .quick-tile {
          border-radius:12px; padding:12px 10px;
          background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.05);
          text-decoration:none; display:flex; flex-direction:column; align-items:flex-start; gap:7px;
          transition:all 0.18s ease;
        }
        .quick-tile:hover {
          background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.1);
          transform:translateY(-1px);
        }

        /* ââ Feed card ââ */
        .ops-card {
          border-radius:20px; overflow:hidden;
          background:rgba(255,255,255,0.022); border:1px solid rgba(255,255,255,0.07);
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .ops-hd {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px; border-bottom:1px solid rgba(255,255,255,0.05);
          background:rgba(0,0,0,0.15); flex-wrap:wrap; gap:10px;
        }
        .ops-hd-left { display:flex; align-items:center; gap:10px; }

        /* ââ Footer nav ââ */
        .cmd-footer { display:flex; align-items:center; gap:5px; flex-wrap:wrap; padding-bottom:8px; animation: fadeUp 0.4s ease 0.3s both; }
        .nav-chip {
          display:flex; align-items:center; gap:5px;
          padding:6px 11px; border-radius:9px;
          background:rgba(255,255,255,0.025); border:1px solid rgba(255,255,255,0.05);
          font-size:11px; color:#71717a; text-decoration:none; transition:all 0.18s ease;
        }
        .nav-chip:hover { color:#fff; background:rgba(124,58,237,0.12); border-color:rgba(124,58,237,0.3); }

        /* ââ Feed view-all link hover ââ */
        .ops-all-link { transition:all 0.15s ease; }
        .ops-all-link:hover { color:#d4d4d8 !important; background:rgba(255,255,255,0.04) !important; }
      `}</style>

      <div className="relative min-h-screen">
        <Aurora />
        <ParticleCanvas />

        <div className="relative z-10 cmd-page">

          {/* âââââââââââââââââââââââââââââââ
              HEADER
          âââââââââââââââââââââââââââââââ */}
          <div className="cmd-header">
            <div className="cmd-header-left">
              {/* Avatar with pulse rings */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "1px solid rgba(124,58,237,0.22)", animation: "pulse-ring 3s ease-out infinite" }} />
                <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "1px solid rgba(124,58,237,0.09)", animation: "pulse-ring 3s ease-out infinite 1.1s" }} />
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 19, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 0 2px rgba(124,58,237,0.4),0 0 32px rgba(124,58,237,0.3)",
                  position: "relative", zIndex: 1, animation: "glitch 8s ease-in-out infinite",
                }}>
                  {initials}
                </div>
                <div style={{
                  position: "absolute", bottom: -2, right: -2, zIndex: 2,
                  width: 11, height: 11, borderRadius: "50%",
                  background: "#10b981", border: "2px solid #000",
                  boxShadow: "0 0 8px rgba(16,185,129,0.8)",
                  animation: "liveDot 2s ease infinite",
                }} />
              </div>

              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 10, color: "#52525b", fontWeight: 600, letterSpacing: "0.06em", marginBottom: 2, textTransform: "uppercase" }}>
                  {greeting}
                </p>
                <h1 style={{ fontSize: "clamp(20px,5vw,28px)", fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <Typewriter
                    text={displayName}
                    speed={60}
                    style={{
                      background: "linear-gradient(135deg,#fff 0%,#c4b5fd 40%,#818cf8 70%,#e879f9 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  />
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "liveDot 1.8s ease infinite", flexShrink: 0 }} />
                    <span style={{ fontSize: 9, color: "#10b981", fontWeight: 800, letterSpacing: "0.1em" }}>ONLINE</span>
                  </div>
                  <div style={{ padding: "2px 8px", borderRadius: 999, background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)", fontSize: 9, color: "#a78bfa", fontWeight: 700, letterSpacing: "0.08em" }}>
                    {agentCount} AGENT{agentCount !== 1 ? "S" : ""}
                  </div>
                </div>
              </div>
            </div>

            <div className="cmd-header-right">
              <div className="cmd-kbd-hint" style={{ padding: "7px 11px", borderRadius: 9, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <kbd style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 4, padding: "1px 5px" }}>âK</kbd>
              </div>
              <Link href="/dashboard/agents" className="hire-btn" style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "#fff", borderRadius: 12, padding: "9px 16px",
                fontSize: 12, fontWeight: 700, letterSpacing: "0.01em",
                boxShadow: "0 0 24px rgba(124,58,237,0.4)", textDecoration: "none",
              }}>
                <Plus size={12} />
                <span className="hire-label-full">Hire Agent</span>
                <span className="hire-label-short">Hire</span>
              </Link>
            </div>
          </div>

          {/* âââââââââââââââââââââââââââââââ
              HERO â Operations banner
          âââââââââââââââââââââââââââââââ */}
          <div className="cmd-hero">
            <div className="hero-main">
              <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                Total Operations
              </div>
              <div className="hero-count">
                <AnimatedCounter value={allCount} />
              </div>
              <div style={{ fontSize: 12, color: "#52525b", marginTop: 8 }}>
                AI tasks executed across your entire workforce
              </div>
            </div>
            <div className="hero-stats">
              {[
                { label: "Success rate", value: `${successRate}%`,                          color: "#10b981" },
                { label: "Saved est.",   value: `$${Math.round(totalCost / 100 * 8)}`,      color: "#a78bfa" },
                { label: "Agents hired", value: String(agentCount),                          color: "#f59e0b" },
              ].map(h => (
                <div key={h.label} className="hero-pill">
                  <div style={{ fontSize: 22, fontWeight: 900, color: h.color, letterSpacing: "-1px", lineHeight: 1, marginBottom: 5 }}>{h.value}</div>
                  <div style={{ fontSize: 10, color: "#52525b", fontWeight: 600 }}>{h.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* âââââââââââââââââââââââââââââââ
              STAT CARDS â horizontal scroll â grid
          âââââââââââââââââââââââââââââââ */}
          <div className="cmd-stats">
            {STAT_CARDS.map((s, i) => (
              <Link
                key={s.label}
                href={s.href}
                className="cmd-stat-card"
                style={{ borderLeftColor: s.color, animationDelay: `${0.08 + i * 0.06}s` } as CSSProperties}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: `${s.color}14`, border: `1px solid ${s.color}22`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 12px ${s.color}18`,
                  }}>
                    <s.icon size={14} color={s.color} />
                  </div>
                  <Sparkline values={s.spark} color={s.color} width={68} height={26} />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 5 }}>
                  {s.prefix && <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.prefix}</span>}
                  <span style={{ fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-1.5px" }}>
                    <AnimatedCounter value={s.value} />
                  </span>
                  {s.suffix && <span style={{ fontSize: 11, color: "#3f3f46", fontWeight: 500 }}>{s.suffix}</span>}
                </div>
                <div style={{ fontSize: 9, fontWeight: 800, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
              </Link>
            ))}
          </div>

          {/* âââââââââââââââââââââââââââââââ
              WORKFORCE â agent cards grid
          âââââââââââââââââââââââââââââââ */}
          <div>
            <div className="cmd-section-hd">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bot size={13} color="#a78bfa" />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#d4d4d8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Workforce</span>
                <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 999, background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", color: "#a78bfa", fontWeight: 700 }}>
                  {agentCount}
                </span>
              </div>
              <Link href="/dashboard/agents" style={{ fontSize: 11, color: "#52525b", textDecoration: "none", display: "flex", alignItems: "center", gap: 3 }}>
                View all <ChevronRight size={11} />
              </Link>
            </div>

            {agents.length === 0 ? (
              <div style={{ borderRadius: 16, padding: "36px 24px", textAlign: "center", background: "rgba(255,255,255,0.022)", border: "1px dashed rgba(124,58,237,0.2)" }}>
                <Bot size={30} color="#3f3f46" style={{ marginBottom: 12 }} />
                <p style={{ fontSize: 13, color: "#52525b", marginBottom: 14 }}>No AI employees yet.</p>
                <Link href="/dashboard/agents" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 11, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                  <Plus size={12} /> Hire your first agent
                </Link>
              </div>
            ) : (
              <div className="cmd-workforce-grid">
                {agents.slice(0, 4).map((a, i) => (
                  <Link
                    key={a.id}
                    href={`/dashboard/agents/${a.id}`}
                    className="agent-card"
                    style={{ animationDelay: `${0.2 + i * 0.06}s` } as CSSProperties}
                  >
                    {/* Avatar row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                        background: `linear-gradient(135deg,${AGENT_COLORS[i % AGENT_COLORS.length][0]},${AGENT_COLORS[i % AGENT_COLORS.length][1]})`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 900, color: "#fff",
                        boxShadow: `0 0 18px ${AGENT_COLORS[i % AGENT_COLORS.length][0]}44`,
                        animation: "agentPulse 3.5s ease-in-out infinite",
                        animationDelay: `${i * 0.9}s`,
                      }}>
                        {a.name[0].toUpperCase()}
                      </div>
                      <div style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: "#10b981", boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                        animation: "liveDot 2.2s ease infinite",
                        animationDelay: `${i * 0.45}s`,
                      }} />
                    </div>
                    {/* Name / role */}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#e4e4e7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                        {a.name.split("â")[0].trim()}
                      </div>
                      <div style={{ fontSize: 10, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.role}</div>
                    </div>
                    {/* Status badge */}
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", padding: "2px 7px", borderRadius: 999, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.14)", letterSpacing: "0.05em", width: "fit-content" }}>
                      ONLINE
                    </span>
                  </Link>
                ))}

                {/* "Hire more" slot â only show if under agent limit */}
                {agentCount < limits.agents && (
                  <Link href="/dashboard/agents" className="agent-card agent-card-empty">
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(124,58,237,0.08)", border: "1px dashed rgba(124,58,237,0.28)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
                      <Plus size={16} color="#7c3aed" />
                    </div>
                    <span style={{ fontSize: 11, color: "#52525b", fontWeight: 600 }}>Hire Agent</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* âââââââââââââââââââââââââââââââ
              OPS FEED  +  CONTROL PANEL
          âââââââââââââââââââââââââââââââ */}
          <div className="cmd-main">

            {/* Live operations feed */}
            <div className="cmd-ops">
              <div className="ops-card">
                <div className="ops-hd">
                  <div className="ops-hd-left">
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Activity size={13} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.2px" }}>Live Operations</div>
                      <div style={{ fontSize: 9, color: "#3f3f46", marginTop: 1 }}>{allCount} total events recorded</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 999, padding: "2px 8px" }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", animation: "liveDot 1.8s ease infinite", flexShrink: 0 }} />
                      <span style={{ fontSize: 9, fontWeight: 800, color: "#10b981", letterSpacing: "0.1em" }}>LIVE</span>
                    </div>
                  </div>
                  <Link href="/dashboard/runs" className="ops-all-link" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "#52525b", textDecoration: "none", padding: "4px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
                    All <ChevronRight size={10} />
                  </Link>
                </div>
                <LiveFeed initialEvents={feedEvents} />
              </div>
            </div>

            {/* Control panel sidebar */}
            <div className="cmd-panel">

              {/* Usage â circular ring */}
              <div className="panel-card">
                <div className="panel-hd">
                  <div className="panel-hd-left">
                    <Gauge size={11} color="#71717a" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#d4d4d8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Usage</span>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, borderRadius: 999, padding: "2px 9px", letterSpacing: "0.06em",
                    color: isPro ? "#a78bfa" : "#71717a",
                    background: isPro ? "rgba(124,58,237,0.12)" : "rgba(113,113,122,0.1)",
                    border: `1px solid ${isPro ? "rgba(124,58,237,0.2)" : "rgba(113,113,122,0.15)"}`,
                  }}>
                    {user.plan}
                  </span>
                </div>
                <div style={{ padding: "18px 16px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                  {/* Circular progress ring */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <svg width={88} height={88} viewBox="0 0 88 88">
                      <defs>
                        <linearGradient id="usageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                      <circle cx={44} cy={44} r={R} fill="none" strokeWidth={7} className="usage-ring-bg" />
                      <circle cx={44} cy={44} r={R} fill="none" strokeWidth={7} className="usage-ring-fg" />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.5px" }}>
                        {Math.round(pct)}<span style={{ fontSize: 9, color: "#52525b" }}>%</span>
                      </span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 80 }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1 }}>{runsUsed}</div>
                    <div style={{ fontSize: 11, color: "#3f3f46", marginTop: 4 }}>of {effectiveRunLimit} runs</div>
                    <div style={{ fontSize: 10, color: "#52525b", marginTop: 3 }}>this period</div>
                    {!isPro && (
                      <Link href="/dashboard/billing" style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 12, padding: "7px 14px", borderRadius: 9, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff", fontSize: 11, fontWeight: 700, textDecoration: "none", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}>
                        <Sparkles size={10} /> Upgrade to Pro
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick access */}
              <div className="panel-card">
                <div className="panel-hd">
                  <div className="panel-hd-left">
                    <Sparkles size={11} color="#a78bfa" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#d4d4d8", textTransform: "uppercase", letterSpacing: "0.1em" }}>Quick Access</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10 }}>
                  {[
                    { href: "/dashboard/agents",    icon: Bot,       label: "Agents",    color: "#7c3aed" },
                    { href: "/dashboard/campaigns", icon: Megaphone, label: "Campaigns", color: "#ec4899" },
                    { href: "/dashboard/social",    icon: Share2,    label: "Social",    color: "#3b82f6" },
                    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics", color: "#f59e0b" },
                  ].map(q => (
                    <Link key={q.href} href={q.href} className="quick-tile">
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${q.color}12`, border: `1px solid ${q.color}20`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 10px ${q.color}14` }}>
                        <q.icon size={13} color={q.color} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#d4d4d8" }}>{q.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* âââââââââââââââââââââââââââââââ
              FOOTER NAV STRIP
          âââââââââââââââââââââââââââââââ */}
          <div className="cmd-footer">
            {[
              { href: "/dashboard/runs",      icon: ListChecks, label: "Runs"      },
              { href: "/dashboard/analytics", icon: BarChart3,  label: "Analytics" },
              { href: "/dashboard/campaigns", icon: Megaphone,  label: "Campaigns" },
              { href: "/dashboard/social",    icon: Share2,     label: "Social"    },
              { href: "/dashboard/billing",   icon: CreditCard, label: "Billing"   },
              { href: "/dashboard/settings",  icon: Settings,   label: "Settings"  },
            ].map(item => (
              <Link key={item.href} href={item.href} className="nav-chip">
                <item.icon size={11} />
                {item.label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
