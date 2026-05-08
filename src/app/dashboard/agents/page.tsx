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

function SparkBar({ seed, color }: { seed: number; color: string }) {
  const bars = Array.from({ length: 10 }, (_, i) => 20 + (seedHash(`${seed}-${i}`) % 80));
  return (
    <svg viewBox="0 0 48 20" style={{ width:48, height:20 }}>
      {bars.map((h, i) => (
        <rect key={i} x={i*4.8} y={20-h*0.2} width="3.8" height={h*0.2}
          fill={color} opacity={0.2+(i/bars.length)*0.8} rx="0.5">
          <animate attributeName="height" values={`${h*0.2};${h*0.28};${h*0.2}`}
            dur={`${1.4+i*0.09}s`} repeatCount="indefinite" />
          <animate attributeName="y" values={`${20-h*0.2};${20-h*0.28};${20-h*0.2}`}
            dur={`${1.4+i*0.09}s`} repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

const CSS = `
  @property --ang-ag { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
  @keyframes spin-ag { to { --ang-ag: 360deg; } }
  @keyframes drift-ag { 0%,100%{transform:translate(0,0);} 33%{transform:translate(40px,-25px);} 66%{transform:translate(-25px,35px);} }
  @keyframes scan-ag { 0%{top:-2px;} 100%{top:100%;} }
  @keyframes pulse-ag { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  @keyframes sweep-ag { 0%{transform:translateX(-100%);} 100%{transform:translateX(250%);} }

  .ag-wrap { position:relative; background:#000a1a; min-height:100vh; }
  .ag-aurora { position:absolute; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
  .ag-blob { position:absolute; border-radius:50%; filter:blur(90px); opacity:0.09; animation:drift-ag 14s ease-in-out infinite; }
  .ag-grid {
    position:absolute; inset:0; pointer-events:none; z-index:0;
    background-image:linear-gradient(rgba(0,102,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,102,255,0.05) 1px,transparent 1px);
    background-size:40px 40px;
  }
  .ag-card {
    position:relative; overflow:hidden;
    transition:transform 0.25s ease, box-shadow 0.25s ease;
    border-radius:6px;
  }
  .ag-card:hover { transform:translateY(-3px); }
  .ag-card::before {
    content:''; position:absolute; inset:0;
    background:linear-gradient(105deg,transparent 30%,rgba(0,180,255,0.04) 50%,transparent 70%);
    animation:sweep-ag 5s linear infinite; pointer-events:none; z-index:5;
  }
  .ag-scanline { position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(0,217,255,0.22),transparent); animation:scan-ag 4s linear infinite; pointer-events:none; z-index:4; }
  .ag-spin { --ang-ag:0deg; animation:spin-ag 5s linear infinite; background:conic-gradient(from var(--ang-ag),#0066ff,#00d9ff,#ffd700,#0066ff); border-radius:5px; padding:1px; }
  .input-ag {
    width:100%; background:rgba(0,10,30,0.85); border:1px solid rgba(0,102,255,0.15); border-radius:4px;
    padding:9px 12px; font-family:'JetBrains Mono','Courier New',monospace; font-size:11px; color:#e0e7ff;
    outline:none; transition:border-color 0.15s, box-shadow 0.15s; letter-spacing:0.02em; box-sizing:border-box;
  }
  .input-ag:focus { border-color:rgba(0,102,255,0.4); box-shadow:0 0 0 2px rgba(0,102,255,0.1); }
  .input-ag::placeholder { color:#2a3560; }
`;

const ASSET_COLORS = ["#0066ff","#00d9ff","#ffd700","#00ff88","#ff6b35","#c084fc","#ff2d55","#00ffcc"];
const ROLE_PRESETS = [
  { code:"SDR", label:"Sales Dev Rep",  desc:"Cold outreach & pipeline" },
  { code:"CPY", label:"Copywriter",     desc:"Content & conversion" },
  { code:"ANL", label:"Analyst",        desc:"Data & research" },
  { code:"SUP", label:"Support",        desc:"Customer service" },
  { code:"MKT", label:"Marketing",      desc:"Campaigns & growth" },
  { code:"OPS", label:"Operations",     desc:"Process automation" },
];

export default async function AgentsPage() {
  const user  = (await getCurrentUser())!;
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  const limit = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  const pct   = Math.min(100, (agents.length / limit) * 100);
  const seed  = seedHash(user.id);

  return (
    <>
      <style>{CSS}</style>
      <div className="ag-wrap">
        <div className="ag-aurora">
          <div className="ag-blob" style={{ width:500, height:500, background:"radial-gradient(circle,#0066ff,transparent)", top:-150, left:-100, animationDelay:"0s" }} />
          <div className="ag-blob" style={{ width:400, height:400, background:"radial-gradient(circle,#003580,transparent)", bottom:-100, right:-50, animationDelay:"-6s" }} />
        </div>
        <div className="ag-grid" />

        <div style={{ position:"relative", zIndex:10 }}>

          {/* HEADER */}
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
            <div>
              <div style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:6 }}>AETHER COMMAND // MODULE: ASSET-REGISTRY</div>
              <h1 style={{ fontSize:22, fontWeight:900, color:"#e0e7ff", fontFamily:"'JetBrains Mono',monospace", letterSpacing:"-0.5px", marginBottom:4 }}>ASSET REGISTRY</h1>
              <p style={{ fontSize:10, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.06em" }}>
                {agents.length} ACTIVE ASSET{agents.length!==1?"S":""} // {limit-agents.length} SLOT{limit-agents.length!==1?"S":""} AVAILABLE
              </p>
            </div>
            <div style={{ background:"rgba(0,8,24,0.85)", border:"1px solid rgba(0,102,255,0.15)", borderRadius:6, padding:"12px 16px", minWidth:150, backdropFilter:"blur(20px)" }}>
              <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>DEPLOYMENT CAPACITY</div>
              <div style={{ fontSize:22, fontWeight:900, fontFamily:"'JetBrains Mono',monospace", color:"#e0e7ff", lineHeight:1, marginBottom:8 }}>
                {agents.length}<span style={{ fontSize:12, color:"#4a5580", fontWeight:400 }}>/{limit}</span>
              </div>
              <div style={{ height:3, background:"rgba(0,102,255,0.08)", borderRadius:2, overflow:"hidden", marginBottom:4 }}>
                <div style={{ height:"100%", width:`${pct}%`, background:pct>80?"#ff2d55":"#0066ff", boxShadow:`0 0 6px ${pct>80?"#ff2d55":"#0066ff"}`, transition:"width 1s ease", borderRadius:2 }} />
              </div>
              <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580" }}>{pct.toFixed(1)}% UTILIZED</div>
            </div>
          </div>

          {/* ASSET GRID */}
          {agents.length > 0 ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:12, marginBottom:24 }}>
              {agents.map((a, i) => {
                const col = ASSET_COLORS[i % ASSET_COLORS.length];
                const assetId = `AST-${String(i+1).padStart(3,"0")}`;
                const sh = seedHash(a.id);
                return (
                  <Link key={a.id} href={`/dashboard/agents/${a.id}`} style={{ textDecoration:"none" }}>
                    <div className="ag-card" style={{ background:"rgba(0,8,24,0.9)", border:`1px solid ${col}22`, padding:"18px", backdropFilter:"blur(20px)", boxShadow:`0 8px 32px rgba(0,0,0,0.5),inset 0 1px 0 ${col}15` }}>
                      <div className="ag-scanline" />
                      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${col},transparent)`, borderRadius:"6px 6px 0 0" }} />
                      <div style={{ position:"absolute", top:10, right:12, fontSize:7, fontFamily:"monospace", color:`${col}77`, letterSpacing:"0.1em" }}>{assetId}</div>

                      <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                        {/* Hex-style avatar */}
                        <div style={{ width:44, height:44, borderRadius:6, background:`linear-gradient(135deg,${col}44,${col}22)`, border:`1px solid ${col}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:col, fontFamily:"monospace", flexShrink:0, boxShadow:`0 4px 12px rgba(0,0,0,0.4),0 0 12px ${col}20` }}>
                          {a.name[0].toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:900, fontFamily:"'JetBrains Mono',monospace", color:"#e0e7ff", marginBottom:4, letterSpacing:"-0.2px" }}>{a.name.toUpperCase()}</div>
                          <div style={{ fontSize:8, fontFamily:"monospace", letterSpacing:"0.1em", color:col, marginBottom:a.description?8:0, padding:"2px 6px", display:"inline-block", background:`${col}12`, border:`1px solid ${col}28`, borderRadius:2 }}>
                            {(a.role||"AGENT").toUpperCase()}
                          </div>
                          {a.description && (
                            <div style={{ fontSize:9, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.03em", lineHeight:1.5, marginTop:6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                              {a.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:14, paddingTop:10, borderTop:`1px solid ${col}12` }}>
                        <div style={{ display:"flex", gap:16 }}>
                          <div>
                            <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>OPS</div>
                            <div style={{ fontSize:14, fontWeight:900, fontFamily:"'JetBrains Mono',monospace", color:"#e0e7ff" }}>{a._count.runs}</div>
                          </div>
                          <div>
                            <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>STATUS</div>
                            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                              <span style={{ width:5, height:5, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 5px #00ff88", animation:"pulse-ag 2s ease infinite", display:"inline-block" }} />
                              <span style={{ fontSize:8, fontFamily:"monospace", color:"#00ff88", letterSpacing:"0.08em" }}>ACTIVE</span>
                            </div>
                          </div>
                        </div>
                        <SparkBar seed={sh} color={col} />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div style={{ border:"1px dashed rgba(0,102,255,0.1)", borderRadius:6, padding:"48px 24px", textAlign:"center", marginBottom:24, background:"rgba(0,8,24,0.4)" }}>
              <div style={{ fontSize:10, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>NO ASSETS REGISTERED</div>
              <div style={{ fontSize:8, fontFamily:"monospace", color:"#2a3560", letterSpacing:"0.1em" }}>DEPLOY YOUR FIRST ASSET BELOW TO BEGIN OPERATIONS</div>
            </div>
          )}

          {/* DEPLOY FORM */}
          {agents.length < limit ? (
            <div style={{ background:"rgba(0,8,24,0.9)", border:"1px solid rgba(0,102,255,0.16)", borderRadius:6, overflow:"hidden", backdropFilter:"blur(20px)" }}>
              <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(0,102,255,0.08)", background:"rgba(0,20,60,0.25)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:3 }}>OPERATION: ASSET-DEPLOYMENT</div>
                  <div style={{ fontSize:12, fontWeight:700, fontFamily:"monospace", color:"#e0e7ff", letterSpacing:"0.05em" }}>REGISTER NEW ASSET</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:7, fontFamily:"monospace", color:"#00ff88", letterSpacing:"0.1em" }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:"#00ff88", boxShadow:"0 0 4px #00ff88", display:"inline-block", animation:"pulse-ag 2s ease infinite" }} />
                  FORM READY
                </div>
              </div>

              {/* Role presets */}
              <div style={{ padding:"14px 20px 0", borderBottom:"1px solid rgba(0,102,255,0.05)" }}>
                <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:10 }}>ROLE CLASSIFICATION PRESETS</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, paddingBottom:14 }}>
                  {ROLE_PRESETS.map(p => (
                    <div key={p.code} style={{ padding:"6px 12px", borderRadius:3, background:"rgba(0,102,255,0.06)", border:"1px solid rgba(0,102,255,0.14)", cursor:"default" }}>
                      <span style={{ fontSize:8, fontFamily:"monospace", color:"#0066ff", fontWeight:700, letterSpacing:"0.1em" }}>{p.code}</span>
                      <span style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580", marginLeft:6 }}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <form action={createAgent} style={{ padding:20 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase", display:"block", marginBottom:6 }}>ASSET DESIGNATION</label>
                    <input className="input-ag" name="name" required placeholder="e.g. NOVA-7 // OUTBOUND" />
                  </div>
                  <div>
                    <label style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase", display:"block", marginBottom:6 }}>ROLE CLASSIFICATION</label>
                    <input className="input-ag" name="role" required placeholder="e.g. SDR, ANALYST" />
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase", display:"block", marginBottom:6 }}>OPERATIONAL BRIEF</label>
                  <input className="input-ag" name="description" placeholder="Brief summary for dashboard display" />
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase", display:"block", marginBottom:6 }}>SYSTEM DIRECTIVE <span style={{ color:"#ff2d55" }}>*</span></label>
                  <textarea className="input-ag" name="systemPrompt" required rows={5}
                    style={{ resize:"vertical", minHeight:100 }}
                    placeholder="You are an expert SDR operating at elite level. Your objective is to..." />
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.15em", textTransform:"uppercase", display:"block", marginBottom:6 }}>INTELLIGENCE BRIEF <span style={{ color:"#4a5580" }}>(OPTIONAL)</span></label>
                  <textarea className="input-ag" name="knowledge" rows={4}
                    style={{ resize:"vertical", minHeight:80 }}
                    placeholder="Company data, playbooks, pricing intel, competitor analysis..." />
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontSize:7, fontFamily:"monospace", color:"#4a5580", letterSpacing:"0.1em" }}>
                    SLOTS REMAINING: <span style={{ color:"#e0e7ff" }}>{limit-agents.length}</span>
                  </div>
                  <div className="ag-spin">
                    <button type="submit" style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 24px", borderRadius:4, background:"linear-gradient(135deg,#0044bb,#002288)", color:"#e0e7ff", fontSize:9, fontFamily:"monospace", fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", border:"none", cursor:"pointer", boxShadow:"0 0 20px rgba(0,102,255,0.25)" }}>
                      + DEPLOY ASSET
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 20px", background:"rgba(255,45,85,0.05)", border:"1px solid rgba(255,45,85,0.18)", borderRadius:6 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#ff2d55", boxShadow:"0 0 8px #ff2d55", flexShrink:0, animation:"pulse-ag 2s ease infinite", display:"inline-block" }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontFamily:"monospace", fontWeight:700, color:"#e0e7ff", letterSpacing:"0.1em", marginBottom:3 }}>DEPLOYMENT CAPACITY EXCEEDED</div>
                <div style={{ fontSize:8, fontFamily:"monospace", color:"#4a5580" }}>{limit}/{limit} SLOTS UTILIZED — REQUEST ELEVATION TO REGISTER ADDITIONAL ASSETS</div>
              </div>
              <Link href="/dashboard/billing" style={{ padding:"7px 16px", borderRadius:4, background:"linear-gradient(135deg,#0044bb,#002288)", border:"1px solid rgba(0,102,255,0.25)", color:"#e0e7ff", fontSize:8, fontFamily:"monospace", fontWeight:700, letterSpacing:"0.12em", textDecoration:"none" }}>
                ELEVATE
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
