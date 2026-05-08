"use client";

import { useState, useEffect } from "react";
import { Sparkles, Send, RefreshCw, Instagram, Facebook, Image as ImageIcon, Clock, Check, Share2, Plus, X, Zap, CheckCircle2, XCircle, ToggleLeft, ToggleRight } from "lucide-react";

const TIMEZONES = [
  "UTC","America/New_York","America/Chicago","America/Denver",
  "America/Los_Angeles","America/Sao_Paulo","Europe/London",
  "Europe/Paris","Europe/Madrid","Asia/Dubai","Asia/Tokyo","Australia/Sydney",
];

interface SocialPost {
  id: string; topic: string; caption: string; hashtags: string;
  platforms: string; status: string; imageUrl?: string;
  fbPostId?: string; igPostId?: string; xPostId?: string;
  error?: string; postedAt?: string; createdAt: string;
}

const TONES = ["professional","casual","inspirational","funny","educational"];
const TOPIC_IDEAS = [
  "AI is changing how businesses hire",
  "How to save 10 hours a week with automation",
  "Why smart companies use AI employees",
  "The future of work",
  "How Aether helps you scale without hiring",
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

interface Schedule {
  enabled: boolean; time: string; timezone: string;
  frequency: string; topic: string; platforms: string[]; nextRun?: string;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "posted") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold"
      style={{ background:"rgba(16,185,129,0.1)", color:"#10b981", border:"1px solid rgba(16,185,129,0.2)" }}>
      <CheckCircle2 className="h-2.5 w-2.5" />posted
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold"
      style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.2)" }}>
      <XCircle className="h-2.5 w-2.5" />error
    </span>
  );
  if (status === "partial") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold"
      style={{ background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)" }}>
      partial
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-semibold"
      style={{ background:"rgba(255,255,255,0.04)", color:"#71717a", border:"1px solid rgba(255,255,255,0.08)" }}>
      <Clock className="h-2.5 w-2.5" />draft
    </span>
  );
}

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: true, x: false });
  const [generating, setGenerating] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<SocialPost | null>(null);
  const [error, setError] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>({
    enabled: false, time: "09:00", timezone: "UTC",
    frequency: "daily", topic: "", platforms: ["facebook","instagram"],
  });
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  useEffect(() => { loadPosts(); loadSchedule(); }, []);

  async function loadSchedule() {
    const r = await fetch("/api/social/schedule");
    if (r.ok) setSchedule(await r.json());
  }

  async function saveSchedule() {
    setScheduleSaving(true);
    await fetch("/api/social/schedule", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(schedule),
    });
    setScheduleSaving(false); setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 2500);
    loadSchedule();
  }

  function toggleSchedulePlatform(p: string) {
    setSchedule(s => ({
      ...s, platforms: s.platforms.includes(p) ? s.platforms.filter(x => x !== p) : [...s.platforms, p],
    }));
  }

  async function loadPosts() {
    const r = await fetch("/api/social");
    const d = await r.json();
    setPosts(Array.isArray(d) ? d : []);
  }

  async function generatePost() {
    if (!topic) { setError("Enter a topic first"); return; }
    const selected = Object.entries(platforms).filter(([,v]) => v).map(([k]) => k);
    if (selected.length === 0) { setError("Select at least one platform"); return; }
    setGenerating(true); setError("");
    const r = await fetch("/api/social/generate", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ topic, tone, platforms: selected }),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setGenerating(false); return; }
    setPreview(d.post);
    await loadPosts();
    setGenerating(false);
  }

  async function publishPost(postId: string) {
    setPostingId(postId); setError("");
    const r = await fetch("/api/social/post", {
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error);
    await loadPosts(); setPostingId(null); setPreview(null);
  }

  const getPlatformBadges = (platformsJson: string) => {
    try { return JSON.parse(platformsJson) as string[]; } catch { return []; }
  };

  const PLATFORM_ICONS: Record<string, React.ReactNode> = {
    instagram: <Instagram className="h-3 w-3" style={{ color:"#e1306c" }} />,
    facebook:  <Facebook className="h-3 w-3" style={{ color:"#1877f2" }} />,
    x:         <XIcon className="h-3 w-3" style={{ color:"#e7e9ea" } as React.CSSProperties} />,
  };

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes post-enter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .post-card{animation:post-enter 0.35s ease both}
        .gen-btn:hover:not(:disabled){box-shadow:0 0 28px rgba(124,58,237,0.45)!important;filter:brightness(1.1)}
        .gen-btn:disabled{opacity:0.6;cursor:not-allowed}
        .pub-btn:hover:not(:disabled){box-shadow:0 0 20px rgba(16,185,129,0.35)!important;filter:brightness(1.1)}
        .topic-chip:hover{border-color:rgba(124,58,237,0.4)!important;background:rgba(124,58,237,0.08)!important;color:#a78bfa!important}
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))", border:"1px solid rgba(124,58,237,0.25)" }}>
            <Share2 style={{ width:18, height:18 }} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Social Media</h1>
            <p className="text-sm text-zinc-500">
              AI generates captions <span className="text-violet-400 font-medium">+ images</span> → posts to{" "}
              <span style={{ color:"#e1306c" }}>Instagram</span>,{" "}
              <span style={{ color:"#1877f2" }}>Facebook</span>,{" "}
              <span className="text-zinc-300">X</span>
            </p>
          </div>
        </div>
        <button onClick={() => setShowSchedule(!showSchedule)}
          className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          style={{
            background: schedule.enabled ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
            border: schedule.enabled ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.08)",
            color: schedule.enabled ? "#10b981" : "#71717a",
          }}>
          <Clock className="h-4 w-4" />
          {schedule.enabled ? `Auto · ${schedule.frequency}` : "Schedule"}
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl px-5 py-3 flex items-center justify-between gap-3"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)" }}>
          <span className="text-sm text-red-400">{error}</span>
          <button onClick={() => setError("")}><X className="h-4 w-4 text-red-400" /></button>
        </div>
      )}

      {/* ── Schedule Panel ── */}
      {showSchedule && (
        <div className="rounded-3xl overflow-hidden"
          style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(124,58,237,0.18)" }}>
          <div className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(124,58,237,0.04)" }}>
            <Clock className="h-4 w-4 text-violet-400" />
            <h2 className="font-bold text-white">Auto-Posting Schedule</h2>
            <button onClick={() => setSchedule(s => ({ ...s, enabled: !s.enabled }))}
              className="ml-auto flex items-center gap-2 text-sm font-semibold transition-all"
              style={{ color: schedule.enabled ? "#10b981" : "#71717a" }}>
              {schedule.enabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
              {schedule.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="p-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Frequency</label>
              <select className="input" value={schedule.frequency} onChange={e => setSchedule(s => ({ ...s, frequency: e.target.value }))}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Time</label>
              <input className="input" type="time" value={schedule.time} onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Timezone</label>
              <select className="input" value={schedule.timezone} onChange={e => setSchedule(s => ({ ...s, timezone: e.target.value }))}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Default Topic</label>
              <input className="input" placeholder="What to post about..." value={schedule.topic}
                onChange={e => setSchedule(s => ({ ...s, topic: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-2 block">Platforms</label>
              <div className="flex gap-2">
                {["facebook","instagram","x"].map(p => {
                  const isOn = schedule.platforms.includes(p);
                  return (
                    <button key={p} onClick={() => toggleSchedulePlatform(p)}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all capitalize"
                      style={{
                        background: isOn ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                        border: isOn ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.07)",
                        color: isOn ? "#a78bfa" : "#71717a",
                      }}>
                      {PLATFORM_ICONS[p]}{p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              {schedule.nextRun && (
                <p className="text-xs text-zinc-600 mb-3">Next run: <span className="text-zinc-400">{schedule.nextRun}</span></p>
              )}
              <button onClick={saveSchedule} disabled={scheduleSaving}
                className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all hover:opacity-90"
                style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                {scheduleSaved ? <><Check className="h-4 w-4" />Saved!</> : scheduleSaving ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Panel ── */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(124,58,237,0.18)" }}>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(124,58,237,0.04)" }}>
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h2 className="font-bold text-white">Generate Post</h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Topic ideas */}
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-600 mb-2 block">Topic ideas</label>
            <div className="flex flex-wrap gap-2">
              {TOPIC_IDEAS.map(t => (
                <button key={t} onClick={() => setTopic(t)}
                  className="topic-chip text-xs rounded-xl px-3 py-1.5 text-zinc-500 transition-all text-left"
                  style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Topic input */}
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Your topic</label>
            <input className="input" placeholder="What do you want to post about?" value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generatePost()} />
          </div>

          {/* Tone + Platforms */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Tone</label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button key={t} onClick={() => setTone(t)}
                    className="rounded-lg px-3 py-1 text-xs font-semibold transition-all capitalize"
                    style={{
                      background: tone === t ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                      border: tone === t ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
                      color: tone === t ? "#a78bfa" : "#71717a",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Platforms</label>
              <div className="flex gap-2">
                {(["facebook","instagram","x"] as const).map(p => {
                  const isOn = platforms[p];
                  return (
                    <button key={p} onClick={() => setPlatforms(prev => ({ ...prev, [p]: !prev[p] }))}
                      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all capitalize"
                      style={{
                        background: isOn ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                        border: isOn ? "1px solid rgba(124,58,237,0.35)" : "1px solid rgba(255,255,255,0.07)",
                        color: isOn ? "#a78bfa" : "#71717a",
                      }}>
                      {PLATFORM_ICONS[p]}{p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={generatePost} disabled={generating}
            className="gen-btn flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all"
            style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow:"0 0 16px rgba(124,58,237,0.2)" }}>
            {generating ? (
              <><RefreshCw className="h-4 w-4 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" />Generate with AI</>
            )}
          </button>
        </div>
      </div>

      {/* ── Preview / Publish ── */}
      {preview && (
        <div className="rounded-3xl overflow-hidden"
          style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(16,185,129,0.2)", boxShadow:"0 0 40px rgba(16,185,129,0.08)" }}>
          <div className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(16,185,129,0.04)" }}>
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-bold text-white">Preview — ready to publish</h2>
            <button onClick={() => setPreview(null)} className="ml-auto text-zinc-600 hover:text-zinc-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap gap-1.5">
              {getPlatformBadges(preview.platforms).map(p => (
                <span key={p} className="flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"
                  style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                  {PLATFORM_ICONS[p]}<span className="capitalize">{p}</span>
                </span>
              ))}
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{preview.caption}</p>
            {preview.hashtags && (
              <p className="text-sm text-violet-400 leading-relaxed">{preview.hashtags}</p>
            )}
            {preview.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.imageUrl} alt="Generated" className="w-full max-h-64 object-cover" />
              </div>
            )}
            <button onClick={() => publishPost(preview.id)} disabled={!!postingId}
              className="pub-btn flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all"
              style={{ background:"linear-gradient(135deg,#10b981,#059669)", boxShadow:"0 0 16px rgba(16,185,129,0.2)" }}>
              {postingId ? (
                <><RefreshCw className="h-4 w-4 animate-spin" />Publishing...</>
              ) : (
                <><Send className="h-4 w-4" />Publish Now</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Post History ── */}
      {posts.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-widest text-zinc-600 mb-3">Post History</h2>
          <div className="space-y-2">
            {posts.map((p, i) => {
              const platformBadges = getPlatformBadges(p.platforms);
              const ts = new Date(p.createdAt);
              const ago = (() => {
                const s = Math.floor((Date.now() - ts.getTime()) / 1000);
                if (s < 60) return `${s}s ago`;
                if (s < 3600) return `${Math.floor(s/60)}m ago`;
                if (s < 86400) return `${Math.floor(s/3600)}h ago`;
                return `${Math.floor(s/86400)}d ago`;
              })();

              return (
                <div key={p.id} className="post-card rounded-2xl p-4 flex items-start gap-4"
                  style={{ animationDelay:`${i * 0.04}s`, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt="" className="h-12 w-12 rounded-xl object-cover shrink-0 border border-white/5" />
                  ) : (
                    <div className="h-12 w-12 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.15)" }}>
                      <ImageIcon className="h-5 w-5 text-violet-500" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={p.status} />
                      <div className="flex gap-1">
                        {platformBadges.map(pb => (
                          <span key={pb} className="flex items-center">{PLATFORM_ICONS[pb]}</span>
                        ))}
                      </div>
                      <span className="text-xs text-zinc-700 ml-auto">{ago}</span>
                    </div>
                    <p className="text-sm text-zinc-300 line-clamp-2">{p.caption}</p>
                    {p.error && <p className="text-xs text-red-400 mt-1">{p.error}</p>}
                  </div>

                  {p.status === "draft" && (
                    <button onClick={() => publishPost(p.id)} disabled={!!postingId}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90"
                      style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                      {postingId === p.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      Post
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {posts.length === 0 && !preview && (
        <div className="rounded-3xl py-12 text-center"
          style={{ background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(255,255,255,0.08)" }}>
          <Share2 className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500">No posts yet — generate your first above.</p>
        </div>
      )}
    </div>
  );
}
