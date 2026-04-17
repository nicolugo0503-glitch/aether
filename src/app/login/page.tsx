import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ArrowRight, Shield } from "lucide-react";

async function login(formData: FormData) {
  "use server";
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

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16">
        <div className="orb w-[500px] h-[500px] bg-violet-700/25 top-[-100px] left-[-100px] animate-pulse-glow" />
        <div className="orb w-[300px] h-[300px] bg-cyan-600/10 bottom-[-50px] right-[-50px]" />
        <div className="relative z-10 max-w-sm">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <div className="h-9 w-9 rounded-xl bg-violet-600 flex items-center justify-center glow-purple-sm">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="font-semibold text-white text-lg">Aether</span>
          </Link>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Your AI workforce<br />is waiting for you.
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-12">
            Sign back in and let your agents continue working — emails, social posts, research, all running automatically.
          </p>
          <div className="space-y-4">
            {["Ava sent 47 cold emails this morning","Social post published to Instagram","Rex completed 3 research reports"].map((msg, i) => (
              <div key={i} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow shrink-0" />
                <span className="text-zinc-300 text-sm">{msg}</span>
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
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-zinc-400">Sign in to your workspace</p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error === "invalid" ? "Invalid email or password. Please try again." : "Please fill in all fields."}
            </div>
          )}

          <form action={login} className="space-y-4">
            <div>
              <label className="label mb-2 block">Email address</label>
              <input className="input" type="email" name="email" required
                autoComplete="email" placeholder="you@company.com" />
            </div>
            <div>
              <label className="label mb-2 block">Password</label>
              <input className="input" type="password" name="password" required
                autoComplete="current-password" placeholder="••••••••" />
            </div>
            <button className="btn-primary w-full py-3.5 text-base rounded-xl glow-purple-sm mt-2 btn-shine group">
              Sign in to Aether
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
              Create one free →
            </Link>
          </p>

          <div className="mt-10 flex items-center justify-center gap-2 text-zinc-700 text-xs">
            <Shield className="h-3.5 w-3.5" />
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
