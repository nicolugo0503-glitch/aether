import Link from "next/link";
import { MarketingNav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { Check, Minus, Zap } from "lucide-react";

const tiers = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Explore Aether and see what AI employees can do for your team.",
    cta: "Get started free",
    ctaHref: "/signup",
    popular: false,
    features: [
      "1 AI employee",
      "25 runs total",
      "Basic integrations",
      "Community support",
    ],
  },
  {
    key: "STARTER",
    name: "Starter",
    price: "$49",
    cadence: "/month",
    blurb: "For solo operators and small teams trying their first AI employees.",
    cta: "Start Starter",
    ctaHref: "/signup",
    popular: false,
    features: [
      "3 AI employees",
      "500 runs / month",
      "All core integrations",
      "Email support",
      "Run history & analytics",
      "Custom system prompts",
    ],
  },
  {
    key: "GROWTH",
    name: "Growth",
    price: "$299",
    cadence: "/month",
    blurb: "For teams scaling AI across sales, support, and operations.",
    cta: "Start Growth",
    ctaHref: "/signup",
    popular: true,
    features: [
      "10 AI employees",
      "5,000 runs / month",
      "All integrations + SDK",
      "Priority support + SLAs",
      "Advanced analytics & export",
      "Autopilot workflows",
      "Custom tools via SDK",
      "Team member seats",
    ],
  },
  {
    key: "SCALE",
    name: "Scale",
    price: "$1,499",
    cadence: "/month",
    blurb: "For companies operationalizing a full autonomous workforce.",
    cta: "Contact sales",
    ctaHref: "#",
    popular: false,
    features: [
      "100 AI employees",
      "50,000 runs / month",
      "Everything in Growth",
      "SSO + SCIM provisioning",
      "SOC 2 audit logs",
      "BYO-model support",
      "VPC / on-prem deployment",
      "Dedicated CSM",
      "Custom contract & SLAs",
    ],
  },
];

const comparison = [
  { feature: "AI employees", free: "1", starter: "3", growth: "10", scale: "100" },
  { feature: "Monthly runs", free: "25 total", starter: "500", growth: "5,000", scale: "50,000" },
  { feature: "Core integrations", free: true, starter: true, growth: true, scale: true },
  { feature: "Custom system prompts", free: true, starter: true, growth: true, scale: true },
  { feature: "Run history & analytics", free: false, starter: true, growth: true, scale: true },
  { feature: "Autopilot workflows", free: false, starter: false, growth: true, scale: true },
  { feature: "Advanced analytics + export", free: false, starter: false, growth: true, scale: true },
  { feature: "Custom tools SDK", free: false, starter: false, growth: true, scale: true },
  { feature: "Priority support + SLAs", free: false, starter: false, growth: true, scale: true },
  { feature: "SSO + SCIM", free: false, starter: false, growth: false, scale: true },
  { feature: "Audit logs", free: false, starter: false, growth: false, scale: true },
  { feature: "BYO-model / VPC", free: false, starter: false, growth: false, scale: true },
  { feature: "Dedicated CSM", free: false, starter: false, growth: false, scale: true },
];

type CellVal = boolean | string;

function CompCell({ val }: { val: CellVal }) {
  if (typeof val === "boolean") {
    return val
      ? <Check className="h-4 w-4 text-success mx-auto" />
      : <Minus className="h-4 w-4 text-muted-2 mx-auto" />;
  }
  return <span className="text-sm font-medium">{val}</span>;
}

export default function PricingPage() {
  return (
    <>
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-hero-grid" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="section-eyebrow mx-auto mb-5 w-fit">Pricing</div>
          <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted">
            Start free. Upgrade when the output is worth more than the bill.
            No hidden fees, no enterprise negotiation theater.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-success" />
              All plans include unlimited users
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-success" />
              Cancel anytime
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-success" />
              No credit card to start
            </span>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-5 md:grid-cols-4">
          {tiers.map((t) => (
            <div
              key={t.key}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 ${
                t.popular
                  ? "border-accent bg-gradient-to-b from-accent/5 to-panel shadow-glow"
                  : "border-border bg-panel hover:border-border-bright"
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1 text-xs font-semibold text-white shadow-glow-sm">
                  <Zap className="h-3 w-3" />
                  Most popular
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted">{t.name}</div>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="text-sm text-muted mb-1">{t.cadence}</span>
                </div>
                <p className="mt-3 text-sm text-muted leading-relaxed">{t.blurb}</p>
              </div>

              <div className="my-5 divider" />

              <ul className="flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-success/15">
                      <Check className="h-2.5 w-2.5 text-success" />
                    </div>
                    <span className="text-muted">{f}</span>
                  </li>
                ))}
              </ul>

              <form
                action="/api/stripe/checkout"
                method="POST"
                className="mt-6"
              >
                {t.key !== "FREE" && <input type="hidden" name="plan" value={t.key} />}
                <button
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-all ${
                    t.popular
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                  type={t.key === "SCALE" ? "button" : "submit"}
                  {...(t.key === "SCALE" ? { onClick: undefined } : {})}
                >
                  {t.cta}
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Full comparison</h2>
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-6 py-4 text-left font-medium text-muted">Feature</th>
                {tiers.map((t) => (
                  <th key={t.key} className={`px-4 py-4 text-center font-semibold ${t.popular ? "text-accent" : ""}`}>
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr key={row.feature} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-panel" : "bg-surface/30"}`}>
                  <td className="px-6 py-3.5 text-muted">{row.feature}</td>
                  <td className="px-4 py-3.5 text-center"><CompCell val={row.free} /></td>
                  <td className="px-4 py-3.5 text-center"><CompCell val={row.starter} /></td>
                  <td className={`px-4 py-3.5 text-center ${tiers[2].popular ? "bg-accent/5" : ""}`}><CompCell val={row.growth} /></td>
                  <td className="px-4 py-3.5 text-center"><CompCell val={row.scale} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/50 bg-surface/20">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-2xl font-bold text-center mb-10">Pricing FAQ</h2>
          <div className="space-y-3">
            {[
              {
                q: "What counts as a 'run'?",
                a: "A run is one complete execution of an AI employee — e.g., Ava researching one lead and drafting one email, or Sage resolving one support ticket. Partial runs (timeouts, errors) don't count.",
              },
              {
                q: "Can I change plans at any time?",
                a: "Yes. Upgrade instantly at any time. Downgrades take effect at the end of your billing period.",
              },
              {
                q: "What happens when I hit my run limit?",
                a: "We notify you and stop new runs from starting. Existing in-progress runs complete. You can upgrade immediately to restore capacity.",
              },
              {
                q: "Do you offer annual billing?",
                a: "Yes — annual plans include a 20% discount. Contact us or choose annual billing in your workspace settings.",
              },
              {
                q: "What's included in 'all integrations'?",
                a: "Slack, Gmail, Salesforce, HubSpot, Zendesk, Jira, Notion, Linear, GitHub, and 30+ more. Full integration list in our docs.",
              },
            ].map((item) => (
              <details key={item.q} className="group rounded-2xl border border-border bg-panel p-5 cursor-pointer hover:border-accent/30 transition-colors">
                <summary className="flex items-center justify-between list-none text-base font-medium">
                  {item.q}
                  <span className="ml-4 text-muted group-open:rotate-180 transition-transform">↓</span>
                </summary>
                <p className="mt-3 text-sm text-muted leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-3">Still unsure? Start free.</h2>
          <p className="text-muted mb-8">
            No credit card. 25 runs. Ava (AI SDR) pre-built and ready.
            You'll know if it's worth it before you spend a dollar.
          </p>
          <Link href="/signup" className="btn-primary-lg">
            Create free workspace →
          </Link>
          <p className="mt-4 text-xs text-muted">
            Need custom terms or procurement? <Link href="#" className="link">Talk to sales</Link>.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
