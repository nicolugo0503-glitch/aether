"use client";
import { useState } from "react";

function Toggle({ label, hint, defaultOn }: { label: string; hint: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#52525b" }}>{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => setOn(o => !o)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: on ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.1)",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
          boxShadow: on ? "0 0 8px rgba(124,58,237,0.4)" : "none",
        }}
        aria-pressed={on}
      >
        <span style={{
          position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
          left: on ? 22 : 2,
        }} />
      </button>
    </div>
  );
}

export function SettingsToggles() {
  return (
    <div>
      <Toggle label="Email Notifications"    hint="Receive updates on runs and deployments."  defaultOn={true} />
      <Toggle label="Run Completion Alerts"  hint="Notify when agents complete tasks."         defaultOn={true} />
      <Toggle label="Weekly Digest"          hint="Summary of activity every Monday."          defaultOn={false} />
    </div>
  );
}
