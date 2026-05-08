import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Settings, Lock, Key, Bell, Trash2, TrendingUp, Activity, Zap } from "lucide-react";

export const metadata = {
  title: "Settings | Aether Dashboard",
};

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function CircuitTrace({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 80" className="w-full h-10 absolute inset-0">
      <defs>
        <filter id="glow-set" x="-50%" y="-50%" width="200%" height="200%">
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
        filter="url(#glow-set)"
      >
        <animate
          attributeName="strokeDashoffset"
          from="300"
          to="0"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>
      <circle cx="50" cy="40" r="2.5" fill={color} opacity="0.8" filter="url(#glow-set)">
        <animate
          attributeName="r"
          values="2.5;3.5;2.5"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="150" cy="60" r="2.5" fill={color} opacity="0.8" filter="url(#glow-set)">
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
    <div className="relative w-14 h-14 flex items-center justify-center">
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
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke={`conic-gradient(from var(--ang), ${color}, #00ffee, #ff0033, ${color})`}
          strokeWidth="2"
          opacity="0.6"
        />
      </svg>
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          background: color,
          boxShadow: `0 0 8px ${color}`,
        }}
      />
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          bottom: "2px",
          right: "2px",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: "orbit-1 4s linear infinite",
        }}
      />
      <div
        className="absolute w-2 h-2 rounded-full"
        style={{
          bottom: "2px",
          left: "2px",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          animation: "orbit-2 4s linear infinite",
        }}
      />
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
        style={{
          background: `linear-gradient(135deg, ${color}88, ${color}44)`,
          border: `1.5px solid ${color}`,
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

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const planKey = toPlanKey(user.stripeProduct);

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
      0% { transform: rotate(0deg) translateX(12px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(12px) rotate(-360deg); }
    }

    @keyframes orbit-2 {
      0% { transform: rotate(120deg) translateX(12px) rotate(-120deg); }
      100% { transform: rotate(480deg) translateX(12px) rotate(-480deg); }
    }

    @keyframes drift-set {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(30px, -20px); }
      66% { transform: translate(-20px, 30px); }
    }

    @keyframes holo-sweep-set {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    body {
      background: #0a0e27;
      color: #e0e7ff;
    }

    .aurora-set {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .aurora-blob-set {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      animation: drift-set 8s ease-in-out infinite;
      opacity: 0.15;
    }

    .blob-1-set {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, #a78bfa, transparent);
      top: -100px;
      left: -100px;
    }

    .blob-2-set {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, #14b8a6, transparent);
      bottom: -150px;
      right: -150px;
      animation-delay: 2s;
    }

    .blob-3-set {
      width: 350px;
      height: 350px;
      background: radial-gradient(circle, #67e8f9, transparent);
      top: 50%;
      left: 50%;
      animation-delay: 4s;
    }

    .blob-4-set {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, #e879f9, transparent);
      top: 40%;
      right: 10%;
      animation-delay: 6s;
    }

    .container-set {
      position: relative;
      z-index: 1;
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }

    .hero-banner-set {
      position: relative;
      border-radius: 16px;
      padding: 3rem 2rem;
      margin-bottom: 3rem;
      background: linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(20, 184, 166, 0.1));
      border: 1px solid rgba(167, 139, 250, 0.3);
      overflow: hidden;
      display: flex;
      align-items: center;
      gap: 2rem;
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #a78bfa, #14b8a6, #67e8f9, #a78bfa);
      background-clip: padding-box;
    }

    .hero-banner-set::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 15px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(20, 24, 50, 0.95));
      pointer-events: none;
    }

    .hero-content-set {
      position: relative;
      z-index: 1;
      flex: 1;
    }

    .hero-icon-set {
      position: relative;
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }

    .hero-title-set {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #a78bfa, #14b8a6, #67e8f9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle-set {
      font-size: 1rem;
      color: #a0aec0;
    }

    .sections-container-set {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .section-card-set {
      position: relative;
      border-radius: 12px;
      padding: 2rem;
      background: linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(20, 184, 166, 0.05));
      border: 1px solid rgba(167, 139, 250, 0.2);
      animation: spin-ang 6s linear infinite;
      background-image: conic-gradient(from var(--ang), #a78bfa, #14b8a6, #67e8f9, #a78bfa);
      background-clip: padding-box;
      transition: all 0.3s ease;
    }

    .section-card-set::before {
      content: '';
      position: absolute;
      inset: 1px;
      border-radius: 11px;
      background: linear-gradient(135deg, rgba(10, 14, 39, 0.85), rgba(20, 24, 50, 0.85));
      pointer-events: none;
      z-index: 1;
    }

    .section-card-set::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 12px;
      background: linear-gradient(135deg, transparent, rgba(167, 139, 250, 0.1), transparent);
      animation: holo-sweep-set 3s ease-in-out infinite;
      pointer-events: none;
    }

    .section-card-set:hover {
      border-color: rgba(167, 139, 250, 0.4);
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(167, 139, 250, 0.15);
    }

    .section-title-set {
      position: relative;
      z-index: 2;
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      color: #e0e7ff;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .section-icon-set {
      color: #a78bfa;
    }

    .section-content-set {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .row-set {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-radius: 8px;
      background: rgba(167, 139, 250, 0.08);
      border: 1px solid rgba(167, 139, 250, 0.1);
      transition: all 0.3s ease;
    }

    .row-set:hover {
      background: rgba(167, 139, 250, 0.12);
      border-color: rgba(167, 139, 250, 0.2);
    }

    .row-info-set {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .row-label-set {
      font-weight: 600;
      color: #e0e7ff;
    }

    .row-value-set {
      font-size: 0.875rem;
      color: #a0aec0;
      word-break: break-all;
    }

    .row-action-set {
      flex-shrink: 0;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      background: rgba(167, 139, 250, 0.15);
      color: #e0e7ff;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .row-action-set:hover {
      background: rgba(167, 139, 250, 0.25);
      box-shadow: 0 0 12px rgba(167, 139, 250, 0.3);
    }

    .toggle-set {
      display: inline-flex;
      align-items: center;
      width: 50px;
      height: 28px;
      border-radius: 14px;
      background: rgba(167, 139, 250, 0.2);
      border: 1px solid rgba(167, 139, 250, 0.3);
      padding: 2px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .toggle-set.active {
      background: rgba(167, 139, 250, 0.4);
      border-color: rgba(167, 139, 250, 0.6);
    }

    .toggle-knob-set {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e0e7ff;
      transition: transform 0.3s ease;
    }

    .toggle-set.active .toggle-knob-set {
      transform: translateX(22px);
    }

    .danger-card-set {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(185, 28, 28, 0.05)) !important;
      border: 1px solid #ef444422 !important;
    }

    .danger-card-set:hover {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(185, 28, 28, 0.1)) !important;
      border-color: #ef4444 !important;
    }

    .danger-button-set {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      background: #ef4444;
      color: white;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .danger-button-set:hover {
      background: #dc2626;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
      transform: translateY(-2px);
    }

    .account-row-set {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-radius: 8px;
      background: rgba(167, 139, 250, 0.08);
      border: 1px solid rgba(167, 139, 250, 0.1);
    }

    .account-info-left-set {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex: 1;
    }

    .account-details-set {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .account-email-set {
      font-weight: 600;
      color: #e0e7ff;
    }

    .account-plan-set {
      font-size: 0.875rem;
      color: #a0aec0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .plan-badge-set {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      background: rgba(167, 139, 250, 0.2);
      color: #a78bfa;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .account-action-set {
      flex-shrink: 0;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      background: rgba(167, 139, 250, 0.15);
      color: #e0e7ff;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .account-action-set:hover {
      background: rgba(167, 139, 250, 0.25);
      box-shadow: 0 0 12px rgba(167, 139, 250, 0.3);
    }

    .nav-strip-set {
      position: relative;
      z-index: 2;
      display: flex;
      gap: 1rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(167, 139, 250, 0.2);
      flex-wrap: wrap;
    }

    .nav-link-set {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      background: rgba(167, 139, 250, 0.15);
      color: #e0e7ff;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      border: 1px solid rgba(167, 139, 250, 0.3);
    }

    .nav-link-set:hover {
      background: rgba(167, 139, 250, 0.25);
      border-color: rgba(167, 139, 250, 0.5);
      transform: translateY(-2px);
    }
  `;

  const CANVAS_SCRIPT = `
(function() {
  const canvas = document.getElementById('nn-canvas-set');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  const nodes = [];
  const colors = ['#a78bfa', '#14b8a6', '#67e8f9'];
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
  const cards = document.querySelectorAll('.holo3d-set');
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

      <div className="aurora-set">
        <div className="aurora-blob-set blob-1-set" />
        <div className="aurora-blob-set blob-2-set" />
        <div className="aurora-blob-set blob-3-set" />
        <div className="aurora-blob-set blob-4-set" />
      </div>

      <canvas
        id="nn-canvas-set"
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

      <div className="container-set">
        <div className="hero-banner-set">
          <div className="hero-icon-set">
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
                  stroke={`conic-gradient(from var(--ang), #a78bfa, #14b8a6, #67e8f9, #a78bfa)`}
                  strokeWidth="2"
                  opacity="0.8"
                />
              </svg>
              <Settings
                size={60}
                style={{
                  position: "absolute",
                  inset: 0,
                  margin: "auto",
                  color: "#a78bfa",
                  filter: "drop-shadow(0 0 10px #a78bfa)",
                }}
              />
            </div>
          </div>
          <div className="hero-content-set">
            <h1 className="hero-title-set">
              System
              <span style={{ display: "inline", position: "relative" }}>
                <span
                  style={{
                    color: "#ff0033",
                    filter: "blur(0.5px)",
                    transform: "translateX(-0.5px)",
                    position: "absolute",
                  }}
                >
                  Configuration
                </span>
                <span
                  style={{
                    color: "#00ffee",
                    filter: "blur(0.5px)",
                    transform: "translateX(0.5px)",
                    position: "absolute",
                  }}
                >
                  Configuration
                </span>
                <span style={{ color: "inherit", position: "relative" }}>
                  Configuration
                </span>
              </span>
            </h1>
            <p className="hero-subtitle-set">
              Manage account settings and system preferences
            </p>
          </div>
        </div>

        <div className="sections-container-set">
          <div className="section-card-set holo3d-set">
            <h2 className="section-title-set">
              <Lock size={20} className="section-icon-set" />
              Account Settings
            </h2>
            <div className="section-content-set">
              <div className="account-row-set">
                <div className="account-info-left-set">
                  <OrbitalAvatar
                    initials={user.email?.split("@")[0].slice(0, 2).toUpperCase() || "US"}
                    color="#a78bfa"
                  />
                  <div className="account-details-set">
                    <div className="account-email-set">
                      <ChromaticNumber value={user.email || "user@example.com"} />
                    </div>
                    <div className="account-plan-set">
                      Active plan
                      <span className="plan-badge-set">
                        {user.stripeProduct === "FREE" ? "FREE" : "PRO"}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="account-action-set">Edit Profile</button>
              </div>
            </div>
          </div>

          <div className="section-card-set holo3d-set">
            <h2 className="section-title-set">
              <Key size={20} className="section-icon-set" />
              Security
            </h2>
            <div className="section-content-set">
              <div className="row-set">
                <div className="row-info-set">
                  <div className="row-label-set">Password</div>
                  <div className="row-value-set">Last changed 3 months ago</div>
                </div>
                <button className="row-action-set">Change Password</button>
              </div>

              <div className="row-set">
                <div className="row-info-set">
                  <div className="row-label-set">Two-Factor Authentication</div>
                  <div className="row-value-set">Not enabled</div>
                </div>
                <button className="row-action-set">Enable 2FA</button>
              </div>

              <div className="row-set">
                <div className="row-info-set">
                  <div className="row-label-set">API Keys</div>
                  <div className="row-value-set">
                    <ChromaticNumber value="2" /> active keys
                  </div>
                </div>
                <button className="row-action-set">Manage Keys</button>
              </div>
            </div>
          </div>

          <div className="section-card-set holo3d-set">
            <h2 className="section-title-set">
              <Bell size={20} className="section-icon-set" />
              Notifications
            </h2>
            <div className="section-content-set">
              <div className="row-set">
                <div className="row-info-set">
                  <div className="row-label-set">Email Notifications</div>
                  <div className="row-value-set">Receive updates on runs and deployments</div>
                </div>
                <div className="toggle-set active">
                  <div className="toggle-knob-set" />
                </div>
              </div>

              <div className="row-set">
                <div className="row-info-set">
                  <div className="row-label-set">Run Completion Alerts</div>
                  <div className="row-value-set">Notify when agents complete tasks</div>
                </div>
                <div className="toggle-set active">
                  <div className="toggle-knob-set" />
                </div>
              </div>

              <div className="row-set">
                <div className="row-info-set">
                  <div className="row-label-set">Weekly Digest</div>
                  <div className="row-value-set">Summary of activity and usage</div>
                </div>
                <div className="toggle-set">
                  <div className="toggle-knob-set" />
                </div>
              </div>
            </div>
          </div>

          <div className="section-card-set danger-card-set holo3d-set">
            <h2 className="section-title-set">
              <Trash2 size={20} style={{ color: "#ef4444" }} />
              Danger Zone
            </h2>
            <div className="section-content-set">
              <div className="row-set" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid #ef444422" }}>
                <div className="row-info-set">
                  <div className="row-label-set" style={{ color: "#ef4444" }}>
                    Delete Account
                  </div>
                  <div className="row-value-set">
                    Permanently remove your account and all associated data
                  </div>
                </div>
                <button className="danger-button-set">Delete Account</button>
              </div>
            </div>
          </div>
        </div>

        <div className="nav-strip-set">
          <Link href="/dashboard/campaigns" className="nav-link-set">
            <TrendingUp size={16} />
            Campaigns
          </Link>
          <Link href="/dashboard/agents" className="nav-link-set">
            <Zap size={16} />
            Agents
          </Link>
          <Link href="/dashboard/social" className="nav-link-set">
            <Activity size={16} />
            Social
          </Link>
          <Link href="/dashboard/billing" className="nav-link-set">
            <Bell size={16} />
            Billing
          </Link>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: CANVAS_SCRIPT }} />
      <script dangerouslySetInnerHTML={{ __html: PARALLAX_SCRIPT }} />
    </div>
  );
}
