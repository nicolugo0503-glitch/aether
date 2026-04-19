import Link from "next/link";
import { MarketingNav } from "@/components/nav";
import { Footer } from "@/components/footer";
import {
  ArrowRight, Bot, Briefcase, CheckCircle2, ChevronRight,
  Code2, Cpu, Headphones, LineChart, Lock, Search,
  Shield, Star, Terminal, Users, Zap,
} from "lucide-react";

/* ─── Data ───────────────────────────────────────────────────────────── */
const agents = [
  {
    id: "AVA-001",
    name: "Ava",
    role: "Sales Development Rep",
    icon: Briefcase,
    status: "ACTIVE",
    runs: "8,412",
    uptime: "99.97%",
    stat: "3× more meetings per dollar than a human SDR",
    color: "border-accent/30 bg-accent/5",
    dot: "bg-accent",
  },
  {
    id: "REX-002",
    name: "Rex",
    role: "Research Analyst",
    icon: Search,
    status: "ACTIVE",
    runs: "2,903",
    uptime: "99.91%",
    stat: "30-page market brief in under 60 seconds",
    color: "border-accent-2/30 bg-accent-2/5",
    dot: "bg-accent-2",
  },
  {
    id: "SAGE-003",
    name: "Sage",
    role: "Support Specialist",
    icon: Headphones,
    status: "ACTIVE",
    runs: "21,847",
    uptime: "99.99%",
    stat: "65%+ of tickets resolved end-to-end autonomously",
    color: "border-accent-3/30 bg-accent-3/5",
    dot: "bg-accent-3",
  },
  {
    id: "OPUS-004",
    name: "Opus",
    role: "Operations Analyst",
    icon: LineChart,
    status: "IDLE",
    runs: "1,204",
    uptime: "99.88%",
    stat: "4+ analyst hours saved per day",
    color: "border-accent-4/30 bg-accent-4/5",
    dot: "bg-accent-4",
  },
];

const metrics = [
  { val: "47,366",   unit: "runs",            label: "completed this week" },
  { val: "< 10 min", unit: "to first run",    label: "from signup" },
  { val: "65%",      unit: "auto-resolution", label: "support ticket average" },
  { val: "$0",       unit: "to start",        label: "no credit card" },
  { val: "40+",      unit: "integrations",    label: "pre-built connectors" },
  { val: "99.9%",    unit: "uptime",          label: "SLA guarantee" },
];

const terminalLines = [
  { prefix: "→", text: "Booting agent SAGE-003 [support-specialist]", color: "text-accent" },
  { prefix: "✓", text: "Knowledge base loaded: 847 documents", color: "text-muted" },
  { prefix: "✓", text: "Ticket #3841 received: 'Cannot login to account'", color: "text-muted" },
  { prefix: "→", text: "Matching against KB: password-reset, auth-errors...", color: "text-accent-2" },
  { prefix: "✓", text: "Resolution found. Drafting reply...", color: "text-muted" },
  { prefix: "✓", text: "Reply sent. Ticket closed. Cost: $0.002  Time: 3.2s", color: "text-accent" },
  { prefix: "→", text: "Ticket #3842 received: 'How do I export data?'", color: "text-accent" },
  { prefix: "✓", text: "CSAT: 4.9/5.0  Escalation rate: 0.31%", color: "text-accent" },
];

const features = [
  { icon: Bot,      title: "Truly autonomous",        body: "Agents run on schedules, triggers, or API. No prompting, no copying into ChatGPT. They just work." },
  { icon: Cpu,      title: "Trained on your data",    body: "Connect Notion, Drive, Salesforce. Your employees learn your playbook, tone, and standards." },
  { icon: Code2,    title: "40+ tool integrations",   body: "Slack, Gmail, HubSpot, Zendesk, Jira, Linear. Custom tools via a typed SDK. Works where your team works." },
  { icon: Shield,   title: "SOC 2 Type II",           body: "Workspace isolation, full audit logs, SSO, SCIM, RBAC. Enterprise-grade from day one." },
  { icon: Lock,     title: "Your data is yours",      body: "Zero training on your data. BYO-model and VPC deployment for Scale customers." },
  { icon: Zap,      title: "Observable ROI",          body: "Every run reports tokens, latency, cost, and dollar-impact. Know exactly what you're getting." },
];

/* ─── Page ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      <MarketingNav />

      {/* ── HERO: MASSIVE TYPOGRAPHIC ──────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background grid */}
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-100" />
        {/* Green radial glow */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-radial-glow-green" />

        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-12">
          <div className="animate-fade-up">
            <div className="eyebrow mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Production-grade AI employees — live in minutes
            </div>
          </div>

          {/* Giant headline */}
          <h1 className="animate-fade-up-d1 text-display font-black tracking-tight leading-none max-w-5xl">
            Stop hiring humans<br />
            for work that{" "}
            <span className="text-shimmer">AI does<br />
            better.</span>
          </h1>

          <div className="animate-fade-up-d2 mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-lg text-lg text-muted leading-relaxed">
              Aether deploys specialized AI employees — SDRs, researchers,
              support agents, ops analysts — that work autonomously, 24/7,
              trained on your data, wired into your tools.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row shrink-0">
              <Link href="/signup" className="btn-primary-lg group">
                Deploy your first AI
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/pricing" className="btn-outline-lg">
                View pricing
              </Link>
            </div>
          </div>

          <div className="animate-fade-up-d3 mt-4 flex flex-wrap gap-6 text-xs font-mono text-muted">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent" /> No credit card</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent" /> 25 free runs</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent" /> SOC 2 certified</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent" /> Live in 10 minutes</span>
          </div>
        </div>

        {/* Terminal mockup */}
        <div className="animate-fade-up-d4 relative mx-auto max-w-7xl px-6 pb-20">
          <div className="rounded-2xl border border-accent/20 bg-panel shadow-terminal overflow-hidden">
            {/* Terminal header */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-surface px-5 py-3">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-danger/60" />
                <div className="h-3 w-3 rounded-full bg-warning/60" />
                <div className="h-3 w-3 rounded-full bg-accent/60" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-muted">
                <Terminal className="h-3 w-3" />
                aether — agent-runtime
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-mono text-accent">3 agents running</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2">
              {/* Terminal output */}
              <div className="border-r border-border/40 p-6 font-mono text-xs space-y-2 min-h-[260px]">
                <div className="text-muted mb-4"># Real-time agent execution log</div>
                {terminalLines.map((line, i) => (
                  <div key={i} className="flex gap-2" style={{ animationDelay: `${i * 0.3}s` }}>
                    <span className={`shrink-0 ${line.color}`}>{line.prefix}</span>
                    <span className={i % 3 === 0 ? "text-text/90" : "text-muted"}>{line.text}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <span className="text-accent">$</span>
                  <span className="cursor-blink" />
                </div>
              </div>

              {/* Live agent status */}
              <div className="p-6 space-y-3">
                <div className="text-xs font-mono text-muted mb-4"># Active workforce</div>
                {agents.slice(0, 3).map((a) => (
                  <div key={a.id} className={`rounded-xl border ${a.color} p-3 flex items-center gap-3`}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/30">
                      <a.icon className="h-4 w-4 text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold">{a.id}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${a.dot} ${a.status === "ACTIVE" ? "animate-pulse" : "opacity-40"}`} />
                        <span className="text-[10px] font-mono text-muted">{a.status}</span>
                      </div>
                      <div className="text-[10px] text-muted truncate">{a.runs} runs · {a.uptime} uptime</div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted shrink-0" />
                  </div>
                ))}
                <div className="rounded-xl border border-border bg-elevated p-3 flex items-center justify-between">
                  <span className="text-xs font-mono text-muted">Total runs today</span>
                  <span className="text-sm font-mono font-bold text-accent">6,204</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS TICKER ───────────────────────────────────────────── */}
      <div className="border-y border-border/50 bg-surface/50 py-4 overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker-inner">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 px-8">
                {metrics.map((m) => (
                  <div key={m.label} className="flex items-baseline gap-3 whitespace-nowrap">
                    <span className="font-mono text-xl font-bold text-accent">{m.val}</span>
                    <span className="font-mono text-sm text-text/80">{m.unit}</span>
                    <span className="text-sm text-muted">{m.label}</span>
                    <span className="text-border-bright mx-6 text-lg">·</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-28">
        <div className="flex flex-col md:flex-row gap-16 items-start">
          <div className="md:w-72 shrink-0">
            <div className="eyebrow mb-4">Process</div>
            <h2 className="text-display-sm font-black tracking-tight">
              From zero to<br />
              <span className="text-accent">running</span><br />
              in 10 min
            </h2>
          </div>
          <div className="flex-1 space-y-0">
            {[
              { num: "01", title: "Pick your employee",     body: "Choose from pre-built specialists — SDRs, researchers, support, ops — or clone and customize one for your exact workflow." },
              { num: "02", title: "Train on your data",     body: "Connect Notion, Drive, Salesforce, or paste docs. Your AI employee learns your playbook, tone, and standards." },
              { num: "03", title: "Wire into your tools",   body: "40+ native integrations. Connect CRM, ticketing, Slack, email. Your agent works where your team does." },
              { num: "04", title: "Watch them execute",     body: "Set triggers, schedules, or run on demand. Every action is logged, every token tracked, every cost visible." },
            ].map((step, i) => (
              <div key={step.num} className="flex gap-6 pb-10 border-l border-border ml-4 pl-8 relative last:border-0 last:pb-0">
                <div className="absolute -left-4 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-accent/40 bg-bg font-mono text-xs font-bold text-accent">
                  {i + 1}
                </div>
                <div>
                  <div className="font-mono text-xs text-muted mb-1">{step.num}</div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI EMPLOYEES — ID CARD STYLE ─────────────────────────────── */}
      <section id="employees" className="border-y border-border/50 bg-surface/30">
        <div className="mx-auto max-w-7xl px-6 py-28">
          <div className="mb-14">
            <div className="eyebrow mb-4">The roster</div>
            <h2 className="text-display-sm font-black tracking-tight">
              Meet your new hires
            </h2>
            <p className="mt-3 text-muted max-w-xl">
              Four pre-built AI employees for the roles every modern team needs. Clone, customize, or build your own.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {agents.map((a) => (
              <div key={a.id} className={`rounded-2xl border ${a.color} p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}>
                {/* Employee ID header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="font-mono text-[10px] text-muted tracking-widest">{a.id}</div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`h-1.5 w-1.5 rounded-full ${a.dot} ${a.status === "ACTIVE" ? "animate-pulse" : ""}`} />
                    <span className={a.status === "ACTIVE" ? "text-accent" : "text-muted"}>{a.status}</span>
                  </div>
                </div>

                {/* Avatar */}
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-black/40 mb-4">
                  <a.icon className="h-6 w-6 text-white/90" />
                </div>

                <div className="text-xl font-black mb-0.5">{a.name}</div>
                <div className="text-xs text-muted mb-4">{a.role}</div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-[10px]">
                  <div className="rounded-lg border border-white/5 bg-black/30 p-2">
                    <div className="text-muted mb-0.5">Runs</div>
                    <div className="font-bold text-sm">{a.runs}</div>
                  </div>
                  <div className="rounded-lg border border-white/5 bg-black/30 p-2">
                    <div className="text-muted mb-0.5">Uptime</div>
                    <div className="font-bold text-sm">{a.uptime}</div>
                  </div>
                </div>

                {/* Key stat */}
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-[11px] font-mono text-muted">
                  ↑ {a.stat}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES — 2-COL LIST ─────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-28">
        <div className="mb-14 flex flex-col md:flex-row gap-8 items-start">
          <div className="md:w-80 shrink-0">
            <div className="eyebrow mb-4">Platform</div>
            <h2 className="text-display-sm font-black tracking-tight">
              Built for<br />
              <span className="text-accent">real work.</span><br />
              Not demos.
            </h2>
          </div>
          <div className="flex-1 grid gap-6 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-panel">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────────────── */}
      <section className="border-t border-border/50 bg-surface/20">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { q: "We replaced two junior SDR hires with Ava. She sends better emails, books more meetings, and never calls in sick.", name: "Jordan K.", title: "VP of Sales, Helix" },
              { q: "Rex produces the kind of research our analyst used to take two weeks on. We get it in 90 seconds. It's actually embarrassing how good it is.", name: "Priya M.", title: "Partner, Northwind" },
              { q: "Sage handles 70% of our support queue autonomously. Our human agents love it — they only get the interesting problems now.", name: "Alex T.", title: "Head of CX, Parallax" },
            ].map((t) => (
              <div key={t.name} className="card">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-sm text-muted leading-relaxed mb-5">"{t.q}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary font-mono text-xs font-bold text-bg">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs font-mono text-muted">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {["Lumen", "Helix", "Northwind", "Parallax", "Quanta", "Vanta"].map((n) => (
              <div key={n} className="rounded-xl border border-border bg-panel px-5 py-2 font-mono text-sm text-muted">
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-4xl px-6 py-28">
        <div className="eyebrow mb-6">FAQ</div>
        <h2 className="text-display-sm font-black tracking-tight mb-12">
          Questions, answered
        </h2>
        <div className="space-y-2">
          {[
            { q: "Is this just a wrapper around ChatGPT?", a: "No. Aether is a full agent runtime: typed tools, retrieval over your private data, evaluation harness, observability, and seat-based billing. ChatGPT is a UI. Aether is production infrastructure." },
            { q: "How is it different from a human employee?", a: "An Aether employee works 24/7, scales instantly, costs a fraction of a salary, and produces consistent output. You control the goals and standards. They execute." },
            { q: "How is this priced?", a: "Per AI employee (seat) per month, plus metered run usage above tier limits. Transparent, like Stripe. No hidden fees." },
            { q: "What about data security?", a: "Workspace-isolated. We never train on your data. SOC 2 Type II. BYO-model and VPC deployment for Scale." },
            { q: "How fast can we go live?", a: "First agent running in under 10 minutes. Full production workflow in under a day." },
          ].map((item) => (
            <details key={item.q} className="group rounded-xl border border-border bg-panel p-5 cursor-pointer hover:border-accent/30 transition-colors">
              <summary className="flex items-center justify-between list-none font-semibold">
                {item.q}
                <ChevronRight className="h-4 w-4 text-muted transition-transform group-open:rotate-90 shrink-0 ml-4" />
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed font-mono">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-border/50 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow-green" />
        <div className="relative mx-auto max-w-7xl px-6 py-32 text-center">
          <div className="eyebrow mx-auto mb-8 w-fit">Ship it</div>
          <h2 className="text-display font-black tracking-tight mx-auto max-w-3xl">
            Your AI workforce<br />
            <span className="text-shimmer">clocks in today</span>
          </h2>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto">
            No credit card. No contracts. No consultants. Pick an employee,
            configure a job, hit go. First run in 10 minutes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link href="/signup" className="btn-primary-lg group animate-pulse-green">
              Deploy your first AI employee — free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/pricing" className="btn-outline-lg">
              See pricing
            </Link>
          </div>
          <div className="mt-6 font-mono text-xs text-muted">
            Join 2,000+ teams · SOC 2 · Cancel anytime
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
