import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { CreditCard, Sparkles, TrendingUp, Zap, ArrowRight, Target , Activity} from "lucide-react";

export const metadata = {
  title: "Billing & Usage | Aether Dashboard",
};

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function MiniWave({ color, seed }: { color: string; seed: number }) {h
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
        <filter id="glow-bill" x="-50%" y="-50%" width="200%" height="200%">
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
        filter="url(#glow-bill)"
      >
        <animate
          attributeName="strokeDashoffset"
          from="300"
          to="0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
      <circle cx="50" cy="40" r="2.5" fill={color} opacity="0.8" filter="url(#glow-bill)">
        <animate
          attributeName="r"
          values="2.5;3.5;2.5"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="150" cy="60" r="2.5" fill={color} opacity="0.8" filter="url(#glow-bill)">
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

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const planKey = toPlanKey(user.stripeProduct);
  const plan = PLAN_LIMITS[planKey];

  const totalRuns = await prisma.run.count({ where: { userId: user.id } });
  const costData = await prisma.run.aggregate({
    where: { userId: user.id },
    _sum: { estimatedCostCents: true },
  });

  const agents = await prisma.agent.findMany({ where: { userId: user.id } });
  const successfulRuns = await prisma.run.count({
    where: { userId: user.id, status: "COMPLETED" },
  });

  const estSpend = ((costData._sum.estimatedCostCents || 0) / 100).toFixed(2);
  const usagePercent = Math.min((totalRuns / plan.monthlyRuns) * 100, 100);
  const agentPercent = Math.min((agents.length / plan.agents) * 100, 100);

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

    @keyframes drift-bill {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(30px, -20px); }
      66% { transform: translate(-20px, 30px); }
    }

    @keyframes holo-sweep-bill {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    @keyframes breathe-bill {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }

    body {
      background: #0a0e27;
      color: #e0e7ff;
    }

    .aurora-bill {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .aurora-blob-bill {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      animation: drift-bill 8s ease-in-out infinite;
      opacity: 0.15;
    }

    .blob-1-bill {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #22c55e, transparent);
      top: -100px;
      left: -100px;
    }

    .blob-2-bill {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #84cc16, transparent);
      bottom: -150px;
      right: -150px;
      animation-delay: 2s;
    }

    .blob-3-bill {
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, #fbbf24, transparent);
      top: 50%;
      left: 50%;
      animation-delay: 4s;
    }

    .blob-4-bill {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #10b981, transparent);
      top: 40%;
      right: 10%;
      animation-delay: 6s;
    }

    .container-bill {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero-banner-bill {
      position: relative;
      border-radius: 16px;
      padding: 3rem 2rem;
      margin-bottom: 3rem;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(132, 204, 22, 0.1));
      border: 1px solid rgba(34, 197, 94, 0.3);
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 2rem;
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #22c55e, #84cc16, #fbbf24, #22c55e);
      background-clip: padding-box;
    }

    .hero-banner-bill::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 15px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(20, 24, 50, 0.95));
      pointer-events: none;
    }

    .hero-content-bill {
      position: relative;
      z-index: 1;
      flex: 1;
    }

    .hero-icon-bill {
      position: relative;
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .hero-title-bill {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #22c55e, #84cc16, #fbbf24);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle-bill {
      font-size: 1rem;
      color: #a0aec0;
    }

    .plan-card-bill {
      position: relative;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 3rem;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(132, 204, 22, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.2);
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #22c55e, #84cc16, #fbbf24, #22c55e);
      background-clip: padding-box;
      width: 100%;
    }

    .plan-card-bill::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.85), rgba(20, 24, 50, 0.85));
      pointer-events: none;
      z-index: 1;
    }

    .plan-header-bill {
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(34, 197, 94, 0.2);
    }

    .plan-name-bill {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e0e7ff;
    }

    .plan-badge-bill {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .usage-bar-container-bill {
      position: relative;
      z-index: 2;
      margin-bottom: 1.5rem;
    }

    .usage-label-bill {
      font-size: 0.875rem;
      color: #a0aec0;
      margin-bottom: 0.5rem;
      display: flex;
      justify-content: space-between;
    }

    .usage-bar-bill {
      width: 100%;
      height: 8px;
      border-radius: 10px;
      background: rgba(34, 197, 94, 0.1);
      overflow: hidden;
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .usage-fill-bill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #84cc16, #fbbf24);
      border-radius: 10px;
      transition: width 0.4s ease;
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
    }

    .stats-grid-bill {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card-bill {
      position: relative;
      border-radius: 12px;
      padding: 1.5rem;
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(132, 204, 22, 0.05));
      border: 1px solid rgba(34, 197, 94, 0.2);
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #22c55e, #84cc16, #fbbf24, #22c55e);
      background-clip: padding-box;
      transition: all 0.3s ease;
    }

    .stat-card-bill::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.8), rgba(20, 24, 50, 0.8));
      pointer-events: none;
      z-index: 1;
    }

    .stat-card-bill:hover {
      border-color: rgba(34, 197, 94, 0.4);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(34, 197, 94, 0.15);
    }

    .stat-label-bill {
      position: relative;
      z-index: 2;
      font-size: 0.875rem;
      color: #a0aec0;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value-bill {
      position: relative;
      z-index: 2;
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #e0e7ff;
    }

    .stat-content-bill {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .circuit-bill {
      position: relative;
      height: 40px;
      margin-bottom: 0.5rem;
      opacity: 0.7;
    }

    .miniwave-bill {
      width: 100%;
      height: 24px;
    }

    .upgrade-section-bill {
      margin-bottom: 3rem;
    }

    .upgrade-button-bill {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 2rem;
      border-radius: 10px;
      background: linear-gradient(135deg, #22c55e, #84cc16);
      color: #0a0e27;
      font-weight: 700;
      font-size: 1.125rem;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      box-shadow: 0 15px 40px rgba(34, 197, 94, 0.4);
    }

    .upgrade-button-bill:hover {
      transform: translateY(-2px);
      box-shadow: 0 20px 50px rgba(34, 197, 94, 0.5);
    }

    .usage-section-bill {
      margin-bottom: 3rem;
    }

    .section-title-bill {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #e0e7ff;
    }

    .usage-item-bill {
      margin-bottom: 2rem;
    }

    .usage-item-label-bill {
      font-size: 0.875rem;
      color: #a0aec0;
      margin-bottom: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .usage-item-bar-bill {
      width: 100%;
      height: 10px;
      border-radius: 10px;
      background: rgba(34, 197, 94, 0.1);
      overflow: hidden;
      border: 1px solid rgba(34, 197, 94, 0.15);
      box-shadow: 0 0 15px rgba(34, 197, 94, 0.1);
    }

    .usage-item-fill-bill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #84cc16);
      border-radius: 10px;
      transition: width 0.4s ease;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
    }

    .history-section-bill {
      margin-bottom: 2rem;
    }

    .history-rows-bill {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .history-row-bill {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-radius: 10px;
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.15);
      transition: all 0.3s ease;
    }

    .history-row-bill:hover {
      background: rgba(34, 197, 94, 0.12);
      border-color: rgba(34, 197, 94, 0.25);
      transform: translateX(4px);
    }

    .history-info-bill {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .history-title-bill {
      font-weight: 600;
      color: #e0e7ff;
    }

    .history-date-bill {
      font-size: 0.875rem;
      color: #a0aec0;
    }

    .history-amount-bill {
      font-size: 1.25rem;
      font-weight: 700;
      color: #22c55e;
    }

    .comparison-section-bill {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-top: 3rem;
    }

    .plan-column-bill {
      position: relative;
      border-radius: 12px;
      padding: 2rem;
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .plan-column-title-bill {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #e0e7ff;
    }

    .feature-list-bill {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .feature-item-bill {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      font-size: 0.95rem;
      color: #c0cee0;
    }

    .feature-check-bill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      flex-shrink: 0;
      font-weight: 700;
    }

    .nav-strip-bill {
      position: relative;
      z-index: 2;
      display: flex;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(34, 197, 94, 0.2);
      flex-wrap: wrap;
    }

    .nav-link-bill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      background: rgba(34, 197, 94, 0.15);
      color: #e0e7ff;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .nav-link-bill:hover {
      background: rgba(34, 197, 94, 0.25);
      border-color: rgba(34, 197, 94, 0.5);
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .comparison-section-bill {
        grid-template-columns: 1fr;
      }
    }
  `;

  const CANVAS_SCRIPT = `
(function() {
  const canvas = document.getElementById('nn-canvas-bill');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  const nodes = [];
  const colors = ['#22c55e', '#84cc16', '#fbbf24'];
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
  const cards = document.querySelectorAll('.holo3d-bill');
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

  return (
    <div style={{ minHeight: "100vh" }}>
      <style>{CSS}</style>

      <div className="aurora-bill">
        <div className="aurora-blob-bill blob-1-bill" />
        <div className="aurora-blob-bill blob-2-bill" />
        <div className="aurora-blob-bill blob-3-bill" />
        <div className="aurora-blob-bill blob-4-bill" />
      </div>

      <canvas
        id="nn-canvas-bill"
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

      <div className="container-bill">
        <div className="hero-banner-bill">
          <div className="hero-icon-bill">
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
                  stroke={`conic-gradient(from var(--ang), #22c55e, #84cc16, #fbbf24, #22c55e)`}
                  strokeWidth="2"
                  opacity="0.8"
                />
              </svg>
              <CreditCard
                size={60}
                style={{
                  position: "absolute",
                  inset: 0,
                  margin: "auto",
                  color: "#22c55e",
                  filter: "drop-shadow(0 0 10px #22c55e)",
                }}
              />
            </div>
          </div>
          <div className="hero-content-bill">
            <h1 className="hero-title-bill">
              Billing
              <span style={{ display: "inline", position: "relative" }}>
                <span
                  style={{
                    color: "#ff0033",
                    filter: "blur(0.5px)",
                    transform: "translateX(-0.5px)",
                    position: "absolute",
                  }}
                >
                  & Usage
                </span>
                <span
                  style={{
                    color: "#00ffee",
                    filter: "blur(0.5px)",
                    transform: "translateX(0.5px)",
                    position: "absolute",
                  }}
                >
                  & Usage
                </span>
                <span style={{ color: "inherit", position: "relative" }}>
                  & Usage
                </span>
              </span>
            </h1>
            <p className="hero-subtitle-bill">
              Transparent pricing and real-time usage metrics
            </p>
          </div>
        </div>

        <div className="plan-card-bill holo3d-bill">
          <div className="plan-header-bill">
            <div>
              <div className="plan-name-bill">
                <ChromaticNumber value={user.stripeProduct === "FREE" ? "Free Plan" : "Pro Plan"} />
              </div>
            </div>
            <div className="plan-badge-bill">
              {user.stripeProduct === "FREE" ? "CURRENT" : "ACTIVE"}
            </div>
          </div>

          <div className="usage-bar-container-bill">
            <div className="usage-label-bill">
              <span>Monthly Usage</span>
              <span>
                <ChromaticNumber value={`${totalRuns} / ${plan.monthlyRuns}`} />
              </span>
            </div>
            <div className="usage-bar-bill">
              <div
                className="usage-fill-bill"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          <div className="usage-bar-container-bill">
            <div className="usage-label-bill">
              <span>Agents</span>
              <span>
                <ChromaticNumber value={`${agents.length} / ${plan.agents}`} />
              </span>
            </div>
            <div className="usage-bar-bill">
              <div
                className="usage-fill-bill"
                style={{ width: `${agentPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="stats-grid-bill">
          <div className="stat-card-bill holo3d-bill">
            <div className="stat-label-bill">This Month Runs</div>
            <div className="stat-value-bill">
              <ChromaticNumber value={totalRuns} />
            </div>
            <div className="stat-content-bill">
              <div className="circuit-bill">
                <CircuitTrace color="#22c55e" />
              </div>
              <div className="miniwave-bill">
                <MiniWave color="#22c55e" seed={1} />
              </div>
            </div>
          </div>

          <div className="stat-card-bill holo3d-bill">
            <div className="stat-label-bill">Est. Spend</div>
            <div className="stat-value-bill">
              <ChromaticNumber value={`$${estSpend}`} />
            </div>
            <div className="stat-content-bill">
              <div className="circuit-bill">
                <CircuitTrace color="#84cc16" />
              </div>
              <div className="miniwave-bill">
                <MiniWave color="#84cc16" seed={2} />
              </div>
            </div>
          </div>

          <div className="stat-card-bill holo3d-bill">
            <div className="stat-label-bill">Success Count</div>
            <div className="stat-value-bill">
              <ChromaticNumber value={successfulRuns} />
            </div>
            <div className="stat-content-bill">
              <div className="circuit-bill">
                <CircuitTrace color="#fbbf24" />
              </div>
              <div className="miniwave-bill">
                <MiniWave color="#fbbf24" seed={3} />
              </div>
            </div>
          </div>

          <div className="stat-card-bill holo3d-bill">
            <div className="stat-label-bill">Agents Used</div>
            <div className="stat-value-bill">
              <ChromaticNumber value={agents.length} />
            </div>
            <div className="stat-content-bill">
              <div className="circuit-bill">
                <CircuitTrace color="#10b981" />
              </div>
              <div className="miniwave-bill">
                <MiniWave color="#10b981" seed={4} />
              </div>
            </div>
          </div>
        </div>

        {user.stripeProduct === "FREE" && (
          <div className="upgrade-section-bill">
            <button className="upgrade-button-bill">
              <Sparkles size={20} />
              Upgrade to Pro
            </button>
          </div>
        )}

        <div className="usage-section-bill">
          <h2 className="section-title-bill">Detailed Breakdown</h2>

          <div className="usage-item-bill">
            <div className="usage-item-label-bill">API Calls</div>
            <div className="usage-item-bar-bill">
              <div
                className="usage-item-fill-bill"
                style={{ width: "65%" }}
              />
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#a0aec0" }}>
              2,450 / 5,000 calls
            </div>
          </div>

          <div className="usage-item-bill">
            <div className="usage-item-label-bill">Storage</div>
            <div className="usage-item-bar-bill">
              <div
                className="usage-item-fill-bill"
                style={{ width: "32%" }}
              />
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#a0aec0" }}>
              3.2 GB / 10 GB
            </div>
          </div>

          <div className="usage-item-bill">
            <div className="usage-item-label-bill">Concurrent Runs</div>
            <div className="usage-item-bar-bill">
              <div
                className="usage-item-fill-bill"
                style={{ width: "45%" }}
              />
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#a0aec0" }}>
              9 / 20 concurrent
            </div>
          </div>
        </div>

        <div className="history-section-bill">
          <h2 className="section-title-bill">Billing History</h2>
          <div className="history-rows-bill">
            {[1, 2, 3].map((i) => (
              <div key={i} className="history-row-bill">
                <div className="history-info-bill">
                  <div className="history-title-bill">
                    {i === 1 ? "Current Period" : `Invoice ${4 - i}`}
                  </div>
                  <div className="history-date-bill">
                    {i === 1 ? "May 2026 - June 2026" : `${5 - i} months ago`}
                  </div>
                </div>
                <div className="history-amount-bill">
                  ${(24 + i * 5).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="comparison-section-bill">
          <div className="plan-column-bill">
            <div className="plan-column-title-bill">FREE</div>
            <div className="feature-list-bill">
              <div className="feature-item-bill">
                <div className="feature-check-bill">✓</div>
                <span>Up to 50 runs/month</span>
              </div>
              <div className="feature-item-bill">
                <div className="feature-check-bill">✓</div>
                <span>3 agents</span>
              </div>
              <div className="feature-item-bill">
                <div className="feature-check-bill">✓</div>
                <span>Basic monitoring</span>
              </div>
              <div className="feature-item-bill" style={{ opacity: 0.5 }}>
                <div className="feature-check-bill" style={{ background: "rgba(160, 174, 192, 0.2)" }}>
                  —
                </div>
                <span>Priority support</span>
              </div>
              <div className="feature-item-bill" style={{ opacity: 0.5 }}>
                <div className="feature-check-bill" style={{ background: "rgba(160, 174, 192, 0.2)" }}>
                  —
                </div>
                <span>Custom integrations</span>
              </div>
            </div>
          </div>

          <div className="plan-column-bill" style={{ background: "rgba(34, 197, 94, 0.12)", borderColor: "rgba(34, 197, 94, 0.4)" }}>
            <div className="plan-column-title-bill" style={{ color: "#22c55e" }}>
              PRO
            </div>
            <div className="feature-list-bill">
              <div className="feature-item-bill">
                <div className="feature-check-bill" style={{ background: "rgba(34, 197, 94, 0.3)" }}>✓</div>
                <span>Unlimited runs</span>
              </div>
              <div className="feature-item-bill">
                <div className="feature-check-bill" style={{ background: "rgba(34, 197, 94, 0.3)" }}>✓</div>
                <span>Unlimited agents</span>
              </div>
              <div className="feature-item-bill">
                <div className="feature-check-bill" style={{ background: "rgba(34, 197, 94, 0.3)" }}>✓</div>
                <span>Advanced analytics</span>
              </div>
              <div className="feature-item-bill">
                <div className="feature-check-bill" style={{ background: "rgba(34, 197, 94, 0.3)" }}>✓</div>
                <span>Priority support</span>
              </div>
              <div className="feature-item-bill">
                <div className="feature-check-bill" style={{ background: "rgba(34, 197, 94, 0.3)" }}>✓</div>
                <span>Custom integrations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-strip-bill">
          <Link href="/dashboard/campaigns" className="nav-link-bill">
            <TrendingUp size={16} />
            Campaigns
          </Link>
          <Link href="/dashboard/agents" className="nav-link-bill">
            <Zap size={16} />
            Agents
          </Link>
          <Link href="/dashboard/social" className="nav-link-bill">
            <Activity size={16} />
            Social
          </Link>
          <Link href="/dashboard/settings" className="nav-link-bill">
            <Target size={16} />
            Settings
          </Link>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: CANVAS_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: PARALLAX_SCRIPT }} />
    </div>
  );
}
