"use client";

import { useState, useEffect } from "react";
import { Sparkles, Send, RefreshCw, Instagram, Facebook } from "lucide-react";

interface SocialPost {
  id: string; topic: string; caption: string; hashtags: string;
  platforms: string; status: string; fbPostId?: string; igPostId?: string;
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

export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [platforms, setPlatforms] = useState({ facebook: true, instagram: true });
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
    setGenerating(true); setError("");
    const selected = Object.entries(platforms).filter(([, v]) => v).map(([k]) => k);
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
    s === "partial" ? "text-yellow-400" : "text-muted";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Social Media</h1>
        <p className="text-sm text-muted mt-1">AI generates and posts to Instagram + Facebook automatically</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
      )}

      {/* Generate panel */}
      <div className="card space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent-2" /> Generate Post</h2>

        <div>
          <label className="label">Topic</label>
          <input className="input mt-1" placeholder="e.g. How AI saves businesses 10 hours a week"
            value={topic} onChange={e => setTopic(e.target.value)} />
          <div className="flex flex-wrap gap-2 mt-2">
            {TOPIC_IDEAS.map(t => (
              <button key={t} onClick={() => setTopic(t)}
                className="text-xs bg-bg border border-border rounded-full px-3 py-1 text-muted hover:text-white">
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="label">Tone</label>
            <select className="input mt-1" value={tone} onChange={e => setTone(e.target.value)}>
              {TONES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Platforms</label>
            <div className="flex gap-3 mt-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={platforms.facebook}
                  onChange={e => setPlatforms({ ...platforms, facebook: e.target.checked })} />
                <Facebook className="h-4 w-4 text-blue-400" /> Facebook
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={platforms.instagram}
                  onChange={e => setPlatforms({ ...platforms, instagram: e.target.checked })} />
                <Instagram className="h-4 w-4 text-pink-400" /> Instagram
              </label>
            </div>
          </div>
        </div>

        <button className="btn-primary flex items-center gap-2" onClick={generatePost} disabled={generating}>
          {generating ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> Generate Post</>}
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="card space-y-4 border-accent/40">
          <h2 className="font-semibold text-accent-2">Preview</h2>
          <div className="bg-bg rounded-lg p-4 space-y-2">
            <p className="text-sm">{preview.caption}</p>
            <p className="text-sm text-muted">{preview.hashtags}</p>
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
          <p className="text-sm text-muted">No posts yet. Generate your first one above.</p>
        ) : (
          <div className="space-y-3">
            {posts.map(p => (
              <div key={p.id} className="border border-border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">{new Date(p.createdAt).toLocaleDateString()}</span>
                  <span className={`text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                </div>
                <p className="text-sm">{p.caption}</p>
                <p className="text-xs text-muted">{p.hashtags}</p>
                {p.error && <p className="text-xs text-red-400">{p.error}</p>}
                {p.status === "draft" && (
                  <button className="btn-primary text-xs py-1 px-3 flex items-center gap-1 mt-2"
                    onClick={() => publishPost(p.id)} disabled={postingId === p.id}>
                    {postingId === p.id ? "Posting..." : <><Send className="h-3 w-3" /> Post Now</>}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-schedule info */}
      <div className="card border-accent/20">
        <h2 className="font-semibold">Auto-Schedule</h2>
        <p className="text-sm text-muted mt-1">
          Once your Facebook and Instagram are connected in <strong className="text-white">Settings</strong>,
          Aether will automatically generate and post every day at 9am — no clicks needed.
        </p>
      </div>
    </div>
  );
}
