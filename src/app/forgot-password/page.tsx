"use client";
import Link from "next/link";
import { useState } from "react";
import { AetherMark } from "@/components/ui/logo";
import { ArrowRight, CheckCircle, Shield } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true); // Always show success — don't reveal if email exists
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%)", filter: "blur(80px)", animation: "pulse-glow 6s ease-in-out infinite" }} />
        <div className="absolute -bottom-32 -right-20 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.15) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="rounded-3xl p-8 md:p-10"
          style={{
            background: "rgba(8,8,12,0.88)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(32px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(124,58,237,0.08)",
          }}>

          {/* Logo */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <AetherMark size={36} glow />
              <span className="font-black text-white text-xl tracking-tight">Aether</span>
            </Link>
            <Link href="/login" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Back to login</Link>
          </div>

          {sent ? (
            /* Success state */
            <div className="text-center py-4">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-white mb-3">Check your inbox</h1>
              <p className="text-zinc-500 mb-8 leading-relaxed">
                If an account exists for <strong className="text-zinc-300">{email}</strong>, we&apos;ve sent a password reset link. Check your spam folder if you don&apos;t see it.
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors font-semibold">
                Return to sign in →
              </Link>
            </div>
          ) : (
            /* Form state */
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Forgot password?</h1>
                <p className="text-zinc-500">No worries — we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label mb-2 block">Email address</label>
                  <input
                    className="input focus:border-violet-500/60"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base btn-shine group mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    boxShadow: "0 0 40px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
                  }}>
                  {loading ? "Sending..." : "Send reset link"}
                  {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-zinc-600">
                Remember it?{" "}
                <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
                  Sign in →
                </Link>
              </p>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-2 text-zinc-700 text-xs">
            <Shield className="h-3.5 w-3.5" />
            Reset links expire in 1 hour
          </div>
        </div>
      </div>
    </div>
  );
}
