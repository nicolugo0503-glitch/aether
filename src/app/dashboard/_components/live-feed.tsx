"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, XCircle, Loader2,
  Mail, Share2, BarChart2, Bot, Zap,
} from "lucide-react";

export type FeedItem = {
  id: string;
  type: "run" | "social" | "campaign";
  agentName: string;
  agentColor: string;
  description: string;
  status: "success" | "error" | "running" | "posted" | "partial";
  ts: number;
  costCents?: number;
  platforms?: string; // comma-separated e.g. "instagram, facebook"
};

function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 10)  return "just now";
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function TypeIcon({ type, color }: { type: FeedItem["type"]; color: string }) {
  const sz = 11;
  if (type === "social")   return <Share2   size={sz} color={color} />;
  if (type === "campaign") return <Mail      size={sz} color={color} />;
  return                          <Bot       size={sz} color={color} />;
}

function StatusBadge({ status }: { status: FeedItem["status"] }) {
  const map = {
    success: { color: "#10b981", label: "success",   Icon: CheckCircle2 },
    posted:  { color: "#10b981", label: "posted",    Icon: CheckCircle2 },
    partial: { color: "#f59e0b", label: "partial",   Icon: Zap          },
    running: { color: "#f59e0b", label: "running",   Icon: Loader2      },
    error:   { color: "#ef4444", label: "error",     Icon: XCircle      },
  }[status] ?? { color: "#71717a", label: status, Icon: Loader2 };

  const { color, label, Icon } = map;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 3,
      borderRadius: 999, padding: "3px 8px",
      background: `${color}10`, border: `1px solid ${color}28`,
      flexShrink: 0,
    }}>
      <Icon
        size={9} color={color}
        style={status === "running" ? { animation: "spin 1s linear infinite" } : undefined}
      />
      <span style={{ fontSize: 10, fontWeight: 600, color }}>{label}</span>
    </div>
  );
}

export function LiveFeed({ initialEvents }: { initialEvents: FeedItem[] }) {
  const [events, setEvents] = useState<FeedItem[]>(initialEvents);
  const [, tick] = useState(0);

  // Re-hydrate from server props on mount
  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  // Update "ago" timestamps every 20 s
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 20_000);
    return () => clearInterval(t);
  }, []);

  if (events.length === 0) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 24px", textAlign: "center",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 14, boxShadow: "0 0 30px rgba(124,58,237,0.15)",
          animation: "floatY 3s ease-in-out infinite",
        }}>
          <BarChart2 size={22} color="#7c3aed" />
        </div>
        <p style={{ fontSize: 14, color: "#d4d4d8", fontWeight: 600, marginBottom: 5 }}>No activity yet</p>
        <p style={{ fontSize: 12, color: "#52525b" }}>Your AI team's actions will appear here in real time.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideInRow {
          from { opacity:0; transform:translateY(-10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50%     { transform: translateY(-5px); }
        }
      `}</style>
      {events.map((e, idx) => (
        <div key={e.id} style={{
          display: "flex", alignItems: "center", gap: 11,
          padding: "10px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.03)",
          animation: idx < 2 ? "slideInRow 0.4s cubic-bezier(0.16,1,0.3,1)" : "none",
          animationDelay: idx === 1 ? "0.06s" : "0s",
          animationFillMode: "both",
        }}>

          {/* Agent avatar with type icon overlay */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              background: `linear-gradient(135deg, ${e.agentColor}, ${e.agentColor}bb)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900, color: "#fff",
              boxShadow: `0 0 12px ${e.agentColor}40`,
            }}>
              {e.agentName[0].toUpperCase()}
            </div>
            {/* Type indicator chip */}
            <div style={{
              position: "absolute", bottom: -3, right: -5,
              width: 16, height: 16, borderRadius: 5, border: "1.5px solid #000",
              background: "rgba(9,9,11,0.95)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TypeIcon type={e.type} color={e.agentColor} />
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: "#e4e4e7",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {e.agentName}
              {e.platforms && (
                <span style={{ fontWeight: 400, color: "#52525b" }}> · {e.platforms}</span>
              )}
            </div>
            <div style={{
              fontSize: 10, color: "#52525b",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              marginTop: 1,
            }}>
              {e.description}
            </div>
          </div>

          {/* Cost (runs only) */}
          {e.costCents != null && e.costCents > 0 && (
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#3f3f46", flexShrink: 0 }}>
              ${(e.costCents / 100).toFixed(2)}
            </span>
          )}

          {/* Time */}
          <span style={{ fontSize: 10, color: "#3f3f46", minWidth: 42, textAlign: "right", flexShrink: 0 }}>
            {ago(e.ts)}
          </span>

          {/* Status badge */}
          <StatusBadge status={e.status} />
        </div>
      ))}
    </>
  );
}
