import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Plus, Bot, ChevronRight, Zap, Users, Sparkles, Brain, Activity } from "lucide-react";

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
      name: String(formData.get("name") || "New Agent"),
      role: String(formData.get("role") || "Specialist"),
      description: String(formData.get("description") || ""),
      systemPrompt: String(
        formData.get("systemPrompt") || "You are a helpful specialist.",
      ),
      knowledge: String(formData.get("knowledge") || ""),
    },
  });
  redirect(`/dashboard/agents/${agent.id}`);
}

const ROLE_PRESETS = [
  { label: "SDR",        desc: "Cold outreach & lead qualification", color: "#7c3aed" },
  { label: "Copywriter", desc: "Emails, ads, landing pages",         color: "#a855f7" },
  { label: "Analyst",    desc: "Data research & insights",           color: "#c4b5fd" },
  { label: "Support",    desc: "Customer service & FAQs",            color: "#8b5cf6" },
];

const PALETTE = ["#7c3aed","#a855f7","#8b5cf6","#c4b5fd","#6d28d9","#4c1d95"];

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function MiniWave({ color, seed }: { color: string; seed: number }) {
  const heights = Array.from({ length: 16 }, (_, i) => 30 + seedHash(`${seed}-${i}`) % 100);
  return (
    <svg viewBox="0 0 160 60" className="w-full h-6" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-ag-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <g key={i}>
          <rect x={i * 10} y={60 - h} width="8" height={h} fill={`url(#grad-ag-${seed})`}>
            <animate attributeName="height" values={`${h};${h * 1.3};${h * 0.7};${h}`} dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="y" values={`${60-h};${60-h*1.3};${60-h*0.7};${60-h}`} dur="2.4s" repeatCount="indefinite" />
          </rect>
        </g>
      ))}
    </svg>
  );
}

function CircuitTrace({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 80" className="w-full h-10 absolute inset-0">
      <defs>
        <filter id="glow-ag" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M 10 40 L 50 40 L 50 20 L 100 20 L 100 60 L 150 60 L 150 40 L 190 40"
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" filter="url(#glow-ag)" strokeDasharray="300">
        <animate attributeName="strokeDashoffset" from="300" to="0" dur="3s" repeatCount="indefinite" />
      </path>
      <circle cx="50" cy="40" r="2.5" fill={color} opacity="0.8" filter="url(#glow-ag)">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="60" r="2.5" fill={color} opacity="0.8" filter="url(#glow-ag)">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ChromaticNumber({ value }: { value: string | number }) {
  return (
    <div className="relative inline-block">
      <span className="text-transparent">{value}</span>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ color: "#ff0033", filter: "blur(0.5px)", transform: "translateX(-0.5px)", position: "absolute" }}>{value}</span>
        <span style={{ color: "#00ffee", filter: "blur(0.5px)", transform: "translateX(0.5px)", position: "absolute" }}>{value}</span>
        <span style={{ color: "inherit", position: "relative" }}>{value}</span>
      </div>
    </div>
  );
}

export default async function AgentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  const limit   = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  const usedPct = Math.min(100, (agents.length / limit) * 100);

  const totalRuns = await prisma.run.count({ where: { userId: user.id } });
  const successRuns = await prisma.run.count({
    where: { userId: user.id, status: { in: ["success", "completed", "COMPLETED"] } },
  });
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;

  const CSS = `
    @property --ang { syntax:'<angle>'; initial-value:0deg; inherits:false; }
    @keyframes spin-ang { to { --ang: 360deg; } }
    @keyframes drift-ag {
      0%,100% { transform:translate(0,0); }
      33% { transform:translate(30px,-20px); }
      66% { transform:translate(-20px,30px); }
    }
    @keyframes holo-sweep-ag { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
    @keyframes pulse-dot-ag {
      0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(124,58,237,0.6); }
      50% { opacity:0.8; box-shadow:0 0 0 6px rgba(124,58,237,0); }
    }
    @keyframes breathe-ag { 0%,100%{opacity:0.3} 50%{opacity:0.8} }

    body { background:#0a0e27; color:#e0e7ff; }

    .aurora-ag { position:fixed;inset:0;pointer-events:none;z-index:0; }
    .aurora-blob-ag { position:absolute;border-radius:50%;filter:blur(80px);animation:drift-ag 8s ease-in-out infinite;opacity:0.15; }
    .blob-1-ag { width:400px;height:400px;background:radial-gradient(circle,#7c3aed,transparent);top:-100px;left:-100px; }
    .blob-2-ag { width:500px;height:500px;background:radial-gradient(circle,#a855f7,transparent);bottom:-150px;right:-150px;animation-delay:2s; }
    .blob-3-ag { width:350px;height:350px;background:radial-gradient(circle,#c4b5fd,transparent);top:50%;left:50%;animation-delay:4s; }
    .blob-4-ag { width:450px;height:450px;background:radial-gradient(circle,#6d28d9,transparent);top:40%;right:10%;animation-delay:6s; }

    .container-ag { position:relative;z-index:1;max-width:1400px;margin:0 auto;padding:2rem; }

    .hero-banner-ag {
      position:relative;border-radius:16px;padding:3rem 2rem;margin-bottom:3rem;
      border:1px solid rgba(124,58,237,0.3);overflow:hidden;display:flex;align-items:center;gap:2rem;
      animation:spin-ang 6s linear infinite;
      background-image:conic-gradient(from var(--ang),#7c3aed,#a855f7,#c4b5fd,#7c3aed);
      background-clip:padding-box;
    }
    .hero-banner-ag::before {
      content:'';position:absolute;inset:1px;border-radius:15px;
      background:linear-gradient(135deg,rgba(10,14,39,0.95),rgba(20,24,50,0.95));pointer-events:none;
    }
    .hero-content-ag { position:relative;z-index:1;flex:1; }
    .hero-icon-ag { position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center;z-index:2; }
    .hero-title-ag {
      font-size:2.5rem;font-weight:700;margin-bottom:0.5rem;
      background:linear-gradient(135deg,#c4b5fd,#a855f7,#7c3aed);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .hero-subtitle-ag { font-size:1rem;color:#a0aec0; }

    .stats-grid-ag { display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin-bottom:3rem; }
    .stat-card-ag {
      position:relative;border-radius:12px;padding:1.5rem;
      animation:spin-ang 6s linear infinite;
      background-image:conic-gradient(from var(--ang),#7c3aed,#a855f7,#c4b5fd,#7c3aed);
      background-clip:padding-box;transition:all 0.3s ease;
    }
    .stat-card-ag::before {
      content:'';position:absolute;inset:1px;border-radius:11px;
      background:linear-gradient(135deg,rgba(10,14,39,0.9),rgba(20,24,50,0.9));pointer-events:none;z-index:1;
    }
    .stat-card-ag:hover { transform:translateY(-4px);box-shadow:0 20px 40px rgba(124,58,237,0.15); }
    .stat-label-ag { position:relative;z-index:2;font-size:0.75rem;color:#a0aec0;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem; }
    .stat-value-ag { position:relative;z-index:2;font-size:2.5rem;font-weight:700;color:#e0e7ff;margin-bottom:0.75rem; }
    .stat-content-ag { position:relative;z-index:2;height:48px; }
    .circuit-ag { position:relative;height:40px; }
    .holo3d-ag { transform-style:preserve-3d;transition:transform 0.3s ease; }

    .section-title-ag {
      font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;color:#e0e7ff;
      display:flex;align-items:center;gap:0.75rem;
    }
    .section-title-ag::after { content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(124,58,237,0.5),transparent); }

    .agent-card-ag {
      position:relative;border-radius:12px;padding:1.5rem;
      animation:spin-ang 6s linear infinite;
      background-image:conic-gradient(from var(--ang),#7c3aed,#a855f7,#c4b5fd,#7c3aed);
      background-clip:padding-box;transition:all 0.3s ease;
      text-decoration:none;display:block;
    }
    .agent-card-ag::before {
      content:'';position:absolute;inset:1px;border-radius:11px;
      background:linear-gradient(135deg,rgba(10,14,39,0.88),rgba(20,24,50,0.88));pointer-events:none;z-index:1;
    }
    .agent-card-ag::after {
      content:'';position:absolute;inset:0;border-radius:12px;
      background:linear-gradient(135deg,transparent,rgba(124,58,237,0.06),transparent);
      animation:holo-sweep-ag 3s ease-in-out infinite;pointer-events:none;z-index:2;
    }
    .agent-card-ag:hover { transform:translateY(-4px);box-shadow:0 20px 40px rgba(124,58,237,0.15); }
    .agent-inner-ag { position:relative;z-index:3;display:flex;align-items:center;gap:1.25rem; }

    .online-dot-ag {
      width:8px;height:8px;border-radius:50%;background:#10b981;
      box-shadow:0 0 8px rgba(16,185,129,0.8);
      animation:pulse-dot-ag 2.4s ease infinite;
    }

    .agents-grid-ag { display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.25rem;margin-bottom:3rem; }

    .hire-form-ag {
      position:relative;border-radius:14px;overflow:hidden;margin-bottom:3rem;
      animation:spin-ang 6s linear infinite;
      background-image:conic-gradient(from var(--ang),#7c3aed,#a855f7,#c4b5fd,#7c3aed);
      background-clip:padding-box;
    }
    .hire-form-ag::before {
      content:'';position:absolute;inset:1px;border-radius:13px;
      background:linear-gradient(135deg,rgba(10,14,39,0.95),rgba(20,24,50,0.95));pointer-events:none;z-index:1;
    }
    .hire-form-inner-ag { position:relative;z-index:2;padding:2rem; }
    .hire-form-header-ag {
      display:flex;align-items:center;gap:1rem;margin-bottom:2rem;
      padding-bottom:1.5rem;border-bottom:1px solid rgba(124,58,237,0.2);
    }
    .form-input-ag {
      width:100%;padding:0.75rem 1rem;border-radius:8px;
      background:rgba(124,58,237,0.06);border:1px solid rgba(124,58,237,0.2);
      color:#e0e7ff;font-size:0.875rem;outline:none;
      box-sizing:border-box;font-family:inherit;
      transition:border-color 0.2s,box-shadow 0.2s;
    }
    .form-input-ag::placeholder { color:#4b5563; }
    .form-input-ag:focus { border-color:rgba(124,58,237,0.6);box-shadow:0 0 0 3px rgba(124,58,237,0.12); }
    .form-label-ag { display:block;font-size:0.7rem;font-weight:700;color:#a0aec0;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.4rem; }
    .form-grid-ag { display:grid;grid-template-columns:1fr 1fr;gap:1.25rem; }

    .hire-btn-ag {
      display:inline-flex;align-items:center;gap:0.75rem;
      padding:1rem 2rem;border-radius:10px;
      background:linear-gradient(135deg,#7c3aed,#a855f7);
      color:#fff;font-weight:700;font-size:1rem;
      border:none;cursor:pointer;transition:all 0.3s ease;
      box-shadow:0 12px 35px rgba(124,58,237,0.4);
    }
    .hire-btn-ag:hover { transform:translateY(-2px);box-shadow:0 16px 45px rgba(124,58,237,0.5); }

    .preset-chip-ag {
      display:inline-flex;align-items:center;gap:0.5rem;
      padding:0.5rem 1rem;border-radius:8px;font-size:0.8rem;font-weight:600;
      border:1px solid;cursor:default;transition:all 0.2s ease;
    }
    .preset-chip-ag:hover { transform:translateY(-2px); }

    .limit-banner-ag {
      display:flex;align-items:center;gap:1.25rem;
      padding:1.25rem 1.5rem;border-radius:12px;margin-bottom:3rem;
      background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.25);
    }

    .empty-state-ag {
      text-align:center;padding:4rem 2rem;border-radius:14px;margin-bottom:3rem;
      background:rgba(124,58,237,0.04);border:1px dashed rgba(124,58,237,0.25);
    }

    .usage-bar-ag { width:100%;height:8px;border-radius:999px;background:rgba(124,58,237,0.1);overflow:hidden;border:1px solid rgba(124,58,237,0.15); }
    .usage-fill-ag { height:100%;border-radius:999px;background:linear-gradient(90deg,#7c3aed,#a855f7,#c4b5fd);box-shadow:0 0 10px rgba(124,58,237,0.5);transition:width 0.4s; }

    .nav-strip-ag { position:relative;z-index:2;display:flex;gap:1rem;padding-top:2rem;border-top:1px solid rgba(124,58,237,0.2);flex-wrap:wrap; }
    .nav-link-ag { display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;border-radius:8px;background:rgba(124,58,237,0.15);color:#e0e7ff;text-decoration:none;font-weight:500;transition:all 0.3s ease;border:1px solid rgba(124,58,237,0.3); }
    .nav-link-ag:hover { background:rgba(124,58,237,0.25);border-color:rgba(124,58,237,0.5);transform:translateY(-2px); }

    @media(max-width:600px){ .form-grid-ag{grid-template-columns:1fr;} .agents-grid-ag{grid-template-columns:1fr;} }
  `;

  const CANVAS_SCRIPT = `
(function(){
  const canvas=document.getElementById('nn-canvas-ag');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  canvas.width=canvas.offsetWidth*window.devicePixelRatio;
  canvas.height=canvas.offsetHeight*window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio,window.devicePixelRatio);
  const nodes=[];
  const colors=['#7c3aed','#a855f7','#c4b5fd','#6d28d9'];
  for(let i=0;i<40;i++){
    nodes.push({x:Math.random()*canvas.offsetWidth,y:Math.random()*canvas.offsetHeight,
      vx:(Math.random()-0.5)*0.5,vy:(Math.random()-0.5)*0.5,color:colors[Math.floor(Math.random()*colors.length)]});
  }
  function animate(){
    ctx.fillStyle='rgba(10,14,39,0.05)';ctx.fillRect(0,0,canvas.offsetWidth,canvas.offsetHeight);
    nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>canvas.offsetWidth)n.vx*=-1;if(n.y<0||n.y>canvas.offsetHeight)n.vy*=-1;});
    nodes.forEach((n,i)=>{for(let j=i+1;j<nodes.length;j++){const o=nodes[j];const dx=n.x-o.x,dy=n.y-o.y,d=Math.sqrt(dx*dx+dy*dy);if(d<150){ctx.beginPath();ctx.strokeStyle=n.color+Math.floor((1-d/150)*0.3*255).toString(16).padStart(2,'0');ctx.lineWidth=0.5;ctx.moveTo(n.x,n.y);ctx.lineTo(o.x,o.y);ctx.stroke();}}});
    nodes.forEach(n=>{ctx.fillStyle=n.color;ctx.shadowColor=n.color;ctx.shadowBlur=10;ctx.beginPath();ctx.arc(n.x,n.y,2.5,0,Math.PI*2);ctx.fill();});
    requestAnimationFrame(animate);
  }
  animate();
})();
  `;

  const PARALLAX_SCRIPT = `
document.addEventListener('mousemove',function(e){
  document.querySelectorAll('.holo3d-ag').forEach(card=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-0.5,y=(e.clientY-r.top)/r.height-0.5;
    card.style.transform='perspective(1000px) rotateX('+(y*5)+'deg) rotateY('+(-x*5)+'deg)';
  });
});
  `;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="aurora-ag">
        <canvas id="nn-canvas-ag" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }} />
        <div className="aurora-blob-ag blob-1-ag" />
        <div className="aurora-blob-ag blob-2-ag" />
        <div className="aurora-blob-ag blob-3-ag" />
        <div className="aurora-blob-ag blob-4-ag" />
      </div>

      <div className="container-ag">

        {/* ── HERO BANNER ── */}
        <div className="hero-banner-ag holo3d-ag">
          <div className="hero-icon-ag">
            <div style={{
              position: "absolute", width: 80, height: 80, borderRadius: "50%",
              animation: "spin-ang 8s linear infinite",
              backgroundImage: "conic-gradient(from var(--ang),#7c3aed,#a855f7,#c4b5fd,#7c3aed)",
              backgroundClip: "padding-box",
            } as React.CSSProperties}>
              <div style={{
                position: "absolute", inset: 1, borderRadius: "50%",
                background: "linear-gradient(135deg,rgba(10,14,39,0.9),rgba(20,24,50,0.9))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Brain size={36} style={{ color: "#a855f7" }} />
              </div>
            </div>
          </div>
          <div className="hero-content-ag">
            <h1 className="hero-title-ag">
              AI{" "}
              <span style={{ display: "inline", position: "relative" }}>
                <span style={{ color: "#ff0033", filter: "blur(0.5px)", transform: "translateX(-0.5px)", position: "absolute" }}>Employees</span>
                <span style={{ color: "#00ffee", filter: "blur(0.5px)", transform: "translateX(0.5px)", position: "absolute" }}>Employees</span>
                <span style={{ color: "inherit", position: "relative" }}>Employees</span>
              </span>
            </h1>
            <p className="hero-subtitle-ag">
              {agents.length} agent{agents.length !== 1 ? "s" : ""} deployed · {limit - agents.length} slot{limit - agents.length !== 1 ? "s" : ""} remaining · always on, never tired
            </p>
          </div>
          {/* Usage bar in hero */}
          <div style={{ position: "relative", zIndex: 2, minWidth: 160 }}>
            <div style={{ fontSize: "0.7rem", color: "#a0aec0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
              Headcount {agents.length} / {limit}
            </div>
            <div className="usage-bar-ag">
              <div className="usage-fill-ag" style={{ width: `${usedPct}%` }} />
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className="stats-grid-ag">
          {[
            { label: "Agents Deployed", value: agents.length, seed: 1, color: "#7c3aed" },
            { label: "Headcount Limit", value: limit,          seed: 2, color: "#a855f7" },
            { label: "Total Runs",      value: totalRuns,       seed: 3, color: "#c4b5fd" },
            { label: "Success Rate",    value: `${successRate}%`, seed: 4, color: "#8b5cf6" },
          ].map(s => (
            <div key={s.label} className="stat-card-ag holo3d-ag">
              <div className="stat-label-ag">{s.label}</div>
              <div className="stat-value-ag"><ChromaticNumber value={s.value} /></div>
              <div className="stat-content-ag">
                <div className="circuit-ag"><CircuitTrace color={s.color} /></div>
                <MiniWave color={s.color} seed={s.seed} />
              </div>
            </div>
          ))}
        </div>

        {/* ── AGENT CARDS ── */}
        {agents.length > 0 ? (
          <>
            <h2 className="section-title-ag">
              <Users size={20} style={{ color: "#a855f7" }} />
              Your Workforce
            </h2>
            <div className="agents-grid-ag">
              {agents.map((a, i) => {
                const initials = a.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
                const color    = PALETTE[i % PALETTE.length];
                return (
                  <Link key={a.id} href={`/dashboard/agents/${a.id}`} className="agent-card-ag holo3d-ag">
                    <div className="agent-inner-ag">
                      {/* Avatar */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: `linear-gradient(135deg,${color}bb,${color}66)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 900, color: "#fff",
                        boxShadow: `0 0 20px ${color}44`,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, color: "#e0e7ff", fontSize: "0.95rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {a.name}
                          </span>
                          <span style={{
                            fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                            background: `${color}18`, color, border: `1px solid ${color}30`,
                            letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
                          }}>
                            {a.role}
                          </span>
                        </div>
                        {a.description && (
                          <p style={{ fontSize: "0.78rem", color: "#a0aec0", lineHeight: 1.5,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {a.description}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4,
                            padding: "2px 8px", borderRadius: 999,
                            background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <Zap size={9} color="#f59e0b" />
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#f59e0b" }}>{a._count.runs} runs</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span className="online-dot-ag" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.8)" }} />
                            <span style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 700 }}>ACTIVE</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={16} style={{ color: "#4b5563", flexShrink: 0, transition: "transform 0.2s" }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <div className="empty-state-ag">
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 1.25rem",
              background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Users size={30} style={{ color: "#7c3aed" }} />
            </div>
            <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#e0e7ff", marginBottom: 6 }}>No employees deployed</h3>
            <p style={{ color: "#a0aec0", fontSize: "0.875rem" }}>Hire your first AI employee using the form below.</p>
          </div>
        )}

        {/* ── HIRE FORM ── */}
        {agents.length < limit && (
          <>
            <h2 className="section-title-ag">
              <Plus size={20} style={{ color: "#a855f7" }} />
              Hire New Employee
            </h2>
            <div className="hire-form-ag">
              <div className="hire-form-inner-ag">
                <div className="hire-form-header-ag">
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Brain size={20} style={{ color: "#a855f7" }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#e0e7ff", fontSize: "1.05rem" }}>Deploy New AI Employee</div>
                    <div style={{ fontSize: "0.8rem", color: "#a0aec0" }}>Available 24/7 · Deploys instantly</div>
                  </div>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={14} style={{ color: "#a855f7" }} />
                    <span style={{ fontSize: "0.8rem", color: "#7c3aed", fontWeight: 600 }}>AI-Powered</span>
                  </div>
                </div>

                {/* Role presets */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a0aec0", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
                    Quick Role Presets
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {ROLE_PRESETS.map(p => (
                      <div key={p.label} className="preset-chip-ag" style={{
                        borderColor: `${p.color}30`, background: `${p.color}0d`, color: p.color,
                      }}>
                        <span style={{ fontWeight: 800 }}>{p.label}</span>
                        <span style={{ color: "#a0aec0", fontWeight: 400, fontSize: "0.75rem" }}>· {p.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <form action={createAgent}>
                  <div className="form-grid-ag" style={{ marginBottom: "1.25rem" }}>
                    <div>
                      <label className="form-label-ag">Employee Name</label>
                      <input className="form-input-ag" name="name" required placeholder="Nova — AI Outbound" />
                    </div>
                    <div>
                      <label className="form-label-ag">Role / Title</label>
                      <input className="form-input-ag" name="role" required placeholder="SDR, Copywriter, Analyst" />
                    </div>
                  </div>
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label className="form-label-ag">Description</label>
                    <input className="form-input-ag" name="description" placeholder="Brief description shown in the dashboard" />
                  </div>
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label className="form-label-ag">System Prompt — defines behavior</label>
                    <textarea className="form-input-ag" name="systemPrompt" required rows={5}
                      placeholder="You are an expert SDR who specializes in cold outreach. Your goal is to..." />
                  </div>
                  <div style={{ marginBottom: "1.75rem" }}>
                    <label className="form-label-ag">Knowledge / Playbook (optional)</label>
                    <textarea className="form-input-ag" name="knowledge" rows={4}
                      placeholder="Paste company context, playbook, FAQs, pricing, or anything the agent should know..." />
                  </div>
                  <button type="submit" className="hire-btn-ag">
                    <Plus size={18} />
                    Deploy Employee
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ── LIMIT REACHED ── */}
        {agents.length >= limit && (
          <div className="limit-banner-ag">
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={20} style={{ color: "#a855f7" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: "#e0e7ff", marginBottom: 4 }}>Headcount limit reached</div>
              <div style={{ fontSize: "0.85rem", color: "#a0aec0" }}>You&apos;ve deployed {limit} of {limit} employees on your current plan.</div>
            </div>
            <Link href="/dashboard/billing" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "0.75rem 1.5rem", borderRadius: 10,
              background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff",
              fontWeight: 700, fontSize: "0.875rem", textDecoration: "none",
              boxShadow: "0 8px 24px rgba(124,58,237,0.35)",
            }}>
              <Sparkles size={14} />
              Upgrade Plan
            </Link>
          </div>
        )}

        <div className="nav-strip-ag">
          <Link href="/dashboard" className="nav-link-ag"><Activity size={16} />Overview</Link>
          <Link href="/dashboard/runs" className="nav-link-ag"><Zap size={16} />Runs</Link>
          <Link href="/dashboard/billing" className="nav-link-ag"><Sparkles size={16} />Billing</Link>
          <Link href="/dashboard/settings" className="nav-link-ag"><Bot size={16} />Settings</Link>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: CANVAS_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: PARALLAX_SCRIPT }} />
    </div>
  );
}
