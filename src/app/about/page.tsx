import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const COMPANY = "Aether AI, Inc.";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <AetherMark size={28} glow />
            <span className="font-black text-white tracking-tight">Aether</span>
          </Link>
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">← Back home</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Hero */}
        <div className="mb-16">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">About Us</p>
          <h1 className="text-5xl font-black leading-tight mb-6">
            We build the AI workforce<br />so you don&apos;t have to hire one.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Aether is an AI automation platform that lets businesses deploy autonomous AI agents across social media, email, and marketing — without writing a single line of code.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-14 p-8 rounded-3xl" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <h2 className="text-2xl font-black mb-4">Our Mission</h2>
          <p className="text-zinc-300 leading-relaxed text-lg">
            To give every business — from solo founders to growing teams — the same marketing and automation firepower that used to require an entire department.
          </p>
        </div>

        {/* Story */}
        <div className="space-y-6 text-zinc-300 leading-relaxed mb-16">
          <h2 className="text-2xl font-black text-white">The Story</h2>
          <p>
            We started Aether after watching talented founders and operators spend 40+ hours a week on repetitive tasks: writing social posts, sending follow-up emails, scheduling campaigns, tracking leads. Work that should be automated — but wasn't, because the tools were too complex, too expensive, or required a developer to set up.
          </p>
          <p>
            So we built Aether. A platform where you connect your accounts once, describe what you want your AI agents to do, and then get back to building your actual business. Your agents post on Instagram, Facebook, X, and email your list — every single day, automatically, without you touching it.
          </p>
          <p>
            We believe the future of work isn't about replacing people — it's about eliminating the work that shouldn't require a person in the first place.
          </p>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-8">What We Stand For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { title: "Simplicity first", body: "Powerful tools shouldn't require a manual. If it takes more than five minutes to set up, we've failed." },
              { title: "Privacy by default", body: "We don't sell your data. We don't use your content to train AI. Your business is yours." },
              { title: "Built for builders", body: "We build for founders, operators, and creators who move fast and need tools that keep up." },
              { title: "Honest pricing", body: "No surprise charges. No hidden fees. What you see on the pricing page is what you pay." },
            ].map(v => (
              <div key={v.title} className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="font-bold text-white mb-2">{v.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-12 rounded-3xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <h2 className="text-2xl font-black mb-3">Ready to try Aether?</h2>
          <p className="text-zinc-400 mb-6">Start free — no credit card required.</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}
          >
            Get started free →
          </Link>
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.05] flex items-center justify-between text-sm text-zinc-700">
          <span>© {new Date().getFullYear()} {COMPANY}</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
