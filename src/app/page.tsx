import Link from "next/link";
import { ArrowRight, Check, Shield, Star, Zap } from "lucide-react";
import { HeroSection } from "@/components/landing/hero";
import { ActivityTicker } from "@/components/landing/ticker";
import { BentoGrid } from "@/components/landing/bento";
import { PlatformsSection } from "@/components/landing/platforms";
import { AgentsShowcase } from "@/components/landing/agents";
import { AetherMark } from "@/components/ui/logo";
import { MobileNav } from "@/components/landing/mobile-nav";
import { ROICalculator } from "@/components/landing/roi-calculator";
import { FAQSection } from "@/components/landing/faq";
import { ComparisonSection } from "@/components/landing/comparison";
import { ProductShowcase } from "@/components/landing/product-showcase";

export default function HomePage() {
  return (
    <div className="relative bg-black overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
          <AetherMark size={32} glow />
          <span className="font-black text-white text-lg tracking-tight">Aether</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm">
          {["Features","Platforms","Agents","Pricing"].map(item => (
            <Link key={item} href={`#${item.toLowerCase()}`}
              className="text-zinc-500 hover:text-white transition-colors duration-200">{item}</Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden md:block text-sm text-zinc-500 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup"
            className="hidden sm:inline-flex group relative items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold overflow-hidden btn-shine"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
            Get started free <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          {/* Mobile hamburger */}
          <MobileNav />
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <HeroSection />

      {/* ── LIVE TICKER ──────────────────────────────── */}
      <ActivityTicker />

      {/* ── PRODUCT SCREENSHOT ───────────────────────── */}
      <ProductShowcase />

      {/* ── SOCIAL PROOF STATS BAR ───────────────────── */}
      <section className="py-14 border-y" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.01)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "2,400+", label: "Teams in production", icon: "👥" },
              { value: "12M+",   label: "AI tasks completed",  icon: "⚡" },
              { value: "94.3%",  label: "Email delivery rate", icon: "📬" },
              { value: "< 10m",  label: "Median time to first run", icon: "🚀" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-3xl md:text-4xl font-black gradient-text mb-1">{s.value}</div>
                <div className="text-zinc-600 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LOGOS ────────────────────────────────────── */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-[0.25em] text-zinc-700 mb-10">
            Trusted by teams at
          </p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to right, #000 0%, transparent 100%)" }} />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
              style={{ background: "linear-gradient(to left, #000 0%, transparent 100%)" }} />
            <div className="flex gap-16 items-center animate-marquee whitespace-nowrap" style={{ animation: "marquee 28s linear infinite" }}>
              {[
                <svg key="lumen" height="20" viewBox="0 0 80 20" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
                  <circle cx="10" cy="10" r="4" fill="#a78bfa"/>
                  <text x="19" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Lumen</text>
                </svg>,
                <svg key="helix" height="20" viewBox="0 0 74 20" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
                  <path d="M4 16 Q8 4 12 10 Q16 16 20 10" stroke="#22d3ee" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  <text x="26" y="15" fill="white" fontSize="13" fontWeight="800" fontFamily="system-ui" letterSpacing="-0.5">Helix</text>
                </svg>,
                <svg key="northwind" height="20" viewBox="0 0 110 20" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
                  <polygon points="10,2 14,10 10,18 6,10" fill="none" stroke="#34d399" strokeWidth="1.5"/>
                  <text x="22" y="15" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui" letterSpacing="0.5">NORTHWIND</text>
                </svg>,
                <svg key="parallax" height="20" viewBox="0 0 96 20" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
                  <rect x="2" y="6" width="8" height="8" fill="#f472b6" rx="1"/>
                  <rect x="6" y="4" width="8" height="8" fill="none" stroke="#f472b6" strokeWidth="1" rx="1"/>
                  <text x="20" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Parallax</text>
                </svg>,
                <svg key="quanta" height="20" viewBox="0 0 84 20" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
                  <circle cx="10" cy="10" r="7" fill="none" stroke="#fb923c" strokeWidth="1.5"/>
                  <circle cx="10" cy="10" r="3" fill="#fb923c"/>
                  <text x="22" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Quanta</text>
                </svg>,
                <svg key="meridian" height="20" viewBox="0 0 100 20" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
                  <path d="M2 10 L8 4 L14 10 L8 16Z" fill="#818cf8"/>
                  <text x="20" y="15" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">Meridian</text>
                </svg>,
                <svg key="vortex" height="20" viewBox="0 0 88 20" fill="none" className="opacity-30 hover:opacity-60 transition-opacity">
                  <path d="M4 4 Q12 10 4 16 Q8 10 16 10 Q8 10 16 4" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <text x="22" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Vortex</text>
                </svg>,
                <svg key="lumen2" height="20" viewBox="0 0 80 20" fill="none" className="opacity-30"><circle cx="10" cy="10" r="4" fill="#a78bfa"/><text x="19" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Lumen</text></svg>,
                <svg key="helix2" height="20" viewBox="0 0 74 20" fill="none" className="opacity-30"><path d="M4 16 Q8 4 12 10 Q16 16 20 10" stroke="#22d3ee" strokeWidth="2" fill="none" strokeLinecap="round"/><text x="26" y="15" fill="white" fontSize="13" fontWeight="800" fontFamily="system-ui" letterSpacing="-0.5">Helix</text></svg>,
                <svg key="northwind2" height="20" viewBox="0 0 110 20" fill="none" className="opacity-30"><polygon points="10,2 14,10 10,18 6,10" fill="none" stroke="#34d399" strokeWidth="1.5"/><text x="22" y="15" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui" letterSpacing="0.5">NORTHWIND</text></svg>,
                <svg key="parallax2" height="20" viewBox="0 0 96 20" fill="none" className="opacity-30"><rect x="2" y="6" width="8" height="8" fill="#f472b6" rx="1"/><rect x="6" y="4" width="8" height="8" fill="none" stroke="#f472b6" strokeWidth="1" rx="1"/><text x="20" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Parallax</text></svg>,
                <svg key="quanta2" height="20" viewBox="0 0 84 20" fill="none" className="opacity-30"><circle cx="10" cy="10" r="7" fill="none" stroke="#fb923c" strokeWidth="1.5"/><circle cx="10" cy="10" r="3" fill="#fb923c"/><text x="22" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Quanta</text></svg>,
                <svg key="meridian2" height="20" viewBox="0 0 100 20" fill="none" className="opacity-30"><path d="M2 10 L8 4 L14 10 L8 16Z" fill="#818cf8"/><text x="20" y="15" fill="white" fontSize="12" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">Meridian</text></svg>,
                <svg key="vortex2" height="20" viewBox="0 0 88 20" fill="none" className="opacity-30"><path d="M4 4 Q12 10 4 16 Q8 10 16 10 Q8 10 16 4" stroke="#f87171" strokeWidth="1.5" fill="none" strokeLinecap="round"/><text x="22" y="15" fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">Vortex</text></svg>,
              ]}
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ───────────────────────────── */}
      <BentoGrid />

      {/* ── PLATFORMS SECTION ────────────────────────── */}
      <div id="platforms">
        <PlatformsSection />
      </div>

      {/* ── AGENTS SHOWCASE ──────────────────────────── */}
      <section id="agents" className="py-16 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(124,58,237,0.05), transparent)" }} />

        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-block text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5"
              style={{ background: "rgba(124,58,237,0.05)" }}>
              Pre-built agents
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6">Meet your<br /><span className="gradient-text">new team.</span></h2>
            <p className="text-zinc-500 text-lg max-w-xl mx-auto">Four AI employees ready to deploy in minutes. Or build your own with a custom system prompt.</p>
          </div>

          <AgentsShowcase />
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="py-16 md:py-32">
        <div className="max-w-4xl mx-auto px-5 sm:px-6">
          <div className="text-center mb-12 md:mb-20">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">
              Live in <span className="gradient-text">10 minutes.</span>
            </h2>
            <p className="text-zinc-500 text-lg">No code. No consultants. No 3-month onboarding.</p>
          </div>
          <div className="space-y-4">
            {[
              { n: "01", title: "Pick your agents", desc: "Choose from Ava (sales), Rex (research), Sage (support), or build a custom agent with your own system prompt and knowledge base.", color: "#7c3aed" },
              { n: "02", title: "Connect your channels", desc: "Plug in Google Sheets for leads, Instagram, Facebook, and X for social, and Resend for email. Each connection takes under 2 minutes.", color: "#0891b2" },
              { n: "03", title: "Set it and forget it", desc: "Run campaigns manually or set a daily schedule. Your AI team works 24/7 — sends reports, posts content, and never needs a day off.", color: "#059669" },
            ].map((step) => (
              <div key={step.n}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:scale-[1.005]"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg"
                  style={{ background: `${step.color}15`, color: step.color, border: `1px solid ${step.color}25`, fontFamily: "monospace" }}>
                  {step.n}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg sm:text-xl mb-1.5 sm:mb-2">{step.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm sm:text-base">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON ───────────────────────────────── */}
      <ComparisonSection />

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-zinc-700 mb-12">What teams are saying</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                quote: "Ava sent 847 personalized emails before 9 AM. We closed 12 demos from that batch. I haven't touched outreach since.",
                name: "Sarah Keller",
                role: "VP of Sales",
                company: "Helix",
                initials: "SK",
                gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                stars: 5,
              },
              {
                quote: "We went from one hand-written post per week to daily content across Instagram, X, and Facebook. Engagement is up 340%. I wish I'd done this two years ago.",
                name: "Marcus Tran",
                role: "Founder & CEO",
                company: "Lumen",
                initials: "MT",
                gradient: "linear-gradient(135deg, #e1306c, #c2185b)",
                stars: 5,
              },
              {
                quote: "Replaced $8k/month in contractors. Aether does better work, faster, and never misses a deadline. The ROI was obvious within the first week.",
                name: "Ana Reyes",
                role: "Chief Executive Officer",
                company: "Parallax",
                initials: "AR",
                gradient: "linear-gradient(135deg, #059669, #047857)",
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="rounded-3xl p-8 flex flex-col transition-all duration-300 hover:-translate-y-1"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-1 mb-5">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-zinc-300 leading-relaxed flex-1 mb-7 text-sm">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: t.gradient }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">{t.name}</div>
                    <div className="text-zinc-600 text-xs">{t.role} · {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROI CALCULATOR ───────────────────────────── */}
      <ROICalculator />

      {/* ── FAQ ──────────────────────────────────────── */}
      <FAQSection />

      {/* ── PRICING ──────────────────────────────────── */}
      <section id="pricing" className="py-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black gradient-text mb-4">Pricing that scales with you.</h2>
            <p className="text-zinc-500 text-lg">Start free. Upgrade when the ROI is obvious.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                name: "Free", price: "$0", desc: "Try before you commit",
                features: ["1 AI employee","10 runs/month","Email campaigns","Dashboard analytics"],
                highlight: false, cta: "Start free", href: "/signup",
              },
              {
                name: "Starter", price: "$49", desc: "For solo operators",
                features: ["3 AI employees","500 runs/month","AI image generation","Instagram + Facebook + X","Email campaigns","Google Sheets import"],
                highlight: false, cta: "Get started", href: "/signup",
              },
              {
                name: "Growth", price: "$149", desc: "For growing teams",
                features: ["10 AI employees","5,000 runs/month","Everything in Starter","AI image generation","Autopilot workflows","Priority support"],
                highlight: true, cta: "Get started", href: "/signup",
              },
              {
                name: "Scale", price: "$499", desc: "For serious operators",
                features: ["100 AI employees","50,000 runs/month","Everything in Growth","Custom agent builder","API access","Dedicated support","SLA guarantee"],
                highlight: false, cta: "Get started", href: "/signup",
              },
            ].map((plan) => (
              <div key={plan.name}
                className="rounded-3xl p-7 flex flex-col relative overflow-hidden"
                style={plan.highlight ? {
                  background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(109,40,217,0.08))",
                  border: "1px solid rgba(124,58,237,0.4)",
                  boxShadow: "0 0 60px rgba(124,58,237,0.12)"
                } : {
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}>
                {plan.highlight && (
                  <>
                    <div className="absolute top-0 inset-x-0 h-px"
                      style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }} />
                    <div className="absolute top-4 right-4 text-xs text-violet-300 bg-violet-500/10 border border-violet-500/30 rounded-full px-3 py-1 font-semibold">
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
                <div className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                      <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: plan.highlight ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)" }}>
                        <Check className="h-3 w-3 text-violet-400" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href={plan.href}
                  className="w-full text-center py-3.5 rounded-2xl font-semibold text-sm transition-all btn-shine"
                  style={plan.highlight ? {
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "white",
                    boxShadow: "0 8px 32px rgba(124,58,237,0.4)"
                  } : {
                    background: "rgba(255,255,255,0.05)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.1)"
                  }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────── */}
      <section className="py-40 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(124,58,237,0.18), transparent)" }} />
          <div className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-8 text-sm text-violet-300"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "100px", padding: "8px 20px" }}>
            <Zap className="h-4 w-4 fill-violet-400 text-violet-400" />
            Ready to deploy in 10 minutes
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black mb-6 md:mb-8 leading-[0.9]">
            <span className="gradient-text">Your AI team</span>
            <br />
            <span className="text-white">starts today.</span>
          </h2>
          <p className="text-zinc-400 text-base md:text-xl mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            Join 2,400+ teams who replaced hours of manual work with AI employees that post on Instagram, X, Facebook, send emails — and never stop.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-lg transition-all btn-shine"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 60px rgba(124,58,237,0.5), 0 0 120px rgba(124,58,237,0.2)" }}>
              Deploy your AI workforce free
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <p className="text-zinc-700 text-sm mt-6">No credit card · 10 free runs · Cancel anytime</p>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="border-t border-white/[0.04] py-12 md:py-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10 mb-12 md:mb-16">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4 hover:opacity-80 transition-opacity">
                <AetherMark size={32} glow={false} />
                <span className="font-black text-white text-lg tracking-tight">Aether</span>
              </Link>
              <p className="text-zinc-600 text-sm leading-relaxed max-w-xs">
                The AI workforce platform for ambitious teams. Instagram, Facebook, X, and Email — all on autopilot.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: [
                  { label: "Features",              href: "#features"  },
                  { label: "AI Agents",             href: "#agents"    },
                  { label: "Campaigns",             href: "#platforms" },
                  { label: "Social Media",          href: "#platforms" },
                  { label: "Pricing",               href: "#pricing"   },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About",    href: "/about"   },
                  { label: "Blog",     href: "/blog"    },
                  { label: "Careers",  href: "/careers" },
                  { label: "Press",    href: "/press"   },
                  { label: "Contact",  href: "/contact" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy Policy",    href: "/privacy"       },
                  { label: "Terms of Service",  href: "/terms"         },
                  { label: "Security",          href: "/security"      },
                  { label: "Cookie Policy",     href: "/cookie-policy" },
                ],
              },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white text-sm font-bold mb-5 uppercase tracking-widest text-xs">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-zinc-500 hover:text-zinc-200 text-sm transition-colors">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/[0.04] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-zinc-700 text-xs">
              <p>© {new Date().getFullYear()} Aether AI, Inc.</p>
              <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            </div>
            <div className="flex items-center gap-6 text-zinc-700 text-xs">
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 256-bit SSL</div>
              <div className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> GDPR Compliant</div>
              <div className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> 99.9% Uptime SLA</div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}