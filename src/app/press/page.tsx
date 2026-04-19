import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const COMPANY = "Aether AI, Inc.";
const EMAIL = "press@useaether.net";

export default function PressPage() {
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

        <div className="mb-12">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Press</p>
          <h1 className="text-5xl font-black leading-tight mb-6">Press & Media</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Resources for journalists and media covering Aether. For press inquiries, reach out at{" "}
            <a href={`mailto:${EMAIL}`} className="text-violet-400 hover:text-violet-300">{EMAIL}</a>.
          </p>
        </div>

        {/* About blurb */}
        <div className="p-8 rounded-3xl mb-10" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)" }}>
          <h2 className="text-lg font-bold text-white mb-3">About Aether</h2>
          <p className="text-zinc-300 leading-relaxed">
            Aether is an AI automation platform that enables businesses to deploy autonomous AI agents across social media channels (Instagram, Facebook, X), email marketing, and lead generation — without writing code. Teams use Aether to automate their entire digital marketing operation, saving 10+ hours per week and scaling output without scaling headcount.
          </p>
        </div>

        {/* Facts */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6">Quick Facts</h2>
          <div className="space-y-4">
            {[
              { label: "Founded",    value: "2025" },
              { label: "Headquarters", value: "Remote-first" },
              { label: "Product",    value: "AI automation SaaS — social media, email, lead generation" },
              { label: "Pricing",    value: "Subscription plans starting at $39/month" },
              { label: "Website",    value: "useaether.net" },
              { label: "Press contact", value: EMAIL },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-6 py-4 border-b border-white/[0.05]">
                <span className="text-zinc-600 text-sm w-36 flex-shrink-0">{f.label}</span>
                <span className="text-zinc-300 text-sm">{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Brand assets */}
        <div className="p-8 rounded-3xl mb-12" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 className="text-lg font-bold text-white mb-3">Brand Assets</h2>
          <p className="text-zinc-500 text-sm mb-5">Logos, screenshots, and brand guidelines available upon request.</p>
          <a
            href={`mailto:${EMAIL}?subject=Brand Assets Request`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
            style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}
          >
            Request brand assets →
          </a>
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
