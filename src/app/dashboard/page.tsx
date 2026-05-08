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

function WireframeSphere() {
  const meridians = [0, 30, 60, 90, 120, 150];
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full">
      <defs>
        <radialGradient id="sphGlow" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#0066ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <filter id="sphBloom" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="0" cy="0" r="42" fill="url(#sphGlow)" />
      <circle cx="0" cy="0" r="42" fill="none" stroke="#0066ff" strokeWidth="0.5" opacity="0.5" />
      {[0, -14, -26, -35, 14, 26, 35].map((y, i) => {
        const rx = Math.sqrt(Math.max(0, 42 * 42 - y * y));
        return <ellipse key={i} cx="0" cy={y} rx={rx} ry={rx * 0.28}
          fill="none" stroke="#00d9ff" strokeWidth="0.35" opacity={0.8 - Math.abs(y) / 60}
          filter="url(#sphBloom)" />;
      })}
      {meridians.map((a, i) => {
        const r = (a * Math.PI) / 180;
        return <line key={i} x1={Math.sin(r) * 42} y1={-42} x2={-Math.sin(r) * 42} y2={42}
          stroke="#003580" strokeWidth="0.25" opacity="0.5"
          strokeDasharray={i % 2 === 0 ? "none" : "1,2"} />;
      })}
      {[[-20, -18], [15, -28], [28, 5], [-8, 30], [35, -10]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.5" fill="#ffd700" opacity="0.9">
            <animate attributeName="r" values="1.5;2.2;1.5" dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={x} cy={y} r="3.5" fill="none" stroke="#ffd700" strokeWidth="0.3" opacity="0.25">
            <animate attributeName="r" values="2;4.5;2" dur={`${1.6 + i * 0.4}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
      <line x1="0" y1="-44" x2="0" y2="44" stroke="#002060" strokeWidth="0.3" strokeDasharray="2,3" />
      <line x1="-44" y1="0" x2="44" y2="0" stroke="#002060" strokeWidth="0.3" strokeDasharray="2,3" />
    </svg>
  );
}

function CN({ v }: { v: string | number }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ visibility: "hidden" }}>{v}</span>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
        <span style={{ color: "#ff0033", filter: "blur(0.6px)", transform: "translateX(-0.7px)", position: "absolute" }}>{v}</span>
        <span style={{ color: "#00ffee", filter: "blur(0.6px)", transform: "translateX(0.7px)", position: "absolute" }}>{v}</span>
        <span style={{ color: "inherit", position: "relative" }}>{v}</span>
      </span>
    </span>
  );
}

function SparkBar({ seed, color }: { seed: number; color: string }) {
  const bars = Array.from({ length: 14 }, (_, i) => 20 + (seedHash(`${seed}-${i}`) % 80));
  return (
    <svg viewBox="0 0 56 24" style={{ width: 56, height: 24 }}>
      {bars.map((h, i) => (
        <rect key={i} x={i * 4} y={24 - h * 0.24} width="3" height={h * 0.24}
          fill={color} opacity={0.25 + (i / bars.length) * 0.75} rx="0.5">
          <animate attributeName="height" values={`${h * 0.24};${h * 0.32};${h * 0.24}`}
            dur={`${1.3 + i * 0.07}s`} repeatCount="indefinite" />
          <animate attributeName="y" values={`${24 - h * 0.24};${24 - h * 0.32};${24 - h * 0.24}`}
            dur={`${1.3 + i * 0.07}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

const CSS = `
  @property --ang-ov { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
  @keyframes spin-ov { to { --ang-ov: 360deg; } }
  @keyframes drift-ov {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(40px,-30px) scale(1.05); }
    66% { transform: translate(-30px,40px) scale(0.96); }
  }
  @keyframes scan-ov { 0% { top:-2px; } 100% { top:100%; } }
  @keyframes pulse-ov { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes holo-ov { 0%{transform:translateX(-100%);} 100%{transform:translateX(250%);} }

  .ov-wrap { position:relative; }
  .ov-aurora {
    position:absolute; inset:0; pointer-events:none; z-index:0; overflow:hidden; border-radius:inherit;
  }
  .ov-blob {
    position:absolute; border-radius:50%; filter:blur(80px); opacity:0.1;
    animation: drift-ov 12s ease-in-out infinite;
  }
  .ov-grid {
    position:absolute; inset:0; pointer-events:none; z-index:0;
    background-image:
      linear-gradient(rgba(0,102,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,102,255,0.05) 1px, transparent 1px);
    background-size:40px 40px;
  }
  .ov-card {
    position:relative; overflow:hidden;
    transition:transform 0.25s ease, box-shadow 0.25s ease;
    border-radius:6px;
  }
  .ov-card:hover { transform:translateY(-3px); }
  .ov-card::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(105deg,transparent 30%,rgba(0,180,255,0.04) 50%,transparent 70%);
    animation:holo-ov 5s linear infinite;
    pointer-events:none; z-index:5;
  }
  .ov-scanline {
    position:absolute; left:0; right:0; height:2px;
    background:linear-gradient(90deg,transparent,rgba(0,217,255,0.25),transparent);
    animation:scan-ov 4s linear infinite;
    pointer-events:none; z-index:4;
  }
  .ov-metric {
    transition:background 0.15s;
  }
  .ov-metric:hover { background:rgba(0,102,255,0.06) !important; }
  .ov-nav:hover {
    background:rgba(0,102,255,0.12) !important;
    box-shadow:0 0 10px rgba(0,102,255,0.15) !important;
  }
  .ov-agentrow:hover { background:rgba(0,102,255,0.06) !important; }
  .ov-spin {
    --ang-ov:0deg; animation:spin-ov 4s linear infinite;
    background:conic-gradient(from var(--ang-ov),#0066ff,#00d9ff,#ffd700,#0066ff);
    border-radius:5px; padding:1px;
  }
`;

export default async function DashboardHome() {
  const user = (await getCurrentUser())!;

  const [agents, recentRuns, successAgg, allCount] = await Promise.all([
    prisma.agent.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.run.findMany({
      where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 12,
      include: { agent: true },
    }),
    prisma.run.aggregate({
      where: { userId: user.id, status: "success" },
      _sum: { tokensIn: true, tokensOut: true, costCents: true }, _count: true,
    }),
    prisma.run.count({ where: { userId: user.id } }),
  ]);

  const failedCount  = await prisma.run.count({ where: { userId: user.id, status: "failed" } });
  const limits       = PLAN_LIMITS[toPlanKey(user.plan)];
  const displayName  = user.name || user.email.split("@")[0];
  const initials     = displayName.slice(0, 2).toUpperCase();
  const totalCost    = successAgg._sum.costCents ?? 0;
  const successCount = successAgg._count ?? 0;
  const seed         = seedHash(user.id);
  const isPro        = user.plan !== "FREE";
  const runsUsed     = user.runsUsedThisPeriod ?? 0;
  const pct          = Math.min((runsUsed / limits.monthlyRuns) * 100, 100);
  const successRate  = allCount > 0 ? ((successCount / allCount) * 100).toFixed(3) : "0.000";
  const agentStubs   = agents.map(a => ({ id: a.id, name: a.name, role: a.role }));

  const STAT_CARDS = [
    { id: "ASSET-001", label: "Active Assets",      value: agents.length,                      color: "#0066ff", seed,     sublabel: `${limits.agents - agents.length} slots free`,      href: "/dashboard/agents"  },
    { id: "EXEC-002",  label: "Successful Ops",     value: successCount,                        color: "#00d9ff", seed: seed+1, sublabel: `${failedCount} failed // ${allCount} total`,  href: "/dashboard/runs"    },
    { id: "THRP-003",  label: "Period Throughput",  value: runsUsed,                            color: "#ffd700", seed: seed+2, sublabel: `${pct.toFixed(2)}% capacity`,                  href: "/dashboard/runs"    },
    { id: "COST-004",  label: "Capital Deployed",   value: `$${(totalCost/100).toFixed(2)}`,    color: "#00ff88", seed: seed+3, sublabel: `${successRate}% success rate`,                 href: "/dashboard/billing" },
  ];

  const AGENT_COLORS = ["#0066ff","#00d9ff","#ffd700","#00ff88","#ff6b35","#c084fc"];

  const STATUS_COLORS: Record<string, string> = {
    success: "#00ff88", failed: "#ff2d55", running: "#ffd700", pending: "#6366f1",
  };

  return (
    <>
      <CommandPalette agents={agentStubs} />
      <AiAssistant />
      <style>{CSS}</style>

      <div className="ov-wrap" style={{ minHeight: "100vh", background: "#000a1a" }}>
        {/* Contained background — does NOT escape the content area */}
        <div className="ov-aurora">
          <div className="ov-blob" style={{ width:500, height:500, background:"radial-gradient(circle,#0066ff,transparent)", top:-150, left:-100, animationDelay:"0s" }} />
          <div className="ov-blob" style={{ width:400, height:400, background:"radial-gradient(circle,#003580,transparent)", bottom:-100, right:-50, animationDelay:"-6s" }} />
          <div className="ov-blob" style={{ width:250, height:250, background:"radial-gradient(circle,#ffd70015,transparent)", top:"40%", left:"50%", animationDelay:"-10s" }} />
        </div>
        <div className="ov-grid" />

        <div style={{ position:"relative", zIndex:10 }}>

          {/* ── SYSTEM HEADER ────────────────────────────────── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:20, marginBottom:20, borderBottom:"1px solid rgba(0,102,255,0.12)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              {/* Orbital avatar */}
              <div style={{ position:"relative", width:44, height:44, flexShrink:0 }}>
                <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
                  <circle cx="22" cy="22" r="19" fill="none" stroke="#0066ff" strokeWidth="1" strokeDasharray="4,3" opacity="0.4">
                    <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="8s" repeatCount="indefinite" />
                  </circle>
                </svg>
                <div style={{ position:"absolute", inset:5, background:"linear-gradient(135deg,#0066ff88,#00d9ff44)", border:"1px solid #0066ff55", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#e0e7ff", fontFamily:"monospace" }}>{initials}</div>
                <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:5, height:5, borderRadius:"50%", background:"#ffd700", boxShadow:"0 0 6px #ffd700" }} />
              </div>
              <div>
                <div style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase" }}>OPERATOR // {user.email}</div>
                <div style={{ fontSize:16, fontWeight:900, color:"#e0e7ff", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"-0.3px" }}>{displayName.toUpperCase()}</div>
                <div style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580" }}>
                  PLAN: <span style={{ color: isPro?"#ffd700":"#4a5580" }}>{user.plan}</span>
                  &nbsp;&bull;&nbsp;
                  CLEARANCE: <span style={{ color: isPro?"#00ff88":"#ffd700" }}>{isPro?"ELEVATED":"STANDARD"}</span>
                </div>
              </div>
            </div>

            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:4, background:"rgba(0,255,136,0.06)", border:"1px solid rgba(0,255,136,0.15)", fontFamily:"monospace", fontSize:9, letterSpacing:"0.12em", color:"#00ff88" }}>
                <span style={{ width:5, height:5, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 6px #00ff88", display:"inline-block", animation:"pulse-ov 2s ease infinite" }} />
                SYSTEMS NOMINAL
              </div>
              <div style={{ padding:"6px 12px", borderRadius:4, background:"rgba(0,102,255,0.06)", border:"1px solid rgba(0,102,255,0.12)", fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:"0.08em", color:"#4a5580" }}>
                {new Date().toISOString().replace("T"," ").slice(0,16)} UTC
              </div>
              <Link href="/dashboard/agents" style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 16px", borderRadius:4, background:"linear-gradient(135deg,#0055cc,#003399)", border:"1px solid rgba(0,102,255,0.35)", color:"#e0e7ff", fontSize:10, fontWeight:700, fontFamily:"monospace", letterSpacing:"0.1em", textDecoration:"none", boxShadow:"0 0 16px rgba(0,102,255,0.2)", textTransform:"uppercase" }}>
                + DEPLOY ASSET
              </Link>
            </div>
          </div>

          {/* ── HERO: SPHERE + KPI GRID ──────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:24, marginBottom:24, alignItems:"center" }}>
            {/* Sphere */}
            <div style={{ position:"relative", width:160, height:160 }}>
              <div style={{ position:"absolute", inset:0, borderRadius:"50%", background:"radial-gradient(circle at 35% 35%,rgba(0,102,255,0.1),transparent 70%)", border:"1px solid rgba(0,102,255,0.18)" }} />
              <WireframeSphere />
              <div style={{ position:"absolute", bottom:-20, left:"50%", transform:"translateX(-50%)", fontFamily:"monospace", fontSize:8, color:"#4a5580", letterSpacing:"0.1em", textTransform:"uppercase", whiteSpace:"nowrap" }}>
                AETHER-NET // {agents.length} NODE{agents.length!==1?"S":""} ACTIVE
              </div>
            </div>

            {/* KPI cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
              {STAT_CARDS.map(s => (
                <Link key={s.id} href={s.href} style={{ textDecoration:"none" }}>
                  <div className="ov-card" style={{ background:"rgba(0,10,30,0.88)", border:`1px solid ${s.color}30`, padding:"14px 14px 12px", backdropFilter:"blur(20px)", boxShadow:`0 0 24px ${s.color}0d,inset 0 1px 0 ${s.color}20` }}>
                    <div className="ov-scanline" />
                    <div style={{ position:"absolute", top:6, right:8, fontSize:7, fontFamily:"monospace", color:`${s.color}77`, letterSpacing:"0.1em" }}>{s.id}</div>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${s.color},transparent)` }} />
                    <div style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:8 }}>{s.label}</div>
                    <div style={{ fontSize:26, fontWeight:900, color:"#e0e7ff", fontFamily:"'JetBrains Mono','Courier New',monospace", lineHeight:1, marginBottom:6, textShadow:`0 0 20px ${s.color}55` }}>
                      <CN v={s.value} />
                    </div>
                    <div style={{ fontSize:8, fontFamily:"monospace", color:`${s.color}aa`, marginBottom:8, letterSpacing:"0.05em" }}>{s.sublabel}</div>
                    <SparkBar seed={s.seed} color={s.color} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── 3D PERSPECTIVE METRIC STRIP ──────────────────── */}
          <div style={{ perspective:"800px", perspectiveOrigin:"50% -50%", marginBottom:24 }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8, transform:"rotateX(16deg) scale(0.98)", transformOrigin:"50% 0%", transformStyle:"preserve-3d" }}>
              {[
                { label:"Success Rate",     value:successRate,                  unit:"%",    ok: parseFloat(successRate)>80 },
                { label:"Assets Deployed",  value:String(agents.length),        unit:"units", ok:true },
                { label:"Period Quota",     value:pct.toFixed(2),               unit:"%",    ok: pct<80 },
                { label:"Capital",          value:`$${(totalCost/100).toFixed(2)}`, unit:"USD", ok:true },
                { label:"Total Ops",        value:String(allCount),             unit:"ops",  ok:true },
                { label:"Failed Ops",       value:String(failedCount),          unit:"ops",  ok: failedCount===0 },
              ].map((m, i) => {
                const sc = m.ok ? "#00ff88" : "#ffd700";
                return (
                  <div key={i} style={{ background:"rgba(0,8,24,0.92)", border:`1px solid ${sc}18`, borderRadius:4, padding:"10px 12px", backdropFilter:"blur(20px)", boxShadow:`0 8px 24px rgba(0,0,0,0.5),0 0 12px ${sc}06` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", textTransform:"uppercase", letterSpacing:"0.12em" }}>{m.label}</span>
                      <span style={{ width:4, height:4, borderRadius:"50%", background:sc, boxShadow:`0 0 4px ${sc}` }} />
                    </div>
                    <div style={{ fontSize:15, fontWeight:900, fontFamily:"'JetBrains Mono',monospace", color:"#e0e7ff", lineHeight:1 }}>
                      {m.value}<span style={{ fontSize:8, color:"#4a5580", marginLeft:3 }}>{m.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── MAIN GRID ────────────────────────────────────── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16 }}>

            {/* EXECUTION LOG */}
            <div style={{ background:"rgba(0,8,24,0.88)", border:"1px solid rgba(0,102,255,0.14)", borderRadius:6, overflow:"hidden", backdropFilter:"blur(20px)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:"1px solid rgba(0,102,255,0.1)", background:"rgba(0,20,60,0.35)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 7px #00ff88", display:"inline-block", animation:"pulse-ov 2s ease infinite" }} />
                  <span style={{ fontSize:10, fontFamily:"monospace", color:"#e0e7ff", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:700 }}>EXECUTION LOG</span>
                  <span style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580", padding:"1px 6px", border:"1px solid rgba(0,102,255,0.14)", borderRadius:2 }}>{allCount} TOTAL</span>
                </div>
                <Link href="/dashboard/runs" style={{ fontSize:8, fontFamily:"monospace", color:"#0066ff", textDecoration:"none", letterSpacing:"0.1em", padding:"4px 10px", border:"1px solid rgba(0,102,255,0.18)", borderRadius:2 }}>VIEW ALL ›</Link>
              </div>

              {/* Column headers */}
              <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 90px 70px", gap:0, padding:"5px 16px", borderBottom:"1px solid rgba(0,102,255,0.06)", background:"rgba(0,20,60,0.15)" }}>
                {["TIMESTAMP","ASSET","STATUS","COST"].map(h => (
                  <span key={h} style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", textTransform:"uppercase", letterSpacing:"0.12em" }}>{h}</span>
                ))}
              </div>

              {recentRuns.length === 0 ? (
                <div style={{ padding:"40px 16px", textAlign:"center" }}>
                  <div style={{ fontFamily:"monospace", fontSize:10, color:"#4a5580", letterSpacing:"0.15em" }}>NO EXECUTION RECORDS</div>
                </div>
              ) : recentRuns.map((r, i) => {
                const sc = STATUS_COLORS[r.status] || "#4a5580";
                const cost = r.costCents ? `$${(r.costCents/100).toFixed(4)}` : "—";
                const ts = new Date(r.createdAt).toISOString().slice(11,19);
                const agentName = (r.agent?.name || "UNKNOWN").slice(0,14).toUpperCase();
                return (
                  <div key={r.id} className="ov-metric" style={{ display:"grid", gridTemplateColumns:"80px 1fr 90px 70px", alignItems:"center", gap:0, padding:"7px 16px", borderBottom:"1px solid rgba(0,102,255,0.04)", opacity: 1 - i*0.04 }}>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:"#4a5580" }}>{ts}</span>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:"#e0e7ff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{agentName}</span>
                    <span style={{ fontSize:8, fontFamily:"monospace", color:sc, letterSpacing:"0.08em" }}>{r.status.toUpperCase()}</span>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:"#4a5580" }}>{cost}</span>
                  </div>
                );
              })}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

              {/* Asset Registry */}
              <div style={{ background:"rgba(0,8,24,0.88)", border:"1px solid rgba(0,102,255,0.14)", borderRadius:6, overflow:"hidden", backdropFilter:"blur(20px)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", borderBottom:"1px solid rgba(0,102,255,0.08)", background:"rgba(0,20,60,0.25)" }}>
                  <span style={{ fontSize:9, fontFamily:"monospace", color:"#e0e7ff", letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:700 }}>ASSET REGISTRY</span>
                  <Link href="/dashboard/agents" style={{ fontSize:7, fontFamily:"monospace", color:"#0066ff", textDecoration:"none", letterSpacing:"0.1em" }}>VIEW ALL</Link>
                </div>
                {agents.length === 0 ? (
                  <div style={{ padding:"20px 14px", textAlign:"center" }}>
                    <div style={{ fontFamily:"monospace", fontSize:9, color:"#4a5580" }}>NO ASSETS REGISTERED</div>
                    <Link href="/dashboard/agents" style={{ fontSize:9, fontFamily:"monospace", color:"#0066ff", textDecoration:"none", display:"block", marginTop:8 }}>+ REGISTER FIRST ASSET</Link>
                  </div>
                ) : agents.map((a, i) => {
                  const col = AGENT_COLORS[i % AGENT_COLORS.length];
                  return (
                    <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="ov-agentrow" style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderBottom:"1px solid rgba(0,102,255,0.05)", textDecoration:"none" }}>
                      <div style={{ width:30, height:30, borderRadius:4, background:`linear-gradient(135deg,${col}44,${col}22)`, border:`1px solid ${col}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:900, color:col, fontFamily:"monospace", flexShrink:0, boxShadow:`0 4px 8px rgba(0,0,0,0.4),0 0 8px ${col}18` }}>{a.name[0].toUpperCase()}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:10, fontWeight:700, fontFamily:"monospace", color:"#e0e7ff", textTransform:"uppercase", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.name}</div>
                        <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.06em" }}>AST-{String(i+1).padStart(3,"0")} // {(a.role||"AGENT").slice(0,18).toUpperCase()}</div>
                      </div>
                      <span style={{ width:5, height:5, borderRadius:"50%", background:col, boxShadow:`0 0 5px ${col}`, flexShrink:0 }} />
                    </Link>
                  );
                })}
              </div>

              {/* Telemetry */}
              <div style={{ background:"rgba(0,8,24,0.88)", border:"1px solid rgba(0,102,255,0.14)", borderRadius:6, padding:"10px 14px", backdropFilter:"blur(20px)" }}>
                <div style={{ fontSize:9, fontFamily:"monospace", color:"#e0e7ff", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10, fontWeight:700 }}>SYSTEM TELEMETRY</div>
                {[
                  { label:"Agent Capacity", value:`${agents.length}/${limits.agents}`, unit:"units", ok: agents.length<limits.agents },
                  { label:"Period Usage",   value:pct.toFixed(3),                      unit:"%",     ok: pct<80 },
                  { label:"Success Rate",   value:successRate,                          unit:"%",     ok: parseFloat(successRate)>80 },
                  { label:"Total Ops",      value:String(allCount),                    unit:"ops",   ok:true },
                  { label:"Capital USD",    value:`${(totalCost/100).toFixed(4)}`,     unit:"USD",   ok:true },
                ].map((m, i) => {
                  const sc = m.ok ? "#00ff88" : "#ffd700";
                  return (
                    <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid rgba(0,102,255,0.06)" }}>
                      <span style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580", textTransform:"uppercase", letterSpacing:"0.08em" }}>{m.label}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                        <span style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:"#e0e7ff" }}>{m.value}</span>
                        <span style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580" }}>{m.unit}</span>
                        <span style={{ width:4, height:4, borderRadius:"50%", background:sc, boxShadow:`0 0 4px ${sc}` }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop:10 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", textTransform:"uppercase", letterSpacing:"0.1em" }}>PERIOD QUOTA</span>
                    <span style={{ fontSize:7, fontFamily:"monospace", color:"#e0e7ff" }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div style={{ height:3, background:"rgba(0,102,255,0.08)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background: pct>80?"#ff2d55":"#0066ff", boxShadow:`0 0 6px ${pct>80?"#ff2d55":"#0066ff"}`, borderRadius:2, transition:"width 1s ease" }} />
                  </div>
                </div>
              </div>

              {/* Nav grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                {[
                  { href:"/dashboard/agents",    label:"ASSETS",  color:"#0066ff" },
                  { href:"/dashboard/campaigns", label:"OPS",     color:"#ffd700" },
                  { href:"/dashboard/social",    label:"SIGNALS", color:"#00d9ff" },
                  { href:"/dashboard/settings",  label:"CONFIG",  color:"#00ff88" },
                ].map(n => (
                  <Link key={n.href} href={n.href} className="ov-nav" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 0", background:`${n.color}08`, border:`1px solid ${n.color}20`, borderRadius:4, color:n.color, fontSize:8, fontFamily:"monospace", fontWeight:700, letterSpacing:"0.15em", textDecoration:"none" }}>
                    {n.label}
                  </Link>
                ))}
              </div>

              {/* Plan */}
              <div style={{ background: isPro?"rgba(0,20,60,0.5)":"rgba(10,8,0,0.5)", border:`1px solid ${isPro?"rgba(0,102,255,0.22)":"rgba(255,215,0,0.18)"}`, borderRadius:6, padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase" }}>AUTHORIZATION</span>
                  <span style={{ fontSize:8, fontFamily:"monospace", fontWeight:700, color: isPro?"#0066ff":"#ffd700", padding:"2px 8px", borderRadius:2, background: isPro?"rgba(0,102,255,0.1)":"rgba(255,215,0,0.08)", border:`1px solid ${isPro?"rgba(0,102,255,0.18)":"rgba(255,215,0,0.12)"}`, letterSpacing:"0.1em" }}>{user.plan}</span>
                </div>
                {!isPro && (
                  <Link href="/dashboard/billing" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 0", background:"linear-gradient(135deg,#0055cc,#003399)", border:"1px solid rgba(0,102,255,0.25)", borderRadius:4, color:"#e0e7ff", fontSize:9, fontFamily:"monospace", fontWeight:700, letterSpacing:"0.15em", textDecoration:"none", textTransform:"uppercase", boxShadow:"0 0 14px rgba(0,102,255,0.18)" }}>
                    REQUEST ELEVATION ›
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:20, paddingTop:10, borderTop:"1px solid rgba(0,102,255,0.06)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              {["CORE:OK","DB:OK","AI:OK","NET:OK"].map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:4, fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.1em" }}>
                  <span style={{ width:3, height:3, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 3px #00ff88" }} />
                  {s}
                </div>
              ))}
            </div>
            <div style={{ fontSize:7, fontFamily:"monospace", color:"#2a3560", letterSpacing:"0.12em" }}>
              AETHER // BUILD {new Date().toISOString().slice(0,10).replace(/-/g,"")}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
