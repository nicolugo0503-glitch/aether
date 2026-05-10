"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Share2, Sparkles, Send, Settings, History,
  CheckCircle2, XCircle, Clock, Loader2, Plus,
  Twitter, Instagram, Facebook, Key, Eye, EyeOff,
  RefreshCw, Image as ImageIcon, Copy, Check, CalendarClock,
  Zap, Globe, BarChart3,
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
  facebook:  { label: "Facebook",    icon: Facebook,  color: "#1877f2", bg: "#1877f212", glow: "rgba(24,119,242,0.3)" },
  instagram: { label: "Instagram",   icon: Instagram, color: "#e1306c", bg: "#e1306c12", glow: "rgba(225,48,108,0.3)" },
  x:         { label: "X / Twitter", icon: Twitter,   color: "#e7e9ea", bg: "#e7e9ea10", glow: "rgba(231,233,234,0.2)" },
} as const;

function statusBadge(status: string) {
  switch (status) {
    case "posted":  return { color: "#10b981", label: "Published", icon: CheckCircle2, bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  };
    case "partial": return { color: "#f59e0b", label: "Partial",   icon: CheckCircle2, bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)"  };
    case "error":   return { color: "#ef4444", label: "Failed",    icon: XCircle,      bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)"   };
    case "draft":   return { color: "#71717a", label: "Draft",     icon: Clock,        bg: "rgba(113,113,122,0.1)", border: "rgba(113,113,122,0.2)"  };
    default:        return { color: "#71717a", label: status,      icon: Clock,        bg: "rgba(113,113,122,0.1)", border: "rgba(113,113,122,0.2)"  };
  }
}

function SecretInput({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: "block", fontSize: 10, color: "#52525b", fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7,
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="social-input"
          style={{ paddingRight: 38 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#52525b", padding: 0,
            display: "flex", alignItems: "center",
          }}
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
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
      display: "flex", alignItems: "center", gap: 5,
      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 7, padding: "4px 10px", fontSize: 11, cursor: "pointer",
      color: copied ? "#10b981" : "#a1a1aa",
      transition: "all 0.15s ease",
    }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy"}
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

  const connectedPlatformCount =
    (connections?.facebookConnected ? 1 : 0) +
    (connections?.instagramConnected ? 1 : 0) +
    (connections?.twitterConnected ? 1 : 0);

  const TABS = [
    { id: "publish"  as const, label: "Generate & Publish", icon: Sparkles,     color: "#7c3aed" },
    { id: "history"  as const, label: "Post History",        icon: History,      color: "#10b981" },
    { id: "settings" as const, label: "Connect Accounts",    icon: Settings,     color: "#3b82f6" },
    { id: "schedule" as const, label: "Auto-Schedule",       icon: CalendarClock,color: "#f59e0b" },
  ];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <style>{`
        @keyframes social-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(16,185,129,0.5); }
          50% { opacity:0.7; box-shadow:0 0 0 5px rgba(16,185,129,0); }
        }
        @keyframes tab-glow {
          0%,100% { box-shadow: 0 0 12px rgba(124,58,237,0.3); }
          50% { box-shadow: 0 0 24px rgba(124,58,237,0.5); }
        }
        @keyframes shimmer-btn {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes draft-enter {
          from { opacity: 0; transform: translateY(10px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes result-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-loader {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes history-slide {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .social-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 10px;
          font-size: 12px; font-weight: 600; cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.18s ease;
          position: relative; white-space: nowrap;
        }
        .social-tab:hover { color: #d4d4d8 !important; background: rgba(255,255,255,0.04) !important; }
        .social-tab-active {
          border-color: rgba(124,58,237,0.35) !important;
          background: rgba(124,58,237,0.15) !important;
          color: #a78bfa !important;
          box-shadow: 0 0 16px rgba(124,58,237,0.2), inset 0 1px 0 rgba(124,58,237,0.15) !important;
        }
        .social-tab-active::after {
          content: "";
          position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
          width: 30px; height: 2px; border-radius: 999px;
          background: linear-gradient(90deg, #7c3aed, #a855f7);
          box-shadow: 0 0 8px rgba(124,58,237,0.6);
        }

        .social-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 10px;
          padding: 10px 14px;
          font-size: 13px;
          color: #e4e4e7;
          outline: none;
          box-sizing: border-box;
          display: block;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .social-input::placeholder { color: #3f3f46; }
        .social-input:focus {
          border-color: rgba(124,58,237,0.5);
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1), 0 0 16px rgba(124,58,237,0.08);
          background: rgba(124,58,237,0.04);
        }

        .platform-toggle {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          font-size: 12px; font-weight: 700;
          cursor: pointer; border: 1px solid;
          transition: all 0.18s ease;
        }
        .platform-toggle:hover { transform: translateY(-1px); }

        .tone-chip {
          padding: 5px 13px; border-radius: 20px; font-size: 11px; font-weight: 700;
          cursor: pointer; border: 1px solid; text-transform: capitalize;
          transition: all 0.15s ease;
        }

        .generate-btn, .publish-btn, .save-btn {
          display: flex; align-items: center; gap: 7px;
          border-radius: 11px; padding: 10px 20px;
          font-size: 13px; font-weight: 700;
          border: none; cursor: pointer; color: #fff;
          position: relative; overflow: hidden;
          transition: all 0.2s ease;
        }
        .generate-btn::after, .publish-btn::after, .save-btn::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .generate-btn:hover::after, .publish-btn:hover::after, .save-btn:hover::after {
          animation: shimmer-btn 0.5s ease forwards;
        }
        .generate-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.5) !important; }
        .publish-btn:hover  { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(16,185,129,0.5) !important; }
        .save-btn:hover     { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,58,237,0.5) !important; }
        .generate-btn:disabled, .publish-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

        .draft-card { animation: draft-enter 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .result-box { animation: result-in 0.3s ease both; }
        .history-item { animation: history-slide 0.35s ease both; }
        .history-item:nth-child(1) { animation-delay: 0.03s; }
        .history-item:nth-child(2) { animation-delay: 0.07s; }
        .history-item:nth-child(3) { animation-delay: 0.11s; }
        .history-item:nth-child(4) { animation-delay: 0.15s; }

        .cred-section {
          border-radius: 14px; overflow: hidden;
          background: rgba(255,255,255,0.022);
          border: 1px solid rgba(255,255,255,0.07);
        }
        .cred-header {
          display: flex; align-items: center; gap: 10px;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cred-body { padding: 18px; }

        .schedule-toggle-track {
          width: 48px; height: 26px; border-radius: 13px;
          border: none; cursor: pointer; position: relative;
          transition: background 0.25s ease;
          flex-shrink: 0;
        }
        .schedule-toggle-thumb {
          position: absolute; top: 3px;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff;
          transition: left 0.25s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16, animation: "social-in 0.4s ease both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}>
            <Share2 size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{
              fontSize: 24, fontWeight: 900, letterSpacing: "-0.5px",
              background: "linear-gradient(135deg, #fff 0%, #60a5fa 70%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              Social Media
            </h1>
            <p style={{ fontSize: 12, color: "#52525b", marginTop: 1 }}>
              {connectedPlatformCount} platform{connectedPlatformCount !== 1 ? "s" : ""} connected · AI-powered publishing
            </p>
          </div>
        </div>

        {/* Connected platform badges */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {connections?.facebookConnected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(24,119,242,0.1)", border: "1px solid rgba(24,119,242,0.3)",
              fontSize: 11, color: "#1877f2", fontWeight: 700,
              boxShadow: "0 0 12px rgba(24,119,242,0.15)",
            }}>
              <Facebook size={11} /> Facebook ✓
            </div>
          )}
          {connections?.instagramConnected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(225,48,108,0.1)", border: "1px solid rgba(225,48,108,0.3)",
              fontSize: 11, color: "#e1306c", fontWeight: 700,
              boxShadow: "0 0 12px rgba(225,48,108,0.15)",
            }}>
              <Instagram size={11} /> Instagram ✓
            </div>
          )}
          {connections?.twitterConnected && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "5px 12px", borderRadius: 20,
              background: "rgba(231,233,234,0.07)", border: "1px solid rgba(231,233,234,0.2)",
              fontSize: 11, color: "#e7e9ea", fontWeight: 700,
            }}>
              <Twitter size={11} /> X ✓
            </div>
          )}
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 4, marginBottom: 28,
        padding: "5px", borderRadius: 14,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        flexWrap: "wrap",
        animation: "social-in 0.4s ease 0.06s both",
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); if (t.id === "history") loadPosts(); }}
            className={`social-tab ${tab === t.id ? "social-tab-active" : ""}`}
            style={{
              color: tab === t.id ? "#a78bfa" : "#52525b",
              background: tab === t.id ? "rgba(124,58,237,0.15)" : "transparent",
              border: tab === t.id ? "1px solid rgba(124,58,237,0.35)" : "1px solid transparent",
              flex: 1,
            }}
          >
            <t.icon size={13} />
            {t.label}
            {t.id === "schedule" && schedule.enabled && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.6)", animation: "pulse-dot 2s ease infinite" }} />
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── PUBLISH TAB ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      {tab === "publish" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, animation: "social-in 0.4s ease both" }}>

          {/* No platforms warning */}
          {connectedPlatformCount === 0 && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              padding: "16px 20px", borderRadius: 14,
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.2)",
              boxShadow: "0 0 24px rgba(245,158,11,0.06)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Key size={16} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 3 }}>
                  No platforms connected
                </div>
                <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
                  Go to <button onClick={() => setTab("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e0b", fontWeight: 700, padding: 0, fontSize: "inherit" }}>Connect Accounts</button> to add Facebook, Instagram, or X credentials.
                  You can still generate posts — they just won&apos;t auto-publish.
                </div>
              </div>
            </div>
          )}

          {/* Compose card */}
          <div style={{
            borderRadius: 18, padding: "22px 24px",
            background: "rgba(255,255,255,0.022)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>
              What do you want to post about?
            </p>
            <textarea
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Our new AI automation tool just launched — share the excitement!"
              rows={3}
              className="social-input"
              style={{ resize: "vertical", marginBottom: 18 }}
            />

            {/* Tone selector */}
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Tone</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["professional", "casual", "witty", "inspirational", "urgent"].map(t => (
                  <button key={t} onClick={() => setTone(t)} className="tone-chip" style={{
                    borderColor: tone === t ? "#7c3aed" : "rgba(255,255,255,0.08)",
                    background: tone === t ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)",
                    color: tone === t ? "#a78bfa" : "#71717a",
                    boxShadow: tone === t ? "0 0 10px rgba(124,58,237,0.2)" : "none",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform selector */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Post to</p>
              <div style={{ display: "flex", gap: 8 }}>
                {(Object.entries(PLATFORM_META) as [string, typeof PLATFORM_META[keyof typeof PLATFORM_META]][]).map(([id, meta]) => {
                  const active = platforms.includes(id);
                  const Icon = meta.icon;
                  return (
                    <button key={id} onClick={() => togglePlatform(id)} className="platform-toggle" style={{
                      borderColor: active ? meta.color + "55" : "rgba(255,255,255,0.08)",
                      background: active ? meta.bg : "rgba(255,255,255,0.03)",
                      color: active ? meta.color : "#52525b",
                      boxShadow: active ? `0 0 14px ${meta.glow}` : "none",
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
              className="generate-btn"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                opacity: !topic.trim() ? 0.5 : 1,
              }}
            >
              {generating
                ? <Loader2 size={14} style={{ animation: "spin-loader 1s linear infinite" }} />
                : <Sparkles size={14} />}
              {generating ? "Generating..." : "Generate Post"}
            </button>
          </div>

          {/* Draft preview */}
          {draft && (
            <div className="draft-card" style={{
              borderRadius: 18, overflow: "hidden",
              background: "rgba(255,255,255,0.022)",
              border: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "0 0 40px rgba(124,58,237,0.1), inset 0 1px 0 rgba(124,58,237,0.08)",
            }}>
              {/* Draft header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: "1px solid rgba(124,58,237,0.15)",
                background: "linear-gradient(90deg, rgba(124,58,237,0.08) 0%, transparent 60%)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: "#7c3aed",
                    boxShadow: "0 0 8px rgba(124,58,237,0.8)",
                  }} />
                  <span style={{ fontSize: 11, color: "#7c3aed", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    AI-Generated Draft
                  </span>
                </div>
                <CopyButton text={`${draft.caption}\n\n${draft.hashtags}`} />
              </div>

              {/* Post content */}
              <div style={{ padding: "20px 22px" }}>
                {draft.imageUrl ? (
                  <img
                    src={draft.imageUrl}
                    alt="Generated"
                    style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 12, marginBottom: 16 }}
                  />
                ) : (
                  <div style={{
                    height: 72, borderRadius: 12, marginBottom: 16,
                    background: "rgba(124,58,237,0.06)", border: "1px dashed rgba(124,58,237,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <ImageIcon size={15} color="#3f3f46" />
                    <span style={{ fontSize: 11, color: "#3f3f46" }}>No image — upgrade to Pro for AI image generation</span>
                  </div>
                )}

                <p style={{ fontSize: 14, color: "#d4d4d8", lineHeight: 1.65, marginBottom: 10 }}>
                  {draft.caption}
                </p>
                <p style={{ fontSize: 13, color: "#7c3aed", fontWeight: 500 }}>{draft.hashtags}</p>

                {/* Platform targets */}
                <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                  {(JSON.parse(draft.platforms || "[]") as string[]).map(p => {
                    const pm = PLATFORM_META[p as keyof typeof PLATFORM_META];
                    if (!pm) return null;
                    const PIcon = pm.icon;
                    return (
                      <div key={p} style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                        background: pm.bg, color: pm.color,
                        border: `1px solid ${pm.color}30`,
                      }}>
                        <PIcon size={9} /> {pm.label}
                      </div>
                    );
                  })}
                </div>

                {/* CTA row */}
                <div style={{ display: "flex", gap: 10, marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <button
                    onClick={publish}
                    disabled={publishing || connectedPlatformCount === 0}
                    className="publish-btn"
                    style={{
                      background: "linear-gradient(135deg,#10b981,#059669)",
                      boxShadow: "0 0 20px rgba(16,185,129,0.4)",
                      opacity: connectedPlatformCount === 0 ? 0.5 : 1,
                    }}
                  >
                    {publishing
                      ? <Loader2 size={13} style={{ animation: "spin-loader 1s linear infinite" }} />
                      : <Send size={13} />}
                    {publishing ? "Publishing..." : "Publish Now"}
                  </button>
                  <button onClick={generate} disabled={generating} className="generate-btn" style={{
                    background: "rgba(255,255,255,0.06)", boxShadow: "none",
                    border: "1px solid rgba(255,255,255,0.09)", color: "#a1a1aa",
                  }}>
                    <RefreshCw size={13} />
                    Regenerate
                  </button>
                </div>

                {/* Publish result */}
                {publishResult && (
                  <div className="result-box" style={{
                    marginTop: 14, padding: "13px 16px", borderRadius: 11,
                    background: (publishResult.errors?.length ?? 0) === 0 && Object.keys(publishResult.results || {}).length > 0
                      ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${(publishResult.errors?.length ?? 0) === 0 && Object.keys(publishResult.results || {}).length > 0
                      ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                  }}>
                    {Object.entries(publishResult.results || {}).map(([platform, id]) => (
                      <div key={platform} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", marginBottom: 3 }}>
                        <CheckCircle2 size={11} />
                        Posted to {platform} · ID: <span style={{ fontFamily: "monospace", fontSize: 10 }}>{id}</span>
                      </div>
                    ))}
                    {(publishResult.errors || []).map((e, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#ef4444", marginBottom: 3 }}>
                        <XCircle size={11} style={{ marginTop: 1, flexShrink: 0 }} />
                        {e}
                      </div>
                    ))}
                    {Object.keys(publishResult.results || {}).length === 0 && (publishResult.errors || []).length === 0 && (
                      <div style={{ fontSize: 12, color: "#71717a" }}>No platforms had credentials to post to.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── HISTORY TAB ─────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      {tab === "history" && (
        <div style={{ animation: "social-in 0.4s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
              <span style={{ fontSize: 11, color: "#52525b" }}>in your history</span>
            </div>
            <button onClick={loadPosts} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 9,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#71717a", fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s ease",
            }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {loadingPosts ? (
            <div style={{ textAlign: "center", padding: "52px 0" }}>
              <Loader2 size={22} color="#52525b" style={{ margin: "0 auto 10px", animation: "spin-loader 1s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#52525b" }}>Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "52px 24px",
              background: "rgba(255,255,255,0.018)", borderRadius: 18,
              border: "1px dashed rgba(255,255,255,0.06)",
            }}>
              <History size={28} color="#3f3f46" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 600, marginBottom: 4 }}>No posts yet</p>
              <p style={{ fontSize: 12, color: "#52525b" }}>Generate and publish your first post.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {posts.map((post, idx) => {
                const badge       = statusBadge(post.status);
                const BadgeIcon   = badge.icon;
                const postPlatforms: string[] = JSON.parse(post.platforms || "[]");
                const leftColor   = post.status === "posted" ? "#10b981" : post.status === "partial" ? "#f59e0b" : post.status === "error" ? "#ef4444" : "#3f3f46";
                return (
                  <div key={post.id} className="history-item" style={{
                    borderRadius: 14, overflow: "hidden",
                    background: "rgba(255,255,255,0.022)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    animationDelay: `${idx * 0.04}s`,
                  }}>
                    {/* Status left accent bar */}
                    <div style={{ width: 3, flexShrink: 0, background: `linear-gradient(180deg, ${leftColor}, ${leftColor}44)` }} />

                    <div style={{ flex: 1, padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3 }}>{post.topic}</div>
                          <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5, marginBottom: 4 }}>
                            {post.caption.slice(0, 130)}{post.caption.length > 130 ? "…" : ""}
                          </p>
                          <p style={{ fontSize: 11, color: "#7c3aed", fontWeight: 500 }}>{post.hashtags.slice(0, 60)}</p>
                        </div>
                        {post.imageUrl && (
                          <img src={post.imageUrl} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        {/* Status badge */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                        }}>
                          <BadgeIcon size={10} />
                          {badge.label}
                        </div>

                        {/* Platform chips */}
                        {postPlatforms.map(p => {
                          const pm = PLATFORM_META[p as keyof typeof PLATFORM_META];
                          if (!pm) return null;
                          const PIcon = pm.icon;
                          return (
                            <div key={p} style={{
                              display: "flex", alignItems: "center", gap: 4,
                              padding: "3px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                              background: pm.bg, color: pm.color,
                            }}>
                              <PIcon size={9} /> {pm.label}
                            </div>
                          );
                        })}

                        <span style={{ fontSize: 10, color: "#3f3f46", marginLeft: "auto" }}>
                          {post.postedAt
                            ? new Date(post.postedAt).toLocaleDateString()
                            : new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {post.error && (
                        <div style={{
                          marginTop: 9, fontSize: 11, color: "#ef4444",
                          padding: "6px 10px", background: "rgba(239,68,68,0.07)", borderRadius: 7,
                        }}>
                          ⚠ {post.error}
                        </div>
                      )}

                      <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                        <CopyButton text={`${post.caption}\n\n${post.hashtags}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── SETTINGS TAB ────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "social-in 0.4s ease both" }}>

          {/* Facebook + Instagram */}
          <div className="cred-section">
            <div className="cred-header" style={{
              background: "linear-gradient(90deg, rgba(24,119,242,0.08) 0%, transparent 60%)",
              borderBottom: "1px solid rgba(24,119,242,0.15)",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "rgba(24,119,242,0.12)", border: "1px solid rgba(24,119,242,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 12px rgba(24,119,242,0.15)",
              }}>
                <Facebook size={16} color="#1877f2" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Facebook & Instagram</div>
                <div style={{ fontSize: 11, color: "#52525b" }}>Meta Graph API — same token for both platforms</div>
              </div>
              {connections?.facebookConnected && (
                <div style={{
                  marginLeft: "auto", fontSize: 10, color: "#10b981", fontWeight: 700,
                  padding: "3px 10px", borderRadius: 20,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                }}>
                  Connected ✓
                </div>
              )}
            </div>
            <div className="cred-body">
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 10, color: "#52525b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
                  Facebook Page ID
                </label>
                <input
                  type="text"
                  value={creds.fbPageId}
                  onChange={e => setCreds(c => ({ ...c, fbPageId: e.target.value }))}
                  placeholder={connections?.facebookConnected ? "••••• (saved)" : "e.g. 123456789012345"}
                  className="social-input"
                />
              </div>
              <SecretInput
                label="Page Access Token"
                value={creds.fbPageToken}
                onChange={v => setCreds(c => ({ ...c, fbPageToken: v }))}
                placeholder={connections?.facebookConnected ? "••••• (saved)" : "EAA..."}
              />
              <div>
                <label style={{ display: "block", fontSize: 10, color: "#52525b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 7 }}>
                  Instagram Business User ID
                </label>
                <input
                  type="text"
                  value={creds.igUserId}
                  onChange={e => setCreds(c => ({ ...c, igUserId: e.target.value }))}
                  placeholder={connections?.instagramConnected ? "••••• (saved)" : "e.g. 987654321"}
                  className="social-input"
                />
                <p style={{ fontSize: 10, color: "#3f3f46", marginTop: 6 }}>
                  Find this in Meta Business Suite → Instagram account settings
                </p>
              </div>
            </div>
          </div>

          {/* X / Twitter */}
          <div className="cred-section">
            <div className="cred-header" style={{
              background: "linear-gradient(90deg, rgba(231,233,234,0.05) 0%, transparent 60%)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Twitter size={16} color="#e7e9ea" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>X / Twitter</div>
                <div style={{ fontSize: 11, color: "#52525b" }}>OAuth 1.0a — requires a Developer App</div>
              </div>
              {connections?.twitterConnected && (
                <div style={{
                  marginLeft: "auto", fontSize: 10, color: "#10b981", fontWeight: 700,
                  padding: "3px 10px", borderRadius: 20,
                  background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
                }}>
                  Connected ✓
                </div>
              )}
            </div>
            <div className="cred-body">
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
          </div>

          {/* Save button */}
          <button
            onClick={saveCreds}
            disabled={savingCreds}
            className="save-btn"
            style={{
              background: credsSaved
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "linear-gradient(135deg,#7c3aed,#6d28d9)",
              boxShadow: credsSaved
                ? "0 0 20px rgba(16,185,129,0.4)"
                : "0 0 20px rgba(124,58,237,0.4)",
              alignSelf: "flex-start",
            }}
          >
            {savingCreds ? <Loader2 size={14} style={{ animation: "spin-loader 1s linear infinite" }} /> : credsSaved ? <Check size={14} /> : <Key size={14} />}
            {credsSaved ? "Saved!" : savingCreds ? "Saving..." : "Save Credentials"}
          </button>

          {/* Help box */}
          <div style={{
            padding: "14px 18px", borderRadius: 12,
            background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)",
          }}>
            <p style={{ fontSize: 12, color: "#60a5fa", fontWeight: 700, marginBottom: 6 }}>How to get your credentials</p>
            <p style={{ fontSize: 11, color: "#3b5a8f", lineHeight: 1.65, margin: 0 }}>
              <strong style={{ color: "#60a5fa" }}>Facebook / Instagram:</strong> Go to developers.facebook.com → My Apps → your app → Graph API Explorer.
              Generate a Page Access Token. Find your Instagram Business User ID in Business Suite.
              <br /><br />
              <strong style={{ color: "#60a5fa" }}>Twitter / X:</strong> Go to developer.twitter.com → Projects & Apps → Keys and tokens.
              You need API Key, API Secret, Access Token, and Access Token Secret with Read + Write permissions.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ── SCHEDULE TAB ────────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════ */}
      {tab === "schedule" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "social-in 0.4s ease both" }}>
          <div style={{
            borderRadius: 18, padding: "20px 22px",
            background: "rgba(255,255,255,0.022)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {/* Toggle row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Auto-Post Schedule</div>
                <div style={{ fontSize: 12, color: "#52525b" }}>
                  Automatically generate and publish posts on a recurring schedule.
                </div>
              </div>
              <button
                onClick={() => setSchedule(s => ({ ...s, enabled: !s.enabled }))}
                className="schedule-toggle-track"
                style={{ background: schedule.enabled ? "#10b981" : "rgba(255,255,255,0.1)" }}
              >
                <span className="schedule-toggle-thumb" style={{ left: schedule.enabled ? 24 : 3 }} />
              </button>
            </div>

            {schedule.enabled && (
              <div style={{ marginTop: 22, paddingTop: 22, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {/* Frequency */}
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Frequency</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[
                      { value: "daily",     label: "Daily" },
                      { value: "every2days",label: "Every 2 days" },
                      { value: "weekly",    label: "Weekly" },
                    ].map(f => (
                      <button key={f.value} onClick={() => setSchedule(s => ({ ...s, frequency: f.value }))} style={{
                        padding: "7px 16px", borderRadius: 9, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", border: "1px solid",
                        borderColor: schedule.frequency === f.value ? "#7c3aed" : "rgba(255,255,255,0.08)",
                        background: schedule.frequency === f.value ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.03)",
                        color: schedule.frequency === f.value ? "#a78bfa" : "#71717a",
                        transition: "all 0.15s ease",
                        boxShadow: schedule.frequency === f.value ? "0 0 10px rgba(124,58,237,0.2)" : "none",
                      }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time + Timezone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Post Time</p>
                    <input type="time" value={schedule.time}
                      onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))}
                      className="social-input" />
                  </div>
                  <div>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Timezone</p>
                    <select value={schedule.timezone}
                      onChange={e => setSchedule(s => ({ ...s, timezone: e.target.value }))}
                      className="social-input" style={{ cursor: "pointer" }}>
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
                <div style={{ marginBottom: 18 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 10 }}>Platforms to auto-post to</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(Object.entries(PLATFORM_META) as [string, typeof PLATFORM_META[keyof typeof PLATFORM_META]][]).map(([pid, meta]) => {
                      const active = schedule.platforms.includes(pid);
                      const Icon = meta.icon;
                      return (
                        <button key={pid} onClick={() => setSchedule(s => ({
                          ...s,
                          platforms: active ? s.platforms.filter(p => p !== pid) : [...s.platforms, pid],
                        }))} className="platform-toggle" style={{
                          borderColor: active ? meta.color + "55" : "rgba(255,255,255,0.08)",
                          background: active ? meta.bg : "rgba(255,255,255,0.03)",
                          color: active ? meta.color : "#52525b",
                          boxShadow: active ? `0 0 12px ${meta.glow}` : "none",
                        }}>
                          <Icon size={13} />
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Topic */}
                <div style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
                    Topic <span style={{ fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>(leave blank for AI-picked topics)</span>
                  </p>
                  <input type="text" value={schedule.topic}
                    onChange={e => setSchedule(s => ({ ...s, topic: e.target.value }))}
                    placeholder="e.g. AI automation tips for small business"
                    className="social-input" />
                </div>

                {schedule.nextRun && (
                  <div style={{ fontSize: 11, color: "#52525b", marginTop: 8 }}>
                    Next auto-post: <span style={{ color: "#a78bfa", fontWeight: 600 }}>{new Date(schedule.nextRun).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={saveSchedule}
            disabled={savingSchedule}
            className="save-btn"
            style={{
              alignSelf: "flex-start",
              background: scheduleSaved
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "linear-gradient(135deg,#7c3aed,#6d28d9)",
              boxShadow: scheduleSaved
                ? "0 0 20px rgba(16,185,129,0.4)"
                : "0 0 20px rgba(124,58,237,0.4)",
            }}
          >
            {savingSchedule ? <Loader2 size={14} style={{ animation: "spin-loader 1s linear infinite" }} /> : scheduleSaved ? <Check size={14} /> : <CalendarClock size={14} />}
            {scheduleSaved ? "Saved!" : savingSchedule ? "Saving..." : schedule.enabled ? "Save Schedule" : "Save (disabled)"}
          </button>

          {/* Info box */}
          <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <p style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>How auto-scheduling works</p>
            <p style={{ fontSize: 11, color: "#52525b", lineHeight: 1.65, margin: 0 }}>
              When enabled, Aether uses AI to write a post about your chosen topic (or picks a relevant business topic automatically),
              generates an image on paid plans, and publishes to all connected platforms at the time you choose.
              Make sure your credentials are saved in Connect Accounts first.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
