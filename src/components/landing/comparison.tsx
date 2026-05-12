import { Check, X } from "lucide-react";

const ROWS = [
  { label: "Sends personalized cold emails 24/7",        aether: true,  old: false },
  { label: "Posts to Instagram, Facebook & X daily",     aether: true,  old: false },
  { label: "Researches leads automatically",             aether: true,  old: false },
  { label: "Works while you sleep",                      aether: true,  old: false },
  { label: "Zero additional headcount cost",             aether: true,  old: false },
  { label: "Scales to 50,000 actions/month",             aether: true,  old: false },
  { label: "Live in 10 minutes — no onboarding",         aether: true,  old: false },
  { label: "Requires expensive contractors",             aether: false, old: true  },
  { label: "Manual copy-paste every single day",         aether: false, old: true  },
  { label: "Limited by human working hours",             aether: false, old: true  },
];

export function ComparisonSection() {
  return (
    <section className="py-24 md:py-40 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(124,58,237,0.06), transparent)" }} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <div className="inline-flex items-center gap-2 text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5"
            style={{ background: "rgba(124,58,237,0.05)" }}>
            Why teams switch
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4">
            The old way is <span className="gradient-text">costing you.</span>
          </h2>
          <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
            Every day without an AI workforce is a day of cold emails not sent, social posts not published, and leads not researched.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-3xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Column headers */}
          <div className="grid grid-cols-3 border-b" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="px-6 py-4 text-zinc-600 text-sm font-semibold">Capability</div>
            <div className="px-6 py-4 text-center border-x" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="inline-flex items-center gap-2 text-sm font-black text-white">
                <span className="h-2 w-2 rounded-full bg-violet-500" />
                Aether AI
              </div>
            </div>
            <div className="px-6 py-4 text-center">
              <div className="text-sm font-semibold text-zinc-600">Manual / Agencies</div>
            </div>
          </div>

          {/* Rows */}
          {ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-3 border-b transition-colors hover:bg-white/[0.015]"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              <div className="px-6 py-4 text-zinc-300 text-sm flex items-center">{row.label}</div>
              <div className="px-6 py-4 flex items-center justify-center border-x"
                style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(124,58,237,0.03)" }}>
                {row.aether ? (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <Check className="h-4 w-4 text-emerald-400" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <X className="h-4 w-4 text-red-400" />
                  </div>
                )}
              </div>
              <div className="px-6 py-4 flex items-center justify-center">
                {row.old ? (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <Check className="h-4 w-4 text-zinc-600" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <X className="h-4 w-4 text-red-400" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Bottom CTA row */}
          <div className="grid grid-cols-3" style={{ background: "rgba(124,58,237,0.05)" }}>
            <div className="px-6 py-5 text-zinc-500 text-sm font-semibold flex items-center">Monthly cost</div>
            <div className="px-6 py-5 flex items-center justify-center border-x"
              style={{ borderColor: "rgba(255,255,255,0.07)" }}>
              <div className="text-center">
                <div className="text-2xl font-black gradient-text">From $49</div>
                <div className="text-xs text-zinc-600 mt-0.5">per month</div>
              </div>
            </div>
            <div className="px-6 py-5 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-black text-zinc-500">$3,000+</div>
                <div className="text-xs text-zinc-600 mt-0.5">per month (contractor avg)</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <a href="/signup"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold text-base btn-shine"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 40px rgba(124,58,237,0.35)" }}>
            Replace your manual work today — free
            <span>→</span>
          </a>
          <p className="text-zinc-700 text-xs mt-4">No credit card · Cancel anytime</p>
        </div>
      </div>
    </section>
  );
}
