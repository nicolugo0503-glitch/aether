"use client";

import { useEffect, useState } from "react";
import { Gift, Copy, Check, Users, Zap, TrendingUp, Share2, ArrowRight, Star } from "lucide-react";

interface ReferralData {
  code: string;
  bonusRuns: number;
  referredCount: number;
  verifiedReferrals: number;
  referralUrl: string;
  referredUsers: Array<{ id: string; name?: string; email: string; createdAt: string; emailVerified: boolean }>;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referral")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function copyLink() {
    if (!data?.referralUrl) return;
    navigator.clipboard.writeText(data.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const BONUS = 25;

  return (
    <div className="relative min-h-screen">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.12), transparent)" }} />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-3">
              <Gift className="h-3 w-3" />
              Referral Program
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Grow together.</h1>
            <p className="text-zinc-500 mt-1">
              Invite your network. You both get <span className="text-violet-400 font-bold">+{BONUS} free runs</span> when they sign up.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            No limit on referrals
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Friends Invited",   value: loading ? "—" : data?.referredCount ?? 0,    icon: Users,      color: "#7c3aed" },
            { label: "Verified Signups",  value: loading ? "—" : data?.verifiedReferrals ?? 0, icon: Check,      color: "#10b981" },
            { label: "Bonus Runs Earned", value: loading ? "—" : data?.bonusRuns ?? 0,         icon: Zap,        color: "#f59e0b" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }} />
              <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
                style={{ background: `radial-gradient(circle, ${s.color}18, transparent)` }} />
              <div className="flex items-start justify-between mb-3 relative">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{s.label}</p>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}28` }}>
                  <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-4xl font-black text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Referral link card */}
        <div className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(109,40,217,0.06))",
            border: "1px solid rgba(124,58,237,0.3)",
            boxShadow: "0 0 60px rgba(124,58,237,0.08)",
          }}>
          <div className="absolute top-0 inset-x-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }} />

          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
              <Share2 className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Your referral link</h2>
              <p className="text-zinc-500 text-sm">Share this link — anyone who signs up gets +{BONUS} runs. So do you.</p>
            </div>
          </div>

          {loading ? (
            <div className="h-12 rounded-xl bg-white/5 animate-pulse" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl px-4 py-3 font-mono text-sm text-violet-300 truncate"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(124,58,237,0.25)" }}>
                {data?.referralUrl}
              </div>
              <button onClick={copyLink}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white shrink-0 transition-all"
                style={{
                  background: copied ? "rgba(16,185,129,0.2)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                  border: copied ? "1px solid rgba(16,185,129,0.4)" : "none",
                  boxShadow: copied ? "none" : "0 0 20px rgba(124,58,237,0.4)",
                }}>
                {copied ? <><Check className="h-4 w-4 text-emerald-400" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy link</>}
              </button>
            </div>
          )}

          {/* Share options */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <p className="text-xs text-zinc-600">Share on:</p>
            {data?.referralUrl && (
              <>
                <a href={`https://twitter.com/intent/tweet?text=I%27ve%20been%20using%20Aether%20to%20automate%20my%20marketing%20with%20AI.%20Get%20%2B25%20free%20runs%20when%20you%20sign%20up%3A%20${encodeURIComponent(data.referralUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(231,233,234,0.08)", color: "#e7e9ea", border: "1px solid rgba(231,233,234,0.12)" }}>
                  X / Twitter
                </a>
                <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.referralUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(10,102,194,0.12)", color: "#60a5fa", border: "1px solid rgba(10,102,194,0.25)" }}>
                  LinkedIn
                </a>
                <a href={`mailto:?subject=You%20should%20try%20Aether&body=Hey%2C%20I've%20been%20automating%20my%20marketing%20with%20AI%20using%20Aether.%20Sign%20up%20with%20my%20link%20and%20we%20both%20get%20%2B25%20free%20runs%3A%20${encodeURIComponent(data.referralUrl)}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{ background: "rgba(167,139,250,0.08)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.15)" }}>
                  Email
                </a>
              </>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { step: "01", title: "Share your link", desc: "Copy your unique referral link and send it to founders, operators, or anyone who'd benefit from AI automation.", icon: Share2 },
            { step: "02", title: "They sign up",     desc: "When someone clicks your link and creates a free account, they see a special welcome banner with your bonus.", icon: Users },
            { step: "03", title: "Both get +25 runs", desc: `Once they verify their email, you both instantly receive +${BONUS} free AI runs. No limits — refer as many as you want.`, icon: Zap },
          ].map(s => (
            <div key={s.step} className="rounded-2xl p-6"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="font-black text-xs text-zinc-600 font-mono">{s.step}</div>
                <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <s.icon className="h-4 w-4 text-violet-400" />
                </div>
              </div>
              <h3 className="text-white font-bold mb-2">{s.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Referrals table */}
        {!loading && data && data.referredUsers.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-400" />
              <span className="text-white font-semibold text-sm">Your referrals</span>
              <span className="ml-auto text-xs text-zinc-600">{data.referredUsers.length} total</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {data.referredUsers.map(u => (
                <div key={u.id} className="flex items-center gap-4 px-6 py-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                    {(u.name || u.email)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.name || u.email.split("@")[0]}</p>
                    <p className="text-zinc-600 text-xs">{new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.emailVerified
                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    : "text-zinc-500 bg-white/5 border border-white/10"}`}>
                    {u.emailVerified ? `+${BONUS} runs awarded` : "Pending verification"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && data && data.referredUsers.length === 0 && (
          <div className="rounded-2xl p-12 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Gift className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 font-semibold mb-1">No referrals yet</p>
            <p className="text-zinc-600 text-sm mb-6">Share your link above to start earning bonus runs.</p>
            <button onClick={copyLink}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
              <Copy className="h-4 w-4" /> Copy your link <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
