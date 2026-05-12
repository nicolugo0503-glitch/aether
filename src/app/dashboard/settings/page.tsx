import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Settings, Lock, Bell, Trash2, User,
  CheckCircle2, AlertCircle, Key, Shield, Sparkles,
} from "lucide-react";
import { updateProfile, changePassword, saveApiKeys } from "./actions";
import { SettingsToggles } from "./_components/settings-toggles";
import { DeleteAccountButton } from "./_components/delete-button";

export const metadata = { title: "Settings | Aether Dashboard" };

/* ─── tiny deterministic hash for seeding visuals ─── */
function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ─── Chromatic-aberration number ─── */
function ChromaticNumber({ value, color }: { value: string; color: string }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span style={{
        position: "absolute", top: 0, left: "-0.5px",
        color: "#ff0033", filter: "blur(0.7px)", opacity: 0.7,
        fontWeight: "inherit", fontSize: "inherit",
      }} aria-hidden>{value}</span>
      <span style={{
        position: "absolute", top: 0, left: "0.5px",
        color: "#00ffee", filter: "blur(0.7px)", opacity: 0.7,
        fontWeight: "inherit", fontSize: "inherit",
      }} aria-hidden>{value}</span>
      <span style={{ color, position: "relative" }}>{value}</span>
    </div>
  );
}

/* ─── Animated circuit trace ─── */
function CircuitTrace({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 80" style={{ width: "100%", height: 40, position: "absolute", inset: 0 }}>
      <defs>
        <filter id="glow-set" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M 10 40 L 50 40 L 50 20 L 100 20 L 100 60 L 150 60 L 150 40 L 190 40"
        stroke={color} strokeWidth="1.5" fill="none" opacity="0.6"
        strokeDasharray="300" filter="url(#glow-set)">
        <animate attributeName="strokeDashoffset" from="300" to="0" dur="3s" repeatCount="indefinite" />
      </path>
      <circle cx="50" cy="40" r="2.5" fill={color} opacity="0.8" filter="url(#glow-set)">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="150" cy="60" r="2.5" fill={color} opacity="0.8" filter="url(#glow-set)">
        <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

/* ─── Animated bar chart ─── */
function MiniWave({ color, seed }: { color: string; seed: number }) {
  const heights = Array.from({ length: 16 }, (_, i) => 30 + (seedHash(`${seed}-${i}`) % 100));
  return (
    <svg viewBox="0 0 160 60" style={{ width: "100%", height: 24 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gset-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <rect key={i} x={i * 10} y={60 - h} width="8" height={h} fill={`url(#gset-${seed})`}>
          <animate attributeName="height" values={`${h};${h * 1.3};${h * 0.7};${h}`} dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="y" values={`${60 - h};${60 - h * 1.3};${60 - h * 0.7};${60 - h}`} dur="2.4s" repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params     = await searchParams;
  const successMsg = params.msg;
  const errorMsg   = params.err;

  const displayName = user.name || user.email.split("@")[0];
  const initials    = displayName[0].toUpperCase();

  const ACCENT  = "#6366f1";
  const ACCENT2 = "#818cf8";
  const ACCENT3 = "#a5b4fc";

  return (
    <div style={{ maxWidth: 700, position: "relative" }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @property --ang-set {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes spin-ang-set {
          to { --ang-set: 360deg; }
        }
        @keyframes drift-set {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(40px,-30px) scale(1.08); }
          66%  { transform: translate(-25px,20px) scale(0.95); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes set-in {
          from { opacity: 0; transform: translateY(18px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes set-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes pulse-set {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(99,102,241,0.5); }
          50%      { opacity:0.7; box-shadow:0 0 0 6px rgba(99,102,241,0); }
        }
        @keyframes shimmer-set {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes danger-pulse {
          0%,100% { border-color:rgba(239,68,68,0.18); }
          50%      { border-color:rgba(239,68,68,0.38); }
        }
        @keyframes tilt-parallax {
          0%   { transform: perspective(1000px) rotateX(0deg) rotateY(0deg); }
        }

        /* ── Conic spinning border card ── */
        .set-card {
          position: relative;
          border-radius: 16px;
          padding: 1px;
          background-image: conic-gradient(from var(--ang-set), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, #c7d2fe, ${ACCENT});
          animation: spin-ang-set 6s linear infinite;
          transition: box-shadow 0.3s ease;
        }
        .set-card:hover {
          box-shadow: 0 0 50px ${ACCENT}33;
        }
        .set-card::before {
          content: '';
          position: absolute; inset: 1px; border-radius: 15px;
          background: linear-gradient(135deg, rgba(10,14,39,0.96), rgba(15,20,50,0.96));
          pointer-events: none; z-index: 0;
        }
        .set-card-inner {
          position: relative; z-index: 1;
        }
        .set-danger-card {
          animation: spin-ang-set 8s linear infinite, danger-pulse 4s ease-in-out infinite;
          background-image: conic-gradient(from var(--ang-set), #ef4444, #dc2626, #f87171, #ef4444);
        }
        .set-danger-card::before {
          background: linear-gradient(135deg, rgba(20,4,4,0.97), rgba(30,8,8,0.97));
        }

        /* ── Holo3d parallax ── */
        .holo3d-set {
          transform-style: preserve-3d;
          transition: transform 0.08s ease-out;
          will-change: transform;
        }

        /* ── Input styles ── */
        .set-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 11px;
          font-size: 13px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e4e4e7;
          outline: none;
          box-sizing: border-box;
          display: block;
          font-family: inherit;
          margin-bottom: 16px;
          transition: border-color 0.2s, box-shadow 0.25s, background 0.2s;
        }
        .set-input::placeholder { color: #3f3f46; }
        .set-input:focus {
          border-color: ${ACCENT}88;
          box-shadow: 0 0 0 3px ${ACCENT}18, 0 0 20px ${ACCENT}10;
          background: rgba(10,8,30,0.7);
        }
        .set-input:disabled { opacity: 0.35; cursor: not-allowed; }

        /* ── Label ── */
        .set-label {
          display: block;
          font-size: 9px;
          font-weight: 700;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 7px;
        }

        /* ── Save button ── */
        .set-save-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 22px; border-radius: 11px; border: none;
          cursor: pointer; font-size: 13px; font-weight: 800;
          letter-spacing: 0.01em; color: #fff; position: relative; overflow: hidden;
          transition: all 0.2s ease;
        }
        .set-save-btn::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .set-save-btn:hover::after { animation: shimmer-set 0.5s ease forwards; }
        .set-save-btn:hover { transform: translateY(-2px) scale(1.01); }

        /* ── Section header bar ── */
        .set-section-header {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 22px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        /* ── Section body ── */
        .set-section-body { padding: 22px 22px; }

        /* ── Stat grid ── */
        .set-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 28px;
        }
        .set-stat-card {
          position: relative; border-radius: 14px; padding: 1px;
          background-image: conic-gradient(from var(--ang-set), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, ${ACCENT});
          animation: spin-ang-set 7s linear infinite;
          overflow: hidden;
        }
        .set-stat-card::before {
          content: '';
          position: absolute; inset: 1px; border-radius: 13px;
          background: linear-gradient(135deg, rgba(10,14,39,0.95), rgba(15,20,50,0.95));
          z-index: 0;
        }
        .set-stat-inner {
          position: relative; z-index: 1;
          padding: 16px 14px;
        }

        /* ── Sections animation ── */
        .set-section { animation: set-in 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .set-section:nth-child(1) { animation-delay: 0.05s; }
        .set-section:nth-child(2) { animation-delay: 0.10s; }
        .set-section:nth-child(3) { animation-delay: 0.15s; }
        .set-section:nth-child(4) { animation-delay: 0.20s; }
        .set-section:nth-child(5) { animation-delay: 0.25s; }

        /* ── Nav strip ── */
        .set-nav-strip {
          display: flex; gap: 6px; flex-wrap: wrap;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(8,10,28,0.9);
          border: 1px solid rgba(255,255,255,0.06);
          margin-top: 28px;
        }
        .set-nav-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: #52525b; cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .set-nav-btn:hover {
          background: rgba(99,102,241,0.1);
          border-color: rgba(99,102,241,0.3);
          color: ${ACCENT3};
        }
      `}</style>

      {/* ── AURORA BLOBS ── */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}22 0%, transparent 70%)`, filter: "blur(80px)", animation: "drift-set 18s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "55%", right: "8%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT2}1a 0%, transparent 70%)`, filter: "blur(80px)", animation: "drift-set 24s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "40%", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, #c7d2fe14 0%, transparent 70%)`, filter: "blur(60px)", animation: "drift-set 20s ease-in-out 6s infinite" }} />
      </div>

      {/* ── NEURAL CANVAS ── */}
      <canvas id="set-neural" style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: 0.18, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── HERO BANNER ── */}
        <div className="holo3d-set set-section" style={{
          borderRadius: 24, padding: "32px 28px", marginBottom: 24,
          background: "linear-gradient(135deg, rgba(10,14,39,0.92) 0%, rgba(18,22,54,0.92) 100%)",
          border: `1px solid ${ACCENT}30`,
          boxShadow: `0 0 60px ${ACCENT}18, inset 0 1px 0 rgba(255,255,255,0.05)`,
          position: "relative", overflow: "hidden",
        }}>
          {/* Circuit trace */}
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", opacity: 0.5 }}>
            <CircuitTrace color={ACCENT2} />
          </div>
          {/* Grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${ACCENT}08 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}08 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />

          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 20 }}>
            {/* Spinning icon */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20, padding: 1,
                background: `conic-gradient(from var(--ang-set), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, ${ACCENT})`,
                animation: "spin-ang-set 4s linear infinite",
              }}>
                <div style={{
                  width: "100%", height: "100%", borderRadius: 19,
                  background: "linear-gradient(135deg, #0e1235, #1a1e4a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: "set-float 3s ease-in-out infinite",
                }}>
                  <Settings size={26} color={ACCENT3} />
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT2, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6 }}>
                ◈ SYSTEM CONFIGURATION
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1, margin: 0 }}>
                <ChromaticNumber value="Settings" color="#fff" />
              </h1>
              <p style={{ fontSize: 12, color: "#52525b", marginTop: 6 }}>
                Manage your account, security &amp; preferences
              </p>
            </div>

            {/* Plan badge */}
            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 16px", borderRadius: 20,
                background: user.plan !== "FREE" ? `${ACCENT}18` : "rgba(255,255,255,0.05)",
                border: `1px solid ${user.plan !== "FREE" ? ACCENT + "44" : "rgba(255,255,255,0.1)"}`,
                boxShadow: user.plan !== "FREE" ? `0 0 20px ${ACCENT}25` : "none",
                fontSize: 11, fontWeight: 800,
                color: user.plan !== "FREE" ? ACCENT3 : "#52525b",
              }}>
                {user.plan !== "FREE" && <Sparkles size={11} />}
                {user.plan} PLAN
              </div>
            </div>
          </div>
        </div>

        {/* ── FEEDBACK BANNERS ── */}
        {successMsg && (
          <div className="set-section" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 18px", borderRadius: 14, marginBottom: 16,
            background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)",
            boxShadow: "0 0 24px rgba(16,185,129,0.1)",
          }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span style={{ fontSize: 13, color: "#10b981", fontWeight: 700 }}>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="set-section" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "13px 18px", borderRadius: 14, marginBottom: 16,
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)",
            boxShadow: "0 0 24px rgba(239,68,68,0.1)",
          }}>
            <AlertCircle size={15} color="#ef4444" />
            <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>{errorMsg}</span>
          </div>
        )}

        {/* ── STAT GRID ── */}
        <div className="set-stat-grid set-section">
          {/* Avatar card */}
          <div className="set-stat-card">
            <div className="set-stat-inner">
              <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Identity</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                  background: `linear-gradient(135deg, ${ACCENT}, #4f46e5, #7c3aed)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 900, color: "#fff",
                  boxShadow: `0 0 20px ${ACCENT}44`,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                  <div style={{ fontSize: 10, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <MiniWave color={ACCENT} seed={seedHash(user.email)} />
              </div>
            </div>
          </div>

          {/* Plan card */}
          <div className="set-stat-card">
            <div className="set-stat-inner">
              <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Current Plan</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}>
                <ChromaticNumber value={user.plan} color={ACCENT3} />
              </div>
              <div style={{ fontSize: 10, color: "#52525b", marginTop: 4 }}>
                {user.plan === "FREE" ? "Upgrade for more power" : "Full access unlocked"}
              </div>
              <div style={{ marginTop: 10 }}>
                <MiniWave color={ACCENT2} seed={seedHash(user.plan + "plan")} />
              </div>
            </div>
          </div>

          {/* Security card */}
          <div className="set-stat-card">
            <div className="set-stat-inner">
              <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Security</div>
              <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}>
                <ChromaticNumber value="●●●●●●●●" color={ACCENT3} />
              </div>
              <div style={{ fontSize: 10, color: "#52525b", marginTop: 4 }}>Password protected</div>
              <div style={{ marginTop: 10 }}>
                <MiniWave color="#818cf8" seed={seedHash("security-dots")} />
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTIONS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── PROFILE ── */}
          <div className="set-section">
            <div className="set-card holo3d-set">
              <div className="set-card-inner">
                <div className="set-section-header" style={{ background: `linear-gradient(90deg, ${ACCENT}10 0%, transparent 70%)` }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 14px ${ACCENT}20`,
                  }}>
                    <User size={15} color={ACCENT3} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Profile</div>
                    <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>Your identity across Aether</div>
                  </div>
                  <div style={{ marginLeft: "auto", width: 36, height: 2, borderRadius: 999, background: `linear-gradient(90deg, ${ACCENT}80, transparent)` }} />
                </div>
                <div className="set-section-body">
                  {/* Online indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", background: "#10b981",
                      boxShadow: "0 0 10px rgba(16,185,129,0.9)",
                      animation: "pulse-set 2.4s ease infinite",
                    }} />
                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>ONLINE · {user.email}</span>
                  </div>

                  <form action={updateProfile}>
                    <label className="set-label">Display name</label>
                    <input className="set-input" name="name" type="text" defaultValue={user.name ?? ""} placeholder="Your name" required />

                    <label className="set-label">Email address</label>
                    <input className="set-input" type="email" value={user.email} readOnly disabled />
                    <p style={{ fontSize: 11, color: "#3f3f46", marginTop: -12, marginBottom: 18 }}>
                      Email cannot be changed. Contact support if needed.
                    </p>

                    <button type="submit" className="set-save-btn" style={{
                      background: `linear-gradient(135deg, ${ACCENT}, #4f46e5)`,
                      boxShadow: `0 0 20px ${ACCENT}40`,
                    }}>
                      Save Profile
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* ── PASSWORD ── */}
          <div className="set-section">
            <div className="set-card holo3d-set">
              <div className="set-card-inner">
                <div className="set-section-header" style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.07) 0%, transparent 70%)" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 14px rgba(59,130,246,0.2)",
                  }}>
                    <Lock size={15} color="#60a5fa" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Change Password</div>
                    <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>Keep your account secure</div>
                  </div>
                  <div style={{ marginLeft: "auto", width: 36, height: 2, borderRadius: 999, background: "linear-gradient(90deg, rgba(59,130,246,0.6), transparent)" }} />
                </div>
                <div className="set-section-body">
                  <form action={changePassword}>
                    <label className="set-label">Current password</label>
                    <input className="set-input" name="current" type="password" placeholder="••••••••" required />

                    <label className="set-label">New password <span style={{ fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>(min 8 chars)</span></label>
                    <input className="set-input" name="next" type="password" placeholder="••••••••" required />

                    <label className="set-label">Confirm new password</label>
                    <input className="set-input" name="confirm" type="password" placeholder="••••••••" required />

                    <button type="submit" className="set-save-btn" style={{
                      background: "linear-gradient(135deg,#3b82f6,#2563eb)",
                      boxShadow: "0 0 20px rgba(59,130,246,0.4)",
                    }}>
                      <Lock size={13} />
                      Change Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* ── API KEYS ── */}
          <div className="set-section">
            <div className="set-card holo3d-set">
              <div className="set-card-inner">
                <div className="set-section-header" style={{ background: "linear-gradient(90deg, rgba(245,158,11,0.07) 0%, transparent 70%)" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 14px rgba(245,158,11,0.2)",
                  }}>
                    <Key size={15} color="#fbbf24" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>API Keys &amp; Integrations</div>
                    <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>Power your campaigns and outreach</div>
                  </div>
                  <div style={{ marginLeft: "auto", width: 36, height: 2, borderRadius: 999, background: "linear-gradient(90deg, rgba(245,158,11,0.6), transparent)" }} />
                </div>
                <div className="set-section-body">
                  <form action={saveApiKeys}>
                    {[
                      { label: "Resend API Key",  name: "resendApiKey",  type: "password" as const, isSet: !!((user as Record<string, unknown>).resendApiKey),  placeholder: "re_...",              desc: "Email campaigns", color: "#f59e0b" },
                      { label: "From Email",       name: "fromEmail",     type: "email"    as const, isSet: !!((user as Record<string, unknown>).fromEmail),     placeholder: "you@yourdomain.com",  desc: "Sender address",  color: "#10b981" },
                      { label: "Serper API Key",   name: "serperApiKey",  type: "password" as const, isSet: !!((user as Record<string, unknown>).serperApiKey),  placeholder: "serper_...",          desc: "Web research",    color: "#3b82f6" },
                    ].map(field => (
                      <div key={field.name} style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                          <label className="set-label" style={{ margin: 0 }}>{field.label}</label>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                            background: `${field.color}14`, color: field.color,
                            border: `1px solid ${field.color}25`, letterSpacing: "0.05em",
                          }}>
                            {field.desc}
                          </span>
                          {field.isSet && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                              background: "rgba(16,185,129,0.1)", color: "#10b981",
                              border: "1px solid rgba(16,185,129,0.25)", letterSpacing: "0.05em",
                            }}>
                              ● CONFIGURED
                            </span>
                          )}
                        </div>
                        <input
                          className="set-input"
                          name={field.name}
                          type={field.type}
                          defaultValue=""
                          placeholder={field.isSet ? "Leave blank to keep current value" : field.placeholder}
                          style={{ marginBottom: 0 }}
                        />
                      </div>
                    ))}

                    <div style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", borderRadius: 10, marginBottom: 18, marginTop: 6,
                      background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
                      fontSize: 11, color: "#60a5fa",
                    }}>
                      <Shield size={12} />
                      Get Resend key at <strong>resend.com</strong> · Serper key at <strong>serper.dev</strong>
                    </div>

                    <button type="submit" className="set-save-btn" style={{
                      background: "linear-gradient(135deg,#f59e0b,#d97706)",
                      boxShadow: "0 0 20px rgba(245,158,11,0.35)",
                    }}>
                      <Key size={13} />
                      Save API Keys
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* ── NOTIFICATIONS ── */}
          <div className="set-section">
            <div className="set-card holo3d-set">
              <div className="set-card-inner">
                <div className="set-section-header" style={{ background: "linear-gradient(90deg, rgba(236,72,153,0.07) 0%, transparent 70%)" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 14px rgba(236,72,153,0.2)",
                  }}>
                    <Bell size={15} color="#f472b6" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Notifications</div>
                    <div style={{ fontSize: 10, color: "#52525b", marginTop: 1 }}>Control when and how Aether alerts you</div>
                  </div>
                  <div style={{ marginLeft: "auto", width: 36, height: 2, borderRadius: 999, background: "linear-gradient(90deg, rgba(236,72,153,0.6), transparent)" }} />
                </div>
                <div className="set-section-body">
                  <SettingsToggles />
                </div>
              </div>
            </div>
          </div>

          {/* ── DANGER ZONE ── */}
          <div className="set-section">
            <div className="set-card set-danger-card holo3d-set">
              <div className="set-card-inner">
                <div className="set-section-header" style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.08) 0%, transparent 70%)", borderBottom: "1px solid rgba(239,68,68,0.12)" }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 11, flexShrink: 0,
                    background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 14px rgba(239,68,68,0.2)",
                  }}>
                    <Trash2 size={15} color="#f87171" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>Danger Zone</div>
                    <div style={{ fontSize: 10, color: "#7f1d1d", marginTop: 1 }}>Irreversible actions — proceed with extreme caution</div>
                  </div>
                </div>
                <div className="set-section-body">
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", marginBottom: 6 }}>Delete Account</div>
                      <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.65, maxWidth: 340 }}>
                        Permanently removes your account, all AI employees, runs, campaigns, and all associated data.
                        This action cannot be undone.
                      </div>
                    </div>
                    <DeleteAccountButton />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── NAV STRIP ── */}
        <nav className="set-nav-strip set-section">
          {[
            { href: "/dashboard",         label: "Overview" },
            { href: "/dashboard/agents",  label: "AI Employees" },
            { href: "/dashboard/runs",    label: "Run History" },
            { href: "/dashboard/social",  label: "Social Media" },
            { href: "/dashboard/billing", label: "Billing" },
          ].map(link => (
            <a key={link.href} href={link.href} className="set-nav-btn">
              {link.label}
            </a>
          ))}
        </nav>

      </div>

      {/* ── NEURAL CANVAS + PARALLAX SCRIPTS ── */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var canvas = document.getElementById('set-neural');
          if (!canvas) return;
          var ctx = canvas.getContext('2d');
          var W, H, nodes = [];
          function resize() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
          }
          resize();
          window.addEventListener('resize', resize);
          for (var i = 0; i < 55; i++) {
            nodes.push({ x: Math.random()*W, y: Math.random()*H, vx: (Math.random()-0.5)*0.4, vy: (Math.random()-0.5)*0.4 });
          }
          function draw() {
            ctx.clearRect(0,0,W,H);
            for (var i=0;i<nodes.length;i++) {
              var n = nodes[i];
              n.x += n.vx; n.y += n.vy;
              if (n.x < 0 || n.x > W) n.vx *= -1;
              if (n.y < 0 || n.y > H) n.vy *= -1;
              for (var j=i+1;j<nodes.length;j++) {
                var m=nodes[j], dx=m.x-n.x, dy=m.y-n.y, d=Math.sqrt(dx*dx+dy*dy);
                if (d < 140) {
                  ctx.beginPath();
                  ctx.moveTo(n.x,n.y); ctx.lineTo(m.x,m.y);
                  ctx.strokeStyle = 'rgba(99,102,241,'+(1-d/140)*0.35+')';
                  ctx.lineWidth = 0.7;
                  ctx.stroke();
                }
              }
              ctx.beginPath();
              ctx.arc(n.x,n.y,2,0,Math.PI*2);
              ctx.fillStyle = 'rgba(129,140,248,0.7)';
              ctx.fill();
            }
            requestAnimationFrame(draw);
          }
          draw();

          /* Parallax */
          document.addEventListener('mousemove', function(e) {
            var rx = (e.clientY/window.innerHeight - 0.5) * 7;
            var ry = (e.clientX/window.innerWidth  - 0.5) * 7;
            document.querySelectorAll('.holo3d-set').forEach(function(el) {
              el.style.transform = 'perspective(1000px) rotateX('+(-rx)+'deg) rotateY('+ry+'deg)';
            });
          });
        })();
      `}} />
    </div>
  );
}
