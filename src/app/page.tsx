import Link from "next/link";
import { ArrowRight, Bot, Mail, Share2, BarChart3, Zap, Shield, Globe, ChevronRight, Star, Check } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center glow-purple-sm">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white tracking-tight">Aether</span>
          <span className="hidden md:block text-xs text-zinc-600 border border-white/10 rounded-full px-2 py-0.5">AI Workforce</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#agents" className="hover:text-white transition-colors">AI Agents</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors hidden md:block">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm px-4 py-2">
            Start free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* Background orbs */}
        <div className="orb w-[800px] h-[800px] bg-violet-600/20 top-[-200px] left-1/2 -translate-x-1/2 animate-pulse-glow" />
        <div className="orb w-[400px] h-[400px] bg-cyan-500/10 top-[30%] right-[-100px]" />
        <div className="orb w-[300px] h-[300px] bg-violet-900/30 bottom-[10%] left-[-50px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-violet-300 mb-8"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse-glow" />
            Now with Social Media AI & Campaign Automation
            <ChevronRight className="h-3 w-3 opacity-60" />
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-bold leading-[0.95] tracking-tight mb-8">
            <span className="gradient-text text-glow">The AI Workforce</span>
            <br />
            <span className="text-white">for ambitious teams.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Aether gives you a team of AI employees that write emails, post on social media, research leads,
            and close deals — automatically, 24/7, at a fraction of the cost of human hires.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup"
              className="btn-primary px-8 py-4 text-base rounded-2xl glow-purple btn-shine group">
              Start free — no credit card
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="#features"
              className="btn-secondary px-8 py-4 text-base rounded-2xl">
              See what it can do
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <div className="flex -space-x-2">
              {["V","M","A","J","S"].map((l, i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: `hsl(${i * 50 + 250}, 70%, 45%)` }}>{l}</div>
              ))}
            </div>
            <span>Joined by <strong className="text-white">2,400+</strong> teams this month</span>
            <div className="flex gap-0.5 ml-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="relative mt-20 mx-auto max-w-5xl">
            <div className="gradient-border rounded-2xl overflow-hidden" style={{ boxShadow: "0 40px 120px rgba(124,58,237,0.2)" }}>
              <div className="bg-zinc-950 rounded-2xl overflow-hidden">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.05] bg-black">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 mx-4 rounded-md bg-white/[0.04] px-3 py-1 text-xs text-zinc-600 text-center">
                    app.aether.ai/dashboard
                  </div>
                </div>
                {/* Dashboard mockup */}
                <div className="grid grid-cols-4 min-h-[320px]">
                  {/* Sidebar */}
                  <div className="border-r border-white/[0.05] p-4 space-y-1">
                    {["Overview","AI Employees","Campaigns","Social Media","Runs","Billing"].map((item, i) => (
                      <div key={item} className={`rounded-lg px-3 py-2 text-xs text-left ${i === 2 ? "bg-violet-600/20 text-violet-300" : "text-zinc-600"}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                  {/* Main */}
                  <div className="col-span-3 p-6 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-sm font-semibold text-white">Campaigns</div>
                      <div className="text-xs bg-violet-600/20 text-violet-300 px-3 py-1 rounded-full">3 active</div>
                    </div>
                    {["Cold Outreach — April", "LinkedIn Follow-up", "Re-engagement Q2"].map((name, i) => (
                      <div key={name} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] px-4 py-3">
                        <div>
                          <div className="text-xs text-white font-medium">{name}</div>
                          <div className="text-xs text-zinc-600 mt-0.5">{[142, 89, 56][i]} leads · Ava — AI SDR</div>
                        </div>
                        <div className={`text-xs font-medium ${["text-emerald-400","text-yellow-400","text-emerald-400"][i]}`}>
                          {["done","running","done"][i]}
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {[["287","Emails Sent"],["94%","Delivery Rate"],["$0.02","Per Email"]].map(([val, label]) => (
                        <div key={label} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-center">
                          <div className="text-lg font-bold text-white">{val}</div>
                          <div className="text-xs text-zinc-600">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Glow under dashboard */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
          </div>
        </div>
      </section>

      {/* ── LOGOS ─────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-zinc-600 mb-8">Trusted by fast-moving teams</p>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-40">
            {["Lumen AI","Helix Labs","Northwind","Parallax","Quanta","Meridian"].map(n => (
              <span key={n} className="text-zinc-400 font-semibold tracking-tight text-sm">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className="py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5 bg-violet-500/5">
              What Aether can do
            </div>
            <h2 className="text-4xl md:text-6xl font-bold gradient-text mb-6">
              Your AI team works<br />while you sleep.
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Not a chatbot. A full autonomous workforce that takes action, sends emails, posts content, and reports results.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Mail,
                color: "from-violet-600 to-violet-800",
                glow: "rgba(124,58,237,0.3)",
                title: "AI Email Campaigns",
                desc: "Connect a Google Sheet of leads. Ava reads each one, searches the web for context, writes a hyper-personalized email, and sends it. Zero clicks after setup.",
                badge: "Campaigns",
              },
              {
                icon: Share2,
                color: "from-pink-600 to-rose-700",
                glow: "rgba(236,72,153,0.3)",
                title: "Social Media Autopilot",
                desc: "Aether generates branded posts for Instagram and Facebook every day and publishes them automatically at 9am. Your brand stays active 24/7.",
                badge: "Social Media",
              },
              {
                icon: Bot,
                color: "from-cyan-600 to-blue-700",
                glow: "rgba(34,211,238,0.3)",
                title: "Custom AI Employees",
                desc: "Build specialized agents with custom roles, system prompts, and knowledge bases. Your SDR, researcher, support rep — all in one dashboard.",
                badge: "AI Employees",
              },
              {
                icon: Zap,
                color: "from-yellow-500 to-orange-600",
                glow: "rgba(234,179,8,0.3)",
                title: "Autonomous by Default",
                desc: "Agents run on schedules, triggers, or API calls. Set it once. No 'copy into ChatGPT', no babysitting, no manual steps.",
                badge: "Automation",
              },
              {
                icon: BarChart3,
                color: "from-emerald-600 to-teal-700",
                glow: "rgba(16,185,129,0.3)",
                title: "Full Observability",
                desc: "Every run logs tokens, cost, input, output, and duration. Know exactly what your AI team is doing and what it costs.",
                badge: "Analytics",
              },
              {
                icon: Globe,
                color: "from-indigo-600 to-violet-700",
                glow: "rgba(99,102,241,0.3)",
                title: "Web Research Built In",
                desc: "Agents can search Google in real-time using Serper. No stale training data — live research before every task.",
                badge: "Web Search",
              },
            ].map((f, i) => (
              <div key={f.title} className="glass glass-hover rounded-2xl p-6 group" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} mb-5`}
                  style={{ boxShadow: `0 8px 24px ${f.glow}` }}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-xs text-zinc-600 mb-2 uppercase tracking-widest">{f.badge}</div>
                <h3 className="text-white font-semibold text-lg mb-3">{f.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI AGENTS ─────────────────────────────────────────── */}
      <section id="agents" className="py-32 relative">
        <div className="orb w-[600px] h-[600px] bg-violet-700/10 top-0 right-[-200px]" />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5 bg-violet-500/5">
              Pre-built agents
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Meet your new team.</h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Pre-configured agents ready to deploy in minutes. Customize any of them or build your own from scratch.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: "Ava", role: "AI Sales Development Rep", color: "violet", emoji: "⚡",
                skills: ["Cold email writing","Lead research","Follow-up sequences","CRM updates"],
                stat: "3x more meetings booked" },
              { name: "Rex", role: "AI Research Analyst", color: "cyan", emoji: "🔍",
                skills: ["Market research","Competitor analysis","Weekly reports","Data synthesis"],
                stat: "10hrs saved per report" },
              { name: "Sage", role: "AI Support Rep", color: "emerald", emoji: "💬",
                skills: ["Ticket resolution","Knowledge base Q&A","Escalation routing","Customer follow-up"],
                stat: "60% tickets resolved automatically" },
              { name: "Opus", role: "AI Ops Analyst", color: "orange", emoji: "📊",
                skills: ["Dashboard monitoring","Anomaly detection","Executive summaries","Runbook drafting"],
                stat: "Zero missed anomalies" },
            ].map((agent) => (
              <div key={agent.name} className="glass glass-hover rounded-2xl p-8 group">
                <div className="flex items-start gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl bg-white/[0.04] border border-white/[0.08]">
                    {agent.emoji}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                    <p className="text-zinc-500 text-sm">{agent.role}</p>
                  </div>
                  <div className="ml-auto text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-3 py-1">
                    {agent.stat}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {agent.skills.map(s => (
                    <div key={s} className="flex items-center gap-2 text-sm text-zinc-400">
                      <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-32 border-y border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Up and running in 10 minutes.</h2>
            <p className="text-zinc-400">No code. No consultants. Just results.</p>
          </div>
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-px bg-gradient-to-b from-violet-600/40 via-violet-600/20 to-transparent hidden md:block" />
            <div className="space-y-10">
              {[
                { n: "01", title: "Sign up & choose an agent", desc: "Pick from pre-built AI employees — Ava for sales, Rex for research, Sage for support — or build your own in minutes." },
                { n: "02", title: "Connect your tools", desc: "Add your Google Sheet of leads, connect your email via Resend, link your Instagram and Facebook pages. Takes 5 minutes." },
                { n: "03", title: "Hit run — or set a schedule", desc: "Run campaigns manually or set a daily schedule. Aether handles everything: research, writing, sending, posting, reporting." },
              ].map((step) => (
                <div key={step.n} className="flex gap-8 items-start">
                  <div className="shrink-0 h-14 w-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-mono font-bold text-sm">
                    {step.n}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-white font-semibold text-xl mb-2">{step.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" className="py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-4">Simple, transparent pricing.</h2>
            <p className="text-zinc-400">Start free. Scale when the ROI is obvious.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Free", price: "$0", period: "/mo",
                desc: "Try your first AI employee",
                features: ["1 AI employee","25 runs/month","Email campaigns","Web dashboard"],
                cta: "Start free", href: "/signup", highlight: false,
              },
              {
                name: "Starter", price: "$49", period: "/mo",
                desc: "For growing teams",
                features: ["3 AI employees","500 runs/month","Email campaigns","Social media autopilot","Google Sheets import","Web search enabled"],
                cta: "Get started", href: "/signup", highlight: true,
              },
              {
                name: "Scale", price: "$1,499", period: "/mo",
                desc: "For serious operators",
                features: ["100 AI employees","50,000 runs/month","Everything in Starter","Priority support","Custom agents","API access"],
                cta: "Talk to us", href: "/signup", highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 flex flex-col ${plan.highlight ? "gradient-border glow-purple" : "glass"}`}>
                {plan.highlight && (
                  <div className="text-xs text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-4 self-start">
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-zinc-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-zinc-500 text-sm mt-2">{plan.desc}</p>
                </div>
                <div className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-violet-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={plan.href}
                  className={`w-full text-center py-3 rounded-xl font-medium text-sm transition-all ${plan.highlight ? "bg-violet-600 text-white hover:bg-violet-500 glow-purple-sm" : "glass text-white hover:border-violet-500/40"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden">
        <div className="orb w-[800px] h-[400px] bg-violet-700/20 top-0 left-1/2 -translate-x-1/2" />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-7xl font-bold gradient-text mb-6">
            Your first AI hire starts today.
          </h2>
          <p className="text-zinc-400 text-xl mb-10">
            Sign up free. No credit card. Your AI workforce is ready to deploy in under 10 minutes.
          </p>
          <Link href="/signup"
            className="inline-flex items-center gap-3 btn-primary px-10 py-5 text-lg rounded-2xl glow-purple btn-shine group">
            Get started free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-zinc-600 text-sm mt-6">25 free runs · No credit card · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-semibold text-white">Aether</span>
              </div>
              <p className="text-zinc-500 text-sm">The AI workforce for ambitious teams.</p>
            </div>
            {[
              { title: "Product", links: ["Features","Pricing","AI Employees","Campaigns","Social Media"] },
              { title: "Company", links: ["About","Blog","Careers","Press"] },
              { title: "Legal", links: ["Privacy","Terms","Security"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white text-sm font-semibold mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(l => (
                    <li key={l}><Link href="#" className="text-zinc-500 hover:text-white text-sm transition-colors">{l}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">© 2025 Aether. All rights reserved.</p>
            <div className="flex items-center gap-2 text-zinc-600 text-sm">
              <Shield className="h-4 w-4" />
              SOC 2 Type II · GDPR Compliant
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
