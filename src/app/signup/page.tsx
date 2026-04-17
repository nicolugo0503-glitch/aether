import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { ArrowRight, Check, Shield } from "lucide-react";

async function signup(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  if (!email || !password || password.length < 8) return redirect("/signup?error=invalid");
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return redirect("/signup?error=exists");
  const user = await prisma.user.create({
    data: {
      email,
      name: name || email.split("@")[0],
      passwordHash: await hashPassword(password),
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
  await createSession(user.id);
  redirect("/dashboard");
}

export default async function SignupPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16">
        <div className="orb w-[500px] h-[500px] bg-violet-700/25 top-[-100px] left-[-100px] animate-pulse-glow" />
        <div className="orb w-[300px] h-[300px] bg-cyan-600/10 bottom-0 right-[-50px]" />
        <div className="relative z-10 max-w-sm">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center glow-purple-sm">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-semibold text-white text-lg">Aether</span>
          </Link>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Build your AI team<br />in 10 minutes.
          </h2>
          <p className="text-zinc-400 leading-relaxed mb-10">
            Deploy AI employees that send emails, post on social, research leads, and more — all on autopilot.
          </p>
          <div className="space-y-3">
            {[
              "Ava (AI SDR) ready to deploy instantly",
              "Connect Google Sheets in 1 click",
              "Auto-post to Instagram + Facebook",
              "25 free runs, no credit card needed",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-violet-400" />
                </div>
                <span className="text-zinc-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 relative">
        <div className="orb w-[400px] h-[400px] bg-violet-600/10 top-0 right-0" />
        <div className="relative z-10 w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-semibold text-white">Aether</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create your workspace</h1>
            <p className="text-zinc-400">Free forever. No credit card required.</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error === "exists" ? "An account with that email already exists." : "Please enter a valid email and password (8+ characters)."}
            </div>
          )}

          <form action={signup} className="space-y-4">
            <div>
              <label className="label mb-2 block">Your name</label>
              <input className="input" type="text" name="name" placeholder="Alex Chen" />
            </div>
            <div>
              <label className="label mb-2 block">Work email</label>
              <input className="input" type="email" name="email" required
                autoComplete="email" placeholder="alex@company.com" />
            </div>
            <div>
              <label className="label mb-2 block">Password</label>
              <input className="input" type="password" name="password" required
                minLength={8} autoComplete="new-password" placeholder="8+ characters" />
            </div>
            <button className="btn-primary w-full py-3.5 text-base rounded-xl glow-purple-sm mt-2 btn-shine group">
              Create free workspace
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Sign in →
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-zinc-700">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-zinc-700 text-xs">
            <Shield className="h-3.5 w-3.5" />
            <span>256-bit SSL encryption · SOC 2 compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}
