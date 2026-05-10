"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";

const AGENTS = [
  { name: "Nova",  role: "SDR",          color: "#7c3aed" },
  { name: "Vera",  role: "Email Writer", color: "#ec4899" },
  { name: "Atlas", role: "Analyst",      color: "#3b82f6" },
  { name: "Rex",   role: "Outbound",     color: "#10b981" },
  { name: "Luna",  role: "Content",      color: "#f59e0b" },
  { name: "Zara",  role: "Researcher",   color: "#8b5cf6" },
];
const STATUSES = ["success","success","success","running","error"] as const;

interface FeedEvent {
  id: string;
  name: string; role: string; color: string;
  status: typeof STATUSES[number];
  cost: number;
  ts: number;
  fresh: boolean;
}

function makeEvent(tsOffset = 0): FeedEvent {
  const a = AGENTS[Math.floor(Math.random() * AGENTS.length)];
  return {
    id: Math.random().toString(36).slice(2),
    ...a,
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    cost: Math.round(Math.random() * 18 + 1) / 100,
    ts: Date.now() - tsOffset,
    fresh: tsOffset === 0,
  };
}

function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 8) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export function LiveFeed({ initialCount }: { initialCount: number }) {
  // Start with empty state — populated in useEffect to avoid server/client
  // Math.random() mismatch that causes React hydration error #418
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [, tick] = useState(0);

  useEffect(() => {
    // Seed initial events client-side only (safe to use Math.random here)
    setEvents(Array.from({ length: Math.min(initialCount + 2, 6) }, (_, i) => makeEvent(i * 90000)));

    const addEvent = setInterval(() => {
      setEvents(prev => [makeEvent(), ...prev.slice(0, 7)]);
    }, 3200);
    const timer = setInterval(() => tick(n => n + 1), 20000);
    return () => { clearInterval(addEvent); clearInterval(timer); };
  }, [initialCount]);

  return (
    <>
      <style>{`
        @keyframes slideInRow {
          from { opacity:0; transform:translateY(-12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spinIcon { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      {events.map(e => {
        const sc = e.status === "success" ? "#10b981" : e.status === "error" ? "#ef4444" : "#f59e0b";
        return (
          <div
            key={e.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.03)",
              animation: e.fresh ? "slideInRow 0.38s cubic-bezier(0.16,1,0.3,1)" : "none",
            }}
          >
            <div style={{ width: 26, height: 26, borderRadius: 8, background: `linear-gradient(135deg, ${e.color}, ${e.color}bb)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff", flexShrink: 0 }}>
              {e.name[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#fff" }}>{e.name}</div>
              <div style={{ fontSize: 10, color: "#3f3f46" }}>{e.role}</div>
            </div>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#52525b" }}>${e.cost.toFixed(2)}</span>
            <span style={{ fontSize: 10, color: "#3f3f46", minWidth: 40, textAlign: "right" }}>{ago(e.ts)}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 3, borderRadius: 999, padding: "3px 8px", background: `${sc}10`, border: `1px solid ${sc}28`, flexShrink: 0 }}>
              {e.status === "success" && <CheckCircle2 size={9} color={sc} />}
              {e.status === "error"   && <XCircle      size={9} color={sc} />}
              {e.status === "running" && <Loader2      size={9} color={sc} style={{ animation: "spinIcon 1s linear infinite" }} />}
              <span style={{ fontSize: 10, fontWeight: 500, color: sc }}>{e.status}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
