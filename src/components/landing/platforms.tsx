"use client";
import { useEffect, useRef, useState } from "react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 7L2 7" />
    </svg>
  );
}

const PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    handle: "@yourbrand",
    color: "#e1306c",
    gradient: "linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
    Icon: InstagramIcon,
    action: "AI generates captions, schedules Reels, and posts daily — no human needed.",
    stat: "2.1K",
    statLabel: "posts this month",
    badge: "Auto-post",
    activity: ["Posted: AI is changing work 🚀", "Story scheduled: 8 PM", "Reel caption written ✍️"],
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "Your Page",
    color: "#1877f2",
    gradient: "linear-gradient(135deg, #1877f2, #0a5cc5)",
    Icon: FacebookIcon,
    action: "Publishes page posts with AI-written copy and suggests boost opportunities.",
    stat: "4.8K",
    statLabel: "reach last 7 days",
    badge: "Auto-publish",
    activity: ["Published: 5 AI trends to watch", "Boost suggestion ready", "Comments replied ✅"],
  },
  {
    id: "x",
    name: "X (Twitter)",
    handle: "@yourbrand",
    color: "#a8b3cf",
    gradient: "linear-gradient(135deg, #2f2f2f, #1a1a1a)",
    Icon: XIcon,
    action: "Posts threads and tweets on any topic, on a schedule you set — fully automated.",
    stat: "12K",
    statLabel: "impressions this week",
    badge: "NEW",
    badgeColor: "#7c3aed",
    activity: ["Thread posted: 5 AI facts 🤖", "Reply drafted for @techleader", "Scheduled: 9 AM tweet"],
  },
  {
    id: "email",
    name: "Email",
    handle: "via Resend",
    color: "#a78bfa",
    gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    Icon: EmailIcon,
    action: "Personalized cold emails from your Google Sheets leads, sent at scale.",
    stat: "847K",
    statLabel: "emails sent all time",
    badge: "Live",
    activity: ["142 emails sent to SDR list", "Open rate: 42% 🔥", "Demo booked from reply"],
  },
];

function ActivityFeed({ items, color }: { items: string[]; color: string }) {
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setVisible(v => (v >= items.length ? 1 : v + 1)), 1800);
    return () => clearInterval(t);
  }, [items.length]);
  return (
    <div className="space-y-2 mt-auto">
      {items.slice(0, visible).map((item, i) => (
        <div key={i} className="flex items-center gap-2.5 text-xs transition-all duration-500"
          style={{ opacity: i === visible - 1 ? 1 : 0.4 }}>
          <span className="h-1.5 w-1.5 rounded-full shrink-0 animate-pulse" style={{ background: color }} />
          <span className="text-zinc-400">{item}</span>
        </div>
      ))}
    </div>
  );
}

export function PlatformsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setRevealed(true); obs.disconnect(); }
    }, { threshold: 0.1 });
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-36 relative overflow-hidden"
      style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, rgba(124,58,237,1), transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-6">
        {/* Header */}
        <div className={`text-center mb-16 md:mb-20 transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-block text-xs text-violet-400 uppercase tracking-widest mb-4 border border-violet-500/20 rounded-full px-4 py-1.5 bg-violet-500/5">
            Multi-channel automation
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6">
            <span className="text-white">One platform.</span>
            <br />
            <span className="gradient-text">Every channel.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Aether connects to Instagram, Facebook, X, and Email — and posts to all of them without you touching a thing.
          </p>
        </div>

        {/* Platform cards — 2-col on md, 4-col on lg */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLATFORMS.map((p, i) => (
            <div key={p.id}
              className={`relative rounded-3xl p-7 flex flex-col min-h-[380px] transition-all duration-700 ${revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
              style={{
                transitionDelay: `${i * 0.08}s`,
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}>

              {/* Top glow bar */}
              <div className="absolute top-0 inset-x-0 h-px rounded-t-3xl"
                style={{ background: `linear-gradient(90deg, transparent, ${p.color}90, transparent)` }} />

              {/* Ambient glow behind icon */}
              <div className="absolute top-6 left-6 h-20 w-20 rounded-full opacity-20 pointer-events-none"
                style={{ background: p.color, filter: "blur(24px)" }} />

              {/* Icon + badge */}
              <div className="flex items-start justify-between mb-6 relative">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white"
                  style={{ background: p.gradient, boxShadow: `0 12px 32px ${p.color}50` }}>
                  <p.Icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{
                    background: `${p.badgeColor || p.color}15`,
                    color: p.badgeColor || p.color,
                    border: `1px solid ${p.badgeColor || p.color}35`,
                  }}>
                  {p.badge}
                </span>
              </div>

              {/* Name */}
              <h3 className="text-white font-black text-xl mb-1">{p.name}</h3>
              <p className="text-xs font-medium mb-4" style={{ color: `${p.color}99` }}>{p.handle}</p>

              {/* Action description */}
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">{p.action}</p>

              {/* Big stat */}
              <div className="rounded-2xl px-5 py-4 mb-5"
                style={{ background: `${p.color}08`, border: `1px solid ${p.color}25` }}>
                <div className="text-4xl font-black leading-none mb-1" style={{ color: p.color }}>{p.stat}</div>
                <div className="text-xs text-zinc-500">{p.statLabel}</div>
              </div>

              {/* Live activity */}
              <ActivityFeed items={p.activity} color={p.color} />
            </div>
          ))}
        </div>

        {/* Bottom badge strip */}
        <div className={`mt-12 flex flex-wrap items-center justify-center gap-3 transition-all duration-700 delay-500 ${revealed ? "opacity-100" : "opacity-0"}`}>
          {["All 4 channels connected", "Auto-publishes 24/7", "Zero manual work", "Set up in 2 minutes"].map(t => (
            <div key={t} className="flex items-center gap-2 text-xs text-zinc-500 px-4 py-2 rounded-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
