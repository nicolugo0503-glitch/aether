import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { CommandPalette } from "./_components/command-palette";
import { AiAssistant }   from "./_components/ai-assistant";

export const metadata = { title: "Command Center | Aether" };

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ── 3D Wireframe Sphere (SVG) ─────────────────────────────────── */
function WireframeSphere() {
  const rings = [
    { ry: 42, rx: 2,  y: 0,   op: 0.9 },
    { ry: 40, rx: 12, y: -12, op: 0.7 },
    { ry: 35, rx: 22, y: -22, op: 0.5 },
    { ry: 26, rx: 30, y: -30, op: 0.35 },
    { ry: 14, rx: 37, y: -37, op: 0.2 },
    { ry: 40, rx: 12, y: 12,  op: 0.7 },
    { ry: 35, rx: 22, y: 22,  op: 0.5 },
    { ry: 26, rx: 30, y: 30,  op: 0.35 },
    { ry: 14, rx: 37, y: 37,  op: 0.2 },
  ];
  const meridians = Array.from({ length: 6 }, (_, i) => i * 30);
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full" style={{ filter: "drop-shadow(0 0 12px #0066ff55)" }}>
      <defs>
        <radialGradient id="sphereGlow" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#0066ff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#000a1a" stopOpacity="0" />
        </radialGradient>
        <filter id="sphereBloom">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="0" cy="0" r="42" fill="url(#sphereGlow)" />
      <circle cx="0" cy="0" r="42" fill="none" stroke="#0066ff" strokeWidth="0.4" opacity="0.6" />
      {rings.map((r, i) => (
        <ellipse key={i} cx="0" cy={r.y} rx={r.rx} ry={r.ry * 0.3}
          fill="none" stroke="#00d9ff" strokeWidth="0.35" opacity={r.op}
          filter="url(#sphereBloom)" />
      ))}
      {meridians.map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = Math.sin(rad) * 42, x2 = -Math.sin(rad) * 42;
        return (
          <line key={i} x1={x1} y1={-42} x2={x2} y2={42}
            stroke="#0044cc" strokeWidth="0.25" opacity="0.4"
            strokeDasharray={i % 2 === 0 ? "none" : "1,2"} />
        );
      })}
      {[[-20, -18], [15, -28], [28, 5], [-8, 30], [35, -10], [-30, 20]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.2" fill="#ffd700" opacity="0.9">
            <animate attributeName="r" values="1.2;1.8;1.2" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.4;0.9" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={y} r="3" fill="none" stroke="#ffd700" strokeWidth="0.3" opacity="0.3">
            <animate attributeName="r" values="1.5;4;1.5" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0;0.3" dur={`${1.5 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      <line x1="0" y1="-45" x2="0" y2="45" stroke="#003080" strokeWidth="0.3" strokeDasharray="2,3" />
      <line x1="-45" y1="0" x2="45" y2="0" stroke="#003080" strokeWidth="0.3" strokeDasharray="2,3" />
    </svg>
  );
}

/* ── Chromatic number ──────────────────────────────────────────── */
function CN({ v }: { v: string | number }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ visibility: "hidden" }}>{v}</span>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
        <span style={{ color: "#ff0033", filter: "blur(0.6px)", transform: "translateX(-0.7px)", position: "absolute" }}>{v}</span>
        <span style={{ color: "#00ffee", filter: "blur(0.6px)", transform: "translateX(0.7px)", position: "absolute" }}>{v}</span>
        <span style={{ color: "inherit", position: "relative" }}>{v}</span>
      </span>
    </span>
  );
}

/* ── Mini sparkbar ─────────────────────────────────────────────── */
function SparkBar({ seed, color }: { seed: number; color: string }) {
  const bars = Array.from({ length: 14 }, (_, i) => 20 + (seedHash(`${seed}-${i}`) % 80));
  return (
    <svg viewBox="0 0 56 24" style={{ width: 56, height: 24 }}>
      {bars.map((h, i) => (
        <rect key={i} x={i * 4} y={24 - h * 0.24} width="3" height={h * 0.24}
          fill={color} opacity={0.3 + (i / bars.length) * 0.7} rx="0.5">
          <animate attributeName="height" values={`${h * 0.24};${h * 0.3};${h * 0.24}`}
            dur={`${1.2 + i * 0.07}s`} repeatCount="indefinite" />
          <animate attributeName="y" values={`${24 - h * 0.24};${24 - h * 0.3};${24 - h * 0.24}`}
            dur={`${1.2 + i * 0.07}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

/* ── Precision metric ──────────────────────────────────────────── */
function PrecisionMetric({ label, value, unit, status }: { label: string; value: string; unit: string; status: "ok" | "warn" | "crit" }) {
  const sc = status === "ok" ? "#00ff88" : status === "warn" ? "#ffd700" : "#ff2d55";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(0,102,255,0.07)" }}>
      <span style={{ fontSize: 9, fontFamily: "monospace", color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', 'Courier New', monospace", fontWeight: 700, color: "#e0e7ff" }}>{value}</span>
        <span style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580" }}>{unit}</span>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: sc, boxShadow: `0 0 4px ${sc}` }}>
        </span>
      </div>
    </div>
  );
}

const CSS = `
  @property --ang-ov {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes spin-ov { to { --ang-ov: 360deg; } }
  @keyframes drift-ov {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(40px, -30px) scale(1.05); }
    66% { transform: translate(-30px, 40px) scale(0.97); }
  }
  @keyframes grid-scroll {
    0% { transform: translateY(0); }
    100% { transform: translateY(40px); }
  }
  @keyframes pulse-ov {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 currentColor; }
    50% { opacity: 0.5; box-shadow: 0 0 0 5px transparent; }
  }
  @keyframes scan-line {
    0% { top: -2px; }
    100% { top: 100%; }
  }
  @keyframes flicker {
    0%, 96%, 100% { opacity: 1; }
    97% { opacity: 0.85; }
    98% { opacity: 1; }
    99% { opacity: 0.9; }
  }
  @keyframes type-in {
    from { width: 0; }
    to { width: 100%; }
  }

  body { background: #000a1a; color: #e0e7ff; }

  .aurora-ov {
    position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  }
  .blob-ov {
    position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.08;
    animation: drift-ov 12s ease-in-out infinite;
  }
  .grid-bg-ov {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(0,102,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,102,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .card-3d-ov {
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.3s ease;
  }
  .card-3d-ov:hover {
    transform: translateY(-3px);
  }
  .card-3d-ov::after {
    content: '';
    position: absolute;
    bottom: -6px; left: 4px; right: 4px;
    height: 6px;
    background: linear-gradient(180deg, rgba(0,50,150,0.5), transparent);
    border-radius: 0 0 4px 4px;
    transform: translateZ(-1px);
    filter: blur(2px);
  }
  .holo-ov {
    position: relative; overflow: hidden;
  }
  .holo-ov::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(0,200,255,0.04) 50%, transparent 70%);
    animation: holo-sweep-ov 4s linear infinite;
    pointer-events: none; z-index: 10;
  }
  @keyframes holo-sweep-ov {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
  .spin-border-ov {
    --ang-ov: 0deg;
    animation: spin-ov 4s linear infinite;
    background: conic-gradient(from var(--ang-ov), #0066ff, #00d9ff, #ffd700, #0066ff);
  }
  .scanline-ov {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0,217,255,0.3), transparent);
    animation: scan-line 3s linear infinite;
    pointer-events: none; z-index: 5;
  }
  .terminal-row-ov {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 16px;
    border-bottom: 1px solid rgba(0,102,255,0.06);
    transition: background 0.15s;
  }
  .terminal-row-ov:hover {
    background: rgba(0,102,255,0.05);
  }
  .flicker-ov { animation: flicker 8s ease-in-out infinite; }
`;

/* ═══════════════════════════════════════════════════════════════ */
export default async function DashboardHome() {
  const user = (await getCurrentUser())!;

  const [agents, recentRuns, totals, allCount] = await Promise.all([
    prisma.agent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.run.findMany({
      where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12, include: { agent: true },
    }),
    prisma.run.aggregate({
      where: { userId: user.id, status: "COMPLETED" },
      _sum: { tokensIn: true, tokensOut: true, costCents: true }, _count: true,
    }),
    prisma.run.count({ where: { userId: user.id } }),
  ]);

  const failedCount = await prisma.run.count({ where: { userId: user.id, status: "FAILED" } });

  const limits       = PLAN_LIMITS[toPlanKey(user.plan)];
  const displayName  = user.name || user.email.split("@")[0];
  const initials     = displayName.slice(0, 2).toUpperCase();
  const totalCost    = totals._sum.costCents ?? 0;
  const successCount = totals._count ?? 0;
  const seed         = seedHash(user.id);
  const isPro        = user.plan !== "FREE";
  const runsUsed     = user.runsUsedThisPeriod ?? 0;
  const pct          = Math.min((runsUsed / limits.monthlyRuns) * 100, 100);
  const successRate  = allCount > 0 ? ((successCount / allCount) * 100).toFixed(3) : "0.000";
  const agentStubs   = agents.map(a => ({ id: a.id, name: a.name, role: a.role }));

  const STAT_CARDS = [
    {
      id: "ASSET-001", label: "Active Assets", value: agents.length,
      max: limits.agents, unit: "units", color: "#0066ff", seed: seed,
      sublabel: `${limits.agents - agents.length} slots remaining`,
      precision: `${agents.length}.000`, href: "/dashboard/agents",
    },
    {
      id: "EXEC-002", label: "Executions", value: successCount,
      max: null, unit: "ops", color: "#00d9ff", seed: seed + 1,
      sublabel: `${failedCount} failed // ${allCount} total`,
      precision: `${successCount}.000`, href: "/dashboard/runs",
    },
    {
      id: "THRP-003", label: "Period Throughput", value: runsUsed,
      max: limits.monthlyRuns, unit: "runs", color: "#ffd700", seed: seed + 2,
      sublabel: `${(pct).toFixed(2)}% capacity utilized`,
      precision: `${runsUsed}.000`, href: "/dashboard/runs",
    },
    {
      id: "COST-004", label: "Capital Deployed", value: `$${(totalCost / 100).toFixed(2)}`,
      max: null, unit: "USD", color: "#00ff88", seed: seed + 3,
      sublabel: `Efficiency: ${successRate}% SR`,
      precision: `${(totalCost / 100).toFixed(6)}`, href: "/dashboard/billing",
    },
  ];

  const AGENT_COLORS = ["#0066ff", "#00d9ff", "#ffd700", "#00ff88", "#ff6b35", "#c084fc"];

  const statusColors: Record<string, string> = {
    COMPLETED: "#00ff88", FAILED: "#ff2d55", RUNNING: "#ffd700", PENDING: "#6366f1",
  };

  return (
    <>
      <CommandPalette agents={agentStubs} />
      <AiAssistant />

      <style>{CSS}</style>

      {/* Background */}
      <div className="aurora-ov">
        <div className="blob-ov" style={{ width: 600, height: 600, background: "radial-gradient(circle, #0066ff, transparent)", top: -200, left: -100, animationDelay: "0s" }} />
        <div className="blob-ov" style={{ width: 500, height: 500, background: "radial-gradient(circle, #003580, transparent)", bottom: -100, right: -100, animationDelay: "-5s" }} />
        <div className="blob-ov" style={{ width: 300, height: 300, background: "radial-gradient(circle, #ffd70022, transparent)", top: "40%", left: "50%", animationDelay: "-9s" }} />
      </div>
      <div className="grid-bg-ov" />

      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh" }}>

        {/* ── SYSTEM HEADER BAR ──────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 0", marginBottom: 20,
          borderBottom: "1px solid rgba(0,102,255,0.15)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Orbital avatar */}
            <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", animation: "spin-ov 8s linear infinite" }}>
                <defs>
                  <style>{`@keyframes spin-ov { to { --ang-ov: 360deg; } }`}</style>
                </defs>
                <circle cx="22" cy="22" r="19" fill="none"
                  stroke="#0066ff" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
              </svg>
              <div style={{
                position: "absolute", inset: 4,
                background: "linear-gradient(135deg, #0066ff88, #00d9ff44)",
                border: "1px solid #0066ff66",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900, color: "#e0e7ff",
                fontFamily: "monospace",
              }}>{initials}</div>
              <div style={{
                position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                width: 5, height: 5, borderRadius: "50%",
                background: "#ffd700", boxShadow: "0 0 6px #ffd700",
              }} />
            </div>

            <div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                OPERATOR // {user.email}
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#e0e7ff", letterSpacing: "-0.3px", fontFamily: "'JetBrains Mono', monospace" }}>
                {displayName.toUpperCase()}
              </div>
              <div style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.08em" }}>
                PLAN: <span style={{ color: isPro ? "#ffd700" : "#4a5580" }}>{user.plan}</span>
                {" "}&nbsp;&bull;&nbsp;{" "}
                CLEARANCE: <span style={{ color: isPro ? "#00ff88" : "#ffd700" }}>{isPro ? "ELEVATED" : "STANDARD"}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* System status */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 4,
              background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)",
              fontFamily: "monospace", fontSize: 9, letterSpacing: "0.12em",
              color: "#00ff88", textTransform: "uppercase",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88", display: "inline-block", animation: "pulse-ov 2s ease infinite" }} />
              SYSTEMS NOMINAL
            </div>

            {/* UTC clock label */}
            <div style={{
              padding: "6px 12px", borderRadius: 4,
              background: "rgba(0,102,255,0.06)", border: "1px solid rgba(0,102,255,0.12)",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: "0.1em",
              color: "#4a5580",
            }}>
              UTC {new Date().toISOString().replace("T", " ").slice(0, 19)}
            </div>

            <Link href="/dashboard/agents" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 16px", borderRadius: 4,
              background: "linear-gradient(135deg, #0055cc, #003399)",
              border: "1px solid rgba(0,102,255,0.4)",
              color: "#e0e7ff", fontSize: 10, fontWeight: 700,
              fontFamily: "monospace", letterSpacing: "0.1em",
              textDecoration: "none", textTransform: "uppercase",
              boxShadow: "0 0 16px rgba(0,102,255,0.25)",
            }}>
              + DEPLOY ASSET
            </Link>
          </div>
        </div>

        {/* ── HERO: SPHERE + KPI STRIP ────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 24, marginBottom: 24, alignItems: "center" }}>

          {/* 3D Sphere */}
          <div style={{ position: "relative", width: 160, height: 160 }}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, rgba(0,102,255,0.12), transparent 70%)",
              boxShadow: "0 0 40px rgba(0,102,255,0.15), inset 0 0 40px rgba(0,0,0,0.5)",
              border: "1px solid rgba(0,102,255,0.2)",
            }} />
            <WireframeSphere />
            {/* Label */}
            <div style={{
              position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)",
              fontFamily: "monospace", fontSize: 8, color: "#4a5580", letterSpacing: "0.12em",
              textTransform: "uppercase", whiteSpace: "nowrap",
            }}>AETHER-NET // {agents.length} NODE{agents.length !== 1 ? "S" : ""} ACTIVE</div>
          </div>

          {/* KPI strip - 4 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {STAT_CARDS.map((s) => (
              <Link key={s.id} href={s.href} style={{ textDecoration: "none" }}>
                <div className="card-3d-ov holo-ov" style={{
                  background: "rgba(0,10,30,0.85)",
                  border: `1px solid ${s.color}33`,
                  borderRadius: 6,
                  padding: "14px 14px 12px",
                  backdropFilter: "blur(20px)",
                  boxShadow: `0 0 24px ${s.color}11, inset 0 1px 0 ${s.color}22`,
                  position: "relative", overflow: "hidden",
                }}>
                  <div className="scanline-ov" />

                  {/* ID badge */}
                  <div style={{
                    position: "absolute", top: 6, right: 8,
                    fontFamily: "monospace", fontSize: 7, color: `${s.color}88`,
                    letterSpacing: "0.1em",
                  }}>{s.id}</div>

                  {/* Accent bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />

                  <div style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
                    {s.label}
                  </div>

                  <div style={{
                    fontSize: 26, fontWeight: 900, color: "#e0e7ff",
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                    lineHeight: 1, marginBottom: 6,
                    textShadow: `0 0 20px ${s.color}66`,
                  }}>
                    <CN v={s.value} />
                  </div>

                  <div style={{ fontSize: 8, fontFamily: "monospace", color: `${s.color}bb`, marginBottom: 8, letterSpacing: "0.06em" }}>
                    {s.sublabel}
                  </div>

                  <SparkBar seed={s.seed} color={s.color} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 3D PERSPECTIVE METRIC ROW ───────────────────────────── */}
        <div style={{
          perspective: "800px",
          perspectiveOrigin: "50% -50%",
          marginBottom: 24,
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 8,
            transform: "rotateX(18deg) scale(0.98)",
            transformOrigin: "50% 0%",
            transformStyle: "preserve-3d",
          }}>
            {[
              { label: "Success Rate", value: successRate, unit: "%", status: parseFloat(successRate) > 80 ? "ok" as const : "warn" as const },
              { label: "Agents Deployed", value: agents.length.toString(), unit: "units", status: "ok" as const },
              { label: "Period Usage", value: pct.toFixed(2), unit: "%", status: pct > 80 ? "crit" as const : pct > 60 ? "warn" as const : "ok" as const },
              { label: "Capital Deployed", value: (totalCost / 100).toFixed(4), unit: "USD", status: "ok" as const },
              { label: "Total Ops", value: allCount.toString(), unit: "ops", status: "ok" as const },
              { label: "Failed Ops", value: failedCount.toString(), unit: "ops", status: failedCount > 0 ? "warn" as const : "ok" as const },
            ].map((m, i) => {
              const sc = m.status === "ok" ? "#00ff88" : m.status === "warn" ? "#ffd700" : "#ff2d55";
              return (
                <div key={i} style={{
                  background: "rgba(0,8,24,0.9)",
                  border: `1px solid ${sc}22`,
                  borderRadius: 4,
                  padding: "10px 12px",
                  backdropFilter: "blur(20px)",
                  boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${sc}08`,
                  transformStyle: "preserve-3d",
                  transform: `translateZ(${4 - i * 0.5}px)`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.12em" }}>{m.label}</span>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: sc, boxShadow: `0 0 4px ${sc}` }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#e0e7ff", lineHeight: 1 }}>
                    {m.value}
                    <span style={{ fontSize: 8, color: "#4a5580", marginLeft: 3 }}>{m.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MAIN GRID ───────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>

          {/* ── EXECUTION LOG (left) ──────────────────────────────── */}
          <div className="holo-ov" style={{
            background: "rgba(0,8,24,0.85)",
            border: "1px solid rgba(0,102,255,0.15)",
            borderRadius: 6,
            overflow: "hidden",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 40px rgba(0,0,0,0.5)",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px",
              borderBottom: "1px solid rgba(0,102,255,0.12)",
              background: "rgba(0,20,60,0.4)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88", animation: "pulse-ov 2s ease infinite" }} />
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "#e0e7ff", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
                  EXECUTION LOG
                </span>
                <span style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580", padding: "1px 6px", border: "1px solid rgba(0,102,255,0.15)", borderRadius: 2 }}>
                  {allCount} TOTAL
                </span>
              </div>
              <Link href="/dashboard/runs" style={{
                fontSize: 8, fontFamily: "monospace", color: "#0066ff",
                textDecoration: "none", letterSpacing: "0.1em",
                padding: "4px 10px", border: "1px solid rgba(0,102,255,0.2)", borderRadius: 2,
              }}>
                VIEW ALL ›
              </Link>
            </div>

            {/* Column headers */}
            <div style={{
              display: "grid", gridTemplateColumns: "80px 1fr 90px 80px 70px",
              gap: 0, padding: "5px 16px",
              borderBottom: "1px solid rgba(0,102,255,0.08)",
              background: "rgba(0,20,60,0.2)",
            }}>
              {["TIMESTAMP", "ASSET", "STATUS", "DURATION", "COST"].map(h => (
                <span key={h} style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", textTransform: "uppercase", letterSpacing: "0.12em" }}>{h}</span>
              ))}
            </div>

            {recentRuns.length === 0 ? (
              <div style={{ padding: "40px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: "#4a5580", letterSpacing: "0.15em" }}>NO EXECUTION RECORDS</div>
                <div style={{ fontFamily: "monospace", fontSize: 8, color: "#2a3560", marginTop: 6 }}>DEPLOY AN ASSET TO BEGIN OPERATIONS</div>
              </div>
            ) : recentRuns.map((r, i) => {
              const sc = statusColors[(r as any).status] || "#4a5580";
              const dur = (r as any).durationMs ? `${Math.round((r as any).durationMs / 1000)}s` : "—";
              const cost = (r as any).costCents ? `$${((r as any).costCents / 100).toFixed(4)}` : "—";
              const ts = new Date((r as any).createdAt).toISOString().slice(11, 19);
              const agentName = ((r as any).agent?.name || "UNKNOWN").slice(0, 12).toUpperCase();
              return (
                <div key={(r as any).id} className="terminal-row-ov" style={{
                  display: "grid", gridTemplateColumns: "80px 1fr 90px 80px 70px",
                  alignItems: "center", gap: 0,
                  opacity: 1 - i * 0.04,
                }}>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#4a5580" }}>{ts}</span>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#e0e7ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {agentName}
                  </span>
                  <span style={{ fontSize: 8, fontFamily: "monospace", color: sc, letterSpacing: "0.08em" }}>
                    {((r as any).status || "UNKNOWN").toUpperCase()}
                  </span>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#4a5580" }}>{dur}</span>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "#4a5580" }}>{cost}</span>
                </div>
              );
            })}
          </div>

          {/* ── RIGHT COLUMN ─────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Asset Registry */}
            <div className="holo-ov" style={{
              background: "rgba(0,8,24,0.85)",
              border: "1px solid rgba(0,102,255,0.15)",
              borderRadius: 6, overflow: "hidden",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", borderBottom: "1px solid rgba(0,102,255,0.1)",
                background: "rgba(0,20,60,0.3)",
              }}>
                <span style={{ fontSize: 9, fontFamily: "monospace", color: "#e0e7ff", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>ASSET REGISTRY</span>
                <Link href="/dashboard/agents" style={{ fontSize: 7, fontFamily: "monospace", color: "#0066ff", textDecoration: "none", letterSpacing: "0.1em" }}>VIEW ALL</Link>
              </div>

              {agents.length === 0 ? (
                <div style={{ padding: "20px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "monospace", fontSize: 9, color: "#4a5580" }}>NO ASSETS REGISTERED</div>
                  <Link href="/dashboard/agents" style={{ fontSize: 9, fontFamily: "monospace", color: "#0066ff", textDecoration: "none", display: "block", marginTop: 8 }}>+ REGISTER FIRST ASSET</Link>
                </div>
              ) : agents.map((a, i) => {
                const col = AGENT_COLORS[i % AGENT_COLORS.length];
                const assetId = `AST-${String(i + 1).padStart(3, "0")}`;
                return (
                  <Link key={a.id} href={`/dashboard/agents/${a.id}`} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 14px",
                    borderBottom: "1px solid rgba(0,102,255,0.06)",
                    textDecoration: "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,102,255,0.06)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    {/* 3D Avatar */}
                    <div style={{
                      position: "relative", width: 32, height: 32, flexShrink: 0,
                      transformStyle: "preserve-3d",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 4,
                        background: `linear-gradient(135deg, ${col}44, ${col}22)`,
                        border: `1px solid ${col}66`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 900, color: col,
                        fontFamily: "monospace",
                        boxShadow: `0 4px 8px rgba(0,0,0,0.5), 0 0 10px ${col}22`,
                      }}>{a.name[0].toUpperCase()}</div>
                      {/* depth face */}
                      <div style={{
                        position: "absolute", bottom: -3, left: 2, right: 2, height: 3,
                        background: `${col}33`, borderRadius: "0 0 2px 2px",
                        filter: "blur(1px)",
                      }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: "#e0e7ff", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.name}
                      </div>
                      <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {assetId} // {(a.role || "AGENT").toUpperCase().slice(0, 20)}
                      </div>
                    </div>

                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: col, boxShadow: `0 0 5px ${col}`, flexShrink: 0 }} />
                  </Link>
                );
              })}
            </div>

            {/* System Telemetry */}
            <div style={{
              background: "rgba(0,8,24,0.85)",
              border: "1px solid rgba(0,102,255,0.15)",
              borderRadius: 6, padding: "10px 14px",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#e0e7ff", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
                SYSTEM TELEMETRY
              </div>
              <PrecisionMetric label="Agent Capacity" value={`${agents.length}/${limits.agents}`} unit="units" status={agents.length >= limits.agents ? "warn" : "ok"} />
              <PrecisionMetric label="Period Utilization" value={`${pct.toFixed(3)}`} unit="%" status={pct > 80 ? "crit" : pct > 60 ? "warn" : "ok"} />
              <PrecisionMetric label="Success Rate" value={successRate} unit="%" status={parseFloat(successRate) > 80 ? "ok" : "warn"} />
              <PrecisionMetric label="Total Operations" value={allCount.toString()} unit="ops" status="ok" />
              <PrecisionMetric label="Failed Operations" value={failedCount.toString()} unit="ops" status={failedCount > 0 ? "warn" : "ok"} />
              <PrecisionMetric label="Capital Deployed" value={`${(totalCost / 100).toFixed(4)}`} unit="USD" status="ok" />

              {/* Usage bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.1em", textTransform: "uppercase" }}>PERIOD QUOTA</span>
                  <span style={{ fontSize: 7, fontFamily: "monospace", color: "#e0e7ff" }}>{pct.toFixed(1)}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(0,102,255,0.1)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${pct}%`, borderRadius: 2,
                    background: pct > 80 ? "#ff2d55" : pct > 60 ? "#ffd700" : "#0066ff",
                    boxShadow: `0 0 6px ${pct > 80 ? "#ff2d55" : "#0066ff"}`,
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            </div>

            {/* Plan status */}
            <div style={{
              background: isPro ? "rgba(0,20,60,0.6)" : "rgba(10,8,0,0.6)",
              border: `1px solid ${isPro ? "rgba(0,102,255,0.25)" : "rgba(255,215,0,0.2)"}`,
              borderRadius: 6, padding: "12px 14px",
              backdropFilter: "blur(20px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase" }}>AUTHORIZATION LEVEL</span>
                <span style={{
                  fontSize: 8, fontFamily: "monospace", fontWeight: 700,
                  color: isPro ? "#0066ff" : "#ffd700",
                  padding: "2px 8px", borderRadius: 2,
                  background: isPro ? "rgba(0,102,255,0.12)" : "rgba(255,215,0,0.1)",
                  border: `1px solid ${isPro ? "rgba(0,102,255,0.2)" : "rgba(255,215,0,0.15)"}`,
                  letterSpacing: "0.1em",
                }}>{user.plan}</span>
              </div>
              {!isPro && (
                <Link href="/dashboard/billing" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "100%", padding: "8px 0",
                  background: "linear-gradient(135deg, #0055cc, #003399)",
                  border: "1px solid rgba(0,102,255,0.3)",
                  borderRadius: 4, color: "#e0e7ff",
                  fontSize: 9, fontFamily: "monospace", fontWeight: 700,
                  letterSpacing: "0.15em", textDecoration: "none", textTransform: "uppercase",
                  boxShadow: "0 0 16px rgba(0,102,255,0.2)",
                }}>
                  REQUEST ELEVATION ›
                </Link>
              )}
              {isPro && (
                <div style={{ fontSize: 8, fontFamily: "monospace", color: "#0066ff", letterSpacing: "0.1em", textAlign: "center" }}>
                  ELEVATED CLEARANCE ACTIVE
                </div>
              )}
            </div>

            {/* Quick navigation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { href: "/dashboard/agents",    label: "ASSETS",    color: "#0066ff" },
                { href: "/dashboard/campaigns", label: "OPS",       color: "#ffd700" },
                { href: "/dashboard/social",    label: "SIGNALS",   color: "#00d9ff" },
                { href: "/dashboard/settings",  label: "CONFIG",    color: "#00ff88" },
              ].map(n => (
                <Link key={n.href} href={n.href} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "8px 0",
                  background: `${n.color}08`,
                  border: `1px solid ${n.color}22`,
                  borderRadius: 4, color: n.color,
                  fontSize: 8, fontFamily: "monospace", fontWeight: 700,
                  letterSpacing: "0.15em", textDecoration: "none",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${n.color}15`; e.currentTarget.style.boxShadow = `0 0 10px ${n.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.background = `${n.color}08`; e.currentTarget.style.boxShadow = "none"; }}>
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER STATUS BAR ───────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 20, padding: "8px 0",
          borderTop: "1px solid rgba(0,102,255,0.08)",
          fontFamily: "monospace",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {["CORE: NOMINAL", "DB: CONNECTED", "AI: ACTIVE", "NET: ONLINE"].map((s, i) => {
              const col = "#00ff88";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 7, color: "#4a5580", letterSpacing: "0.1em" }}>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: col, boxShadow: `0 0 3px ${col}` }} />
                  {s}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 7, color: "#2a3560", letterSpacing: "0.12em" }}>
            AETHER COMMAND CENTER // BUILD {new Date().toISOString().slice(0, 10).replace(/-/g, "")}
          </div>
        </div>

      </div>
    </>
  );
}
