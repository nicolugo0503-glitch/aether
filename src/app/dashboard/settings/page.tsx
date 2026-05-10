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
  const bg     = danger ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.022)";
  return (
    <div style={{
      borderRadius: 18, overflow: "hidden",
      background: bg,
      border: `1px solid ${border}`,
      boxShadow: danger ? "inset 0 1px 0 rgba(239,68,68,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.03)",
    }}>
      {/* Section header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "16px 22px",
        borderBottom: `1px solid ${danger ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)"}`,
        background: danger
          ? "linear-gradient(90deg, rgba(239,68,68,0.06) 0%, transparent 60%)"
          : `linear-gradient(90deg, ${color}0d 0%, transparent 60%)`,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: `${color}15`,
          border: `1px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 12px ${color}15`,
        }}>
          <Icon size={15} color={color} />
        </div>
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: danger ? "#ef4444" : "#fff", letterSpacing: "-0.1px" }}>
            {title}
          </h2>
          {subtitle && <p style={{ fontSize: 11, color: "#52525b", marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>

      {/* Section body */}
      <div style={{ padding: "20px 22px" }}>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block", fontSize: 10, fontWeight: 700, color: "#52525b",
      textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7,
    }}>
      {children}
    </label>
  );
}

function SaveBtn({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <button type="submit" className="settings-save-btn" style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "10px 22px", borderRadius: 11, border: "none", cursor: "pointer",
      fontSize: 12, fontWeight: 700,
      background: danger ? "linear-gradient(135deg,#ef4444,#dc2626)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
      color: "#fff",
      boxShadow: danger ? "0 0 16px rgba(239,68,68,0.3)" : "0 0 16px rgba(124,58,237,0.3)",
      position: "relative", overflow: "hidden",
    }}>
      {label}
    </button>
  );
}

const INPUT_BASE: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  fontSize: 13, background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  color: "#e4e4e7", outline: "none",
  boxSizing: "border-box", display: "block",
  marginBottom: 14, fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s, background 0.2s",
};

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
    <div style={{ maxWidth: 660 }}>
      <style>{`
        @keyframes settings-in {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-icon { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.5); }
          50% { opacity:0.7; box-shadow:0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes shimmer-save {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes danger-pulse {
          0%,100% { border-color: rgba(239,68,68,0.18); }
          50% { border-color: rgba(239,68,68,0.35); }
        }

        .settings-section { animation: settings-in 0.45s cubic-bezier(0.16,1,0.3,1) both; }
        .settings-section:nth-child(1) { animation-delay: 0.04s; }
        .settings-section:nth-child(2) { animation-delay: 0.08s; }
        .settings-section:nth-child(3) { animation-delay: 0.12s; }
        .settings-section:nth-child(4) { animation-delay: 0.16s; }
        .settings-section:nth-child(5) { animation-delay: 0.20s; }

        .settings-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          color: #e4e4e7;
          outline: none;
          box-sizing: border-box;
          display: block;
          margin-bottom: 14px;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .settings-input::placeholder { color: #3f3f46; }
        .settings-input:focus {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1), 0 0 20px rgba(124,58,237,0.08);
          background: rgba(124,58,237,0.04);
        }
        .settings-input:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .settings-save-btn {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .settings-save-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .settings-save-btn:hover::after {
          animation: shimmer-save 0.5s ease forwards;
        }
        .settings-save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 28px rgba(124,58,237,0.5) !important;
        }

        .danger-section { animation: danger-pulse 4s ease-in-out infinite; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          animation: "float-icon 3s ease-in-out infinite",
        }}>
          <Settings size={20} color="#fff" />
        </div>
        <div>
          <h1 style={{
            fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #fff 0%, #a78bfa 60%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            Settings
          </h1>
          <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>Manage your account and preferences</p>
        </div>
      </div>

      {/* ── FEEDBACK BANNERS ── */}
      {successMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 12, marginBottom: 20,
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
          boxShadow: "0 0 20px rgba(16,185,129,0.08)",
        }}>
          <CheckCircle2 size={15} color="#10b981" />
          <span style={{ fontSize: 13, color: "#10b981", fontWeight: 500 }}>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", borderRadius: 12, marginBottom: 20,
          background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
          boxShadow: "0 0 20px rgba(239,68,68,0.08)",
        }}>
          <AlertCircle size={15} color="#ef4444" />
          <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── PROFILE ── */}
        <div className="settings-section">
          <Section icon={User} title="Profile" subtitle="Your identity across Aether" accentColor="#7c3aed">
            {/* Avatar card */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", borderRadius: 13, marginBottom: 22,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}>
              {/* Avatar with gradient ring */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 14,
                  background: "linear-gradient(135deg,#7c3aed,#ec4899)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 900, color: "#fff",
                  boxShadow: "0 0 0 2px rgba(124,58,237,0.4), 0 0 24px rgba(124,58,237,0.35)",
                }}>
                  {initials}
                </div>
                <div style={{
                  position: "absolute", bottom: -2, right: -2,
                  width: 12, height: 12, borderRadius: "50%",
                  background: "#10b981", border: "2px solid #09090b",
                  boxShadow: "0 0 6px rgba(16,185,129,0.7)",
                  animation: "pulse-dot 2.4s ease infinite",
                }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{displayName}</div>
                <div style={{ fontSize: 12, color: "#52525b", marginTop: 1 }}>{user.email}</div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", borderRadius: 999, padding: "3px 10px",
                color: user.plan === "FREE" ? "#71717a" : "#a78bfa",
                background: user.plan === "FREE" ? "rgba(113,113,122,0.12)" : "rgba(124,58,237,0.14)",
                border: `1px solid ${user.plan === "FREE" ? "rgba(113,113,122,0.2)" : "rgba(124,58,237,0.25)"}`,
              }}>
                {user.plan}
              </div>
            </div>

            <form action={updateProfile}>
              <FieldLabel>Display name</FieldLabel>
              <input className="settings-input" name="name" type="text" defaultValue={user.name ?? ""} placeholder="Your name" required />

              <FieldLabel>Email address</FieldLabel>
              <input className="settings-input" type="email" value={user.email} readOnly disabled />
              <p style={{ fontSize: 11, color: "#3f3f46", marginTop: -10, marginBottom: 18 }}>
                Email cannot be changed. Contact support if needed.
              </p>
              <SaveBtn label="Save Profile" />
            </form>
          </Section>
        </div>

        {/* ── PASSWORD ── */}
        <div className="settings-section">
          <Section icon={Lock} title="Change Password" subtitle="Secure your account" accentColor="#3b82f6">
            <form action={changePassword}>
              <FieldLabel>Current password</FieldLabel>
              <input className="settings-input" name="current" type="password" placeholder="••••••••" required />

              <FieldLabel>New password <span style={{ fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>(min. 8 characters)</span></FieldLabel>
              <input className="settings-input" name="next" type="password" placeholder="••••••••" required />

              <FieldLabel>Confirm new password</FieldLabel>
              <input className="settings-input" name="confirm" type="password" placeholder="••••••••" required />

              <SaveBtn label="Change Password" />
            </form>
          </Section>
        </div>

        {/* ── API KEYS ── */}
        <div className="settings-section">
          <Section icon={Key} title="API Keys & Integrations" subtitle="Power your campaigns and outreach" accentColor="#f59e0b">
            <p style={{ fontSize: 12, color: "#52525b", marginBottom: 20, lineHeight: 1.65 }}>
              These keys power your campaigns and email outreach. Stored securely and never shared with third parties.
            </p>

            {/* Integration cards */}
            {[
              {
                name: "Resend API Key",
                inputName: "resendApiKey",
                type: "password",
                defaultValue: user.resendApiKey ?? "",
                placeholder: "re_...",
                description: "For email campaigns",
                color: "#f59e0b",
                tag: "Email",
              },
              {
                name: "From Email",
                inputName: "fromEmail",
                type: "email",
                defaultValue: user.fromEmail ?? "",
                placeholder: "you@yourdomain.com",
                description: "Sender address for campaigns",
                color: "#10b981",
                tag: "Email",
              },
              {
                name: "Serper API Key",
                inputName: "serperApiKey",
                type: "password",
                defaultValue: user.serperApiKey ?? "",
                placeholder: "serper_...",
                description: "Web research & lead enrichment",
                color: "#3b82f6",
                tag: "Search",
              },
            ].map(field => (
              <div key={field.inputName} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    {field.name}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "1px 7px", borderRadius: 999,
                    background: `${field.color}14`, color: field.color,
                    border: `1px solid ${field.color}25`, letterSpacing: "0.05em",
                  }}>
                    {field.description}
                  </span>
                </div>
              </div>
            ))}

            <form action={saveApiKeys}>
              <FieldLabel>Resend API Key <span style={{ fontWeight: 400, color: "#52525b", textTransform: "none", letterSpacing: 0 }}>— for email campaigns</span></FieldLabel>
              <input className="settings-input" name="resendApiKey" type="password" defaultValue={user.resendApiKey ?? ""} placeholder="re_..." />

              <FieldLabel>From Email <span style={{ fontWeight: 400, color: "#52525b", textTransform: "none", letterSpacing: 0 }}>— sender address</span></FieldLabel>
              <input className="settings-input" name="fromEmail" type="email" defaultValue={user.fromEmail ?? ""} placeholder="you@yourdomain.com" />

              <FieldLabel>Serper API Key <span style={{ fontWeight: 400, color: "#52525b", textTransform: "none", letterSpacing: 0 }}>— web research & lead enrichment</span></FieldLabel>
              <input className="settings-input" name="serperApiKey" type="password" defaultValue={user.serperApiKey ?? ""} placeholder="serper_..." />

              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10, marginBottom: 18,
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
          <Section icon={Trash2} title="Danger Zone" subtitle="Irreversible actions — proceed with caution" danger>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 5 }}>
                  Delete Account
                </div>
                <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6, maxWidth: 360 }}>
                  Permanently removes your account, all AI employees, runs, and all data. This action cannot be undone.
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
