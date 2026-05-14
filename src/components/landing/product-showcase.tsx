"use client";
import { useEffect, useRef } from "react";

const CAMPAIGN_ROWS = [
  { agent: "Ava", label: "Series B Outreach — Q2", status: "Running", sent: 412, opens: "38%", replies: "6.2%", color: "#7c3aed", dot: "#a78bfa" },
  { agent: "Social", label: "Daily Content — Instagram + X", status: "Scheduled", sent: 84, opens: "—", replies: "—", color: "#e1306c", dot: "#f472b6" },
  { agent: "Rex", label: "Competitor Intel — TechCorp", status: "Complete", sent: 1, opens: "—", replies: "—", color: "#0891b2", dot: "#22d3ee" },
  { agent: "Sage", label: "Support Inbox Digest", status: "Running", sent: 217, opens: "71%", replies: "—", color: "#059669", dot: "#34d399" },
];

const ACTIVITY = [
  { time: "just now", text: "Ava sent email to marcus@helix.io", color: "#7c3aed" },
  { time: "12s ago",  text: "Instagram post published: 'AI is changing…'", color: "#e1306c" },
  { time: "43s ago",  text: "Rex completed research on 14 accounts", color: "#0891b2" },
  { time: "1m ago",   text: "Ava opened by sarah@parallax.com", color: "#7c3aed" },
  { time: "2m ago",   text: "X thread posted — 847 impressions so far", color: "#e1306c" },
];

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {pulse && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />}
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: color }} />
    </span>
  );
}

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.style.opacity = "1";
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 md:py-28 relative overflow-hidden">
      {/* Ambient glow behind the mockup */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(124,58,237,0.07), transparent)" }} />

      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        {/* Label */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-block text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5"
            style={{ background: "rgba(124,58,237,0.05)" }}>
            Live dashboard
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4">
            Everything in one place.
          </h2>
          <p className="text-zinc-500 text-lg max-w-xl mx-auto">
            Your AI employees, campaigns, and results — all visible from a single command center.
          </p>
        </div>

        {/* Browser mockup */}
        <div ref={containerRef} style={{ opacity: 0, transition: "opacity 0.8s ease 0.1s" }}>
          <div className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), 0 0 80px rgba(124,58,237,0.08)",
            }}>

            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3"
              style={{ background: "rgba(18,18,24,1)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ background: "#ff5f57" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "#ffbd2e" }} />
                <div className="h-3 w-3 rounded-full" style={{ background: "#28c840" }} />
              </div>
              <div className="flex-1 mx-4 rounded-md px-3 py-1 text-xs text-zinc-600 flex items-center gap-2"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", maxWidth: 320, margin: "0 auto" }}>
                <svg className="h-3 w-3 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                app.aether.ai/dashboard
              </div>
            </div>

            {/* App content */}
            <div className="flex" style={{ background: "rgba(8,8,12,1)", minHeight: 480 }}>

              {/* Sidebar */}
              <div className="hidden md:flex flex-col w-52 shrink-0 py-4 px-3"
                style={{ borderRight: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,10,16,0.8)" }}>
                {/* Logo */}
                <div className="flex items-center gap-2 px-2 mb-6">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center text-sm font-black text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>A</div>
                  <span className="text-white font-bold text-sm">Aether</span>
                </div>
                {/* Nav */}
                {[
                  { icon: "▣", label: "Dashboard", active: false },
                  { icon: "⚡", label: "Campaigns", active: true },
                  { icon: "🤖", label: "AI Agents", active: false },
                  { icon: "📊", label: "Analytics", active: false },
                  { icon: "📅", label: "Calendar", active: false },
                  { icon: "⚙", label: "Settings", active: false },
                ].map(item => (
                  <div key={item.label}
                    className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs mb-0.5 cursor-default"
                    style={item.active
                      ? { background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.15)" }
                      : { color: "rgba(255,255,255,0.3)" }}>
                    <span className="text-sm leading-none">{item.icon}</span>
                    <span className={item.active ? "font-semibold" : ""}>{item.label}</span>
                    {item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />}
                  </div>
                ))}

                {/* AI agents status */}
                <div className="mt-auto">
                  <div className="text-[10px] text-zinc-700 uppercase tracking-widest px-2 mb-2">Active agents</div>
                  {[
                    { name: "Ava", status: "Running", color: "#7c3aed" },
                    { name: "Rex", status: "Idle", color: "#0891b2" },
                    { name: "Sage", status: "Running", color: "#059669" },
                  ].map(a => (
                    <div key={a.name} className="flex items-center gap-2 px-2 py-1.5 text-xs">
                      <StatusDot color={a.color} pulse={a.status === "Running"} />
                      <span className="text-zinc-400">{a.name}</span>
                      <span className="ml-auto text-[10px]" style={{ color: a.status === "Running" ? a.color : "rgba(255,255,255,0.2)" }}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-5 overflow-hidden">
                {/* Page header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-white font-bold text-base">Active Campaigns</h3>
                    <p className="text-zinc-600 text-xs mt-0.5">4 running · last updated just now</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 cursor-default"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      Filter
                    </div>
                    <div className="px-3 py-1.5 rounded-lg text-xs text-white font-medium cursor-default"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                      + New campaign
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: "Emails sent today", value: "847", change: "+12%", up: true },
                    { label: "Avg open rate",      value: "38.4%", change: "+4.1%", up: true },
                    { label: "Demos booked",       value: "12", change: "+3 this week", up: true },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div className="text-zinc-600 text-[10px] mb-1">{s.label}</div>
                      <div className="text-white font-black text-lg leading-none mb-1">{s.value}</div>
                      <div className="text-emerald-400 text-[10px]">↑ {s.change}</div>
                    </div>
                  ))}
                </div>

                {/* Campaign table */}
                <div className="rounded-xl overflow-hidden mb-4"
                  style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                  {/* Table header */}
                  <div className="grid text-[10px] text-zinc-700 uppercase tracking-widest px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)",
                      gridTemplateColumns: "1fr 80px 60px 60px 60px" }}>
                    <span>Campaign</span>
                    <span className="hidden sm:block">Status</span>
                    <span className="hidden sm:block text-right">Sent</span>
                    <span className="hidden sm:block text-right">Opens</span>
                    <span className="hidden sm:block text-right">Replies</span>
                  </div>
                  {CAMPAIGN_ROWS.map((row) => (
                    <div key={row.label}
                      className="grid items-center px-3 py-2.5"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)",
                        gridTemplateColumns: "1fr 80px 60px 60px 60px" }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold"
                          style={{ background: `${row.color}20`, color: row.color, border: `1px solid ${row.color}30` }}>
                          {row.agent[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-zinc-200 text-xs font-medium truncate">{row.label}</div>
                          <div className="text-zinc-600 text-[10px]">{row.agent}</div>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5">
                        <StatusDot color={row.dot} pulse={row.status === "Running"} />
                        <span className="text-xs" style={{ color: row.status === "Running" ? row.dot : "rgba(255,255,255,0.25)" }}>
                          {row.status}
                        </span>
                      </div>
                      <div className="hidden sm:block text-right text-xs text-zinc-400">{row.sent}</div>
                      <div className="hidden sm:block text-right text-xs text-zinc-400">{row.opens}</div>
                      <div className="hidden sm:block text-right text-xs" style={{ color: row.replies !== "—" ? "#34d399" : "rgba(255,255,255,0.25)" }}>
                        {row.replies}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Activity feed */}
                <div>
                  <div className="text-[10px] text-zinc-700 uppercase tracking-widest mb-2">Live activity</div>
                  <div className="space-y-1.5">
                    {ACTIVITY.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: item.color }} />
                        <span className="text-zinc-400 flex-1 truncate">{item.text}</span>
                        <span className="text-zinc-700 shrink-0">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Caption badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          {[
            { icon: "🔴", text: "Live — updates every second" },
            { icon: "🔒", text: "SOC 2 compliant" },
            { icon: "⚡", text: "Sub-second execution" },
            { icon: "📊", text: "Full audit trail" },
          ].map(b => (
            <div key={b.text} className="flex items-center gap-2 text-xs text-zinc-500 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span>{b.icon}</span>
              {b.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}