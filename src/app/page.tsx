import Link from "next/link";
import { MarketingNav } from "@/components/nav";
import { Footer } from "@/components/footer";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Headphones,
  LineChart,
  Search,
  Sparkles,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

const employees = [
  {
    icon: Briefcase,
    name: "Ava",
    role: "AI Sales Development Rep",
    blurb:
      "Researches inbound leads in seconds and drafts hyper-personalized first-touch emails. Books 3x more meetings per dollar than a human SDR.",
  },
  {
    icon: Search,
    name: "Rex",
    role: "AI Research Analyst",
    blurb:
      "Produces sourced market briefs, competitor teardowns, and deep-dive reports on demand. Trained on your thesis, your taste.",
  },
  {
    icon: Headphones,
    name: "Sage",
    role: "AI Tier-1 Support Rep",
    blurb:
      "Resolves 60%+ of your support tickets end-to-end using your knowledge base. Escalates the rest with full context.",
  },
  {
    icon: LineChart,
    name: "Opus",
    role: "AI Ops Analyst",
    blurb:
      "Monitors dashboards, flags anomalies, writes weekly execs, and drafts runbooks for everything it sees.",
  },
];

const features = [
  { icon: Bot,      title: "Autonomous by default",   body: "Agents run on schedules, triggers, or API calls. No 'copy into ChatGPT'." },
  { icon: Sparkles, title: "Trained on your data",    body: "Point Aether at Notion, Drive, Salesforce, or upload docs. Employees learn your playbook." },
  { icon: Zap,      title: "Wired into your tools",   body: "Pre-built integrations for 40+ SaaS tools. Custom tools via a typed SDK." },
  { icon: Shield,   title: "SOC 2 Type II",           body: "Enterprise-grade isolation, audit logs, SSO, and role-based access from day one." },
  { icon: Clock,    title: "Live in 10 minutes",      body: "Pick an employee, configure a job, connect tools, hit go. No consultants." },
  { icon: LineChart,title: "ROI you can see",         body: "Every run reports tokens, cost, outcome, and a dollar-impact estimate." },
];

export default function HomePage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-hero-grid" />
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-panel px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
            New: Autopilot workflows are live
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
            Hire an autonomous <span className="bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">AI workforce</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Aether gives your team a workforce of specialized AI employees —
            SDRs, researchers, support reps, analysts — trained on your data,
            wired into your tools, and billed per seat.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className="btn-primary">
              Start free — hire your first AI <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="btn-secondary">See pricing</Link>
          </div>
          <p className="mt-4 text-xs text-muted">No credit card required · 25 free runs · cancel anytime</p>
        </div>
      </section>

      {/* Logos */}
      <section className="mx-auto max-w-6xl px-6">
        <p className="text-center text-xs uppercase tracking-widest text-muted">
          Teams shipping with Aether
        </p>
        <div className="mt-6 grid grid-cols-2 gap-6 opacity-60 md:grid-cols-6">
          {["Lumen", "Helix", "Northwind", "Vercel.ish", "Parallax", "Quanta"].map(
            (n) => (
              <div
                key={n}
                className="flex h-10 items-center justify-center rounded-md border border-border bg-panel text-sm tracking-wide text-muted"
              >
                {n}
              </div>
            ),
          )}
        </div>
      </section>

      {/* AI Employees */}
      <section id="employees" className="mx-auto mt-28 max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold">Meet the team</h2>
          <p className="mt-2 text-muted">
            Pick from pre-built AI employees — or clone one and make it yours.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {employees.map((e) => (
            <div key={e.name} className="card flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border bg-bg">
                <e.icon className="h-5 w-5 text-accent-2" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-lg font-semibold">{e.name}</h3>
                  <span className="text-xs text-muted">{e.role}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{e.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto mt-28 max-w-6xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold">Built for real work, not demos</h2>
          <p className="mt-2 text-muted">
            Every piece of Aether is designed to survive production — and an audit.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card">
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 max-w-6xl px-6">
        <div className="card flex flex-col items-center gap-4 bg-gradient-to-br from-panel to-black py-14 text-center">
          <h2 className="max-w-xl text-3xl font-semibold">
            Your next hire starts at $0.
          </h2>
          <p className="max-w-xl text-muted">
            Spin up your first AI employee in 10 minutes. Upgrade only when the output is worth more than the bill.
          </p>
          <Link href="/signup" className="btn-primary">
            Get started free <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto mt-28 max-w-3xl px-6">
        <h2 className="text-3xl font-semibold text-center">FAQ</h2>
        <div className="mt-8 space-y-4">
          {[
            {
              q: "Is this just a wrapper around ChatGPT?",
              a: "No. Aether is a full agent runtime: typed tools, retrieval over your data, evaluation harness, observability, and seat-based billing. ChatGPT is a UI; Aether is infrastructure.",
            },
            {
              q: "How is this priced?",
              a: "Per AI employee ('seat') per month, plus metered run-usage above generous tier limits. Transparent like Stripe.",
            },
            {
              q: "What about data and security?",
              a: "Your data is isolated per workspace. We don't train on your data. SOC 2 Type II and optional BYO-model / VPC deployment on Scale plans.",
            },
            {
              q: "How fast can we go live?",
              a: "First agent is typically live in under 10 minutes. First production workflow in a day.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-border bg-panel p-5"
            >
              <summary className="cursor-pointer list-none text-base font-medium">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
