"use client";
import { useEffect, useRef, useState } from "react";
import { Mail, Share2, Bot, Zap, BarChart3, Globe, Check } from "lucide-react";

function BentoCard({ children, className = "", glow = "" }: { children: React.ReactNode; className?: string; glow?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const onMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };
    card.addEventListener("mousemove", onMove);
    return () => card.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div ref={cardRef}
      className={`relative rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 group ${className}`}
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl"
        style={{ background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glow || "rgba(124,58,237,0.08)"}, transparent 60%)` }} />
      {children}
    </div>
  );
}

function TypedOutput() {
  const lines = [
    "Subject: Quick question, Marcus",
    "",
    "Hi Marcus,",
    "",
    "I noticed Helix just raised Series B —",
    "congrats. We help growth-stage",
    "teams like yours book 3x more demos",
    "with AI-written outreach.",
  ];
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(v => (v < lines.length ? v + 1 : 0));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Fixed height — never causes layout reflow
  return (
    <div className="font-mono text-xs text-zinc-400 leading-relaxed overflow-hidden" style={{ height: 112 }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            opacity: i < visible ? (i === visible - 1 ? 1 : 0.6) : 0,
            transition: "opacity 0.3s ease",
            minHeight: "1.2em",
          }}
        >
          {line || "\u00A0"}
        </div>
      ))}
      <span className="inline-block w-1.5 h-3.5 bg-violet-400 animate-pulse ml-0.5" />
    </div>
  );
}

// X (Twitter) icon SVG
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function SocialPreview() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [imgPhase, setImgPhase] = useState<"generating"|"done">("generating");
  const platforms = [
    { name: "Instagram", color: "#e1306c", label: "✓ Posted to Instagram" },
    { name: "Facebook", color: "#1877f2", label: "✓ Published to Facebook" },
    { name: "X (Twitter)", color: "#e7e9ea", label: "✓ Thread posted on X" },
  ];
  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % platforms.length), 2200);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setImgPhase(p => p === "generating" ? "done" : "generating"), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-3">
      {/* AI Image generation indicator */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
        style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
        <span className="text-violet-400">✦</span>
        <span className={`transition-all duration-500 ${imgPhase === "generating" ? "text-zinc-500" : "text-violet-300"}`}>
          {imgPhase === "generating" ? "DALL·E 3 generating image..." : "Image generated ✓"}
        </span>
        {imgPhase === "generating" && (
          <span className="ml-auto flex gap-0.5">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" style={{ animationDelay: `${i*150}ms` }} />
            ))}
          </span>
        )}
      </div>
      <div className="rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="h-28 flex items-center justify-center text-4xl relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(34,211,238,0.2))" }}>
          <span className="text-4xl">🚀</span>
          {imgPhase === "done" && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(34,211,238,0.3))" }}>
              <span className="text-xs text-white font-semibold bg-black/30 px-2 py-1 rounded-full">AI Image Ready</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-zinc-300 leading-relaxed">AI is transforming how teams work. Here&apos;s what we learned deploying 50 AI employees...</p>
          <p className="text-xs text-violet-400 mt-1">#AIWorkforce #Automation #Aether</p>
        </div>
      </div>
      <div className="space-y-1.5">
        {platforms.map((p, i) => (
          <div key={p.name}
            className={`flex items-center gap-2 text-xs transition-all duration-500 ${i === activeIdx ? "opacity-100" : "opacity-30"}`}
            style={{ color: i === activeIdx ? p.color : "#52525b" }}>
            <div className="h-2 w-2 rounded-full shrink-0"
              style={{ background: i === activeIdx ? p.color : "#3f3f46" }} />
            {i === activeIdx ? p.label : p.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BentoGrid() {
  return (
    <section id="features" className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-block text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5 bg-violet-500/5">
            Everything you need
          </div>
          <h2 className="text-5xl md:text-7xl font-black mb-6">
            <span className="gradient-text">Your AI team.</span>
            <br />
            <span className="text-white">Doing real work.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Not prompts. Not chat. Actual autonomous agents that take action inside your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ contain: "layout" }}>

          {/* Email campaigns — wide */}
          <BentoCard className="md:col-span-2 p-6 md:p-8 overflow-hidden" glow="rgba(124,58,237,0.12)">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 8px 24px rgba(124,58,237,0.4)" }}>
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-white font-bold">AI Email Campaigns</div>
                <div className="text-xs text-zinc-500">Google Sheets → Personalized emails → Sent</div>
              </div>
              <div className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">Live</div>
            </div>
            <div className="rounded-2xl p-4 mb-4 overflow-hidden" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)", minHeight: 0 }}>
              <div className="text-xs text-zinc-600 mb-3 font-mono">AVA // GENERATING EMAIL FOR LEAD #47</div>
              <TypedOutput />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["142", "Emails sent"], ["94%", "Delivered"], ["$0.02", "Per email"]].map(([v, l]) => (
                <div key={l} className="text-center rounded-xl py-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <div className="text-xl font-black text-white">{v}</div>
                  <div className="text-xs text-zinc-600">{l}</div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Social media — now includes X */}
          <BentoCard className="p-8" glow="rgba(236,72,153,0.1)">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #ec4899, #be185d)", boxShadow: "0 8px 24px rgba(236,72,153,0.4)" }}>
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">Social Autopilot</div>
                <div className="text-xs text-zinc-500">Caption + Image · Instagram · Facebook · X</div>
              </div>
            </div>
            <SocialPreview />
          </BentoCard>

          {/* AI Employees */}
          <BentoCard className="p-8" glow="rgba(34,211,238,0.08)">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white mb-6"
              style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)", boxShadow: "0 8px 24px rgba(34,211,238,0.3)" }}>
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-white font-bold text-xl mb-3">Custom AI Employees</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Build agents with custom roles, system prompts, and knowledge bases.</p>
            <div className="space-y-2">
              {["Ava — AI SDR ⚡","Rex — Researcher 🔍","Sage — Support 💬","Opus — Analyst 📊"].map(a => (
                <div key={a} className="flex items-center gap-2.5 text-sm text-zinc-300 rounded-xl px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                  {a}
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Full Automation Stack — wide */}
          <BentoCard className="md:col-span-2 p-6 md:p-8 overflow-hidden" glow="rgba(234,179,8,0.08)">
            <div className="flex items-start gap-6">
              <div>
                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white mb-6"
                  style={{ background: "linear-gradient(135deg, #d97706, #92400e)", boxShadow: "0 8px 24px rgba(217,119,6,0.3)" }}>
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-white font-bold text-2xl mb-3">Full Automation Stack</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">Set it once. Runs forever. No clicks, no babysitting, no ChatGPT.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Globe, label: "Live web search" },
                    { icon: Mail, label: "Email sending" },
                    { icon: Share2, label: "Instagram + Facebook" },
                    { label: "X / Twitter posting", isX: true },
                    { icon: BarChart3, label: "Auto reporting" },
                    { icon: Zap, label: "DALL·E 3 image gen" },
                  ].map(({ icon: Icon, label, isX }) => (
                    <div key={label} className="flex items-center gap-2 text-sm text-zinc-300">
                      {isX ? (
                        <XIcon className="h-4 w-4 text-yellow-500" />
                      ) : (
                        Icon && <Icon className="h-4 w-4 text-yellow-500" />
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Flow diagram */}
              <div className="flex-1 hidden md:block">
                <div className="space-y-2">
                  {[
                    { label: "Google Sheets", color: "#10b981", icon: "📊" },
                    { label: "AI Research Lead", color: "#7c3aed", icon: "🔍" },
                    { label: "Write Caption + Generate Image", color: "#7c3aed", icon: "🎨" },
                    { label: "Post to Instagram / Facebook / X", color: "#e1306c", icon: "📱" },
                    { label: "Send via Email + Log", color: "#f59e0b", icon: "✅" },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1 rounded-xl px-3 py-2.5 text-sm"
                        style={{ background: `${step.color}10`, border: `1px solid ${step.color}30` }}>
                        <span>{step.icon}</span>
                        <span className="text-zinc-300">{step.label}</span>
                      </div>
                      {i < 4 && <div className="h-3 w-px bg-zinc-700" style={{ marginLeft: "16px" }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>

        </div>
      </div>
    </section>
  );
}
