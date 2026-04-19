import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { ArrowRight, Shield } from "lucide-react";
import { AetherMark } from "@/components/ui/logo";

async function login(formData: FormData) {
  "use server";
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // 10 attempts per 15 minutes per IP
  if (isRateLimited(`login:${ip}`, 10)) {
    return redirect("/login?error=ratelimit");
  }

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return redirect("/login?error=missing");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return redirect("/login?error=invalid");
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  const errorMsg =
    error === "invalid"   ? "Invalid email or password — try again." :
    error === "missing"   ? "Please fill in all fields." :
    error === "ratelimit" ? "Too many attempts. Please wait 15 minutes and try again." :
    null;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">

      {/* Cinematic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.35) 0%, transparent 70%)", filter: "blur(80px)", animation: "pulse-glow 6s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.2) 0%, transparent 70%)", filter: "blur(80px)", animation: "float 10s ease-in-out infinite" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="rounded-3xl p-8 md:p-10"
          style={{
            background: "rgba(8,8,12,0.88)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(32px)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 40px 80px rgba(0,0,0,0.7), 0 0 80px rgba(124,58,237,0.08)",
          }}>

          {/* Logo + back link */}
          <div className="flex items-center justify-between mb-10">
            <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <AetherMark size={36} glow />
              <span className="font-black text-white text-xl tracking-tight">Aether</span>
            </Link>
            <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">← Home</Link>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Welcome back.</h1>
            <p className="text-zinc-500">Your agents kept working. Sign in to review.</p>
          </div>

          {/* Live activity */}
          <div className="rounded-2xl p-3 mb-8 space-y-2"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)" }}>
            {[
              { msg: "Ava sent 47 cold emails this morning", time: "2h ago" },
              { msg: "Social post published to Instagram + X", time: "4h ago" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  {item.msg}
                </div>
                <span className="text-xs text-zinc-700 shrink-0 ml-2">{item.time}</span>
              </div>
            ))}
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form action={login} className="space-y-4">
            <div>
              <label className="label mb-2 block">Email address</label>
              <input
                className="input focus:border-violet-500/60"
                type="email" name="email" required
                autoComplete="email" placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label">Password</label>
                <Link href="/forgot-password" className="text-xs text-zinc-600 hover:text-violet-400 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                className="input focus:border-violet-500/60"
                type="password" name="password" required
                autoComplete="current-password" placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base btn-shine group mt-2"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                boxShadow: "0 0 40px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}>
              Sign in to Aether
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
              Start free →
            </Link>
          </p>

          <div className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-2 text-zinc-700 text-xs">
            <Shield className="h-3.5 w-3.5" />
            256-bit encryption · SOC 2 · No credit card needed
          </div>
        </div>
      </div>
    </div>
  );
}
