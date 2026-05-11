"use client";
import { useState, useEffect } from "react";

const STORAGE_KEY = "aether_notification_prefs";

function loadPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function Toggle({
  id,
  label,
  hint,
  defaultOn,
}: {
  id: string;
  label: string;
  hint: string;
  defaultOn: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = loadPrefs();
    if (id in saved) setOn(saved[id]);
  }, [id]);

  const toggle = () => {
    const next = !on;
    setOn(next);
    try {
      const prefs = loadPrefs();
      prefs[id] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {}
  };

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
        onClick={toggle}
        style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: on ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.1)",
          position: "relative", transition: "background 0.2s", flexShrink: 0,
          boxShadow: on ? "0 0 8px rgba(124,58,237,0.4)" : "none",
          opacity: mounted ? 1 : 0,
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
      <Toggle id="email_notifications"   label="Email Notifications"   hint="Receive updates on runs and deployments."  defaultOn={true}  />
      <Toggle id="run_completion_alerts" label="Run Completion Alerts"  hint="Notify when agents complete tasks."         defaultOn={true}  />
      <Toggle id="weekly_digest"         label="Weekly Digest"          hint="Summary of activity every Monday."          defaultOn={false} />
    </div>
  );
}
