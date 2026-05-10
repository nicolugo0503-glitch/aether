"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2, Sparkles, Send, Settings, History,
  CheckCircle2, XCircle, Clock, Loader2, Plus,
  Twitter, Instagram, Facebook, Key, Eye, EyeOff,
  RefreshCw, Image as ImageIcon, Copy, Check, CalendarClock,
} from "lucide-react";

type SocialPost = {
  id: string;
  topic: string;
  caption: string;
  hashtags: string;
  platforms: string;
  status: string;
  imageUrl: string | null;
  postedAt: string | null;
  error: string | null;
  createdAt: string;
};

type Connections = {
  facebookConnected: boolean;
  instagramConnected: boolean;
  twitterConnected: boolean;
  fbPageId: string;
  fbPageToken: string;
  igUserId: string;
  twitterApiKey: string;
  twitterApiSecret: string;
  twitterAccessToken: string;
  twitterAccessSecret: string;
};

const PLATFORM_META = {
  facebook:  { label: "Facebook",   icon: Facebook,  color: "#1877f2", bg: "#1877f214" },
  instagram: { label: "Instagram",  icon: Instagram, color: "#e1306c", bg: "#e1306c14" },
  x:         { label: "X / Twitter", icon: Twitter,  color: "#e7e9ea", bg: "#e7e9ea14" },
} as const;

function statusBadge(status: string) {
  switch (status) {
    case "posted":  return { color: "#10b981", label: "Published", icon: CheckCircle2 };
    case "partial": return { color: "#f59e0b", label: "Partial",   icon: CheckCircle2 };
    case "error":   return { color: "#ef4444", label: "Failed",    icon: XCircle };
    case "draft":   return { color: "#71717a", label: "Draft",     icon: Clock };
    default:        return { color: "#71717a", label: status,      icon: Clock };
  }
}

function SecretInput({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
            padding: "9px 36px 9px 12px", fontSize: 13, color: "#e4e4e7",
            outline: "none", boxSizing: "border-box",
          }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#52525b", padding: 0,
          }}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer",
      color: copied ? "#10b981" : "#a1a1aa", display: "flex", alignItems: "center", gap: 4,
    }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

type ScheduleConfig = {
  enabled: boolean;
  time: string;
  timezone: string;
  frequency: string;
  topic: string;
  platforms: string[];
  nextRun: string | null;
};

export default function SocialPage() {
  const [tab, setTab] = useState<"publish" | "history" | "settings" | "schedule">("publish");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<SocialPost | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ results: Record<string, string>; errors: string[] } | null>(null);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [connections, setConnections] = useState<Connections | null>(null);
  const [savingCreds, setSavingCreds] = useState(false);
  const [credsSaved, setCredsSaved] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleConfig>({
    enabled: false, time: "09:00", timezone: "America/New_York",
    frequency: "daily", topic: "", platforms: ["facebook", "instagram"], nextRun: null,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [creds, setCreds] = useState({
    fbPageId: "", fbPageToken: "", igUserId: "",
    twitterApiKey: "", twitterApiSecret: "",
    twitterAccessToken: "", twitterAccessSecret: "",
  });

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/social");
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch {}
    setLoadingPosts(false);
  }, []);

  const loadConnections = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setConnections(data);
    } catch {}
  }, []);

  const loadSchedule = useCallback(async () => {
    try {
      const res = await fetch("/api/social/schedule");
      const data = await res.json();
      if (!data.error) setSchedule(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadPosts();
    loadConnections();
    loadSchedule();
  }, [loadPosts, loadConnections, loadSchedule]);

  const togglePlatform = (id: string) => {
    setPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true);
    setDraft(null);
    setPublishResult(null);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), tone, platforms }),
      });
      const data = await res.json();
      if (data.post) setDraft(data.post);
    } catch {}
    setGenerating(false);
  };

  const publish = async () => {
    if (!draft) return;
    setPublishing(true);
    setPublishResult(null);
    try {
      const res = await fetch("/api/social/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: draft.id }),
      });
      const data = await res.json();
      setPublishResult(data);
      if (data.success) {
        loadPosts();
      }
    } catch {}
    setPublishing(false);
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await fetch("/api/social/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      setScheduleSaved(true);
      loadSchedule();
      setTimeout(() => setScheduleSaved(false), 3000);
    } catch {}
    setSavingSchedule(false);
  };

  const saveCreds = async () => {
    setSavingCreds(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      setCredsSaved(true);
      loadConnections();
      setTimeout(() => setCredsSaved(false), 3000);
    } catch {}
    setSavingCreds(false);
  };

  const tabStyle = (active: boolean) => ({
    padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: "pointer", border: "none",
    background: active ? "rgba(124,58,237,0.2)" : "transparent",
    color: active ? "#a78bfa" : "#52525b",
    borderBottom: active ? "2px solid #7c3aed" : "2px solid transparent",
    transition: "all 0.15s",
  });

  const connectedPlatformCount =
    (connections?.facebookConnected ? 1 : 0) +
    (connections?.instagramConnected ? 1 : 0) +
    (connections?.twitterConnected ? 1 : 0);

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(59,130,246,0.35)",
            }}>
              <Share2 size={17} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.4px", margin: 0 }}>
              Social Media
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#52525b", margin: 0 }}>
            {connectedPlatformCount} platform{connectedPlatformCount !== 1 ? "s" : ""} connected · AI-powered publishing
          </p>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {connections?.facebookConnected && (
            <div style={{ padding: "5px 10px", borderRadius: 20, background: "#1877f214",
              border: "1px solid #1877f230", fontSize: 11, color: "#1877f2", fontWeight: 600 }}>
              Facebook ✓
            </div>
          )}
          {connections?.instagramConnected && (
            <div style={{ padding: "5px 10px", borderRadius: 20, background: "#e1306c14",
              border: "1px solid #e1306c30", fontSize: 11, color: "#e1306c", fontWeight: 600 }}>
              Instagram ✓
            </div>
          )}
          {connections?.twitterConnected && (
            <div style={{ padding: "5px 10px", borderRadius: 20, background: "#e7e9ea14",
              border: "1px solid #e7e9ea30", fontSize: 11, color: "#e7e9ea", fontWeight: 600 }}>
              X ✓
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <button style={tabStyle(tab === "publish")} onClick={() => setTab("publish")}>
          <Sparkles size={13} style={{ display: "inline", marginRight: 5 }} />
          Generate & Publish
        </button>
        <button style={tabStyle(tab === "history")} onClick={() => { setTab("history"); loadPosts(); }}>
          <History size={13} style={{ display: "inline", marginRight: 5 }} />
          Post History
        </button>
        <button style={tabStyle(tab === "settings")} onClick={() => setTab("settings")}>
          <Settings size={13} style={{ display: "inline", marginRight: 5 }} />
          Connect Accounts
        </button>
        <button style={tabStyle(tab === "schedule")} onClick={() => setTab("schedule")}>
          <CalendarClock size={13} style={{ display: "inline", marginRight: 5 }} />
          Auto-Schedule
          {schedule.enabled && (
            <span style={{ marginLeft: 6, width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", verticalAlign: "middle" }} />
          )}
        </button>
      </div>

      {/* ── PUBLISH TAB ── */}
      {tab === "publish" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {connectedPlatformCount === 0 && (
            <div style={{
              padding: "14px 18px", borderRadius: 12,
              background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <Key size={16} color="#f59e0b" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24", marginBottom: 2 }}>
                  No platforms connected
                </div>
                <div style={{ fontSize: 12, color: "#92400e" }}>
                  Go to "Connect Accounts" to add your Facebook, Instagram, or X credentials.
                  You can still generate content — it just won't auto-publish.
                </div>
              </div>
            </div>
          )}

          {/* Topic input */}
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              What do you want to post about?
            </label>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Our new AI automation tool just launched — share the excitement!"
              rows={3}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                padding: "10px 12px", fontSize: 13, color: "#e4e4e7",
                outline: "none", resize: "vertical", boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />

            {/* Tone */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Tone
              </label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["professional", "casual", "witty", "inspirational", "urgent"].map(t => (
                  <button key={t} onClick={() => setTone(t)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    cursor: "pointer", border: "1px solid",
                    borderColor: tone === t ? "#7c3aed" : "rgba(255,255,255,0.08)",
                    background: tone === t ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                    color: tone === t ? "#a78bfa" : "#71717a",
                    textTransform: "capitalize",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Post to
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(Object.entries(PLATFORM_META) as [string, typeof PLATFORM_META[keyof typeof PLATFORM_META]][]).map(([id, meta]) => {
                  const active = platforms.includes(id);
                  const Icon = meta.icon;
                  return (
                    <button key={id} onClick={() => togglePlatform(id)} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", border: "1px solid",
                      borderColor: active ? meta.color + "60" : "rgba(255,255,255,0.08)",
                      background: active ? meta.bg : "rgba(255,255,255,0.03)",
                      color: active ? meta.color : "#52525b",
                    }}>
                      <Icon size={13} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating || !topic.trim()}
              style={{
                marginTop: 16, display: "flex", alignItems: "center", gap: 8,
                background: generating ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
                color: "#fff", borderRadius: 10, padding: "10px 20px",
                fontSize: 13, fontWeight: 700, border: "none", cursor: generating ? "not-allowed" : "pointer",
                boxShadow: "0 0 16px rgba(124,58,237,0.35)", opacity: !topic.trim() ? 0.5 : 1,
              }}
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {generating ? "Generating..." : "Generate Post"}
            </button>
          </div>

          {/* Draft preview */}
          {draft && (
            <div style={{
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: 14, padding: "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: "#7c3aed", fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  AI-Generated Draft
                </span>
                <CopyButton text={`${draft.caption}\n\n${draft.hashtags}`} />
              </div>

              {draft.imageUrl && (
                <img
                  src={draft.imageUrl}
                  alt="Generated"
                  style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 10, marginBottom: 14 }}
                />
              )}
              {!draft.imageUrl && (
                <div style={{
                  height: 80, borderRadius: 10, marginBottom: 14,
                  background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <ImageIcon size={16} color="#3f3f46" />
                  <span style={{ fontSize: 12, color: "#3f3f46" }}>No image (Free plan — upgrade for AI images)</span>
                </div>
              )}

              <p style={{ fontSize: 14, color: "#d4d4d8", lineHeight: 1.6, marginBottom: 10 }}>
                {draft.caption}
              </p>
              <p style={{ fontSize: 13, color: "#7c3aed" }}>{draft.hashtags}</p>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 10 }}>
                <button
                  onClick={publish}
                  disabled={publishing || connectedPlatformCount === 0}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: publishing ? "rgba(16,185,129,0.3)" : "linear-gradient(135deg,#10b981,#059669)",
                    color: "#fff", borderRadius: 9, padding: "9px 18px",
                    fontSize: 13, fontWeight: 700, border: "none",
                    cursor: publishing || connectedPlatformCount === 0 ? "not-allowed" : "pointer",
                    opacity: connectedPlatformCount === 0 ? 0.5 : 1,
                  }}
                >
                  {publishing ? <Loader2 size={13} /> : <Send size={13} />}
                  {publishing ? "Publishing..." : "Publish Now"}
                </button>
                <button onClick={generate} disabled={generating} style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: "rgba(255,255,255,0.05)", color: "#a1a1aa",
                  borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700,
                  border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer",
                }}>
                  <RefreshCw size={13} />
                  Regenerate
                </button>
              </div>

              {/* Publish result */}
              {publishResult && (
                <div style={{
                  marginTop: 14, padding: "12px 14px", borderRadius: 9,
                  background: publishResult.errors?.length === 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                  border: `1px solid ${publishResult.errors?.length === 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
                }}>
                  {Object.entries(publishResult.results || {}).map(([platform, id]) => (
                    <div key={platform} style={{ fontSize: 12, color: "#10b981", marginBottom: 2 }}>
                      ✓ Posted to {platform} (ID: {id})
                    </div>
                  ))}
                  {(publishResult.errors || []).map((e, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#ef4444", marginBottom: 2 }}>
                      ✗ {e}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#52525b" }}>{posts.length} posts</span>
            <button onClick={loadPosts} style={{
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "5px 10px", cursor: "pointer", color: "#71717a",
              display: "flex", alignItems: "center", gap: 5, fontSize: 12,
            }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loadingPosts ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#52525b" }}>
              <Loader2 size={24} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13 }}>Loading...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "48px 24px",
              background: "rgba(255,255,255,0.02)", borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <History size={28} color="#3f3f46" style={{ margin: "0 auto 10px" }} />
              <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 500, marginBottom: 4 }}>No posts yet</p>
              <p style={{ fontSize: 12, color: "#52525b" }}>Generate and publish your first post.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {posts.map(post => {
                const badge = statusBadge(post.status);
                const BadgeIcon = badge.icon;
                const postPlatforms: string[] = JSON.parse(post.platforms || "[]");
                return (
                  <div key={post.id} style={{
                    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 12, padding: "14px 16px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 3 }}>{post.topic}</div>
                        <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5, marginBottom: 4 }}>
                          {post.caption.slice(0, 120)}{post.caption.length > 120 ? "..." : ""}
                        </p>
                        <p style={{ fontSize: 11, color: "#7c3aed" }}>{post.hashtags.slice(0, 60)}</p>
                      </div>
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: `${badge.color}14`, color: badge.color, border: `1px solid ${badge.color}30`,
                      }}>
                        <BadgeIcon size={11} />
                        {badge.label}
                      </div>
                      {postPlatforms.map(p => {
                        const pm = PLATFORM_META[p as keyof typeof PLATFORM_META];
                        if (!pm) return null;
                        const PIcon = pm.icon;
                        return (
                          <div key={p} style={{
                            display: "flex", alignItems: "center", gap: 4,
                            padding: "3px 8px", borderRadius: 20, fontSize: 11,
                            background: pm.bg, color: pm.color,
                          }}>
                            <PIcon size={10} /> {pm.label}
                          </div>
                        );
                      })}
                      <span style={{ fontSize: 11, color: "#3f3f46", marginLeft: "auto" }}>
                        {post.postedAt
                          ? new Date(post.postedAt).toLocaleDateString()
                          : new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {post.error && (
                      <div style={{ marginTop: 8, fontSize: 11, color: "#ef4444", padding: "6px 10px",
                        background: "rgba(239,68,68,0.08)", borderRadius: 6 }}>
                        Error: {post.error}
                      </div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                      <CopyButton text={`${post.caption}\n\n${post.hashtags}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Meta — Facebook + Instagram */}
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Facebook size={18} color="#1877f2" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Facebook & Instagram</div>
                <div style={{ fontSize: 11, color: "#52525b" }}>Uses Meta Graph API — same token for both</div>
              </div>
              {connections?.facebookConnected && (
                <div style={{ marginLeft: "auto", fontSize: 11, color: "#10b981", fontWeight: 600,
                  padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)" }}>
                  Connected ✓
                </div>
              )}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Facebook Page ID
              </label>
              <input
                type="text"
                value={creds.fbPageId}
                onChange={e => setCreds(c => ({ ...c, fbPageId: e.target.value }))}
                placeholder={connections?.facebookConnected ? "••••• (saved)" : "e.g. 123456789012345"}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "9px 12px", fontSize: 13, color: "#e4e4e7",
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <SecretInput
              label="Page Access Token"
              value={creds.fbPageToken}
              onChange={v => setCreds(c => ({ ...c, fbPageToken: v }))}
              placeholder={connections?.facebookConnected ? "••••• (saved)" : "EAA..."}
            />
            <div>
              <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Instagram Business User ID
              </label>
              <input
                type="text"
                value={creds.igUserId}
                onChange={e => setCreds(c => ({ ...c, igUserId: e.target.value }))}
                placeholder={connections?.instagramConnected ? "••••• (saved)" : "e.g. 987654321"}
                style={{
                  width: "100%", background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                  padding: "9px 12px", fontSize: 13, color: "#e4e4e7",
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: 10, color: "#3f3f46", marginTop: 4 }}>
                Get this from Business Suite → Instagram account settings
              </div>
            </div>
          </div>

          {/* X / Twitter */}
          <div style={{
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 14, padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <Twitter size={18} color="#e7e9ea" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>X / Twitter</div>
                <div style={{ fontSize: 11, color: "#52525b" }}>OAuth 1.0a — requires a Developer App</div>
              </div>
              {connections?.twitterConnected && (
                <div style={{ marginLeft: "auto", fontSize: 11, color: "#10b981", fontWeight: 600,
                  padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)",
                  border: "1px solid rgba(16,185,129,0.3)" }}>
                  Connected ✓
                </div>
              )}
            </div>

            <SecretInput label="API Key" value={creds.twitterApiKey}
              onChange={v => setCreds(c => ({ ...c, twitterApiKey: v }))}
              placeholder={connections?.twitterConnected ? "••••• (saved)" : "API Key from developer.twitter.com"} />
            <SecretInput label="API Secret" value={creds.twitterApiSecret}
              onChange={v => setCreds(c => ({ ...c, twitterApiSecret: v }))}
              placeholder={connections?.twitterConnected ? "••••• (saved)" : "API Secret"} />
            <SecretInput label="Access Token" value={creds.twitterAccessToken}
              onChange={v => setCreds(c => ({ ...c, twitterAccessToken: v }))}
              placeholder={connections?.twitterConnected ? "••••• (saved)" : "Access Token"} />
            <SecretInput label="Access Token Secret" value={creds.twitterAccessSecret}
              onChange={v => setCreds(c => ({ ...c, twitterAccessSecret: v }))}
              placeholder={connections?.twitterConnected ? "••••• (saved)" : "Access Token Secret"} />
          </div>

          <button
            onClick={saveCreds}
            disabled={savingCreds}
            style={{
              display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
              background: credsSaved ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
              color: "#fff", borderRadius: 10, padding: "10px 22px",
              fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
              boxShadow: "0 0 16px rgba(124,58,237,0.35)",
            }}
          >
            {savingCreds ? <Loader2 size={14} /> : credsSaved ? <Check size={14} /> : <Key size={14} />}
            {credsSaved ? "Saved!" : savingCreds ? "Saving..." : "Save Credentials"}
          </button>

          <div style={{
            padding: "14px 18px", borderRadius: 12,
            background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
          }}>
            <p style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600, marginBottom: 6 }}>How to get your credentials</p>
            <p style={{ fontSize: 11, color: "#3b5a8f", lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "#60a5fa" }}>Facebook/Instagram:</strong> Go to developers.facebook.com → My Apps → your app → Graph API Explorer.
              Generate a Page Access Token for your page. Find your Instagram Business User ID in Business Suite.
              <br /><br />
              <strong style={{ color: "#60a5fa" }}>Twitter/X:</strong> Go to developer.twitter.com → Projects & Apps → your app → Keys and tokens.
              You need API Key, API Secret, Access Token, and Access Token Secret with Read+Write permissions.
            </p>
          </div>
        </div>
      )}

      {/* ── SCHEDULE TAB ── */}
      {tab === "schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Enable toggle */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Auto-Post Schedule</div>
                <div style={{ fontSize: 12, color: "#52525b" }}>
                  Automatically generate and publish posts on a schedule. Requires connected platforms.
                </div>
              </div>
              <button
                onClick={() => setSchedule(s => ({ ...s, enabled: !s.enabled }))}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                  background: schedule.enabled ? "#10b981" : "rgba(255,255,255,0.1)",
                  position: "relative", transition: "background 0.2s", flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute", top: 3, left: schedule.enabled ? 24 : 3,
                  width: 20, height: 20, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }} />
              </button>
            </div>

            {schedule.enabled && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Frequency */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Frequency</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { value: "daily", label: "Daily" },
                      { value: "every2days", label: "Every 2 days" },
                      { value: "weekly", label: "Weekly" },
                    ].map(f => (
                      <button key={f.value} onClick={() => setSchedule(s => ({ ...s, frequency: f.value }))} style={{
                        padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
                        borderColor: schedule.frequency === f.value ? "#7c3aed" : "rgba(255,255,255,0.08)",
                        background: schedule.frequency === f.value ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                        color: schedule.frequency === f.value ? "#a78bfa" : "#71717a",
                      }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time + Timezone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Post Time</label>
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e4e4e7", outline: "none", boxSizing: "border-box" as const }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Timezone</label>
                    <select
                      value={schedule.timezone}
                      onChange={e => setSchedule(s => ({ ...s, timezone: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e4e4e7", outline: "none", boxSizing: "border-box" as const, cursor: "pointer" }}
                    >
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Asia/Kolkata">Mumbai (IST)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>

                {/* Platforms */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Platforms to auto-post to</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(Object.entries(PLATFORM_META) as [string, typeof PLATFORM_META[keyof typeof PLATFORM_META]][]).map(([pid, meta]) => {
                      const active = schedule.platforms.includes(pid);
                      const Icon = meta.icon;
                      return (
                        <button key={pid} onClick={() => setSchedule(s => ({
                          ...s,
                          platforms: active ? s.platforms.filter(p => p !== pid) : [...s.platforms, pid],
                        }))} style={{
                          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
                          borderColor: active ? meta.color + "60" : "rgba(255,255,255,0.08)",
                          background: active ? meta.bg : "rgba(255,255,255,0.03)",
                          color: active ? meta.color : "#52525b",
                        }}>
                          <Icon size={13} />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom topic */}
                <div style={{ marginBottom: 4 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    Topic <span style={{ color: "#3f3f46", fontWeight: 400, textTransform: "none" }}>(leave blank for AI-picked topics)</span>
                  </label>
                  <input
                    type="text"
                    value={schedule.topic}
                    onChange={e => setSchedule(s => ({ ...s, topic: e.target.value }))}
                    placeholder="e.g. AI automation tips for small business"
                    style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e4e4e7", outline: "none", boxSizing: "border-box" as const }}
                  />
                </div>

                {schedule.nextRun && (
                  <div style={{ marginTop: 12, fontSize: 11, color: "#52525b" }}>
                    Next auto-post: <span style={{ color: "#a78bfa" }}>{new Date(schedule.nextRun).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={saveSchedule}
            disabled={savingSchedule}
            style={{
              display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
              background: scheduleSaved ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#7c3aed,#6d28d9)",
              color: "#fff", borderRadius: 10, padding: "10px 22px", fontSize: 13, fontWeight: 700,
              border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(124,58,237,0.35)",
            }}
          >
            {savingSchedule ? <Loader2 size={14} /> : scheduleSaved ? <Check size={14} /> : <CalendarClock size={14} />}
            {scheduleSaved ? "Saved!" : savingSchedule ? "Saving..." : schedule.enabled ? "Save Schedule" : "Save (disabled)"}
          </button>

          <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600, marginBottom: 4 }}>How auto-scheduling works</p>
            <p style={{ fontSize: 11, color: "#52525b", lineHeight: 1.6, margin: 0 }}>
              When enabled, Aether uses AI to write a post about your chosen topic (or picks a relevant business topic automatically),
              generates an image (on paid plans), and publishes to all your connected platforms at the time you choose.
              Make sure your platform credentials are saved in the Connect Accounts tab first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
