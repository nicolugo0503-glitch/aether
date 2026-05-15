"use client";
import { useEffect, useRef, useState } from "react";

const AGENTS = [
  {
    name: "Ava",
    role: "AI SDR",
    color: "#7c3aed",
    badge: "Email",
    task: "Composing #847 → marcus@helix.io",
    content: `Subject: Quick question, Marcus

Hi Marcus — congrats on the Series B.

Saw Helix is scaling the sales team to 40
reps this quarter. Most teams at that stage
spend 15+ hrs/week on manual outreach.

Aether handles all of it. Personalized
cold emails at scale, 24/7, zero headcount.

Open rate on this sequence: 38.4%.
Last reply booked a demo 6 minutes ago.

Worth a 15-min call this week?

— Ava, AI SDR`,
    metric: "847 sent today",
    metricSub: "38.4% open rate · 3 demos booked",
    delay: 0,
  },
  {
    name: "Social",
    role: "Autopilot",
    color: "#e1306c",
    badge: "Instagram",
    task: "Drafting post · Scheduled 6:00 PM",
    content: `🚀 The future of work isn't hybrid —
it's autonomous.

While your team sleeps, Aether is:
• Sending personalized cold emails
• Publishing social content daily
• Researching your next 100 leads

Zero headcount. 10x output.

What would you do with 10 extra
hours every week? 👇

#AIAutomation #FutureOfWork #SaaS`,
    metric: "Posted to 4 channels",
    metricSub: "Avg 2.1K impressions · Auto-scheduled",
    delay: 500,
  },
  {
    name: "Rex",
    role: "Researcher",
    color: "#0891b2",
    badge: "Brief",
    task: "Generating · TechCorp Industries",
    content: `ACCOUNT BRIEF: TechCorp Industries
Generated: Just now · Confidence: High
─────────────────────────────────

Revenue:    ~$45M ARR (estimated)
Headcount:   280 (+32% YoY, LinkedIn)
Funding:     $18M Series A, Apr 2024
Stack:       Salesforce, HubSpot, Slack

GROWTH SIGNALS 🔥
• 14 new SDR job postings this month
• CEO posted about "scaling outbound"
• 2 direct competitors now on Aether

RECOMMENDED ANGLE:
Lead with the time-savings story.
Reference their SDR hiring surge.`,
    metric: "14 briefs today",
    metricSub: "Avg 4 min per brief · Full data room",
    delay: 1000,
  },
];

export function ProductShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [charCounts, setCharCounts] = useState([0, 0, 0]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const start = Date.now();
    const SPEED = 38; // chars per second
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      setCharCounts(AGENTS.map((a) => {
        const agentElapsed = Math.max(0, elapsed - a.delay);
        return Math.min(Math.floor((agentElapsed / 1000) * SPEED), a.content.length);
      }));
    }, 30);
    return () => clearInterval(timer);
  }, [visible]);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-40 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.008)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse, #7c3aed, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div
            className="inline-block text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5"
            style={{ background: "rgba(124,58,237,0.05)" }}
          >
            Live agents
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6">
            <span className="text-white">Watch your agents</span>
            <br />
            <span className="gradient-text">work in real time.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            This is what Aether is doing right now for teams like yours — no humans required.
          </p>
        </div>

        {/* Agent output windows */}
        <div className="grid md:grid-cols-3 gap-5">
          {AGENTS.map((agent, i) => {
            const displayed = agent.content.slice(0, charCounts[i]);
            const isTyping = charCounts[i] < agent.content.length;
            const started = charCounts[i] > 0;
            return (
              <div
                key={agent.name}
                className={`rounded-3xl flex flex-col overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                style={{
                  transitionDelay: `${i * 0.12 + 0.2}s`,
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  boxShadow: started ? `0 0 60px ${agent.color}08` : "none",
                  transition: "box-shadow 0.5s ease, opacity 0.7s ease, transform 0.7s ease",
                }}
              >
                {/* Colored top bar */}
                <div
                  className="h-px w-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${agent.color}80, transparent)` }}
                />

                {/* Card header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-base font-black text-white shrink-0"
                      style={{ background: `${agent.color}20`, border: `1px solid ${agent.color}35` }}
                    >
                      {agent.name[0]}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm leading-none">{agent.name}</div>
                      <div className="text-xs mt-0.5 font-medium uppercase tracking-widest" style={{ color: agent.color }}>
                        {agent.role}
                      </div>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: `${agent.color}15`, color: agent.color, border: `1px solid ${agent.color}30` }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: agent.color, animation: isTyping ? "ping 1s cubic-bezier(0,0,0.2,1) infinite" : "none", opacity: isTyping ? 1 : 0.5 }}
                    />
                    {isTyping ? "Writing…" : "Done"}
                  </div>
                </div>

                {/* Task line */}
                <div
                  className="px-5 py-2.5 text-xs text-zinc-500 font-mono"
                  style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <span style={{ color: agent.color }}>▶</span> {agent.task}
                </div>

                {/* Content output — typewriter */}
                <div className="flex-1 px-5 py-5 min-h-[280px]">
                  <pre
                    className="text-xs leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap break-words"
                    style={{ fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace" }}
                  >
                    {displayed}
                    {isTyping && (
                      <span
                        className="inline-block w-[2px] h-[13px] ml-[1px] align-middle"
                        style={{ background: agent.color, animation: "pulse 0.8s ease-in-out infinite" }}
                      />
                    )}
                  </pre>
                </div>

                {/* Metric footer */}
                <div
                  className="px-5 py-4 flex items-center justify-between"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                    background: `${agent.color}06`,
                  }}
                >
                  <div>
                    <div className="text-white font-black text-base leading-none">{agent.metric}</div>
                    <div className="text-zinc-600 text-xs mt-1">{agent.metricSub}</div>
                  </div>
                  <div
                    className="text-xs px-2.5 py-1 rounded-lg font-semibold"
                    style={{ background: `${agent.color}15`, color: agent.color }}
                  >
                    {agent.badge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom strip */}
        <div
          className={`mt-12 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 delay-700 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          {[
            "Runs 24 hours a day, 7 days a week",
            "No prompting required",
            "All 3 agents active simultaneously",
            "Results visible in your dashboard",
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 text-xs text-zinc-500 px-4 py-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
