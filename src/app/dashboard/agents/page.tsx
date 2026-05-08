import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";

export const metadata = { title: "Asset Registry | Aether" };

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
      name: String(formData.get("name") || "New Asset"),
      role: String(formData.get("role") || "Specialist"),
      description: String(formData.get("description") || ""),
      systemPrompt: String(formData.get("systemPrompt") || "You are a helpful specialist."),
      knowledge: String(formData.get("knowledge") || ""),
    },
  });
  redirect(`/dashboard/agents/${agent.id}`);
}

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function SparkBar({ seed, color, w = 48 }: { seed: number; color: string; w?: number }) {
  const bars = Array.from({ length: 10 }, (_, i) => 20 + (seedHash(`${seed}-${i}`) % 80));
  return (
    <svg viewBox={`0 0 ${w} 20`} style={{ width: w, height: 20 }}>
      {bars.map((h, i) => (
        <rect key={i} x={i * (w / 10)} y={20 - h * 0.2} width={w / 10 - 1} height={h * 0.2}
          fill={color} opacity={0.2 + (i / bars.length) * 0.8} rx="0.5">
          <animate attributeName="height" values={`${h * 0.2};${h * 0.28};${h * 0.2}`}
            dur={`${1.4 + i * 0.09}s`} repeatCount="indefinite" />
          <animate attributeName="y" values={`${20 - h * 0.2};${20 - h * 0.28};${20 - h * 0.2}`}
            dur={`${1.4 + i * 0.09}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

function HexIcon({ letter, color }: { letter: string; color: string }) {
  return (
    <svg width="44" height="50" viewBox="0 0 44 50" style={{ flexShrink: 0 }}>
      <defs>
        <filter id={`hglow-${letter}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <polygon points="22,2 42,13 42,37 22,48 2,37 2,13"
        fill={`${color}18`} stroke={`${color}55`} strokeWidth="1"
        filter={`url(#hglow-${letter})`} />
      <polygon points="22,8 36,16 36,34 22,42 8,34 8,16"
        fill={`${color}10`} stroke={`${color}33`} strokeWidth="0.5" />
      <text x="22" y="30" textAnchor="middle" fill={color}
        fontSize="16" fontWeight="900" fontFamily="'JetBrains Mono', monospace"
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
        {letter}
      </text>
    </svg>
  );
}

const CSS = `
  @property --ang-ag {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  @keyframes spin-ag { to { --ang-ag: 360deg; } }
  @keyframes drift-ag {
    0%, 100% { transform: translate(0,0); }
    33% { transform: translate(40px,-25px); }
    66% { transform: translate(-25px,35px); }
  }
  @keyframes scan-ag { 0% { top: -2px; } 100% { top: 100%; } }
  @keyframes pulse-ag {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes flicker-ag {
    0%, 95%, 100% { opacity: 1; }
    96% { opacity: 0.8; }
    98% { opacity: 1; }
  }
  body { background: #000a1a; color: #e0e7ff; }
  .aurora-ag { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
  .blob-ag {
    position: absolute; border-radius: 50%;
    filter: blur(90px); opacity: 0.08;
    animation: drift-ag 14s ease-in-out infinite;
  }
  .grid-bg-ag {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(0,102,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,102,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .asset-card {
    position: relative; overflow: hidden;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    transform-style: preserve-3d;
  }
  .asset-card:hover {
    transform: translateY(-4px) rotateX(1deg);
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px var(--card-glow, rgba(0,102,255,0.15)) !important;
  }
  .holo-ag::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(105deg, transparent 30%, rgba(0,180,255,0.04) 50%, transparent 70%);
    animation: sweep-ag 5s linear infinite;
    pointer-events: none; z-index: 10;
  }
  @keyframes sweep-ag {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }
  .scanline-ag {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(0,217,255,0.25), transparent);
    animation: scan-ag 4s linear infinite;
    pointer-events: none; z-index: 5;
  }
  .spin-border-ag {
    --ang-ag: 0deg;
    animation: spin-ag 5s linear infinite;
    background: conic-gradient(from var(--ang-ag), #0066ff, #00d9ff, #ffd700, #0066ff);
    border-radius: 7px;
    padding: 1px;
  }
  .input-inst {
    width: 100%;
    background: rgba(0,10,30,0.8);
    border: 1px solid rgba(0,102,255,0.15);
    border-radius: 4px;
    padding: 9px 12px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 11px;
    color: #e0e7ff;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    letter-spacing: 0.02em;
    box-sizing: border-box;
  }
  .input-inst:focus {
    border-color: rgba(0,102,255,0.4);
    box-shadow: 0 0 0 2px rgba(0,102,255,0.1);
  }
  .input-inst::placeholder { color: #2a3560; }
`;

const ASSET_COLORS = ["#0066ff","#00d9ff","#ffd700","#00ff88","#ff6b35","#c084fc","#ff2d55","#00ffcc"];
const ROLE_PRESETS = [
  { code: "SDR", label: "Sales Dev Rep", desc: "Cold outreach & pipeline" },
  { code: "CPY", label: "Copywriter", desc: "Content & conversion copy" },
  { code: "ANL", label: "Analyst", desc: "Data research & insights" },
  { code: "SUP", label: "Support", desc: "Customer service & triage" },
  { code: "MKT", label: "Marketing", desc: "Campaigns & growth ops" },
  { code: "OPS", label: "Operations", desc: "Process automation" },
];

export default async function AgentsPage() {
  const user = (await getCurrentUser())!;
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  const limit  = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  const pct    = Math.min(100, (agents.length / limit) * 100);
  const isPro  = user.plan !== "FREE";
  const seed   = seedHash(user.id);

  return (
    <>
      <style>{CSS}</style>
      <div className="aurora-ag">
        <div className="blob-ag" style={{ width: 500, height: 500, background: "radial-gradient(circle,#0066ff,transparent)", top: -150, left: -100 }} />
        <div className="blob-ag" style={{ width: 400, height: 400, background: "radial-gradient(circle,#003580,transparent)", bottom: -100, right: -50, animationDelay: "-6s" }} />
      </div>
      <div className="grid-bg-ag" />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── PAGE HEADER ─────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
              AETHER COMMAND // MODULE: ASSET-REGISTRY
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#e0e7ff", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.5px", marginBottom: 4 }}>
              ASSET REGISTRY
            </h1>
            <p style={{ fontSize: 10, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.06em" }}>
              {agents.length} ACTIVE ASSET{agents.length !== 1 ? "S" : ""} // {limit - agents.length} SLOT{limit - agents.length !== 1 ? "S" : ""} AVAILABLE
            </p>
          </div>

          {/* Capacity meter */}
          <div style={{
            background: "rgba(0,8,24,0.85)", border: "1px solid rgba(0,102,255,0.15)",
            borderRadius: 6, padding: "12px 16px", minWidth: 160,
            backdropFilter: "blur(20px)",
          }}>
            <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>DEPLOYMENT CAPACITY</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#e0e7ff", lineHeight: 1, marginBottom: 8 }}>
              {agents.length}<span style={{ fontSize: 12, color: "#4a5580", fontWeight: 400 }}>/{limit}</span>
            </div>
            <div style={{ height: 3, background: "rgba(0,102,255,0.1)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? "#ff2d55" : "#0066ff", boxShadow: `0 0 6px ${pct > 80 ? "#ff2d55" : "#0066ff"}`, transition: "width 1s ease", borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580" }}>{pct.toFixed(1)}% UTILIZED</div>
          </div>
        </div>

        {/* ── ASSET GRID ──────────────────────────────────────────── */}
        {agents.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12, marginBottom: 24 }}>
            {agents.map((a, i) => {
              const col = ASSET_COLORS[i % ASSET_COLORS.length];
              const assetId = `AST-${String(i + 1).padStart(3, "0")}`;
              const runsCount = a._count.runs;
              const letter = a.name[0].toUpperCase();
              const sh = seedHash(a.id);
              return (
                <Link key={a.id} href={`/dashboard/agents/${a.id}`} style={{ textDecoration: "none" }}>
                  <div className="asset-card holo-ag" style={{
                    background: "rgba(0,8,24,0.88)",
                    border: `1px solid ${col}22`,
                    borderRadius: 6, padding: 18,
                    backdropFilter: "blur(20px)",
                    boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 ${col}15`,
                    ["--card-glow" as string]: `${col}22`,
                  }}>
                    <div className="scanline-ag" />

                    {/* Top accent */}
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${col}, transparent)`, borderRadius: "6px 6px 0 0" }} />

                    {/* Asset ID badge */}
                    <div style={{ position: "absolute", top: 10, right: 12, fontSize: 7, fontFamily: "monospace", color: `${col}88`, letterSpacing: "0.1em" }}>
                      {assetId}
                    </div>

                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <HexIcon letter={letter} color={col} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#e0e7ff", marginBottom: 2, letterSpacing: "-0.2px" }}>
                          {a.name.toUpperCase()}
                        </div>
                        <div style={{ fontSize: 8, fontFamily: "monospace", letterSpacing: "0.1em", color: col, marginBottom: 8, padding: "2px 6px", display: "inline-block", background: `${col}12`, border: `1px solid ${col}30`, borderRadius: 2 }}>
                          {(a.role || "AGENT").toUpperCase()}
                        </div>
                        {a.description && (
                          <div style={{ fontSize: 9, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.03em", lineHeight: 1.5, marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {a.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics strip */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 10, borderTop: `1px solid ${col}12` }}>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>OPS</div>
                          <div style={{ fontSize: 14, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace", color: "#e0e7ff" }}>{runsCount}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>STATUS</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 5px #00ff88", animation: "pulse-ag 2s ease infinite", display: "inline-block" }} />
                            <span style={{ fontSize: 8, fontFamily: "monospace", color: "#00ff88", letterSpacing: "0.08em" }}>ACTIVE</span>
                          </div>
                        </div>
                      </div>
                      <SparkBar seed={sh} color={col} w={60} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div style={{
            border: "1px dashed rgba(0,102,255,0.12)", borderRadius: 6,
            padding: "48px 24px", textAlign: "center", marginBottom: 24,
            background: "rgba(0,8,24,0.5)",
          }}>
            <div style={{ fontSize: 10, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
              NO ASSETS REGISTERED
            </div>
            <div style={{ fontSize: 8, fontFamily: "monospace", color: "#2a3560", letterSpacing: "0.1em" }}>
              DEPLOY YOUR FIRST ASSET BELOW TO BEGIN OPERATIONS
            </div>
          </div>
        )}

        {/* ── DEPLOY NEW ASSET FORM ────────────────────────────────── */}
        {agents.length < limit ? (
          <div className="holo-ag" style={{
            background: "rgba(0,8,24,0.88)",
            border: "1px solid rgba(0,102,255,0.18)",
            borderRadius: 6, overflow: "hidden",
            backdropFilter: "blur(20px)",
            boxShadow: "0 0 40px rgba(0,0,0,0.5)",
          }}>
            {/* Form header */}
            <div style={{
              padding: "12px 20px",
              borderBottom: "1px solid rgba(0,102,255,0.1)",
              background: "rgba(0,20,60,0.3)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 3 }}>OPERATION: ASSET-DEPLOYMENT</div>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "#e0e7ff", letterSpacing: "0.05em" }}>REGISTER NEW ASSET</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 7, fontFamily: "monospace", color: "#00ff88", letterSpacing: "0.1em" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 4px #00ff88", display: "inline-block", animation: "pulse-ag 2s ease infinite" }} />
                FORM READY
              </div>
            </div>

            {/* Role presets */}
            <div style={{ padding: "16px 20px 0", borderBottom: "1px solid rgba(0,102,255,0.06)" }}>
              <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10 }}>ROLE CLASSIFICATION PRESETS</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingBottom: 16 }}>
                {ROLE_PRESETS.map(p => (
                  <div key={p.code} style={{
                    padding: "6px 12px", borderRadius: 3,
                    background: "rgba(0,102,255,0.06)",
                    border: "1px solid rgba(0,102,255,0.15)",
                    cursor: "default",
                    transition: "all 0.15s",
                  }}>
                    <span style={{ fontSize: 8, fontFamily: "monospace", color: "#0066ff", fontWeight: 700, letterSpacing: "0.1em" }}>{p.code}</span>
                    <span style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580", marginLeft: 6 }}>{p.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form body */}
            <form action={createAgent} style={{ padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    ASSET DESIGNATION
                  </label>
                  <input className="input-inst" name="name" required placeholder="e.g. NOVA-7 // OUTBOUND" />
                </div>
                <div>
                  <label style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    ROLE CLASSIFICATION
                  </label>
                  <input className="input-inst" name="role" required placeholder="e.g. SDR, ANALYST" />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  OPERATIONAL BRIEF
                </label>
                <input className="input-inst" name="description" placeholder="Brief operational summary for dashboard display" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  SYSTEM DIRECTIVE <span style={{ color: "#ff2d55" }}>*</span>
                </label>
                <textarea className="input-inst" name="systemPrompt" required rows={5}
                  style={{ resize: "vertical", minHeight: 100 }}
                  placeholder="You are an expert SDR operating at a high-performance level. Your objective is to..." />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  INTELLIGENCE BRIEF <span style={{ color: "#4a5580" }}>(OPTIONAL)</span>
                </label>
                <textarea className="input-inst" name="knowledge" rows={4}
                  style={{ resize: "vertical", minHeight: 80 }}
                  placeholder="Classified context: company data, playbooks, pricing intel, competitor analysis..." />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 7, fontFamily: "monospace", color: "#4a5580", letterSpacing: "0.1em" }}>
                  SLOTS REMAINING: <span style={{ color: "#e0e7ff" }}>{limit - agents.length}</span>
                </div>
                <div className="spin-border-ag">
                  <button type="submit" style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "9px 20px", borderRadius: 6,
                    background: "linear-gradient(135deg, #0044bb, #002288)",
                    color: "#e0e7ff", fontSize: 9, fontFamily: "monospace",
                    fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase",
                    border: "none", cursor: "pointer",
                    boxShadow: "0 0 20px rgba(0,102,255,0.3)",
                    width: "100%",
                  }}>
                    + DEPLOY ASSET
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "16px 20px",
            background: "rgba(255,45,85,0.06)",
            border: "1px solid rgba(255,45,85,0.2)",
            borderRadius: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff2d55", boxShadow: "0 0 8px #ff2d55", flexShrink: 0, animation: "pulse-ag 2s ease infinite" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 700, color: "#e0e7ff", letterSpacing: "0.1em", marginBottom: 3 }}>DEPLOYMENT CAPACITY EXCEEDED</div>
              <div style={{ fontSize: 8, fontFamily: "monospace", color: "#4a5580" }}>{limit}/{limit} SLOTS UTILIZED — REQUEST CAPACITY ELEVATION TO REGISTER ADDITIONAL ASSETS</div>
            </div>
            <Link href="/dashboard/billing" style={{
              padding: "7px 16px", borderRadius: 4,
              background: "linear-gradient(135deg, #0044bb, #002288)",
              border: "1px solid rgba(0,102,255,0.3)",
              color: "#e0e7ff", fontSize: 8, fontFamily: "monospace",
              fontWeight: 700, letterSpacing: "0.12em", textDecoration: "none",
              boxShadow: "0 0 12px rgba(0,102,255,0.2)",
            }}>
              ELEVATE CLEARANCE
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
