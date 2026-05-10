import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Settings, Lock, Bell, Trash2, User, CheckCircle2, AlertCircle } from "lucide-react";
import { updateProfile, changePassword } from "./actions";
import { SettingsToggles } from "./_components/settings-toggles";
import { DeleteAccountButton } from "./_components/delete-button";

export const metadata = { title: "Settings | Aether Dashboard" };

const INPUT_STYLE = {
  width: "100%", padding: "9px 13px", borderRadius: 9, fontSize: 13,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", outline: "none", boxSizing: "border-box" as const,
  display: "block", marginBottom: 12,
};

function Section({
  icon: Icon,
  title,
  children,
  danger,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div style={{
      borderRadius: 16, padding: "22px 24px",
      background: danger ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.025)",
      border: `1px solid ${danger ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.07)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <Icon size={16} color={danger ? "#ef4444" : "#a78bfa"} />
        <h2 style={{ fontSize: 14, fontWeight: 700, color: danger ? "#ef4444" : "#fff", margin: 0 }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function SaveButton({ label, danger }: { label: string; danger?: boolean }) {
  return (
    <button type="submit" style={{
      padding: "9px 20px", borderRadius: 9, border: "none", cursor: "pointer",
      fontSize: 13, fontWeight: 700,
      background: danger ? "#ef4444" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
      color: "#fff",
      boxShadow: danger ? "0 0 12px rgba(239,68,68,0.3)" : "0 0 12px rgba(124,58,237,0.3)",
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

  const params = await searchParams;
  const successMsg = params.msg;
  const errorMsg   = params.err;

  const displayName = user.name || user.email.split("@")[0];
  const initials    = displayName[0].toUpperCase();

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 14px rgba(124,58,237,0.35)",
        }}>
          <Settings size={16} color="#fff" />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.4px", margin: 0 }}>
          Settings
        </h1>
      </div>

      {/* Feedback */}
      {successMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
          borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
          marginBottom: 16, fontSize: 13, color: "#10b981",
        }}>
          <CheckCircle2 size={14} /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
          borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
          marginBottom: 16, fontSize: 13, color: "#ef4444",
        }}>
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Profile */}
        <Section icon={User} title="Profile">
          {/* Current account */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", borderRadius: 10,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            marginBottom: 20,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontWeight: 900, color: "#fff",
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{displayName}</div>
              <div style={{ fontSize: 12, color: "#52525b" }}>{user.email}</div>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "3px 10px",
              color: user.plan === "FREE" ? "#71717a" : "#a78bfa",
              background: user.plan === "FREE" ? "rgba(113,113,122,0.12)" : "rgba(124,58,237,0.14)",
              border: `1px solid ${user.plan === "FREE" ? "rgba(113,113,122,0.2)" : "rgba(124,58,237,0.25)"}`,
            }}>
              {user.plan}
            </span>
          </div>

          <form action={updateProfile}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 5 }}>
              Display name
            </label>
            <input
              name="name"
              type="text"
              defaultValue={user.name ?? ""}
              placeholder="Your name"
              required
              style={INPUT_STYLE}
            />
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 5 }}>
              Email address
            </label>
            <input
              type="email"
              value={user.email}
              readOnly
              disabled
              style={{ ...INPUT_STYLE, opacity: 0.45, cursor: "not-allowed" }}
            />
            <p style={{ fontSize: 11, color: "#3f3f46", marginTop: -8, marginBottom: 14 }}>
              Email cannot be changed. Contact support if needed.
            </p>
            <SaveButton label="Save profile" />
          </form>
        </Section>

        {/* Password */}
        <Section icon={Lock} title="Change Password">
          <form action={changePassword}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 5 }}>
              Current password
            </label>
            <input name="current" type="password" placeholder="••••••••" required style={INPUT_STYLE} />

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 5 }}>
              New password <span style={{ color: "#52525b", fontWeight: 400 }}>(min. 8 characters)</span>
            </label>
            <input name="next" type="password" placeholder="••••••••" required style={INPUT_STYLE} />

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 5 }}>
              Confirm new password
            </label>
            <input name="confirm" type="password" placeholder="••••••••" required style={INPUT_STYLE} />

            <SaveButton label="Change password" />
          </form>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <SettingsToggles />
        </Section>

        {/* Danger */}
        <Section icon={Trash2} title="Danger Zone" danger>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#ef4444", marginBottom: 4 }}>
                Delete Account
              </div>
              <div style={{ fontSize: 12, color: "#71717a", maxWidth: 380 }}>
                Permanently removes your acc