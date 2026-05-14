"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  RefreshCw,
  Mail,
  MailX,
  Eye,
  Pin,
  PinOff,
  Plus,
  Minus,
  Sparkles,
  Clock,
} from "lucide-react";
import { severityColor, severityLabel } from "@/lib/competitor";

interface CompetitorDTO {
  id: string;
  name: string;
  url: string;
  category: string;
  focus: string | null;
  enabled: boolean;
  frequency: string;
  notifyEmail: boolean;
  lastSeverity: string | null;
  lastSummary: string | null;
  lastFetchedAt: string | null;
  lastChangeAt: string | null;
  lastError: string | null;
  totalScans: number;
  totalChanges: number;
  nextScanAt: string | null;
}

interface ChangeDTO {
  id: string;
  summary: string;
  details: string;
  severity: string;
  signals: string;
  charsAdded: number;
  charsRemoved: number;
  read: boolean;
  pinned: boolean;
  emailedAt: string | null;
  detectedAt: string;
}

function timeAgo(d: string | null): string {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

function parseSignals(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function CompetitorDetailClient({
  competitor,
  initialChanges,
  snapshotCount,
}: {
  competitor: CompetitorDTO;
  initialChanges: ChangeDTO[];
  snapshotCount: number;
}) {
  const router = useRouter();
  const [comp, setComp] = useState(competitor);
  const [changes, setChanges] = useState(initialChanges);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function runScan() {
    setScanning(true);
    setScanMsg("Fetching the latest version of the page…");
    try {
      const res = await fetch(`/api/competitors/${comp.id}/scan`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setScanMsg(`Scan failed: ${data?.error || res.statusText}`);
      } else if (data.changed) {
        setScanMsg(`Change detected (${data.severity}): ${data.summary}`);
        startTransition(() => router.refresh());
      } else if (data.ok) {
        setScanMsg("No material change since the last snapshot.");
        startTransition(() => router.refresh());
      } else {
        setScanMsg(`Scan finished with an issue: ${data?.error || "unknown"}`);
      }
    } catch (e) {
      setScanMsg(
        `Scan failed: ${e instanceof Error ? e.message : "network error"}`,
      );
    } finally {
      setScanning(false);
    }
  }

  async function updateCompetitor(patch: Partial<CompetitorDTO>) {
    const optimistic = { ...comp, ...patch };
    setComp(optimistic);
    try {
      const res = await fetch(`/api/competitors/${comp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("update failed");
    } catch {
      // revert if it failed
      setComp(comp);
    }
  }

  async function patchChange(id: string, patch: Partial<ChangeDTO>) {
    setChanges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    );
    try {
      await fetch(`/api/competitors/changes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    } catch {
      /* tolerated */
    }
  }

  const unreadCount = changes.filter((c) => !c.read).length;

  return (
    <div className="space-y-6">
      {/* Status / controls */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Stat label="Watching" value={comp.enabled ? "Yes" : "Paused"} accent={comp.enabled ? "#22c55e" : "#71717a"} />
          <Stat label="Changes" value={comp.totalChanges} accent="#a78bfa" />
          <Stat label="Snapshots" value={snapshotCount} accent="#7c3aed" />
          <Stat label="Unread" value={unreadCount} accent={unreadCount > 0 ? "#a78bfa" : "#71717a"} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={runScan}
            disabled={scanning || pending}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-all hover:opacity-90 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.32)",
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
            {scanning ? "Scanning…" : "Scan now"}
          </button>

          <button
            type="button"
            onClick={() => updateCompetitor({ enabled: !comp.enabled })}
            className="rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            style={{
              background: comp.enabled
                ? "rgba(239,68,68,0.06)"
                : "rgba(34,197,94,0.08)",
              border: comp.enabled
                ? "1px solid rgba(239,68,68,0.20)"
                : "1px solid rgba(34,197,94,0.20)",
              color: comp.enabled ? "#fca5a5" : "#86efac",
            }}
          >
            {comp.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {comp.enabled ? "Pause tracking" : "Resume tracking"}
          </button>

          <button
            type="button"
            onClick={() => updateCompetitor({ notifyEmail: !comp.notifyEmail })}
            className="rounded-xl px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: comp.notifyEmail ? "#a78bfa" : "#71717a",
            }}
          >
            {comp.notifyEmail ? <Mail className="h-3.5 w-3.5" /> : <MailX className="h-3.5 w-3.5" />}
            Email on high+ severity: {comp.notifyEmail ? "on" : "off"}
          </button>

          <select
            value={comp.frequency}
            onChange={(e) => updateCompetitor({ frequency: e.target.value })}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-white outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <option value="hourly">Scan: every hour</option>
            <option value="daily">Scan: daily</option>
            <option value="weekly">Scan: weekly</option>
          </select>
        </div>

        {scanMsg && (
          <div className="mt-3 text-xs text-zinc-400">
            <Sparkles className="h-3 w-3 inline mr-1" style={{ color: "#a78bfa" }} />
            {scanMsg}
          </div>
        )}

        <div className="mt-3 flex items-center gap-4 text-[11px] text-zinc-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> last scan {timeAgo(comp.lastFetchedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            next scan {timeAgo(comp.nextScanAt)}
          </span>
          {comp.lastError && (
            <span className="text-amber-400">
              last error: {comp.lastError.slice(0, 120)}
            </span>
          )}
        </div>
      </div>

      {/* Focus editor */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: "rgba(124,58,237,0.04)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}
      >
        <label className="text-[11px] uppercase tracking-widest text-violet-300 font-semibold">
          Operator focus
        </label>
        <textarea
          defaultValue={comp.focus || ""}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v !== (comp.focus || "")) updateCompetitor({ focus: v || null });
          }}
          rows={2}
          placeholder="e.g. 'Watch for pricing tier changes, new enterprise plan, or comparison-page additions.'"
          className="mt-2 w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none resize-none"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
        <p className="text-[11px] text-zinc-600 mt-1.5">
          Tells the AI what you care about. The summary will lead with anything that
          matches this focus.
        </p>
      </div>

      {/* Changes timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-widest">
            Change feed
          </h2>
          <span className="text-[11px] text-zinc-600">
            {changes.length} {changes.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {changes.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center text-sm text-zinc-500"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px dashed rgba(255,255,255,0.10)",
            }}
          >
            No detected changes yet. Aether will surface anything material the next
            time it scans this page.
          </div>
        ) : (
          <div className="space-y-3">
            {changes.map((c) => {
              const sevc = severityColor(c.severity);
              const signals = parseSignals(c.signals);
              return (
                <article
                  key={c.id}
                  className="rounded-2xl p-5 transition-colors"
                  style={{
                    background: c.read
                      ? "rgba(255,255,255,0.02)"
                      : "rgba(124,58,237,0.06)",
                    border: c.read
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "1px solid rgba(124,58,237,0.30)",
                  }}
                >
                  <header className="flex items-start gap-3 flex-wrap">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                      style={{
                        color: sevc.text,
                        background: sevc.bg,
                        border: `1px solid ${sevc.border}`,
                      }}
                    >
                      {severityLabel(c.severity)}
                    </span>

                    {signals.map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          color: "#a78bfa",
                          background: "rgba(124,58,237,0.08)",
                          border: "1px solid rgba(124,58,237,0.20)",
                        }}
                      >
                        {s}
                      </span>
                    ))}

                    <span className="text-[11px] text-zinc-600 ml-auto">
                      {timeAgo(c.detectedAt)}
                    </span>
                  </header>

                  <h3 className="text-base font-bold text-white mt-3">{c.summary}</h3>
                  {c.details && (
                    <p className="text-sm text-zinc-400 mt-1.5 whitespace-pre-line">
                      {c.details}
                    </p>
                  )}

                  <footer className="mt-4 flex items-center gap-4 text-[11px] text-zinc-600">
                    <span className="inline-flex items-center gap-1 text-emerald-400/80">
                      <Plus className="h-3 w-3" /> {c.charsAdded.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-400/80">
                      <Minus className="h-3 w-3" /> {c.charsRemoved.toLocaleString()}
                    </span>
                    {c.emailedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> emailed {timeAgo(c.emailedAt)}
                      </span>
                    )}

                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => patchChange(c.id, { read: !c.read })}
                        className="rounded-lg px-2 py-1 inline-flex items-center gap-1 hover:text-white"
                        title={c.read ? "Mark as unread" : "Mark as read"}
                      >
                        <Eye className="h-3 w-3" /> {c.read ? "read" : "unread"}
                      </button>
                      <button
                        type="button"
                        onClick={() => patchChange(c.id, { pinned: !c.pinned })}
                        className="rounded-lg px-2 py-1 inline-flex items-center gap-1 hover:text-white"
                        style={{ color: c.pinned ? "#a78bfa" : undefined }}
                        title={c.pinned ? "Unpin" : "Pin"}
                      >
                        {c.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                        {c.pinned ? "pinned" : "pin"}
                      </button>
                    </div>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: "rgba(0,0,0,0.30)",
        border: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
      <div className="text-xl font-black mt-0.5" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
