import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { AetherMark } from "@/components/ui/logo";
import { MobileNav } from "@/components/landing/mobile-nav";

const PLANS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    desc: "Try before you commit",
    features: [
      "1 AI employee",
      "25 runs / month",
      "Email campaigns",
      "Dashboard analytics",
    ],
    highlight: false,
    cta: "Start free",
    href: "/signup",
  },
  {
    key: "STARTER",
    name: "Starter",
    price: "$49",
    desc: "For solo operators",
    features: [
      "3 AI employees",
      "500 runs / month",
      "AI image generation",
      "Instagram + Facebook + X",
      "Email campaigns",
      "Google Sheets import",
      "Email support",
    ],
    highlight: false,
    cta: "Get started",
    href: "/signup",
  },
  {
    key: "GROWTH",
    name: "Growth",
    price: "$149",
    desc: "For growing teams",
    features: [
      "10 AI employees",
      "5,000 runs / month",
      "Everything in Starter",
      "AI image generation",
      "Autopilot workflows",
      "Advanced analytics",
      "Priority support",
    ],
    highlight: true,
    cta: "Get started",
    href: "/signup",
  },
  {
    key: "SCALE",
    name: "Scale",
    price: "$499",
    desc: "For serious operators",
    features: [
      "100 AI employees",
      "50,000 runs / month",
      "Everything in Growth",
      "Custom agent builder",
      "API access",
      "Dedicated support",
      "SLA guarantee",
    ],
    highlight: false,
    cta: "Get started",
    href: "/signup",
  },
];

const FAQ = [
  { q: "What counts as a 'run'?", a: "A run is one execution of an AI agent — one cold email written, one social post generated, one campaign row processed. Each task completion = one run." },
  { q: "Can I change plans anytime?", a: "Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately, downgrades at the next billing cycle." },
  { q: "What happens when I hit my run limit?", a: "Your agents pause until the next billing period. You'll get an email warning at 80% usage so you can upgrade before hitting the cap." },
  { q: "Do I need a credit card to start?", a: "No. The Free plan requires no credit card. You only need to add payment details when upgrading to a paid plan." },
  { q: "Can I cancel anytime?", a: "Yes — no contracts, no cancellation fees. Cancel from your billing settings and you'll keep access until the end of the current period." },
  { q: "Do you offer refunds?", a: "We offer a full refund within 7 days of your first paid charge if you're not satisfied. Contact support@useaether.net." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black text-white">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
          <AetherMark size={32} glow />
          <span className="font-black text-white text-lg tracking-tight">Aether</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          {["Features","Platforms","Agents","Pricing"].map(item => (
            <Link key={item} href={`/#${item.toLowerCase()}`}
              className="text-zinc-500 hover:text-white transition-colors">{item}</Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:block text-sm text-zinc-500 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold btn-shine"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
            Get started free <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <MobileNav />
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 text-center px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa" }}>
          Simple, transparent pricing
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-5">
          Start free.<br />
          <span style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Scale when ready.
          </span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto">
          Every plan includes all AI employees, all integrations, and unlimited team members. Pay only for runs.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map(plan => (
            <div key={plan.key}
              className="rounded-3xl p-7 flex flex-col relative overflow-hidden"
              style={plan.highlight ? {
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.08))",
                border: "1px solid rgba(124,58,237,0.4)",
                boxShadow: "0 0 60px rgba(124,58,237,0.12)",
              } : {
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}>

              {plan.highlight && (
                <>
                  <div className="absolute top-0 inset-x-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }} />
                  <div className="absolute top-4 right-4 text-xs font-semibold text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1">
                    Most popular
                  </div>
                </>
              )}

              <div className="mb-6">
                <h3 className="text-white font-bold text-xl mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-zinc-500 text-sm">/month</span>
                </div>
                <p className="text-zinc-500 text-sm">{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-7">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: plan.highlight ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)" }}>
                      <Check className="h-3 w-3 text-violet-400" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href={plan.href}
                className="w-full text-center py-3.5 rounded-2xl font-bold text-sm btn-shine"
                style={plan.highlight ? {
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  color: "white",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
                } : {
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Compare note */}
        <p className="text-center text-zinc-600 text-sm mt-8">
          Need enterprise terms, custom limits, or on-prem?{" "}
          <Link href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">Talk to us →</Link>
        </p>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-32">
        <h2 className="text-3xl font-black text-white text-center mb-12">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQ.map(item => (
            <div key={item.q} className="p-6 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold text-white mb-2">{item.q}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <div className="border-t border-white/[0.04] py-8 px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-700 max-w-6xl mx-auto">
        <span>© {new Date().getFullYear()} Aether AI, Inc.</span>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
          <Link href="/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
        </div>
      </div>
    </div>
  );
}
