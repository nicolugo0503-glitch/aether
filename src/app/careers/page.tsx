import Link from "next/link";
import { AetherMark } from "@/components/ui/logo";

const COMPANY = "Aether AI, Inc.";
const EMAIL = "careers@useaether.net";

export default function CareersPage() {
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
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-4">Careers</p>
          <h1 className="text-5xl font-black leading-tight mb-6">Help us build the future of work.</h1>
          <p className="text-zinc-400 text-lg leading-relaxed">
            We&apos;re a small, ambitious team building tools that give every business access to an AI workforce. If that excites you, we want to hear from you.
          </p>
        </div>

        {/* Perks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {[
            { title: "Fully remote", body: "Work from anywhere in the world. We care about results, not where you sit." },
            { title: "Competitive equity", body: "Everyone who joins early gets meaningful ownership in what we're building." },
            { title: "No bureaucracy", body: "Small team, high ownership. Your work ships fast and has real impact." },
            { title: "Async-first", body: "We respect your time and focus. No endless meetings or status-update culture." },
          ].map(p => (
            <div key={p.title} className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold text-white mb-2">{p.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        {/* Open Roles */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-white mb-8">Open Roles</h2>
          <div
            className="p-10 rounded-3xl text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-zinc-400 text-lg mb-2">No open roles right now.</p>
            <p className="text-zinc-600 text-sm mb-6">We&apos;re heads-down building. Check back soon — or reach out anyway if you think you&apos;d be a great fit.</p>
            <a
              href={`mailto:${EMAIL}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}
            >
              Introduce yourself →
            </a>
          </div>
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
