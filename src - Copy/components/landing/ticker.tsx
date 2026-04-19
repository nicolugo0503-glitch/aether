"use client";

const ACTIVITIES = [
  "⚡ Ava sent cold email to john@acme.com",
  "📸 Instagram post published — 847 reach",
  "🐦 X thread posted: '5 AI facts' — 2.1K impressions",
  "🔍 Rex researched TechCorp for Sarah's pitch",
  "✅ Sage resolved support ticket #4821",
  "📧 Campaign 'April Outreach' — 142 emails sent",
  "📊 Opus generated weekly ops report",
  "🎯 Ava booked a demo with Marcus @ Helix",
  "🔵 Facebook post published — 1.2K impressions",
  "💬 Sage answered 'What is your refund policy?'",
  "🐦 X tweet scheduled for 9:00 AM tomorrow",
  "⚡ Campaign 'Follow-up Q2' — 89 leads processed",
  "🔍 Rex completed competitive analysis for Nike",
  "📸 Reel caption written + scheduled for 6 PM",
  "🎯 Ava generated 12 personalized follow-ups",
  "🐦 X thread auto-posted on AI trends — 5K reach",
];

export function ActivityTicker() {
  const doubled = [...ACTIVITIES, ...ACTIVITIES];
  return (
    <div className="relative py-6 overflow-hidden border-y border-white/[0.04]"
      style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.95) 0%, transparent 8%, transparent 92%, rgba(0,0,0,0.95) 100%)" }}>
      <div className="flex gap-6 w-max"
        style={{ animation: "ticker 50s linear infinite" }}>
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap text-sm text-zinc-500 px-4 py-2 rounded-full"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            {item}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
