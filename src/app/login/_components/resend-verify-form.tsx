"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResendVerifyForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
      } else {
        router.push("/login?resent=1");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-1">
      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded-lg px-3 py-2 text-xs bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 rounded-lg text-xs font-bold text-amber-900 disabled:opacity-50 shrink-0"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
        >
          {loading ? "Sending…" : "Resend"}
        </button>
      </div>
    </form>
  );
}
