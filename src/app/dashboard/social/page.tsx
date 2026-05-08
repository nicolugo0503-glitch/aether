import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Share2, TrendingUp, MessageCircle, BarChart3, Zap, Activity } from "lucide-react";

export const metadata = {
  title: "Social Intelligence Hub | Aether Dashboard",
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
    <svg
      viewBox="0 0 160 60"
      className="w-full h-6"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <g key={i}>
          <rect
            x={i * 10}
            y={60 - h}
            width="8"
            height={h}
            fill={`url(#grad-${seed})`}
          >
            <animate
              attributeName="height"
              values={`${h};${h * 1.3};${h * 0.7};${h}`}
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="y"
              values={`${60 - h};${60 - h * 1.3};${60 - h * 0.7};${60 - h}`}
              dur="2.4s"
              repeatCount="indefinite"
            />
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
        <filter id="glow-soc" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M 10 40 L 50 40 L 50 20 L 100 20 L 100 60 L 150 60 L 150 40 L 190 40"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
        filter="url(#glow-soc)"
      >
        <animate
          attributeName="strokeDashoffset"
          from="300"
          to="0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
      <circle cx="50" cy="40" r="2.5" fill={color} opacity="0.8" filter="url(#glow-soc)">
        <animate
          attributeName="r"
          values="2.5;3.5;2.5"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="150" cy="60" r="2.5" fill={color} opacity="0.8" filter="url(#glow-soc)">
        <animate
          attributeName="r"
          values="2.5;3.5;2.5"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function OrbitalAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          animation: "spin-ang 8s linear infinite",
          "--ang": "0deg",
        } as any}
      >
        <defs>
          <style>{`
            @property --ang {
              syntax: '<angle>';
              initial-value: 0deg;
              inherits: false;
            }
            @keyframes spin-ang {
              to { --ang: 360deg; }
            }
          `}</style>
        </defs>
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          stroke={`conic-gradient(from var(--ang), ${color}, #00ffee, #ff0033, ${color})`}
          strokeWidth="2"
          opacity="0.6"
        />
      </svg>
      <div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          bottom: "2px",
          right: "2px",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: "orbit-1 4s linear infinite",
        }}
      />
      <div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          bottom: "2px",
          left: "2px",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          animation: "orbit-2 4s linear infinite",
        }}
      />
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${color}88, ${color}44)`,
          border: `1px solid ${color}`,
        }}
      >
        {initials}
      </div>
    </div>
  );
}

function ChromaticNumber({ value }: { value: string | number }) {
  return (
    <div className="relative inline-block">
      <span className="text-transparent">{value}</span>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          style={{
            color: "#ff0033",
            filter: "blur(0.5px)",
            transform: "translateX(-0.5px)",
            position: "absolute",
          }}
        >
          {value}
        </span>
        <span
          style={{
            color: "#00ffee",
            filter: "blur(0.5px)",
            transform: "translateX(0.5px)",
            position: "absolute",
          }}
        >
          {value}
        </span>
        <span style={{ color: "inherit", position: "relative" }}>{value}</span>
      </div>
    </div>
  );
}

export default async function SocialPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    include: { _count: { select: { runs: true } } },
  });

  const runs = await prisma.run.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const successfulRuns = runs.filter((r) => r.status === "COMPLETED").length;

  const CSS = `
    @property --ang {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }

    @keyframes spin-ang {
      to { --ang: 360deg; }
    }

    @keyframes orbit-1 {
      0% { transform: rotate(0deg) translateX(10px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(10px) rotate(-360deg); }
    }

    @keyframes orbit-2 {
      0% { transform: rotate(120deg) translateX(10px) rotate(-120deg); }
      100% { transform: rotate(480deg) translateX(10px) rotate(-480deg); }
    }

    @keyframes drift-soc {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(30px, -20px); }
      66% { transform: translate(-20px, 30px); }
    }

    @keyframes holo-sweep-soc {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    @keyframes breathe-soc {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }

    body {
      background: #0a0e27;
      color: #e0e7ff;
    }

    .aurora-soc {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .aurora-blob-soc {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      animation: drift-soc 8s ease-in-out infinite;
      opacity: 0.15;
    }

    .blob-1-soc {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #06b6d4, transparent);
      top: -100px;
      left: -100px;
    }

    .blob-2-soc {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #0ea5e9, transparent);
      bottom: -150px;
      right: -150px;
      animation-delay: 2s;
    }

    .blob-3-soc {
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, #00d9ff, transparent);
      top: 50%;
      left: 50%;
      animation-delay: 4s;
    }

    .blob-4-soc {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #0891b2, transparent);
      top: 40%;
      right: 10%;
      animation-delay: 6s;
    }

    .container-soc {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero-banner-soc {
      position: relative;
      border-radius: 16px;
      padding: 3rem 2rem;
      margin-bottom: 3rem;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(14, 165, 233, 0.1));
      border: 1px solid rgba(6, 182, 212, 0.3);
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 2rem;
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #06b6d4, #0ea5e9, #00d9ff, #06b6d4);
      background-clip: padding-box;
    }

    .hero-banner-soc::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 15px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(20, 24, 50, 0.95));
      pointer-events: none;
    }

    .hero-content-soc {
      position: relative;
      z-index: 1;
      flex: 1;
    }

    .hero-icon-soc {
      position: relative;
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .hero-title-soc {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #06b6d4, #0ea5e9, #00d9ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle-soc {
      font-size: 1rem;
      color: #a0aec0;
    }

    .platform-grid-soc {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .platform-card-soc {
      position: relative;
      border-radius: 12px;
      padding: 2rem 1.5rem;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(14, 165, 233, 0.05));
      border: 1px solid rgba(6, 182, 212, 0.2);
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #06b6d4, #0ea5e9, #00d9ff, #06b6d4);
      background-clip: padding-box;
      transition: all 0.3s ease;
      text-align: center;
    }

    .platform-card-soc::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(20, 24, 50, 0.8));
      pointer-events: none;
      z-index: 1;
    }

    .platform-card-soc:hover {
      border-color: rgba(6, 182, 212, 0.4);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(6, 182, 212, 0.15);
    }

    .platform-icon-soc {
      position: relative;
      z-index: 2;
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .platform-name-soc {
      position: relative;
      z-index: 2;
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #e0e7ff;
    }

    .platform-active-soc {
      position: relative;
      z-index: 2;
      font-size: 0.875rem;
      color: #a0aec0;
      margin-bottom: 1rem;
    }

    .platform-wave-soc {
      position: relative;
      z-index: 2;
      height: 24px;
      margin-top: 1rem;
    }

    .agents-roster-soc {
      margin-bottom: 3rem;
    }

    .roster-title-soc {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #e0e7ff;
    }

    .roster-grid-soc {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .creator-card-soc {
      position: relative;
      border-radius: 10px;
      padding: 1.25rem;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(14, 165, 233, 0.05));
      border: 1px solid rgba(6, 182, 212, 0.15);
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #06b6d4, #0ea5e9, #00d9ff, #06b6d4);
      background-clip: padding-box;
      transition: all 0.3s ease;
    }

    .creator-card-soc::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 9px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.85), rgba(20, 24, 50, 0.85));
      pointer-events: none;
      z-index: 1;
    }

    .creator-card-soc::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 10px;
      background: linear-gradient(135deg, transparent, rgba(6, 182, 212, 0.1), transparent);
      animation: holo-sweep-soc 3s ease-in-out infinite;
      pointer-events: none;
    }

    .creator-card-soc:hover {
      border-color: rgba(6, 182, 212, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(6, 182, 212, 0.1);
    }

    .creator-header-soc {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .creator-name-soc {
      font-weight: 600;
      color: #e0e7ff;
      flex: 1;
    }

    .creator-role-soc {
      font-size: 0.75rem;
      color: #a0aec0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .creator-stats-soc {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .creator-stat-label-soc {
      color: #a0aec0;
    }

    .creator-stat-value-soc {
      font-weight: 700;
      color: #e0e7ff;
    }

    .analytics-grid-soc {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .analytics-card-soc {
      position: relative;
      border-radius: 12px;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(14, 165, 233, 0.05));
      border: 1px solid rgba(6, 182, 212, 0.2);
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #06b6d4, #0ea5e9, #00d9ff, #06b6d4);
      background-clip: padding-box;
      transition: all 0.3s ease;
    }

    .analytics-card-soc::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(20, 24, 50, 0.8));
      pointer-events: none;
      z-index: 1;
    }

    .analytics-card-soc:hover {
      border-color: rgba(6, 182, 212, 0.4);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(6, 182, 212, 0.15);
    }

    .analytics-label-soc {
      position: relative;
      z-index: 2;
      font-size: 0.875rem;
      color: #a0aec0;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .analytics-value-soc {
      position: relative;
      z-index: 2;
      font-size: 2rem;
      font-weight: 700;
      color: #e0e7ff;
      margin-bottom: 0.75rem;
    }

    .analytics-wave-soc {
      position: relative;
      z-index: 2;
      height: 24px;
    }

    .pipeline-title-soc {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #e0e7ff;
    }

    .pipeline-rows-soc {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .pipeline-row-soc {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 8px;
      background: rgba(6, 182, 212, 0.08);
      border: 1px solid rgba(6, 182, 212, 0.15);
      transition: all 0.3s ease;
    }

    .pipeline-row-soc:hover {
      background: rgba(6, 182, 212, 0.12);
      border-color: rgba(6, 182, 212, 0.25);
    }

    .pipeline-avatar-soc {
      flex-shrink: 0;
    }

    .pipeline-info-soc {
      flex: 1;
      min-width: 0;
    }

    .pipeline-title-text-soc {
      font-weight: 600;
      color: #e0e7ff;
      margin-bottom: 0.25rem;
    }

    .pipeline-time-soc {
      font-size: 0.875rem;
      color: #a0aec0;
    }

    .pipeline-count-soc {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      background: rgba(6, 182, 212, 0.15);
      font-size: 0.875rem;
      font-weight: 600;
      color: #06b6d4;
      flex-shrink: 0;
    }

    .nav-strip-soc {
      position: relative;
      z-index: 2;
      display: flex;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(6, 182, 212, 0.2);
      flex-wrap: wrap;
    }

    .nav-link-soc {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      background: rgba(6, 182, 212, 0.15);
      color: #e0e7ff;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      border: 1px solid rgba(6, 182, 212, 0.3);
    }

    .nav-link-soc:hover {
      background: rgba(6, 182, 212, 0.25);
      border-color: rgba(6, 182, 212, 0.5);
      transform: translateY(-2px);
    }
  `;

  const CANVAS_SCRIPT = `
(function() {
  const canvas = document.getElementById('nn-canvas-soc');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  const nodes = [];
  const colors = ['#06b6d4', '#0ea5e9', '#00d9ff'];
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
    ctx.fillStyle = 'rgba(10, 14, 39, 0.05)';
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    
    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > canvas.offsetWidth) n.vx *= -1;
      if (n.y < 0 || n.y > canvas.offsetHeight) n.vy *= -1;
    });
    
    nodes.forEach((n, i) => {
      for (let j = i + 1; j < nodes.length; j++) {
        const o = nodes[j];
        const dx = n.x - o.x;
        const dy = n.y - o.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 150) {
          ctx.strokeStyle = n.color.replace(')', ', ' + (1 - d/150) * 0.3 + ')');
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(o.x, o.y);
          ctx.stroke();
        }
      }
    });
    
    nodes.forEach(n => {
      ctx.fillStyle = n.color;
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  animate();
})();
  `;

  const PARALLAX_SCRIPT = `
document.addEventListener('mousemove', function(e) {
  const cards = document.querySelectorAll('.holo3d-soc');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotX = y * 5;
    const rotY = -x * 5;
    card.style.transform = \`perspective(1000px) rotateX(\${rotX}deg) rotateY(\${rotY}deg)\`;
  });
});
  `;

  const platformAgentCount = Math.ceil(agents.length / 4);

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{CSS}</style>

      <div className="aurora-soc">
        <div className="aurora-blob-soc blob-1-soc" />
        <div className="aurora-blob-soc blob-2-soc" />
        <div className="aurora-blob-soc blob-3-soc" />
        <div className="aurora-blob-soc blob-4-soc" />
      </div>

      <canvas
        id="nn-canvas-soc"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      <div className="container-soc">
        <div className="hero-banner-soc">
          <div className="hero-icon-soc">
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <svg
                style={{
                  animation: "spin-ang 8s linear infinite",
                  "--ang": "0deg",
                } as any}
                viewBox="0 0 100 100"
                className="absolute inset-0"
              >
                <defs>
                  <style>{`
                    @property --ang {
                      syntax: '<angle>';
                      initial-value: 0deg;
                      inherits: false;
                    }
                    @keyframes spin-ang {
                      to { --ang: 360deg; }
                    }
                  `}</style>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={`conic-gradient(from var(--ang), #06b6d4, #0ea5e9, #00d9ff, #06b6d4)`}
                  strokeWidth="2"
                  opacity="0.8"
                />
              </svg>
              <Share2
                size={60}
                style={{
                  position: "absolute",
                  inset: 0,
                  margin: "auto",
                  color: "#06b6d4",
                  filter: "drop-shadow(0 0 10px #06b6d4)",
                }}
              />
            </div>
          </div>
          <div className="hero-content-soc">
            <h1 className="hero-title-soc">
              Social
              <span style={{ display: "inline", position: "relative" }}>
                <span
                  style={{
                    color: "#ff0033",
                    filter: "blur(0.5px)",
                    transform: "translateX(-0.5px)",
                    position: "absolute",
                  }}
                >
                  Intelligence Hub
                </span>
                <span
                  style={{
                    color: "#00ffee",
                    filter: "blur(0.5px)",
                    transform: "translateX(0.5px)",
                    position: "absolute",
                  }}
                >
                  Intelligence Hub
                </span>
                <span style={{ color: "inherit", position: "relative" }}>
                  Intelligence Hub
                </span>
              </span>
            </h1>
            <p className="hero-subtitle-soc">
              {agents.length} AI agents publishing content across platforms
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem", color: "#e0e7ff" }}>
          Platform Network
        </h2>
        <div className="platform-grid-soc">
          {["Twitter/X", "LinkedIn", "Instagram", "YouTube"].map((platform) => (
            <div key={platform} className="platform-card-soc holo3d-soc">
              <div className="platform-icon-soc">
                {platform === "Twitter/X" && <MessageCircle size={32} color="#06b6d4" />}
                {platform === "LinkedIn" && <TrendingUp size={32} color="#06b6d4" />}
                {platform === "Instagram" && <BarChart3 size={32} color="#06b6d4" />}
                {platform === "YouTube" && <Activity size={32} color="#06b6d4" />}
              </div>
              <div className="platform-name-soc">{platform}</div>
              <div className="platform-active-soc">
                <ChromaticNumber value={platformAgentCount} /> AI agents active
              </div>
              <div className="platform-wave-soc">
                <MiniWave
                  color="#06b6d4"
                  seed={seedHash(platform)}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="agents-roster-soc">
          <h2 className="roster-title-soc">Content Creator Roster</h2>
          <div className="roster-grid-soc">
            {agents.map((agent) => (
              <div key={agent.id} className="creator-card-soc holo3d-soc">
                <div className="creator-header-soc">
                  <OrbitalAvatar
                    initials={agent.name.slice(0, 2).toUpperCase()}
                    color="#06b6d4"
                  />
                  <div>
                    <div className="creator-name-soc">{agent.name}</div>
                    <div className="creator-role-soc">Content Creator</div>
                  </div>
                </div>
                <div className="creator-stats-soc">
                  <span className="creator-stat-label-soc">Posts:</span>
                  <span className="creator-stat-value-soc">
                    <ChromaticNumber value={agent._count.runs} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "1.5rem", color: "#e0e7ff", marginTop: "3rem" }}>
          Social Analytics
        </h2>
        <div className="analytics-grid-soc">
          <div className="analytics-card-soc holo3d-soc">
            <div className="analytics-label-soc">Total Reach</div>
            <div className="analytics-value-soc">
              <ChromaticNumber value="12.4K" />
            </div>
            <div className="analytics-wave-soc">
              <MiniWave color="#06b6d4" seed={10} />
            </div>
          </div>
          <div className="analytics-card-soc holo3d-soc">
            <div className="analytics-label-soc">Engagement Rate</div>
            <div className="analytics-value-soc">
              <ChromaticNumber value="8.3%" />
            </div>
            <div className="analytics-wave-soc">
              <MiniWave color="#0ea5e9" seed={11} />
            </div>
          </div>
          <div className="analytics-card-soc holo3d-soc">
            <div className="analytics-label-soc">Content Pieces</div>
            <div className="analytics-value-soc">
              <ChromaticNumber value={runs.length} />
            </div>
            <div className="analytics-wave-soc">
              <MiniWave color="#00d9ff" seed={12} />
            </div>
          </div>
          <div className="analytics-card-soc holo3d-soc">
            <div className="analytics-label-soc">Active Platforms</div>
            <div className="analytics-value-soc">
              <ChromaticNumber value="4" />
            </div>
            <div className="analytics-wave-soc">
              <MiniWave color="#0891b2" seed={13} />
            </div>
          </div>
        </div>

        <h2 className="pipeline-title-soc">Content Pipeline</h2>
        <div className="pipeline-rows-soc">
          {runs.slice(0, 8).map((run, idx) => (
            <div key={run.id} className="pipeline-row-soc">
              <div className="pipeline-avatar-soc">
                <OrbitalAvatar
                  initials={String.fromCharCode(65 + (idx % 26))}
                  color="#06b6d4"
                />
              </div>
              <div className="pipeline-info-soc">
                <div className="pipeline-title-text-soc">Post Published</div>
                <div className="pipeline-time-soc">
                  {Math.floor(Math.random() * 60)} minutes ago
                </div>
              </div>
              <div className="pipeline-count-soc">
                {["Scheduled", "Publishing", "Published"][Math.floor(Math.random() * 3)]}
              </div>
            </div>
          ))}
        </div>

        <div className="nav-strip-soc">
          <Link href="/dashboard/campaigns" className="nav-link-soc">
            <Zap size={16} />
            Campaigns
          </Link>
          <Link href="/dashboard/agents" className="nav-link-soc">
            <Activity size={16} />
            Agents
          </Link>
          <Link href="/dashboard/billing" className="nav-link-soc">
            <TrendingUp size={16} />
            Billing
          </Link>
          <Link href="/dashboard/settings" className="nav-link-soc">
            <BarChart3 size={16} />
            Settings
          </Link>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: CANVAS_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: PARALLAX_SCRIPT }} />
    </div>
  );
}
