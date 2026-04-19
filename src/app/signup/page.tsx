import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";
import { ArrowRight, Check, Shield, Zap } from "lucide-react";
import { AetherMark } from "@/components/ui/logo";
import crypto from "crypto";

async function signup(formData: FormData) {
  "use server";
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return redirect("/signup?error=ratelimit");
  }

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  if (!email || !password || password.length < 8) return redirect("/signup?error=invalid");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return redirect("/signup?error=exists");

  const verifyToken = crypto.randomBytes(32).toString("hex");

  await prisma.user.create({
    data: {
      email,
      name: name || email.split("@")[0],
      passwordHash: await hashPassword(password),
      emailVerified: false,
      emailVerifyToken: verifyToken,
      agents: {
        create: {
          name: "Ava — AI SDR",
          role: "Sales Development Rep",
          description: "Crafts hyper-personalized cold outreach from lead context.",
          systemPrompt: "You are Ava, an elite B2B SDR. Given a lead profile, produce a tight 80-word cold email with a specific hook. No fluff, one CTA.",
        },
      },
    },
  });

  // Send verification email via Resend
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://www.useaether.net"}/api/auth/verify-email?token=${verifyToken}`;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@useaether.net";

  if (resendKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `Aether <${fromEmail}>`,
        to: email,
        subject: "Verify your Aether email",
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#09090b;color:#fff;border-radius:16px">
            <div style="margin-bottom:32px">
              <span style="font-size:24px;font-weight:900;color:#fff">Aether</span>
            </div>
            <h2 style="font-size:22px;font-weight:700;margin-bottom:12px">Verify your email</h2>
            <p style="color:#a1a1aa;margin-bottom:28px;line-height:1.6">
              You're almost in. Click the button below to verify your email and access your workspace.
            </p>
            <a href="${verifyUrl}"
               style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px">
              Verify email →
            </a>
            <p style="color:#52525b;font-size:12px;margin-top:32px">
              If you didn't create an Aether account, you can safely ignore this email.<br/>
              Link: ${verifyUrl}
            </p>
          </div>
        `,
      }),
    }).catch(() => null);
  }

  redirect("/signup?verified=pending");
}

export default async function SignupPage({
  searchParams,
}: { searchParams: Promise<{ error?: string; verified?: string }> }) {
  const { error, verified } = await searchParams;

  if (verified === "pending") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Check your inbox</h1>
          <p className="text-zinc-400 leading-relaxed mb-8">
            We sent a verification link to your email. Click it to activate your account and access your workspace.
          </p>
          <p className="text-zinc-600 text-sm">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 transition-colors">try again</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex relative overflow-hidden">

      {/* Cinematic background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[800px] h-[800px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%)", filter: "blur(80px)", animation: "pulse-glow 7s ease-in-out infinite" }} />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.15) 0%, transparent 70%)", filter: "blur(80px)", animation: "float 12s ease-in-out infinite" }} />
        <div className="absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
      </div>

      {/* LEFT: Feature showcase */}
      <div className="hidden lg:flex lg:w-[45%] relative z-10 flex-col justify-center p-16 border-r border-white/[0.04]">
        <Link href="/" className="flex items-center gap-2.5 mb-16">
          <AetherMark size={36} glow />
          <span className="font-black text-white text-xl tracking-tight">Aether</span>
        </Link>

        <div className="mb-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-[1.05] tracking-tight">
            Build your AI team<br />
            <span className="gradient-text">in 10 minutes.</span>
          </h2>
          <p className="text-zinc-500 leading-relaxed text-lg">
            Deploy agents that never sleep, never quit, and cost less than a coffee per day.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4 mb-12">
          {[
            { text: "Ava — AI SDR ready to deploy instantly", color: "#7c3aed" },
            { text: "Auto-post to Instagram, Facebook & X", color: "#e1306c" },
            { text: "Send 1,000+ personalized emails a day", color: "#0891b2" },
            { text: "25 free runs · No credit card required", color: "#059669" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${item.color}20`, border: `1px solid ${item.color}35` }}>
                <Check className="h-3 w-3" style={{ color: item.color }} />
              </div>
              <span className="text-zinc-300 text-sm">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex -space-x-2">
              {["#7c3aed","#2563eb","#059669","#dc2626"].map((c, i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: c }}>
                  {["N","A","M","J"][i]}
                </div>
              ))}
            </div>
            <span className="text-zinc-400 text-sm"><strong className="text-white">2,400+</strong> teams already inside</span>
          </div>
          <p className="text-xs text-zinc-600">&ldquo;Replaced two full-time contractors on day one.&rdquo; — Ana R., CEO</p>
        </div>
      </div>

      {/* RIGHT: Signup form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <AetherMark size={32} glow />
            <span className="font-black text-white text-lg tracking-tight">Aether</span>
          </div>

          <div className="rounded-3xl p-8"
            style={{
              background: "rgba(8,8,12,0.85)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(32px)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.06)",
            }}>

            {/* Heading */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
                <Zap className="h-3 w-3 fill-emerald-400" />
                Free forever · No credit card
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Create workspace</h1>
              <p className="text-zinc-500 mt-1">Your AI team will be ready in minutes.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error === "exists"    ? "An account with that email already exists." :
                 error === "ratelimit" ? "Too many signups from this device. Try again in an hour." :
                 "Please enter a valid email and password (8+ chars)."}
              </div>
            )}

            {/* Form */}
            <form action={signup} className="space-y-4">
              <div>
                <label className="label mb-1.5 block">Your name</label>
                <input className="input" type="text" name="name" placeholder="Alex Chen" />
              </div>
              <div>
                <label className="label mb-1.5 block">Work email</label>
                <input className="input" type="email" name="email" required autoComplete="email" placeholder="alex@company.com" />
              </div>
              <div>
                <label className="label mb-1.5 block">Password</label>
                <input className="input" type="password" name="password" required minLength={8} autoComplete="new-password" placeholder="8+ characters" />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-bold text-base btn-shine group mt-2"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: "0 0 40px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.1)",
                }}>
                Create free workspace
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-zinc-600">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">Sign in →</Link>
            </p>

            <p className="mt-4 text-center text-xs text-zinc-700">
              By signing up you agree to our{" "}
              <Link href="/terms" className="hover:text-zinc-400 transition-colors underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors underline">Privacy Policy</Link>.
            </p>
            <div className="mt-4 pt-5 border-t border-white/[0.04] flex items-center justify-center gap-2 text-zinc-700 text-xs">
              <Shield className="h-3.5 w-3.5" />
              256-bit SSL · SOC 2 · GDPR Compliant
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
