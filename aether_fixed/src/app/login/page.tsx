import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark, Wordmark } from "@/components/nav";
import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ArrowRight, Shield, Terminal, Zap } from "lucide-react";

async function login(formData: FormData) {
  "use server";
  const email    = String(formData.get("email")    || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  if (!email || !password) return redirect("/login?error=missing");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash)))
    return redirect("/login?error=invalid");
  await createSession(user.id);
  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left — form */}
      <div className="flex flex-1 flex-col justify-between p-8 lg:max-w-xl">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LogoMark size={26} />
          <Wordmark />
        </Link>

        <div className="mx-auto w-full max-w-sm py-10">
          <div className="animate-fade-up mb-8">
            <div className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
              &gt; auth.login()
            </div>
            <h1 className="text-3xl font-black tracking-tight">Welcome back.</h1>
            <p className="mt-2 text-muted font-mono text-sm">Your workforce is waiting.</p>
          </div>

          {error && (
            <div className="animate-fade-up-d1 mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 font-mono text-xs text-red-400">
              ✗ {error === "invalid" ? "Invalid credentials. Try again." : "Missing fields."}
            </div>
          )}

          <form action={login} className="animate-fade-up-d2 space-y-4">
            <div>
              <label className="label mb-2 block">Email</label>
              <input className="input" type="email" name="email" required autoComplete="email" placeholder="you@company.com" />
            </div>
            <div>
              <label className="label mb-2 block">Password</label>
              <input className="input" type="password" name="password" required autoComplete="current-password" placeholder="••••••••••" />
            </div>
            <button className="btn-primary w-full py-3 rounded-xl text-base group mt-2">
              Sign in
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <p className="animate-fade-up-d3 mt-8 text-center font-mono text-xs text-muted">
            No account?{" "}
            <Link href="/signup" className="link">Deploy your AI workforce →</Link>
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs text-muted">
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> SOC 2 Type II</span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Systems nominal
          </span>
        </div>
      </div>

      {/* Right — terminal visual */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden bg-surface border-l border-border p-12">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow-green" />

        <div className="relative z-10 w-full max-w-md">
          <div className="card-terminal p-6 font-mono text-xs">
            <div className="flex items-center gap-2 mb-5 pb-3 border-b border-border/50">
              <Terminal className="h-4 w-4 text-accent" />
              <span className="text-accent">aether-runtime</span>
              <span className="ml-auto text-muted">v2.0.0</span>
            </div>
            <div className="space-y-2 text-muted">
              <div><span className="text-accent">→</span> Ava processed 142 leads today</div>
              <div><span className="text-accent">→</span> Sage closed 847 tickets this week</div>
              <div><span className="text-accent">→</span> Rex delivered 12 research briefs</div>
              <div className="text-border">──────────────────────────────</div>
              <div><span className="text-accent-2">✓</span> All agents operational</div>
              <div><span className="text-accent-2">✓</span> Uptime: 99.97% <span className="text-muted">(30d)</span></div>
              <div><span className="text-accent-2">✓</span> Total cost saved: <span className="text-accent">$28,400</span></div>
              <div className="text-border">──────────────────────────────</div>
              <div className="flex items-center gap-1">
                <span className="text-accent">&gt;</span>
                <span className="text-text">Awaiting your session</span>
                <span className="cursor-blink" />
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Zap,      label: "Autonomous", val: "24/7" },
              { icon: Shield,   label: "Secure",     val: "SOC 2" },
              { icon: Terminal, label: "Observable", val: "Full logs" },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="rounded-xl border border-border bg-panel p-3 text-center">
                <Icon className="h-4 w-4 text-accent mx-auto mb-1.5" />
                <div className="font-mono text-[10px] text-muted">{label}</div>
                <div className="font-mono text-xs font-bold text-text">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
