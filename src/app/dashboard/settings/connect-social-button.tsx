"use client";
import { useState } from "react";

export function ConnectSocialButton({ connected }: { connected: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const r = await fetch("/api/social/connect");
      const d = await r.json();
      if (d.url) window.open(d.url, "_blank");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
        <span className="text-sm text-zinc-400">
          {connected ? "Social accounts connected via Ayrshare" : "No social accounts connected yet"}
        </span>
      </div>
      <button onClick={handleConnect} disabled={loading} className="btn-secondary">
        {loading ? "Opening..." : connected ? "Manage Connected Accounts" : "Connect Social Accounts"}
      </button>
      {!connected && (
        <p className="text-xs text-zinc-600">
          Click the button above to connect Facebook, Instagram, and X in one simple step.
        </p>
      )}
    </div>
  );
}
