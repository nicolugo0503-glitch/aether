import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Activity, Zap, TrendingUp, Target, BarChart3 } from "lucide-react";

export const metadata = {
  title: "Execution Chronicle | Aether Dashboard",
};

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function MiniWave({ color, seed }: { color: string; seed: number }) {
  const heights = Array.from({ length: 16 }, (_, i) => {
    const rand = seedHash(`${seed}-${i}`) % 100;
    return 30 + rand;
  });

  return (
    <svg viewBox="0 0 160 60" className="w-full h-6" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-run-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <g key={i}>
          <rect x={i * 10} y={60 - h} width="8" height={h} fill={`url(#grad-run-${seed})`}>
            <animate attributeName="height" values={`${h};${h * 1.3};${h * 0.7};${h}`} dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="y" values={`${60 - h};${60 - h * 1.3};${60 - h * 0.7};${60 - h}`} dur="2.4s" repeatCount="indefinite" />
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
        <filter id="glow-run" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M 10 40 L 50 40 L 50 20 L 100 20 L 100 60 L 150 60 L 150 40 L 190 40"
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.6" filter="url(#glow-run)" strokeDasharray="300">
        <animate attributeName="strokeDashoffset" from="300" to="0" dur="3s" repeatCount="indefinite" />
      </path>
      <circle cx="50" cy="40" r="2.5" fill={color} opacity="0.8" filter="url(#glow-run)">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="60" r="2.5" fill={color} opacity="0.8" filter="url(#glow-run)">
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

function StatusPulse({ status }: { status: string }) {
  const cfg: Record<string, { color: string; label: string }> = {
    COMPLETED: { color: "#10b981", label: "COMPLETED" },
    FAILED: { color: "#ef4444", label: "FAILED" },
    RUNNING: { color: "#f59e0b", label: "RUNNING" },
    PENDING: { color: "#6366f1", label: "PENDING" },
  };
  const c = cfg[status] || { color: "#71717a", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.4rem",
      padding: "0.3rem 0.75rem", borderRadius: "20px",
      background: `${c.color}1e`, border: `1px solid ${c.color}44`,
      fontSize: "0.72rem", fontWeight: 700, color: c.color, letterSpacing: "0.05em",
    }}>
      <span style={{
        width: "6px", height: "6px", borderRadius: "50%",
        background: c.color, boxShadow: `0 0 8px ${c.color}`,
        display: "inline-block",
        animation: status === "RUNNING" ? "breathe-run 1s ease-in-out infinite" : "none",
      }} />
      {c.label}
    </span>
  );
}

export default async function RunsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const runs = await prisma.run.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { agent: { select: { name: true } } },
  });

  const completedRuns = runs.filter((r) => r.status === "COMPLETED").length;
  const failedRuns = runs.filter((r) => r.status === "FAILED").length;
  const runningRuns = runs.filter((r) => r.status === "RUNNING").length;
  const successRate = runs.length > 0 ? Math.round((completedRuns / runs.length) * 100) : 0;

  const CSS = `
    @property --ang {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    @keyframes spin-ang { to { --ang: 360deg; } }
    @keyframes orbit-1 {
      0% { transform: rotate(0deg) translateX(10px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(10px) rotate(-360deg); }
    }
    @keyframes orbit-2 {
      0% { transform: rotate(120deg) translateX(10px) rotate(-120deg); }
      100% { transform: rotate(480deg) translateX(10px) rotate(-480deg); }
    }
    @keyframes drift-run {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(30px, -20px); }
      66% { transform: translate(-20px, 30px); }
    }
    @keyframes holo-sweep-run {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes breathe-run {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.4); }
    }
    body { background: #0a0e27; color: #e0e7ff; }
    .aurora-run { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
    .aurora-blob-run {
      position: absolute; border-radius: 50%; filter: blur(80px);
      animation: drift-run 8s ease-in-out infinite; opacity: 0.15;
    }
    .blob-1-run { width:400px;height:400px;background:radial-gradient(circle,#f59e0b,transparent);top:-100px;left:-100px; }
    .blob-2-run { width:500px;height:500px;background:radial-gradient(circle,#ef4444,transparent);bottom:-150px;right:-150px;animation-delay:2s; }
    .blob-3-run { width:350px;height:350px;background:radial-gradient(circle,#10b981,transparent);top:50%;left:50%;animation-delay:4s; }
    .blob-4-run { width:450px;height:450px;background:radial-gradient(circle,#f97316,transparent);top:40%;right:10%;animation-delay:6s; }
    .container-run { position:relative;z-index:1;max-width:1400px;margin:0 auto;padding:2rem; }
    .hero-banner-run {
      position:relative;border-radius:16px;padding:3rem 2rem;margin-bottom:3rem;
      border:1px solid rgba(245,158,11,0.3);overflow:hidden;display:flex;align-items:center;gap:2rem;
      animation:spin-ang 6s linear infinite;
      background-image:conic-gradient(from var(--ang),#f59e0b,#ef4444,#f97316,#f59e0b);
      background-clip:padding-box;
    }
    .hero-banner-run::before {
      content:'';position:absolute;inset:1px;border-radius:15px;
      background:linear-gradient(135deg,rgba(10,14,39,0.95),rgba(20,24,50,0.95));pointer-events:none;
    }
    .hero-content-run { position:relative;z-index:1;flex:1; }
    .hero-icon-run { position:relative;width:120px;height:120px;display:flex;align-items:center;justify-content:center;z-index:2; }
    .hero-title-run {
      font-size:2.5rem;font-weight:700;margin-bottom:0.5rem;
      background:linear-gradient(135deg,#f59e0b,#ef4444,#f97316);
      -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
    }
    .hero-subtitle-run { font-size:1rem;color:#a0aec0; }
    .stats-grid-run { display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1.5rem;margin-bottom:3rem; }
    .stat-card-run {
      position:relative;border-radius:12px;padding:1.5rem;
      animation:spin-ang 6s linear infinite;
      background-image:conic-gradient(from var(--ang),#f59e0b,#ef4444,#f97316,#f59e0b);
      background-clip:padding-box;transition:all 0.3s ease;
    }
    .stat-card-run::before {
      content:'';position:absolute;inset:1px;border-radius:11px;
      background:linear-gradient(135deg,rgba(10,14,39,0.9),rgba(20,24,50,0.9));pointer-events:none;z-index:1;
    }
    .stat-card-run:hover { transform:translateY(-4px);box-shadow:0 20px 40px rgba(245,158,11,0.15); }
    .stat-label-run { position:relative;z-index:2;font-size:0.75rem;color:#a0aec0;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.5rem; }
    .stat-value-run { position:relative;z-index:2;font-size:2.5rem;font-weight:700;color:#e0e7ff;margin-bottom:0.75rem; }
    .stat-content-run { position:relative;z-index:2;height:48px; }
    .circuit-run { position:relative;height:40px; }
    .miniwave-run { height:24px; }
    .holo3d-run { transform-style:preserve-3d;transition:transform 0.3s ease; }
    .section-title-run {
      font-size:1.5rem;font-weight:700;margin-bottom:1.5rem;color:#e0e7ff;
      display:flex;align-items:center;gap:0.75rem;
    }
    .section-title-run::after { content:'';flex:1;height:1px;background:linear-gradient(90deg,rgba(245,158,11,0.4),transparent); }
    .run-row-run {
      position:relative;border-radius:10px;padding:1.25rem 1.5rem;margin-bottom:0.75rem;
      border:1px solid rgba(245,158,11,0.15);
      animation:spin-ang 6s linear infinite;
      background-image:conic-gradient(from var(--ang),#f59e0b,#ef4444,#f97316,#f59e0b);
      background-clip:padding-box;transition:all 0.3s ease;
    }
    .run-row-run::before {
      content:'';position:absolute;inset:1px;border-radius:9px;
      background:linear-gradient(135deg,rgba(10,14,39,0.85),rgba(20,24,50,0.85));pointer-events:none;z-index:1;
    }
    .run-row-run::after {
      content:'';position:absolute;inset:0;border-radius:10px;
      background:linear-gradient(135deg,transparent,rgba(245,158,11,0.08),transparent);
      animation:holo-sweep-run 3s ease-in-out infinite;pointer-events:none;
    }
    .run-row-run:hover { border-color:rgba(245,158,11,0.3);transform:translateY(-2px);box-shadow:0 12px 30px rgba(245,158,11,0.1); }
    .run-inner-run { position:relative;z-index:2;display:flex;align-items:center;gap:1.25rem;width:100%;flex-wrap:wrap; }
    .run-number-run { font-size:0.75rem;color:#a0aec0;min-width:40px;font-family:monospace; }
    .run-agent-run { font-weight:600;color:#e0e7ff;flex:1;min-width:150px; }
    .run-time-run { font-size:0.8rem;color:#a0aec0; }
    .run-cost-run { font-size:0.875rem;font-weight:600;color:#10b981; }
    .run-output-run { font-size:0.75rem;color:#71717a;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .nav-strip-run {
      position:relative;z-index:2;display:flex;gap:1rem;padding-top:2rem;
      border-top:1px solid rgba(245,158,11,0.2);flex-wrap:wrap;
    }
    .nav-link-run {
      display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;
      border-radius:8px;background:rgba(245,158,11,0.15);color:#e0e7ff;
      text-decoration:none;font-weight:500;transition:all 0.3s ease;
      border:1px solid rgba(245,158,11,0.3);
    }
    .nav-link-run:hover { background:rgba(245,158,11,0.25);border-color:rgba(245,158,11,0.5);transform:translateY(-2px); }
  `;

  const CANVAS_SCRIPT = `
(function() {
  const canvas = document.getElementById('nn-canvas-run');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  const nodes = [];
  const colors = ['#f59e0b','#ef4444','#10b981','#f97316'];
  for (let i = 0; i < 40; i++) {
    nodes.push({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
  function animate() {
    ctx.fillStyle = 'rgba(10,14,39,0.05)';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > canvas.offsetWidth) n.vx *= -1;
      if (n.y < 0 || n.y > canvas.offsetHeight) n.vy *= -1;
    });
    nodes.forEach((n, i) => {
      for (let j = i+1; j < nodes.length; j++) {
        const o = nodes[j];
        const dx = n.x-o.x, dy = n.y-o.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 150) {
          ctx.beginPath();
          ctx.strokeStyle = n.color + Math.floor((1-d/150)*0.3*255).toString(16).padStart(2,'0');
          ctx.lineWidth = 0.5;
          ctx.moveTo(n.x,n.y); ctx.lineTo(o.x,o.y); ctx.stroke();
        }
      }
    });
    nodes.forEach(n => {
      ctx.fillStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(n.x,n.y,2.5,0,Math.PI*2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
})();
  `;

  const PARALLAX_SCRIPT = `
document.addEventListener('mousemove', function(e) {
  const cards = document.querySelectorAll('.holo3d-run');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = \`perspective(1000px) rotateX(\${y*5}deg) rotateY(\${-x*5}deg)\`;
  });
});
  `;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Aurora Neural Background */}
      <div className="aurora-run">
        <canvas id="nn-canvas-run"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4 }} />
        <div className="aurora-blob-run blob-1-run" />
        <div className="aurora-blob-run blob-2-run" />
        <div className="aurora-blob-run blob-3-run" />
        <div className="aurora-blob-run blob-4-run" />
      </div>

      <div className="container-run">
        {/* Hero Banner */}
        <div className="hero-banner-run holo3d-run">
          <div className="hero-icon-run">
            <div style={{
              position: "absolute", width: "80px", height: "80px", borderRadius: "50%",
              background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.2))",
              border: "1px solid rgba(245,158,11,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "spin-ang 8s linear infinite",
              backgroundImage: "conic-gradient(from var(--ang),#f59e0b,#ef4444,#f97316,#f59e0b)",
              backgroundClip: "padding-box",
            } as any}>
              <div style={{
                position: "absolute", inset: "1px", borderRadius: "50%",
                background: "linear-gradient(135deg,rgba(10,14,39,0.9),rgba(20,24,50,0.9))",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Activity size={36} style={{ color: "#f59e0b" }} />
              </div>
            </div>
          </div>
          <div className="hero-content-run">
            <h1 className="hero-title-run">
              <span style={{ position: "relative" }}>
                <span style={{ color: "#ff0033", filter: "blur(0.5px)", transform: "translateX(-0.5px)", position: "absolute" }}>
                  Execution Chronicle
                </span>
                <span style={{ color: "#00ffee", filter: "blur(0.5px)", transform: "translateX(0.5px)", position: "absolute" }}>
                  Execution Chronicle
                </span>
                <span style={{ color: "inherit", position: "relative" }}>Execution Chronicle</span>
              </span>
            </h1>
            <p className="hero-subtitle-run">Real-time agent execution telemetry</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-run">
          {[
            { label: "Total Runs", value: runs.length, color: "#f59e0b", seed: 1 },
            { label: "Completed", value: completedRuns, color: "#10b981", seed: 2 },
            { label: "Failed", value: failedRuns, color: "#ef4444", seed: 3 },
            { label: "Success Rate", value: `${successRate}%`, color: "#f97316", seed: 4 },
          ].map((stat) => (
            <div key={stat.label} className="stat-card-run holo3d-run">
              <div className="stat-label-run">{stat.label}</div>
              <div className="stat-value-run" style={{ color: stat.color }}>
                <ChromaticNumber value={stat.value} />
              </div>
              <div className="stat-content-run">
                <div className="circuit-run">
                  <CircuitTrace color={stat.color} />
                </div>
                <div className="miniwave-run">
                  <MiniWave color={stat.color} seed={stat.seed} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Runs List */}
        <div style={{ marginBottom: "3rem" }}>
          <div className="section-title-run">
            <Activity size={20} style={{ color: "#f59e0b" }} />
            Recent Executions
          </div>

          {runs.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "4rem", color: "#a0aec0",
              background: "rgba(245,158,11,0.05)", borderRadius: "12px",
              border: "1px solid rgba(245,158,11,0.15)",
            }}>
              <Activity size={48} style={{ color: "#f59e0b", margin: "0 auto 1rem", opacity: 0.5 }} />
              <p>No executions yet. Run an agent to see results here.</p>
            </div>
          ) : (
            <div>
              {runs.map((run, idx) => (
                <div key={run.id} className="run-row-run">
                  <div className="run-inner-run">
                    <span className="run-number-run">#{String(idx + 1).padStart(3, "0")}</span>
                    <span className="run-agent-run">
                      {(run as any).agent?.name || "Unknown Agent"}
                    </span>
                    <StatusPulse status={run.status} />
                    <span className="run-time-run">
                      {new Date(run.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    {(run as any).cost != null && (
                      <span className="run-cost-run">
                        ${((run as any).cost / 100).toFixed(4)}
                      </span>
                    )}
                    {(run as any).output && (
                      <span className="run-output-run">
                        {(run as any).output.substring(0, 80)}...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="nav-strip-run">
          <Link href="/dashboard" className="nav-link-run">
            <BarChart3 size={16} />Overview
          </Link>
          <Link href="/dashboard/agents" className="nav-link-run">
            <Zap size={16} />Agents
          </Link>
          <Link href="/dashboard/campaigns" className="nav-link-run">
            <TrendingUp size={16} />Campaigns
          </Link>
          <Link href="/dashboard/social" className="nav-link-run">
            <Target size={16} />Social
          </Link>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: CANVAS_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: PARALLAX_SCRIPT }} />
    </div>
  );
}
