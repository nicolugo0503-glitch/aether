"use client";

import { useState, useEffect } from "react";
import { Sparkles, Send, RefreshCw, Instagram, Facebook, Image as ImageIcon } from "lucide-react";

interface SocialPost {
  id: string; topic: string; caption: string; hashtags: string;
  platforms: string; status: string; imageUrl?: string;
  fbPostId?: string; igPostId?: string; xPostId?: string;
  error?: string; postedAt?: string; createdAt: string;
}

const TONES = ["professional", "casual", "inspirational", "funny", "educational"];
const TOPIC_IDEAS = [
  "AI is changing how businesses hire",
  "How to save 10 hours a week with automation",
  "Why smart companies use AI employees",
  "The future of work in 2025",
  "How Aether helps you scale without hiring",
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
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

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    const r = await fetch("/api/social");
    const d = await r.json();
    setPosts(Array.isArray(d) ? d : []);
  }

  async function generatePost() {
    if (!topic) { setError("Enter a topic first"); return; }
    const selected = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k);
    if (selected.length === 0) { setError("Select at least one platform"); return; }
    setGenerating(true); setError("");
    const r = await fetch("/api/social/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, tone, platforms: selected }),
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error);
    await loadPosts();
    setPostingId(null);
    setPreview(null);
  }

  const statusColor = (s: string) =>
    s === "posted" ? "text-emerald-400" : s === "error" ? "text-red-400" :
    s === "partial" ? "text-yellow-400" : "text-zinc-500";

  const getPlatformBadges = (platformsJson: string) => {
    try { return JSON.parse(platformsJson) as string[]; }
    catch { return []; }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Social Media</h1>
        <p className="text-sm text-zinc-500 mt-1">
          AI generates captions <span className="text-violet-400 font-medium">+ images</span> and posts to{" "}
          <span className="text-pink-400">Instagram</span>,{" "}
          <span className="text-blue-400">Facebook</span>, and{" "}
          <span className="text-zinc-300">X (Twitter)</span> automatically
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">{error}</div>
      )}

      {/* Generate panel */}
      <div className="card space-y-5">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" /> Generate Post + Image
        </h2>

        <div>
          <label className="label">Topic</label>
          <input className="input mt-1.5" placeholder="e.g. How AI saves businesses 10 hours a week"
            value={topic} onChange={e => setTopic(e.target.value)} />
          <div className="flex flex-wrap gap-2 mt-2.5">
            {TOPIC_IDEAS.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                className="text-xs border border-white/[0.06] rounded-full px-3 py-1 text-zinc-500 hover:text-white hover:border-violet-500/30 transition-all"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <label className="label">Tone</label>
            <select className="input mt-1.5" value={tone} onChange={e => setTone(e.target.value)}>
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Platforms</label>
            <div className="flex gap-4 mt-2.5 flex-wrap">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={platforms.facebook}
                  onChange={e => setPlatforms({ ...platforms, facebook: e.target.checked })} />
                <Facebook className="h-4 w-4 text-blue-400" />
                <span className="text-zinc-300">Facebook</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={platforms.instagram}
                  onChange={e => setPlatforms({ ...platforms, instagram: e.target.checked })} />
                <Instagram className="h-4 w-4 text-pink-400" />
                <span className="text-zinc-300">Instagram</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={platforms.x}
                  onChange={e => setPlatforms({ ...platforms, x: e.target.checked })} />
                <XIcon className="h-4 w-4 text-zinc-300" />
                <span className="text-zinc-300">X (Twitter)</span>
              </label>
            </div>
          </div>
        </div>

        <button className="btn-primary flex items-center gap-2" onClick={generatePost} disabled={generating}>
          {generating
            ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating caption + image...</>
            : <><Sparkles className="h-4 w-4" /> Generate Post</>}
        </button>

        {generating && (
          <div className="text-xs text-zinc-600 flex items-center gap-2">
            <ImageIcon className="h-3 w-3" />
            Writing caption and generating a custom image with DALL·E 3 — takes ~10 seconds
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="card space-y-4" style={{ borderColor: "rgba(124,58,237,0.4)" }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-violet-300">Preview</h2>
            <div className="flex gap-2">
              {getPlatformBadges(preview.platforms).map(p => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: p === "x" ? "rgba(255,255,255,0.05)" : p === "instagram" ? "rgba(225,48,108,0.1)" : "rgba(24,119,242,0.1)",
                    color: p === "x" ? "#e7e9ea" : p === "instagram" ? "#e1306c" : "#1877f2",
                    border: `1px solid ${p === "x" ? "rgba(255,255,255,0.1)" : p === "instagram" ? "rgba(225,48,108,0.3)" : "rgba(24,119,242,0.3)"}`,
                  }}>
                  {p === "x" ? "X/Twitter" : p.charAt(0).toUpperCase() + p.slice(1)}
                </span>
              ))}
            </div>
          </div>

          {/* Generated image */}
          {preview.imageUrl && (
            <div className="rounded-2xl overflow-hidden aspect-square w-full max-w-sm mx-auto"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              <img src={preview.imageUrl} alt="AI generated" className="w-full h-full object-cover" />
            </div>
          )}
          {!preview.imageUrl && (
            <div className="rounded-2xl flex items-center justify-center h-40 w-full"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}>
              <p className="text-xs text-zinc-600 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Image generation unavailable — post will be text only
              </p>
            </div>
          )}

          <div className="rounded-xl p-4 space-y-2" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-zinc-200">{preview.caption}</p>
            <p className="text-sm text-violet-400">{preview.hashtags}</p>
          </div>

          <div className="flex gap-2">
            <button className="btn-primary flex items-center gap-2" onClick={() => publishPost(preview.id)}
              disabled={postingId === preview.id}>
              {postingId === preview.id
                ? <><RefreshCw className="h-4 w-4 animate-spin" /> Posting...</>
                : <><Send className="h-4 w-4" /> Post Now</>}
            </button>
            <button className="btn-secondary" onClick={() => setPreview(null)}>Discard</button>
          </div>
        </div>
      )}

      {/* Post history */}
      <div className="card">
        <h2 className="font-semibold mb-4">Post History</h2>
        {posts.length === 0 ? (
          <p className="text-sm text-zinc-500">No posts yet. Generate your first one above.</p>
        ) : (
          <div className="space-y-3">
            {posts.map(p => {
              const badges = getPlatformBadges(p.platforms);
              return (
                <div key={p.id} className="rounded-xl p-4 flex gap-4"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  {/* Thumbnail */}
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      style={{ border: "1px solid rgba(255,255,255,0.07)" }} />
                  )}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-zinc-600">{new Date(p.createdAt).toLocaleDateString()}</span>
                        {badges.map(b => (
                          <span key={b} className="text-xs text-zinc-700 bg-white/[0.03] border border-white/[0.05] rounded-full px-2 py-0.5">
                            {b === "x" ? "X" : b === "instagram" ? "IG" : "FB"}
                          </span>
                        ))}
                      </div>
                      <span className={`text-xs font-medium shrink-0 ${statusColor(p.status)}`}>{p.status}</span>
                    </div>
                    <p className="text-sm text-zinc-300 truncate">{p.caption}</p>
                    <p className="text-xs text-violet-400 truncate">{p.hashtags}</p>
                    {p.error && <p className="text-xs text-red-400">{p.error}</p>}
                    {p.status === "draft" && (
                      <button className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 mt-1"
                        onClick={() => publishPost(p.id)} disabled={postingId === p.id}>
                        {postingId === p.id ? "Posting..." : <><Send className="h-3 w-3" /> Post Now</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Auto-schedule */}
      <div className="card" style={{ borderColor: "rgba(124,58,237,0.2)" }}>
        <h2 className="font-semibold mb-1">Auto-Schedule</h2>
        <p className="text-sm text-zinc-500">
          Connect your social accounts in <strong className="text-white">Settings</strong> and Aether will
          auto-generate a post + image and publish every day at 9 AM across all connected platforms.
        </p>
        <div className="mt-3 flex gap-3 flex-wrap">
          {[
            { label: "Instagram", color: "#e1306c" },
            { label: "Facebook", color: "#1877f2" },
            { label: "X (Twitter)", color: "#e7e9ea" },
          ].map(p => (
            <div key={p.label} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
              style={{ background: `${p.color}10`, color: p.color, border: `1px solid ${p.color}25` }}>
              {p.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
