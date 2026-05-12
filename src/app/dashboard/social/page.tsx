"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Share2, Sparkles, Send, Settings, History,
  CheckCircle2, XCircle, Clock, Loader2, Plus,
  Twitter, Instagram, Facebook, Key, Eye, EyeOff,
  RefreshCw, Image as ImageIcon, Copy, Check, CalendarClock,
  Zap, Globe, BarChart3,
} from "lucide-react";

/* ─── Types ─── */
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

/* ─── Constants ─── */
const ACCENT  = "#0ea5e9";
const ACCENT2 = "#38bdf8";
const ACCENT3 = "#7dd3fc";

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

/* ─── ChromaticNumber ─── */
function ChromaticNumber({ value, color }: { value: string; color: string }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span style={{ position: "absolute", top: 0, left: "-0.5px", color: "#ff0033", filter: "blur(0.7px)", opacity: 0.7, fontWeight: "inherit", fontSize: "inherit" }} aria-hidden>{value}</span>
      <span style={{ position: "absolute", top: 0, left: "0.5px",  color: "#00ffee", filter: "blur(0.7px)", opacity: 0.7, fontWeight: "inherit", fontSize: "inherit" }} aria-hidden>{value}</span>
      <span style={{ color, position: "relative" }}>{value}</span>
    </div>
  );
}

/* ─── MiniWave ─── */
function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function MiniWave({ color, seed }: { color: string; seed: number }) {
  const heights = Array.from({ length: 16 }, (_, i) => 30 + (seedHash(`${seed}-${i}`) % 100));
  return (
    <svg viewBox="0 0 160 60" style={{ width: "100%", height: 20 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`gsoc-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.8" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>
      {heights.map((h, i) => (
        <rect key={i} x={i * 10} y={60 - h} width="8" height={h} fill={`url(#gsoc-${seed})`}>
          <animate attributeName="height" values={`${h};${h * 1.3};${h * 0.7};${h}`} dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="y" values={`${60 - h};${60 - h * 1.3};${60 - h * 0.7};${60 - h}`} dur="2.4s" repeatCount="indefinite" />
        </rect>
      ))}
    </svg>
  );
}

/* ─── Signal Bars ─── */
function SignalBars({ active, color }: { active: boolean; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 12, flexShrink: 0 }}>
      {[4, 7, 10].map((h, i) => (
        <div key={i} style={{
          width: 3, height: active ? h : h * 0.35, borderRadius: 2,
          background: active ? color : "rgba(255,255,255,0.15)",
          boxShadow: active ? `0 0 4px ${color}` : "none",
          transition: `height 0.3s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s, background 0.2s ease`,
        }} />
      ))}
    </div>
  );
}

/* ─── Publish Ripple ─── */
function PublishRipple() {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "inherit", zIndex: 20 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 0, height: 0, borderRadius: "50%",
          border: "2px solid rgba(16,185,129,0.8)",
          animation: `broadcast-ripple 1.5s ease-out ${i * 0.35}s forwards`,
        }} />
      ))}
    </div>
  );
}

/* ─── SecretInput ─── */
function SecretInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 9, color: "#52525b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="soc-input"
          style={{ paddingRight: 38 }}
        />
        <button type="button" onClick={() => setShow(s => !s)} style={{
          position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: "#52525b", padding: 0, display: "flex", alignItems: "center",
        }}>
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>
    </div>
  );
}

/* ─── CopyButton ─── */
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
      color: copied ? "#10b981" : "#a1a1aa", transition: "all 0.15s ease",
    }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/* ─── Phone Mockup ─── */
function PhoneMockup({ draft, platforms }: { draft: SocialPost; platforms: string[] }) {
  const primaryPlatform = platforms.includes("instagram") ? "instagram" : platforms.includes("facebook") ? "facebook" : "x";
  const pm = PLATFORM_META[primaryPlatform as keyof typeof PLATFORM_META];
  const PIcon = pm.icon;
  const caption = draft.caption.length > 120 ? draft.caption.slice(0, 120) + "…" : draft.caption;
  const hashtags = draft.hashtags.split(" ").slice(0, 4).join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.12em" }}>
        Preview · {pm.label}
      </div>
      <div style={{
        width: 210, borderRadius: 36,
        background: "#0a0a0a",
        border: "2px solid rgba(255,255,255,0.12)",
        boxShadow: `0 0 0 1px rgba(0,0,0,0.8), 0 40px 80px rgba(0,0,0,0.7), 0 0 40px ${pm.glow}`,
        overflow: "hidden", position: "relative",
      }}>
        {/* Notch */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: 8, paddingBottom: 4, background: "#0a0a0a", position: "relative", zIndex: 2 }}>
          <div style={{ width: 72, height: 18, borderRadius: "0 0 12px 12px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#333" }} />
            <div style={{ width: 10, height: 4, borderRadius: 999, background: "#333" }} />
          </div>
        </div>
        {/* Status bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 14px 6px", fontSize: 8, color: "#888", fontWeight: 700 }}>
          <span>9:41</span>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <SignalBars active color="#888" />
            <span>100%</span>
          </div>
        </div>
        {/* Platform chrome */}
        <div style={{ padding: "8px 12px", borderBottom: `1px solid ${pm.color}22`, background: primaryPlatform === "x" ? "#000" : "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg, ${pm.color}, ${pm.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <PIcon size={10} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>aether.ai</div>
            <div style={{ fontSize: 7, color: "#555" }}>{primaryPlatform === "instagram" ? "SPONSORED · " : ""}now</div>
          </div>
          {primaryPlatform === "instagram" && (
            <div style={{ fontSize: 7, fontWeight: 800, color: pm.color, border: `1px solid ${pm.color}`, borderRadius: 4, padding: "2px 5px" }}>Follow</div>
          )}
          {primaryPlatform === "x" && <div style={{ fontSize: 18, color: "#fff" }}>𝕏</div>}
        </div>
        {/* Post content */}
        <div style={{ background: primaryPlatform === "x" ? "#000" : "#0a0a0a" }}>
          {draft.imageUrl ? (
            <img src={draft.imageUrl} alt="Post" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", aspectRatio: "1", background: `linear-gradient(135deg, ${pm.color}15, ${pm.color}05)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <PIcon size={28} color={`${pm.color}44`} />
              <span style={{ fontSize: 7, color: "#333", textAlign: "center", padding: "0 10px" }}>Upgrade to Pro for AI images</span>
            </div>
          )}
          {primaryPlatform === "instagram" && (
            <div style={{ padding: "6px 10px 4px", display: "flex", gap: 10, alignItems: "center" }}>
              {["♥", "💬", "↗"].map((icon, i) => <span key={i} style={{ fontSize: 14, cursor: "pointer" }}>{icon}</span>)}
            </div>
          )}
          <div style={{ padding: primaryPlatform === "instagram" ? "4px 10px 10px" : "8px 10px" }}>
            {primaryPlatform !== "x" && <span style={{ fontSize: 8, fontWeight: 800, color: "#fff", marginRight: 4 }}>aether.ai</span>}
            {primaryPlatform === "x" && (
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: `linear-gradient(135deg, ${pm.color}, #333)`, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#fff" }}>Aether AI</div>
                  <div style={{ fontSize: 7, color: "#555" }}>@aether_ai · now</div>
                </div>
              </div>
            )}
            <span style={{ fontSize: 8, color: "#ccc", lineHeight: 1.4 }}>{caption}</span>
            {hashtags && <div style={{ fontSize: 7, color: pm.color, marginTop: 3, opacity: 0.8 }}>{hashtags}</div>}
          </div>
          {primaryPlatform === "x" && (
            <div style={{ padding: "4px 10px 10px", display: "flex", gap: 14, alignItems: "center" }}>
              {["💬", "🔁", "♥", "↗"].map((icon, i) => <span key={i} style={{ fontSize: 11 }}>{icon}</span>)}
            </div>
          )}
          {primaryPlatform === "facebook" && (
            <div style={{ padding: "6px 10px 8px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-around", fontSize: 7, color: "#555", fontWeight: 600 }}>
              {["👍 Like", "💬 Comment", "↗ Share"].map(a => <span key={a}>{a}</span>)}
            </div>
          )}
        </div>
        {/* Home indicator */}
        <div style={{ padding: "8px", display: "flex", justifyContent: "center", background: "#0a0a0a" }}>
          <div style={{ width: 40, height: 3, borderRadius: 999, background: "rgba(255,255,255,0.2)" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        {(Object.keys(PLATFORM_META) as (keyof typeof PLATFORM_META)[]).filter(pid => platforms.includes(pid)).map(pid => {
          const meta = PLATFORM_META[pid];
          const MIcon = meta.icon;
          return (
            <div key={pid} style={{ width: 20, height: 20, borderRadius: "50%", background: meta.bg, border: `1px solid ${meta.color}44`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MIcon size={9} color={meta.color} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Schedule type ─── */
type ScheduleConfig = {
  enabled: boolean;
  time: string;
  timezone: string;
  frequency: string;
  topic: string;
  platforms: string[];
  nextRun: string | null;
};

/* ══════════════════════════════════════════════════════════════ */
export default function SocialPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tab, setTab] = useState<"publish" | "history" | "settings" | "schedule">("publish");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("professional");
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<SocialPost | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishRipple, setPublishRipple] = useState(false);
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

  /* ─── Neural canvas ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = 0, H = 0;
    const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
    let raf = 0;
    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < 55; i++) {
      nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 });
    }
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = m.x - n.x, dy = m.y - n.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y);
            ctx.strokeStyle = `rgba(14,165,233,${(1 - d / 140) * 0.3})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(56,189,248,0.7)";
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ─── Parallax ─── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const rx = (e.clientY / window.innerHeight - 0.5) * 7;
      const ry = (e.clientX / window.innerWidth  - 0.5) * 7;
      document.querySelectorAll<HTMLElement>(".holo3d-soc").forEach(el => {
        el.style.transform = `perspective(1000px) rotateX(${-rx}deg) rotateY(${ry}deg)`;
      });
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  /* ─── Data fetchers ─── */
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

  const togglePlatform = (id: string) =>
    setPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const generate = async () => {
    if (!topic.trim()) return;
    setGenerating(true); setDraft(null); setPublishResult(null);
    try {
      const res = await fetch("/api/social/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), tone, platforms }),
      });
      const data = await res.json();
      if (data.post) setDraft(data.post);
    } catch {}
    setGenerating(false);
  };

  const publish = async () => {
    if (!draft) return;
    setPublishing(true); setPublishResult(null); setPublishRipple(true);
    setTimeout(() => setPublishRipple(false), 2000);
    try {
      const res = await fetch("/api/social/post", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: draft.id }),
      });
      const data = await res.json();
      setPublishResult(data);
      if (data.success) loadPosts();
    } catch {}
    setPublishing(false);
  };

  const saveSchedule = async () => {
    setSavingSchedule(true);
    try {
      await fetch("/api/social/schedule", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      setScheduleSaved(true); loadSchedule();
      setTimeout(() => setScheduleSaved(false), 3000);
    } catch {}
    setSavingSchedule(false);
  };

  const saveCreds = async () => {
    setSavingCreds(true);
    try {
      await fetch("/api/settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      setCredsSaved(true); loadConnections();
      setTimeout(() => setCredsSaved(false), 3000);
    } catch {}
    setSavingCreds(false);
  };

  const connectedPlatformCount =
    (connections?.facebookConnected ? 1 : 0) +
    (connections?.instagramConnected ? 1 : 0) +
    (connections?.twitterConnected ? 1 : 0);

  const TABS = [
    { id: "publish"  as const, label: "Generate & Publish", icon: Sparkles,      color: ACCENT  },
    { id: "history"  as const, label: "Post History",        icon: History,       color: "#10b981" },
    { id: "settings" as const, label: "Connect Accounts",    icon: Settings,      color: "#3b82f6" },
    { id: "schedule" as const, label: "Auto-Schedule",       icon: CalendarClock, color: "#f59e0b" },
  ];

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", position: "relative" }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @property --ang-soc {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes spin-ang-soc {
          to { --ang-soc: 360deg; }
        }
        @keyframes drift-soc {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(40px,-30px) scale(1.08); }
          66%  { transform: translate(-25px,20px) scale(0.95); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes soc-in {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes soc-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes pulse-soc {
          0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(14,165,233,0.5); }
          50%      { opacity:0.7; box-shadow:0 0 0 6px rgba(14,165,233,0); }
        }
        @keyframes shimmer-soc {
          0%   { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(300%) skewX(-12deg); }
        }
        @keyframes spin-loader {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes broadcast-ripple {
          0%   { width: 0; height: 0; opacity: 1; border-width: 3px; }
          100% { width: 300px; height: 300px; opacity: 0; border-width: 1px; }
        }
        @keyframes history-slide {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes generating-pulse {
          0%,100% { box-shadow: 0 0 20px rgba(14,165,233,0.3); }
          50%      { box-shadow: 0 0 40px rgba(14,165,233,0.6), 0 0 60px rgba(14,165,233,0.2); }
        }
        @keyframes status-blink {
          0%,100% { opacity:1; }
          50%      { opacity:0.3; }
        }

        /* ── Conic spinning card ── */
        .soc-card {
          position: relative; border-radius: 18px; padding: 1px;
          background-image: conic-gradient(from var(--ang-soc), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, #bae6fd, ${ACCENT});
          animation: spin-ang-soc 6s linear infinite;
          transition: box-shadow 0.3s ease;
        }
        .soc-card:hover { box-shadow: 0 0 50px ${ACCENT}33; }
        .soc-card::before {
          content: ''; position: absolute; inset: 1px; border-radius: 17px;
          background: linear-gradient(135deg, rgba(10,14,39,0.95), rgba(8,18,38,0.95));
          pointer-events: none; z-index: 0;
        }
        .soc-card-inner { position: relative; z-index: 1; }

        /* ── Holo3d ── */
        .holo3d-soc {
          transform-style: preserve-3d;
          transition: transform 0.08s ease-out;
          will-change: transform;
        }

        /* ── Tab bar ── */
        .soc-tab {
          display: flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 10px;
          font-size: 12px; font-weight: 700; cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s ease; position: relative; white-space: nowrap; overflow: hidden;
          flex: 1;
        }
        .soc-tab:hover { color: #d4d4d8 !important; background: rgba(255,255,255,0.05) !important; }
        .soc-tab-active {
          border-color: ${ACCENT}44 !important;
          background: ${ACCENT}16 !important;
          color: ${ACCENT3} !important;
        }
        .soc-tab-active::after {
          content: ""; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%);
          width: 30px; height: 2px; border-radius: 999px;
          background: linear-gradient(90deg, ${ACCENT}, ${ACCENT2});
          box-shadow: 0 0 10px ${ACCENT}cc;
        }
        .soc-tab::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .soc-tab:hover::before { animation: shimmer-soc 0.5s ease forwards; }

        /* ── Inputs ── */
        .soc-input {
          width: 100%; background: rgba(6,6,16,0.8);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
          padding: 10px 14px; font-size: 13px; color: #e4e4e7;
          outline: none; box-sizing: border-box; display: block; font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .soc-input::placeholder { color: #3f3f46; }
        .soc-input:focus {
          border-color: ${ACCENT}88;
          box-shadow: 0 0 0 3px ${ACCENT}18, 0 0 20px ${ACCENT}10;
          background: rgba(4,16,30,0.8);
        }

        /* ── Platform toggle ── */
        .platform-toggle {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 10px;
          font-size: 12px; font-weight: 800; cursor: pointer; border: 1px solid;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1); position: relative; overflow: hidden;
        }
        .platform-toggle:hover { transform: translateY(-2px) scale(1.02); }
        .platform-toggle::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .platform-toggle:hover::before { animation: shimmer-soc 0.5s ease forwards; }

        /* ── Tone chip ── */
        .tone-chip {
          padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700;
          cursor: pointer; border: 1px solid; text-transform: capitalize;
          transition: all 0.15s ease;
        }
        .tone-chip:hover { transform: translateY(-1px); }

        /* ── Action buttons ── */
        .generate-btn, .publish-btn, .soc-save-btn {
          display: flex; align-items: center; gap: 8px;
          border-radius: 12px; padding: 11px 22px;
          font-size: 13px; font-weight: 800; border: none; cursor: pointer; color: #fff;
          position: relative; overflow: hidden; transition: all 0.2s ease; letter-spacing: 0.01em;
        }
        .generate-btn::after, .publish-btn::after, .soc-save-btn::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: translateX(-100%) skewX(-12deg);
        }
        .generate-btn:hover::after, .publish-btn:hover::after, .soc-save-btn:hover::after { animation: shimmer-soc 0.5s ease forwards; }
        .generate-btn:hover  { transform: translateY(-2px); box-shadow: 0 8px 30px ${ACCENT}55 !important; }
        .publish-btn:hover   { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(16,185,129,0.55) !important; }
        .soc-save-btn:hover  { transform: translateY(-2px); box-shadow: 0 8px 30px ${ACCENT}55 !important; }
        .generate-btn:disabled, .publish-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none !important; }

        .generating-active { animation: generating-pulse 1.5s ease-in-out infinite; }
        .history-item { animation: history-slide 0.35s ease both; }
        .history-item:nth-child(1) { animation-delay: 0.03s; }
        .history-item:nth-child(2) { animation-delay: 0.07s; }
        .history-item:nth-child(3) { animation-delay: 0.11s; }
        .history-item:nth-child(4) { animation-delay: 0.15s; }

        /* ── Cred section ── */
        .cred-section {
          position: relative; border-radius: 16px; padding: 1px;
          background-image: conic-gradient(from var(--ang-soc), ${ACCENT}99, ${ACCENT2}99, ${ACCENT}99);
          animation: spin-ang-soc 8s linear infinite;
        }
        .cred-section::before {
          content: ''; position: absolute; inset: 1px; border-radius: 15px;
          background: linear-gradient(135deg, rgba(10,14,39,0.97), rgba(8,18,38,0.97));
          z-index: 0;
        }
        .cred-section-inner { position: relative; z-index: 1; }
        .cred-header {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .cred-body { padding: 20px; }

        /* ── Schedule toggle ── */
        .schedule-toggle-track {
          width: 50px; height: 28px; border-radius: 14px; border: none; cursor: pointer;
          position: relative; transition: background 0.25s ease; flex-shrink: 0;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
        }
        .schedule-toggle-thumb {
          position: absolute; top: 4px;
          width: 20px; height: 20px; border-radius: 50%; background: #fff;
          transition: left 0.25s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        /* ── Nav strip ── */
        .soc-nav-strip {
          display: flex; gap: 6px; flex-wrap: wrap;
          padding: 14px 18px; border-radius: 14px;
          background: rgba(8,10,28,0.9);
          border: 1px solid rgba(255,255,255,0.06);
          margin-top: 28px;
        }
        .soc-nav-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 10px;
          font-size: 11px; font-weight: 700;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          color: #52525b; cursor: pointer; text-decoration: none;
          transition: all 0.15s ease;
        }
        .soc-nav-btn:hover {
          background: ${ACCENT}18; border-color: ${ACCENT}33; color: ${ACCENT3};
        }

        /* ── Stat grid ── */
        .soc-stat-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px; margin-bottom: 24px;
        }
        .soc-stat-card {
          position: relative; border-radius: 14px; padding: 1px;
          background-image: conic-gradient(from var(--ang-soc), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, ${ACCENT});
          animation: spin-ang-soc 7s linear infinite; overflow: hidden;
        }
        .soc-stat-card::before {
          content: ''; position: absolute; inset: 1px; border-radius: 13px;
          background: linear-gradient(135deg, rgba(10,14,39,0.96), rgba(8,18,38,0.96)); z-index: 0;
        }
        .soc-stat-inner { position: relative; z-index: 1; padding: 14px 12px; }
      `}</style>

      {/* ── AURORA BLOBS ── */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "8%", left: "10%", width: 440, height: 440, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT}1e 0%, transparent 70%)`, filter: "blur(80px)", animation: "drift-soc 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "50%", right: "5%", width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${ACCENT2}18 0%, transparent 70%)`, filter: "blur(80px)", animation: "drift-soc 26s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", bottom: "12%", left: "35%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, #bae6fd14 0%, transparent 70%)`, filter: "blur(60px)", animation: "drift-soc 22s ease-in-out 7s infinite" }} />
      </div>

      {/* ── NEURAL CANVAS ── */}
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: 0.18, pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── HERO BANNER ── */}
        <div className="holo3d-soc" style={{
          borderRadius: 24, padding: "28px 24px", marginBottom: 20,
          background: "linear-gradient(135deg, rgba(10,14,39,0.92) 0%, rgba(8,18,48,0.92) 100%)",
          border: `1px solid ${ACCENT}30`,
          boxShadow: `0 0 60px ${ACCENT}18, inset 0 1px 0 rgba(255,255,255,0.05)`,
          position: "relative", overflow: "hidden",
          animation: "soc-in 0.4s ease both",
        }}>
          {/* Grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${ACCENT}08 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}08 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              {/* Spinning icon */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18, padding: 1,
                  background: `conic-gradient(from var(--ang-soc), ${ACCENT}, ${ACCENT2}, ${ACCENT3}, ${ACCENT})`,
                  animation: "spin-ang-soc 4s linear infinite",
                }}>
                  <div style={{
                    width: "100%", height: "100%", borderRadius: 17,
                    background: "linear-gradient(135deg, #0a1230, #0e1a40)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    animation: "soc-float 3s ease-in-out infinite",
                  }}>
                    <Share2 size={24} color={ACCENT3} />
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT2, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 5 }}>
                  ◈ BROADCAST NETWORK
                </div>
                <h1 style={{
                  fontSize: 26, fontWeight: 900, letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0,
                  background: `linear-gradient(135deg, #fff 0%, ${ACCENT3} 50%, ${ACCENT2} 85%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>
                  Social Media
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px rgba(16,185,129,0.8)", animation: "status-blink 2s ease-in-out infinite" }} />
                  <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, fontFamily: "monospace" }}>
                    {connectedPlatformCount} PLATFORM{connectedPlatformCount !== 1 ? "S" : ""} CONNECTED · AI-POWERED
                  </span>
                </div>
              </div>
            </div>

            {/* Connected platform badges */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {connections?.facebookConnected && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(24,119,242,0.1)", border: "1px solid rgba(24,119,242,0.35)", fontSize: 11, color: "#1877f2", fontWeight: 800, boxShadow: "0 0 16px rgba(24,119,242,0.2)" }}>
                  <Facebook size={11} /> Facebook <span style={{ color: "#10b981" }}>✓</span>
                </div>
              )}
              {connections?.instagramConnected && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(225,48,108,0.1)", border: "1px solid rgba(225,48,108,0.35)", fontSize: 11, color: "#e1306c", fontWeight: 800, boxShadow: "0 0 16px rgba(225,48,108,0.2)" }}>
                  <Instagram size={11} /> Instagram <span style={{ color: "#10b981" }}>✓</span>
                </div>
              )}
              {connections?.twitterConnected && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "rgba(231,233,234,0.07)", border: "1px solid rgba(231,233,234,0.25)", fontSize: 11, color: "#e7e9ea", fontWeight: 800, boxShadow: "0 0 16px rgba(231,233,234,0.08)" }}>
                  <Twitter size={11} /> X <span style={{ color: "#10b981" }}>✓</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS GRID ── */}
        <div className="soc-stat-grid" style={{ animation: "soc-in 0.4s ease 0.05s both" }}>
          {[
            { label: "Posts Published", value: String(posts.filter(p => p.status === "posted").length), color: "#10b981" },
            { label: "Platforms Active", value: String(connectedPlatformCount), color: ACCENT },
            { label: "Total Posts",      value: String(posts.length),           color: ACCENT2 },
          ].map((s, i) => (
            <div key={i} className="soc-stat-card">
              <div className="soc-stat-inner">
                <div style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-1px" }}>
                  <ChromaticNumber value={s.value} color={s.color} />
                </div>
                <div style={{ marginTop: 8 }}>
                  <MiniWave color={s.color} seed={seedHash(s.label)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          padding: "5px", borderRadius: 16,
          background: "rgba(4,4,12,0.85)", border: "1px solid rgba(255,255,255,0.07)",
          flexWrap: "wrap", animation: "soc-in 0.4s ease 0.08s both",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === "history") loadPosts(); }}
              className={`soc-tab ${tab === t.id ? "soc-tab-active" : ""}`}
              style={{
                color: tab === t.id ? ACCENT3 : "#52525b",
                background: tab === t.id ? `${ACCENT}16` : "transparent",
                border: tab === t.id ? `1px solid ${ACCENT}44` : "1px solid transparent",
              }}
            >
              <t.icon size={13} />
              {t.label}
              {t.id === "schedule" && schedule.enabled && (
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.8)", animation: "pulse-soc 2s ease infinite" }} />
              )}
            </button>
          ))}
        </div>

        {/* ═══ PUBLISH TAB ═══ */}
        {tab === "publish" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "soc-in 0.4s ease both" }}>

            {/* No platforms warning */}
            {connectedPlatformCount === 0 && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "16px 20px", borderRadius: 16,
                background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)",
                boxShadow: "0 0 30px rgba(245,158,11,0.06)",
              }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Key size={17} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>No platforms connected</div>
                  <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.65 }}>
                    Go to{" "}
                    <button onClick={() => setTab("settings")} style={{ background: "none", border: "none", cursor: "pointer", color: "#f59e0b", fontWeight: 800, padding: 0, fontSize: "inherit" }}>
                      Connect Accounts
                    </button>{" "}
                    to add credentials. You can still generate posts — they just won&apos;t auto-publish.
                  </div>
                </div>
              </div>
            )}

            {/* Compose card */}
            <div className="soc-card holo3d-soc">
              <div className="soc-card-inner" style={{ padding: "22px" }}>
                {/* Grid bg */}
                <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${ACCENT}06 1px, transparent 1px), linear-gradient(90deg, ${ACCENT}06 1px, transparent 1px)`, backgroundSize: "32px 32px", pointerEvents: "none", borderRadius: 17 }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: ACCENT }}>⬡</span> BROADCAST TOPIC
                  </p>
                  <textarea
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="e.g. Our new AI automation tool just launched — share the excitement!"
                    rows={3}
                    className="soc-input"
                    style={{ resize: "vertical", marginBottom: 18 }}
                  />

                  {/* Tone selector */}
                  <div style={{ marginBottom: 18 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>TONE</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {["professional", "casual", "witty", "inspirational", "urgent"].map(t => (
                        <button key={t} onClick={() => setTone(t)} className="tone-chip" style={{
                          borderColor: tone === t ? ACCENT : "rgba(255,255,255,0.07)",
                          background:  tone === t ? `${ACCENT}18` : "rgba(255,255,255,0.03)",
                          color:       tone === t ? ACCENT3 : "#71717a",
                          boxShadow:   tone === t ? `0 0 12px ${ACCENT}30` : "none",
                        }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Platform selector */}
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>BROADCAST TO</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(Object.entries(PLATFORM_META) as [string, typeof PLATFORM_META[keyof typeof PLATFORM_META]][]).map(([id, meta]) => {
                        const active = platforms.includes(id);
                        const Icon = meta.icon;
                        return (
                          <button key={id} onClick={() => togglePlatform(id)} className="platform-toggle" style={{
                            borderColor: active ? meta.color + "55" : "rgba(255,255,255,0.08)",
                            background:  active ? meta.bg : "rgba(255,255,255,0.03)",
                            color:       active ? meta.color : "#52525b",
                            boxShadow:   active ? `0 0 16px ${meta.glow}` : "none",
                          }}>
                            <Icon size={13} />
                            {meta.label}
                            <SignalBars active={active} color={meta.color} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={generate}
                    disabled={generating || !topic.trim()}
                    className={`generate-btn ${generating ? "generating-active" : ""}`}
                    style={{
                      background: generating ? `linear-gradient(135deg, #0369a1, #075985)` : `linear-gradient(135deg, ${ACCENT}, #0284c7)`,
                      boxShadow: `0 0 24px ${ACCENT}44`,
                      opacity: !topic.trim() ? 0.4 : 1,
                    }}
                  >
                    {generating ? <Loader2 size={15} style={{ animation: "spin-loader 1s linear infinite" }} /> : <Sparkles size={15} />}
                    {generating ? "AI Writing..." : "Generate Post"}
                  </button>
                </div>
              </div>
            </div>

            {/* Draft preview */}
            {draft && (
              <div className="soc-card holo3d-soc" style={{ animation: "soc-in 0.45s cubic-bezier(0.16,1,0.3,1) both" }}>
                <div className="soc-card-inner">
                  {/* Draft header */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 22px", borderBottom: `1px solid ${ACCENT}22`,
                    background: `linear-gradient(90deg, ${ACCENT}10 0%, transparent 60%)`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: ACCENT, boxShadow: `0 0 10px ${ACCENT}`, animation: "pulse-soc 1.5s ease-in-out infinite" }} />
                      <span style={{ fontSize: 11, color: ACCENT, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>AI-Generated Draft</span>
                    </div>
                    <CopyButton text={`${draft.caption}\n\n${draft.hashtags}`} />
                  </div>

                  {/* Split layout */}
                  <div style={{ display: "flex", gap: 0 }}>
                    <div style={{ flex: 1, padding: "22px", borderRight: "1px solid rgba(255,255,255,0.04)" }}>
                      {draft.imageUrl ? (
                        <img src={draft.imageUrl} alt="Generated" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 12, marginBottom: 16 }} />
                      ) : (
                        <div style={{ height: 72, borderRadius: 12, marginBottom: 16, background: `${ACCENT}0a`, border: `1px dashed ${ACCENT}33`, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <ImageIcon size={14} color="#3f3f46" />
                          <span style={{ fontSize: 11, color: "#3f3f46" }}>No image — upgrade to Pro for AI image generation</span>
                        </div>
                      )}
                      <p style={{ fontSize: 14, color: "#d4d4d8", lineHeight: 1.65, marginBottom: 10 }}>{draft.caption}</p>
                      <p style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>{draft.hashtags}</p>

                      {/* Platform targets */}
                      <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                        {(JSON.parse(draft.platforms || "[]") as string[]).map(p => {
                          const pm = PLATFORM_META[p as keyof typeof PLATFORM_META];
                          if (!pm) return null;
                          const PIcon = pm.icon;
                          return (
                            <div key={p} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: pm.bg, color: pm.color, border: `1px solid ${pm.color}30`, boxShadow: `0 0 8px ${pm.glow}` }}>
                              <PIcon size={9} /> {pm.label}
                            </div>
                          );
                        })}
                      </div>

                      {/* CTA row */}
                      <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.05)", flexWrap: "wrap" }}>
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={publish}
                            disabled={publishing || connectedPlatformCount === 0}
                            className="publish-btn"
                            style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 0 24px rgba(16,185,129,0.45)", opacity: connectedPlatformCount === 0 ? 0.4 : 1 }}
                          >
                            {publishing ? <Loader2 size={14} style={{ animation: "spin-loader 1s linear infinite" }} /> : <Send size={14} />}
                            {publishing ? "Broadcasting..." : "Publish Now"}
                          </button>
                          {publishRipple && <PublishRipple />}
                        </div>
                        <button onClick={generate} disabled={generating} className="generate-btn" style={{ background: "rgba(255,255,255,0.05)", boxShadow: "none", border: "1px solid rgba(255,255,255,0.09)", color: "#71717a" }}>
                          <RefreshCw size={13} /> Regenerate
                        </button>
                      </div>

                      {/* Publish result */}
                      {publishResult && (
                        <div style={{
                          marginTop: 14, padding: "13px 16px", borderRadius: 12, animation: "soc-in 0.3s ease both",
                          background: (publishResult.errors?.length ?? 0) === 0 && Object.keys(publishResult.results || {}).length > 0 ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
                          border: `1px solid ${(publishResult.errors?.length ?? 0) === 0 && Object.keys(publishResult.results || {}).length > 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                        }}>
                          {Object.entries(publishResult.results || {}).map(([platform, id]) => (
                            <div key={platform} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#10b981", marginBottom: 3 }}>
                              <CheckCircle2 size={11} /> Posted to {platform} · ID: <span style={{ fontFamily: "monospace", fontSize: 10 }}>{id}</span>
                            </div>
                          ))}
                          {(publishResult.errors || []).map((e, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: "#ef4444", marginBottom: 3 }}>
                              <XCircle size={11} style={{ marginTop: 1, flexShrink: 0 }} /> {e}
                            </div>
                          ))}
                          {Object.keys(publishResult.results || {}).length === 0 && (publishResult.errors || []).length === 0 && (
                            <div style={{ fontSize: 12, color: "#71717a" }}>No platforms had credentials to post to.</div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Phone mockup */}
                    <div style={{ padding: "28px 22px", display: "flex", alignItems: "flex-start", justifyContent: "center", background: `radial-gradient(ellipse at 50% 50%, ${ACCENT}06 0%, transparent 70%)`, minWidth: 260 }}>
                      <PhoneMockup draft={draft} platforms={platforms} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY TAB ═══ */}
        {tab === "history" && (
          <div style={{ animation: "soc-in 0.4s ease both" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{posts.length}</span>
                <span style={{ fontSize: 12, color: "#52525b" }}>post{posts.length !== 1 ? "s" : ""} in your history</span>
              </div>
              <button onClick={loadPosts} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#71717a", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease",
              }}>
                <RefreshCw size={12} /> Refresh
              </button>
            </div>

            {loadingPosts ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <Loader2 size={24} color="#52525b" style={{ margin: "0 auto 12px", animation: "spin-loader 1s linear infinite" }} />
                <p style={{ fontSize: 13, color: "#52525b" }}>Loading posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="soc-card" style={{ padding: 0 }}>
                <div className="soc-card-inner" style={{ textAlign: "center", padding: "60px 24px" }}>
                  <History size={30} color="#3f3f46" style={{ margin: "0 auto 14px" }} />
                  <p style={{ fontSize: 15, color: "#d4d4d8", fontWeight: 700, marginBottom: 5 }}>No posts yet</p>
                  <p style={{ fontSize: 12, color: "#52525b" }}>Generate and publish your first post.</p>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {posts.map((post, idx) => {
                  const badge     = statusBadge(post.status);
                  const BadgeIcon = badge.icon;
                  const postPlatforms: string[] = JSON.parse(post.platforms || "[]");
                  const leftColor = post.status === "posted" ? "#10b981" : post.status === "partial" ? "#f59e0b" : post.status === "error" ? "#ef4444" : "#3f3f46";
                  return (
                    <div key={post.id} className="history-item" style={{
                      borderRadius: 16, overflow: "hidden",
                      background: "rgba(4,4,12,0.85)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      display: "flex",
                      animationDelay: `${idx * 0.04}s`,
                      boxShadow: `0 0 20px ${leftColor}08`,
                      transition: "border-color 0.2s ease",
                    }}>
                      <div style={{ width: 3, flexShrink: 0, background: `linear-gradient(180deg, ${leftColor}, ${leftColor}44)`, boxShadow: `2px 0 8px ${leftColor}44` }} />
                      <div style={{ flex: 1, padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{post.topic}</div>
                            <p style={{ fontSize: 12, color: "#71717a", lineHeight: 1.55, marginBottom: 5 }}>
                              {post.caption.slice(0, 130)}{post.caption.length > 130 ? "…" : ""}
                            </p>
                            <p style={{ fontSize: 11, color: ACCENT, fontWeight: 600 }}>{post.hashtags.slice(0, 60)}</p>
                          </div>
                          {post.imageUrl && <img src={post.imageUrl} alt="" style={{ width: 62, height: 62, borderRadius: 10, objectFit: "cover", flexShrink: 0, border: "1px solid rgba(255,255,255,0.07)" }} />}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 800, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, boxShadow: `0 0 8px ${badge.color}22` }}>
                            <BadgeIcon size={10} /> {badge.label}
                          </div>
                          {postPlatforms.map(p => {
                            const pm = PLATFORM_META[p as keyof typeof PLATFORM_META];
                            if (!pm) return null;
                            const PIcon = pm.icon;
                            return (
                              <div key={p} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: pm.bg, color: pm.color, border: `1px solid ${pm.color}25` }}>
                                <PIcon size={9} /> {pm.label}
                              </div>
                            );
                          })}
                          <span style={{ fontSize: 10, color: "#3f3f46", marginLeft: "auto", fontFamily: "monospace" }}>
                            {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {post.error && (
                          <div style={{ marginTop: 10, fontSize: 11, color: "#ef4444", padding: "7px 12px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8 }}>
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

        {/* ═══ SETTINGS TAB ═══ */}
        {tab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "soc-in 0.4s ease both" }}>

            {/* Facebook + Instagram */}
            <div className="cred-section">
              <div className="cred-section-inner">
                <div className="cred-header" style={{ background: "linear-gradient(90deg, rgba(24,119,242,0.07) 0%, transparent 60%)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: "rgba(24,119,242,0.12)", border: "1px solid rgba(24,119,242,0.3)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 16px rgba(24,119,242,0.2)" }}>
                    <Facebook size={17} color="#1877f2" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Facebook &amp; Instagram</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>Meta Graph API — same token for both platforms</div>
                  </div>
                  {connections?.facebookConnected && (
                    <div style={{ marginLeft: "auto", fontSize: 10, color: "#10b981", fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.35)" }}>Connected ✓</div>
                  )}
                </div>
                <div className="cred-body">
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 9, color: "#52525b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 7 }}>Facebook Page ID</label>
                    <input type="text" value={creds.fbPageId} onChange={e => setCreds(c => ({ ...c, fbPageId: e.target.value }))} placeholder={connections?.facebookConnected ? "••••• (saved)" : "e.g. 123456789012345"} className="soc-input" />
                  </div>
                  <SecretInput label="Page Access Token" value={creds.fbPageToken} onChange={v => setCreds(c => ({ ...c, fbPageToken: v }))} placeholder={connections?.facebookConnected ? "••••• (saved)" : "EAA..."} />
                  <div>
                    <label style={{ display: "block", fontSize: 9, color: "#52525b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 7 }}>Instagram Business User ID</label>
                    <input type="text" value={creds.igUserId} onChange={e => setCreds(c => ({ ...c, igUserId: e.target.value }))} placeholder={connections?.instagramConnected ? "••••• (saved)" : "e.g. 987654321"} className="soc-input" />
                    <p style={{ fontSize: 10, color: "#3f3f46", marginTop: 6 }}>Find this in Meta Business Suite → Instagram account settings</p>
                  </div>
                </div>
              </div>
            </div>

            {/* X / Twitter */}
            <div className="cred-section">
              <div className="cred-section-inner">
                <div className="cred-header" style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, transparent 60%)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Twitter size={17} color="#e7e9ea" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>X / Twitter</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>OAuth 1.0a — requires a Developer App</div>
                  </div>
                  {connections?.twitterConnected && (
                    <div style={{ marginLeft: "auto", fontSize: 10, color: "#10b981", fontWeight: 800, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.35)" }}>Connected ✓</div>
                  )}
                </div>
                <div className="cred-body">
                  <SecretInput label="API Key" value={creds.twitterApiKey} onChange={v => setCreds(c => ({ ...c, twitterApiKey: v }))} placeholder={connections?.twitterConnected ? "••••• (saved)" : "API Key from developer.twitter.com"} />
                  <SecretInput label="API Secret" value={creds.twitterApiSecret} onChange={v => setCreds(c => ({ ...c, twitterApiSecret: v }))} placeholder={connections?.twitterConnected ? "••••• (saved)" : "API Secret"} />
                  <SecretInput label="Access Token" value={creds.twitterAccessToken} onChange={v => setCreds(c => ({ ...c, twitterAccessToken: v }))} placeholder={connections?.twitterConnected ? "••••• (saved)" : "Access Token"} />
                  <SecretInput label="Access Token Secret" value={creds.twitterAccessSecret} onChange={v => setCreds(c => ({ ...c, twitterAccessSecret: v }))} placeholder={connections?.twitterConnected ? "••••• (saved)" : "Access Token Secret"} />
                </div>
              </div>
            </div>

            {/* Save creds button */}
            <button onClick={saveCreds} disabled={savingCreds} className="soc-save-btn" style={{
              alignSelf: "flex-start",
              background: credsSaved ? "linear-gradient(135deg,#10b981,#059669)" : `linear-gradient(135deg,${ACCENT},#0284c7)`,
              boxShadow: credsSaved ? "0 0 24px rgba(16,185,129,0.45)" : `0 0 24px ${ACCENT}44`,
            }}>
              {savingCreds ? <Loader2 size={14} style={{ animation: "spin-loader 1s linear infinite" }} /> : credsSaved ? <Check size={14} /> : <Key size={14} />}
              {credsSaved ? "Saved!" : savingCreds ? "Saving..." : "Save Credentials"}
            </button>

            {/* Help box */}
            <div style={{ padding: "16px 20px", borderRadius: 14, background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, boxShadow: `0 0 20px ${ACCENT}08` }}>
              <p style={{ fontSize: 12, color: ACCENT3, fontWeight: 800, marginBottom: 8 }}>How to get your credentials</p>
              <p style={{ fontSize: 11, color: "#3b5a8f", lineHeight: 1.7, margin: 0 }}>
                <strong style={{ color: ACCENT3 }}>Facebook / Instagram:</strong> Go to developers.facebook.com → My Apps → your app → Graph API Explorer.
                Generate a Page Access Token. Find your Instagram Business User ID in Business Suite.
                <br /><br />
                <strong style={{ color: ACCENT3 }}>Twitter / X:</strong> Go to developer.twitter.com → Projects &amp; Apps → Keys and tokens.
                You need API Key, API Secret, Access Token, and Access Token Secret with Read + Write permissions.
              </p>
            </div>
          </div>
        )}

        {/* ═══ SCHEDULE TAB ═══ */}
        {tab === "schedule" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "soc-in 0.4s ease both" }}>
            <div className="soc-card holo3d-soc">
              <div className="soc-card-inner" style={{ padding: "22px 24px" }}>
                {/* Toggle row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 5 }}>Auto-Post Schedule</div>
                    <div style={{ fontSize: 12, color: "#52525b", lineHeight: 1.6 }}>
                      Automatically generate and publish posts on a recurring schedule.
                    </div>
                  </div>
                  <button
                    onClick={() => setSchedule(s => ({ ...s, enabled: !s.enabled }))}
                    className="schedule-toggle-track"
                    style={{ background: schedule.enabled ? "#10b981" : "rgba(255,255,255,0.1)" }}
                  >
                    <span className="schedule-toggle-thumb" style={{ left: schedule.enabled ? 26 : 4 }} />
                  </button>
                </div>

                {schedule.enabled && (
                  <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Frequency */}
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Frequency</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[{ value: "daily", label: "Daily" }, { value: "every2days", label: "Every 2 days" }, { value: "weekly", label: "Weekly" }].map(f => (
                          <button key={f.value} onClick={() => setSchedule(s => ({ ...s, frequency: f.value }))} style={{
                            padding: "8px 18px", borderRadius: 10, fontSize: 12, fontWeight: 800, cursor: "pointer", border: "1px solid",
                            borderColor: schedule.frequency === f.value ? ACCENT : "rgba(255,255,255,0.08)",
                            background:  schedule.frequency === f.value ? `${ACCENT}18` : "rgba(255,255,255,0.03)",
                            color:       schedule.frequency === f.value ? ACCENT3 : "#71717a",
                            transition: "all 0.15s ease",
                            boxShadow: schedule.frequency === f.value ? `0 0 14px ${ACCENT}30` : "none",
                          }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time + Timezone */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Post Time</p>
                        <input type="time" value={schedule.time} onChange={e => setSchedule(s => ({ ...s, time: e.target.value }))} className="soc-input" />
                      </div>
                      <div>
                        <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>Timezone</p>
                        <select value={schedule.timezone} onChange={e => setSchedule(s => ({ ...s, timezone: e.target.value }))} className="soc-input" style={{ cursor: "pointer" }}>
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
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>Platforms to auto-post to</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {(Object.entries(PLATFORM_META) as [string, typeof PLATFORM_META[keyof typeof PLATFORM_META]][]).map(([pid, meta]) => {
                          const active = schedule.platforms.includes(pid);
                          const Icon = meta.icon;
                          return (
                            <button key={pid} onClick={() => setSchedule(s => ({ ...s, platforms: active ? s.platforms.filter(p => p !== pid) : [...s.platforms, pid] }))} className="platform-toggle" style={{
                              borderColor: active ? meta.color + "55" : "rgba(255,255,255,0.08)",
                              background:  active ? meta.bg : "rgba(255,255,255,0.03)",
                              color:       active ? meta.color : "#52525b",
                              boxShadow:   active ? `0 0 14px ${meta.glow}` : "none",
                            }}>
                              <Icon size={13} />
                              {meta.label}
                              <SignalBars active={active} color={meta.color} />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Topic */}
                    <div style={{ marginBottom: 8 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 8 }}>
                        Topic <span style={{ fontWeight: 400, color: "#3f3f46", textTransform: "none", letterSpacing: 0 }}>(leave blank for AI-picked topics)</span>
                      </p>
                      <input type="text" value={schedule.topic} onChange={e => setSchedule(s => ({ ...s, topic: e.target.value }))} placeholder="e.g. AI automation tips for small business" className="soc-input" />
                    </div>

                    {schedule.nextRun && (
                      <div style={{ fontSize: 11, color: "#52525b", marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 6px rgba(16,185,129,0.8)", animation: "pulse-soc 2s ease infinite" }} />
                        Next auto-post: <span style={{ color: ACCENT3, fontWeight: 700, fontFamily: "monospace" }}>{new Date(schedule.nextRun).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button onClick={saveSchedule} disabled={savingSchedule} className="soc-save-btn" style={{
              alignSelf: "flex-start",
              background: scheduleSaved ? "linear-gradient(135deg,#10b981,#059669)" : `linear-gradient(135deg,${ACCENT},#0284c7)`,
              boxShadow: scheduleSaved ? "0 0 24px rgba(16,185,129,0.45)" : `0 0 24px ${ACCENT}44`,
            }}>
              {savingSchedule ? <Loader2 size={14} style={{ animation: "spin-loader 1s linear infinite" }} /> : scheduleSaved ? <Check size={14} /> : <CalendarClock size={14} />}
              {scheduleSaved ? "Saved!" : savingSchedule ? "Saving..." : schedule.enabled ? "Save Schedule" : "Save (disabled)"}
            </button>

            <div style={{ padding: "16px 20px", borderRadius: 14, background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, boxShadow: `0 0 20px ${ACCENT}08` }}>
              <p style={{ fontSize: 12, color: ACCENT3, fontWeight: 800, marginBottom: 6 }}>How auto-scheduling works</p>
              <p style={{ fontSize: 11, color: "#52525b", lineHeight: 1.7, margin: 0 }}>
                When enabled, Aether uses AI to write a post about your chosen topic (or picks a relevant business topic automatically),
                generates an image on paid plans, and publishes to all connected platforms at the time you choose.
                Make sure your credentials are saved in Connect Accounts first.
              </p>
            </div>
          </div>
        )}

        {/* ── NAV STRIP ── */}
        <nav className="soc-nav-strip">
          {[
            { href: "/dashboard",                   label: "Overview"     },
            { href: "/dashboard/social/calendar",   label: "📅 Calendar"  },
            { href: "/dashboard/agents",            label: "AI Employees" },
            { href: "/dashboard/runs",              label: "Run History"  },
            { href: "/dashboard/settings",          label: "Settings"     },
            { href: "/dashboard/billing",           label: "Billing"      },
          ].map(link => (
            <a key={link.href} href={link.href} className="soc-nav-btn">{link.label}</a>
          ))}
        </nav>

      </div>
    </div>
  );
}
