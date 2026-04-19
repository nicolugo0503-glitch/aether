import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark, Wordmark } from "@/components/nav";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { ArrowRight, Check, Shield, Star, Users } from "lucide-react";

async function signup(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "").toLowerCase().trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();
  if (!email || !password || password.length < 8) {
    return redirect("/signup?error=invalid");
  }

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
          description: "Drafts personalized cold emails from lead context.",
          systemPrompt:
            "You are Ava, an elite B2B SDR. Given a lead profile, produce a tight 80-word cold email with a specific hook. No fluff, one CTA.",
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
    <div className="min-h-screen bg-bg flex">
      {/* Left panel — social proof */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden bg-surface border-r border-border">
        <div className="pointer-events-none absolute inset-0 hero-dots opacity-20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(34,211,238,0.10),transparent)]" />

        <div className="relative z-10 max-w-sm px-8">
          <div className="section-eyebrow mb-6">Join the future of work</div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Deploy your first<br />
            <span className="gradient-text">AI employee</span><br />
            in 10 minutes
          </h2>
          <p className="text-muted text-sm leading-relaxed mb-10">
            Hundreds of teams have already replaced repetitive work with Æther.
            Start free — upgrade when you see the results.
          </p>

          {/* What you get */}
          <div className="space-y-3 mb-10">
            {[
              "25 runs free — no card required",
              "Ava (AI SDR) pre-built and ready",
              "40+ tool integrations",
              "SOC 2 Type II certified",
              "Full observability: cost, tokens, outcomes",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <span className="text-muted">{item}</span>
              </div>
            ))}
          </div>

          {/* Mini testimonial */}
          <div className="rounded-2xl border border-border bg-panel p-5">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-sm text-muted leading-relaxed">
              "We went from struggling to hit quota to having Ava book 40 meetings
              in the first week. Game-changer."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold">
                M
              </div>
              <div>
                <div className="text-xs font-semibold">Marcus R.</div>
                <div className="text-[11px] text-muted">Head of Sales, Lumen</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted">
            <Users className="h-3.5 w-3.5" />
            <span>Join 2,000+ teams already using Æther</span>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col justify-between p-8 lg:max-w-lg xl:max-w-xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LogoMark size={28} />
          <Wordmark />
        </Link>

        {/* Form */}
        <div className="mx-auto w-full max-w-sm py-12">
          <div className="animate-fade-up">
            <h1 className="text-3xl font-bold tracking-tight">
              Create your workspace
            </h1>
            <p className="mt-2 text-muted">
              Free forever. No credit card required.
            </p>
          </div>

          {error && (
            <div className="animate-fade-up-d1 mt-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-red-300">
              {error === "exists"
                ? "An account with that email already exists. Sign in instead?"
                : "Please enter a valid email and a password of at least 8 characters."}
            </div>
          )}

          <form action={signup} className="animate-fade-up-d2 mt-8 space-y-5">
            <div>
              <label className="label mb-2 block">Your name</label>
              <input
                className="input"
                type="text"
                name="name"
                placeholder="Alex Johnson"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="label mb-2 block">Work email</label>
              <input
                className="input"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="label mb-2 block">Password</label>
              <input
                className="input"
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
              />
            </div>

            <button className="btn-primary w-full py-3 rounded-xl text-base group mt-2">
              Create workspace — it's free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <p className="text-center text-[11px] text-muted leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="#" className="hover:text-text transition-colors underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="#" className="hover:text-text transition-colors underline">Privacy Policy</Link>.
            </p>
          </form>

          <p className="animate-fade-up-d3 mt-8 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="link font-medium">
              Sign in →
            </Link>
          </p>
        </div>

        {/* Bottom trust */}
        <div className="flex items-center gap-4 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            SOC 2 Type II
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" />
            No credit card
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Free forever plan
          </div>
        </div>
      </div>
    </div>
  );
}
