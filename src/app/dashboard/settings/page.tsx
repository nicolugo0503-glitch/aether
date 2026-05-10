import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Lock, Bell, Trash2, User, CheckCircle2, AlertCircle, Key, Shield, Sparkles } from "lucide-react";
import { updateProfile, changePassword, saveApiKeys } from "./actions";
import { SettingsToggles } from "./_components/settings-toggles";
import { DeleteAccountButton } from "./_components/delete-button";

export const metadata = { title: "Settings | Aether Dashboard" };

function Section({
  icon: Icon,
  title,
  subtitle,
  accentColor,
  children,
  danger,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  accentColor?: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const color  = danger ? "#ef4444" : (accentColor || "#7c3aed");
  const border = danger ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.07)";
  const bg     = danger ? "rgba(239,68,68,0.03)" : "rgba(4,4,12,0.85)";
  return (
    <div className="settings-card" style={{
      borderRadius: 20, overflow: "hidden",
      background: bg,
      border: `1px solid ${border}`,
      boxShadow: danger
        ? "inset 0 1px 0 rgba(239,68,68,0.06), 0 0 40px rgba(239,68,68,0.04)"
        : `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 40px ${color}06`,
      position: "relative",
    }}>
      {/* Animated top border glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: danger
          ? "linear-gradient(90deg, transparent, rgba(239,68,68,0.5), rgba(239,68,68,0.8), rgba(239,68,68,0.5), transparent)"
          : `linear-gradient(90deg, transparent, ${color}55, ${color}cc, ${color}55, transparent)`,
        opacity: 0.8,
      }} />

      {/* Section header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "18px 24px",
        borderBottom: `1px solid ${danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)"}`,
        background: danger
          ? "linear-gradient(90deg, rgba(239,68,68,0.07) 0%, transparent 70%)"
          : `linear-gradient(90deg, ${color}0d 0%, transparent 70%)`,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 12, flexShrink: 0,
          background: `${color}15`,
          border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 16px ${color}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}>
          <Icon size={16} color={color} />
        </div>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: danger ? "#ef4444" : "#fff", letterSpacing: "-0.1px" }}>
            {title}
          </h2>
          {subtitle && <p style={{ fontSize: 11, color: "#52525b", marginTop: 1 }}>{subtitle}</p>}
        </div>
        {/* Accent line */}
        <div style={{ marginLeft: "auto", width: 40, height: 2, borderRadius: 999, background: `linear-gradient(90deg, ${color}80, transparent)` }} />
      </div>

      {/* Section body */}
      <div style={{ padding: "22px 24px" }}>
        {children}
      </div>
    </div>
  );
}

function SaveBtn({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <button type="submit" className="settings-save-btn" style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "11px 24px", borderRadius: 12, border: "none", cursor: "pointer",
      fontSize: 13, fontWeight: 800, letterSpacing: "0.01em",
      background: danger ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
      color: "#fff",
      boxShadow: danger ? "0 0 20px rgba(239,68,68,0.35)" : "0 0 20px rgba(124,58,237,0.35)",
      position: "relative", overflow: "hidden",
    }}>
      {label}
    </button>
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

  return (
    <div style={{ maxWidth: 680 }}>
      <style>{`
        @keyframes settings-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float-icon {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-3px) rotate(2deg); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.6); }
          50%      { opacity:0.8; box-shadow:0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes shimmer-save {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes danger-pulse {
          0%,100% { border-color: rgba(239,68,68,0.18); box-shadow: 0 0 40px rgba(239,68,68,0.04); }
          50%      { border-color: rgba(239,68,68,0.35); box-shadow: 0 0 60px rgba(239,68,68,0.08); }
        }
        @keyframes avatar-halo-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes avatar-halo-orbit-rev {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes constellation-pulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.4); }
        }
        @keyframes glitch-title {
          0%,100% { text-shadow: none; }
          3%       { text-shadow: -2px 0 #ec4899, 2px 0 #3b82f6; }
          6%       { text-shadow: none; }
          93%      { text-shadow: none; }
          96%      { text-shadow: -1px 0 #a78bfa; }
          99%      { text-shadow: none; }
        }
        @keyframes border-rotate {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes card-glow-pulse {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1; }
        }
        @keyframes input-focus-glow {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .settings-section {
          animation: settings-in 0.5s cubic-bezier(0.16,1,0.3,1) both;
        }
        .settings-section:nth-child(1) { animation-delay: 0.04s; }
        .settings-section:nth-child(2) { animation-delay: 0.09s; }
        .settings-section:nth-child(3) { animation-delay: 0.14s; }
        .settings-section:nth-child(4) { animation-delay: 0.19s; }
        .settings-section:nth-child(5) { animation-delay: 0.24s; }

        .settings-card {
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .settings-card:hover {
          box-shadow: 0 0 60px rgba(124,58,237,0.08), 0 0 0 1px rgba(124,58,237,0.12) !important;
        }

        /* Floating label inputs */
        .float-field {
          position: relative;
          margin-bottom: 20px;
        }
        .float-field label {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: #52525b;
          pointer-events: none;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
          background: transparent;
          padding: 0 4px;
          font-weight: 600;
          letter-spacing: 0.02em;
          z-index: 1;
        }
        .float-field:focus-within label,
        .float-field.has-value label {
          top: 0;
          font-size: 9px;
          color: #a78bfa;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: #04040c;
          padding: 0 6px;
        }
        .float-field textarea ~ label {
          top: 14px;
          transform: none;
        }
        .float-field:focus-within textarea ~ label,
        .float-field.has-value textarea ~ label {
          top: -8px;
          transform: none;
        }

        .settings-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e4e4e7;
          outline: none;
          box-sizing: border-box;
          display: block;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.25s, background 0.2s;
        }
        .settings-input::placeholder { color: transparent; }
        .settings-input:focus {
          border-color: rgba(124,58,237,0.55);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1), 0 0 24px rgba(124,58,237,0.08);
          background: rgba(10,5,30,0.6);
        }
        .settings-input:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        /* Plain label style (for non-float fields) */
        .field-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #52525b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 7px;
        }

        /* Static input with label above */
        .static-input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 13px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: #e4e4e7;
          outline: none;
          box-sizing: border-box;
          display: block;
          margin-bottom: 18px;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.25s, background 0.2s;
        }
        .static-input::placeholder { color: #3f3f46; }
        .static-input:focus {
          border-color: rgba(124,58,237,0.55);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1), 0 0 24px rgba(124,58,237,0.08);
          background: rgba(10,5,30,0.6);
        }
        .static-input:disabled { opacity: 0.35; cursor: not-allowed; }

        .settings-save-btn {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .settings-save-btn::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .settings-save-btn:hover::after { animation: shimmer-save 0.5s ease forwards; }
        .settings-save-btn:hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 0 36px rgba(124,58,237,0.55) !important;
        }

        .danger-section { animation: danger-pulse 4s ease-in-out infinite; }

        /* Constellation dots */
        .constellation-dot {
          position: absolute;
          border-radius: 50%;
          background: rgba(167,139,250,0.8);
          box-shadow: 0 0 4px rgba(167,139,250,0.6);
        }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 30px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
            animation: "float-icon 3s ease-in-out infinite",
            position: "relative", zIndex: 1,
          }}>
            <Settings size={22} color="#fff" />
          </div>
          {/* Rotating ring */}
          <div style={{
            position: "absolute", inset: -5, borderRadius: 22,
            border: "1px solid rgba(124,58,237,0.35)",
            animation: "border-rotate 6s linear infinite",
            background: "conic-gradient(from 0deg, rgba(124,58,237,0.5) 0deg, transparent 80deg, transparent 280deg, rgba(124,58,237,0.3) 360deg)",
          }} />
        </div>
        <div>
          <h1 style={{
            fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #fff 0%, #c4b5fd 40%, #a78bfa 80%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            animation: "glitch-title 10s ease-in-out infinite",
          }}>
            Settings
          </h1>
          <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>Manage your account, security & preferences</p>
        </div>
      </div>

      {/* ── FEEDBACK BANNERS ── */}
      {successMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 18px", borderRadius: 14, marginBottom: 22,
          background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.3)",
          boxShadow: "0 0 24px rgba(16,185,129,0.1)",
        }}>
          <CheckCircle2 size={16} color="#10b981" />
          <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 18px", borderRadius: 14, marginBottom: 22,
          background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.3)",
          boxShadow: "0 0 24px rgba(239,68,68,0.1)",
        }}>
          <AlertCircle size={16} color="#ef4444" />
          <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── PROFILE ── */}
        <div className="settings-section">
          <Section icon={User} title="Profile" subtitle="Your identity across Aether" accentColor="#7c3aed">

            {/* ── Avatar card with constellation halo ── */}
            <div style={{
              display: "flex", alignItems: "center", gap: 18,
              padding: "18px 20px", borderRadius: 16, marginBottom: 28,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              position: "relative", overflow: "hidden",
            }}>
              {/* Ambient glow */}
              <div style={{
                position: "absolute", top: -30, left: -10, width: 160, height: 160,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }} />

              {/* Avatar with orbiting constellation */}
              <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                {/* Outer orbiting ring */}
                <div style={{
                  position: "absolute", inset: -12, borderRadius: "50%",
                  border: "1px solid rgba(124,58,237,0.25)",
                  animation: "avatar-halo-orbit 8s linear infinite",
                }}>
                  {/* Orbiting dot */}
                  <div className="constellation-dot" style={{ width: 5, height: 5, top: -2.5, left: "50%", transform: "translateX(-50%)" }} />
                </div>
                {/* Inner orbiting ring */}
                <div style={{
                  position: "absolute", inset: -6, borderRadius: "50%",
                  border: "1px dashed rgba(167,139,250,0.2)",
                  animation: "avatar-halo-orbit-rev 5s linear infinite",
                }}>
                  <div className="constellation-dot" style={{ width: 3, height: 3, bottom: -1.5, left: "50%", transform: "translateX(-50%)" }} />
                </div>

                {/* Avatar */}
                <div style={{
                  width: 64, height: 64, borderRadius: 18,
                  background: "linear-gradient(135deg,#7c3aed,#ec4899,#6d28d9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 30px rgba(124,58,237,0.5), 0 0 0 2px rgba(167,139,250,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
                  position: "relative",
                }}>
                  {initials}
                </div>

                {/* Online dot */}
                <div style={{
                  position: "absolute", bottom: -1, right: -1, zIndex: 10,
                  width: 14, height: 14, borderRadius: "50%",
                  background: "#10b981", border: "2px solid #09090b",
                  boxShadow: "0 0 8px rgba(16,185,129,0.9), 0 0 16px rgba(16,185,129,0.4)",
                  animation: "pulse-dot 2.4s ease infinite",
                }} />
              </div>

              <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{displayName}</div>
                <div style={{ fontSize: 12, color: "#52525b" }}>{user.email}</div>
                <div style={{ marginTop: 10 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", borderRadius: 999, padding: "4px 12px",
                    color: user.plan === "FREE" ? "#71717a" : "#a78bfa",
                    background: user.plan === "FREE" ? "rgba(113,113,122,0.1)" : "rgba(124,58,237,0.12)",
                    border: `1px solid ${user.plan === "FREE" ? "rgba(113,113,122,0.2)" : "rgba(124,58,237,0.28)"}`,
                    boxShadow: user.plan !== "FREE" ? "0 0 12px rgba(124,58,237,0.2)" : "none",
                  }}>
                    {user.plan !== "FREE" && <Sparkles size={10} />}
                    {user.plan}
                  </span>
                </div>
              </div>
            </div>

            <form action={updateProfile}>
              <label className="field-label">Display name</label>
              <input className="static-input" name="name" type="text" defaultValue={user.name ?? ""} placeholder="Your name" required />

              <label className="field-label">Email address</label>
              <input className="static-input" type="email" value={user.email} readOnly disabled />
              <p style={{ fontSize: 11, color: "#3f3f46", marginTop: -14, marginBottom: 20 }}>
                Email cannot be changed. Contact support if needed.
              </p>
              <SaveBtn label="Save Profile" />
            </form>
          </Section>
        </div>

        {/* ── PASSWORD ── */}
        <div className="settings-section">
          <Section icon={Lock} title="Change Password" subtitle="Keep your account secure" accentColor="#3b82f6">
            <form action={changePassword}>
              <label className="field-label">Current password</label>
              <input className="static-input" name="current" type="password" placeholder="••••••••" required />

              <label className="field-label">New password <span style={{ fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>(min. 8 characters)</span></label>
              <input className="static-input" name="next" type="password" placeholder="••••••••" required />

              <label className="field-label">Confirm new password</label>
              <input className="static-input" name="confirm" type="password" placeholder="••••••••" required />

              <SaveBtn label="Change Password" />
            </form>
          </Section>
        </div>

        {/* ── API KEYS ── */}
        <div className="settings-section">
          <Section icon={Key} title="API Keys & Integrations" subtitle="Power your campaigns and outreach" accentColor="#f59e0b">
            <p style={{ fontSize: 12, color: "#52525b", marginBottom: 22, lineHeight: 1.65 }}>
              These keys power your campaigns and email outreach. Stored securely and never shared with third parties.
            </p>

            <form action={saveApiKeys}>
              {/* Integration cards */}
              {[
                { label: "Resend API Key", name: "resendApiKey", type: "password" as const, value: user.resendApiKey ?? "", placeholder: "re_...", desc: "Email campaigns", color: "#f59e0b" },
                { label: "From Email", name: "fromEmail", type: "email" as const, value: user.fromEmail ?? "", placeholder: "you@yourdomain.com", desc: "Sender address", color: "#10b981" },
                { label: "Serper API Key", name: "serperApiKey", type: "password" as const, value: user.serperApiKey ?? "", placeholder: "serper_...", desc: "Web research", color: "#3b82f6" },
              ].map(field => (
                <div key={field.name} style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <label className="field-label" style={{ margin: 0 }}>{field.label}</label>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      background: `${field.color}14`, color: field.color,
                      border: `1px solid ${field.color}25`, letterSpacing: "0.05em",
                    }}>
                      {field.desc}
                    </span>
                  </div>
                  <input
                    className="static-input"
                    name={field.name}
                    type={field.type}
                    defaultValue={field.value}
                    placeholder={field.placeholder}
                    style={{ marginBottom: 0 }}
                  />
                </div>
              ))}

              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 16px", borderRadius: 11, marginBottom: 20, marginTop: 4,
                background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
                fontSize: 11, color: "#60a5fa",
              }}>
                <Shield size={12} />
                Get Resend key at <strong>resend.com</strong> · Serper key at <strong>serper.dev</strong>
              </div>

              <SaveBtn label="Save API Keys" />
            </form>
          </Section>
        </div>

        {/* ── NOTIFICATIONS ── */}
        <div className="settings-section">
          <Section icon={Bell} title="Notifications" subtitle="Control when and how Aether alerts you" accentColor="#ec4899">
            <SettingsToggles />
          </Section>
        </div>

        {/* ── DANGER ZONE ── */}
        <div className="settings-section danger-section">
          <Section icon={Trash2} title="Danger Zone" subtitle="Irreversible actions — proceed with extreme caution" danger>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", marginBottom: 6 }}>
                  Delete Account
                </div>
                <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.65, maxWidth: 360 }}>
                  Permanently removes your account, all AI employees, runs, campaigns, and all associated data.
                  This action cannot be undone.
                </div>
              </div>
              <DeleteAccountButton />
            </div>
          </Section>
        </div>

      </div>
    </div>
  );
}
