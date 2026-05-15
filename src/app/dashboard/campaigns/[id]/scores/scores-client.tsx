"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Sparkles, Flame, Zap, Snowflake, RefreshCw, Search,
  CheckCircle2, XCircle, MinusCircle, Loader2, Save, AlertTriangle, Trophy, Download,
} from "lucide-react";

interface LeadScore {
  id: string;
  leadEmail: string;
  leadName: string;
  leadCompany: string | null;
  score: number;
  tier: "HOT" | "WARM" | "COLD";
  reasoning: string;
  signals: string[];
  redFlags: string[];
  contacted: boolean;
  skipped: boolean;
  createdAt: string;
}

interface Summary { total: number; hot: number; warm: number; cold: number; avgScore: number; }

const BRAND = "#7c3aed";

function tierStyle(tier: LeadScore["tier"]) {
  if (tier === "HOT")  return { bg: "rgba(239,68,68,0.10)",  fg: "#f87171", border: "rgba(239,68,68,0.4)",  icon: <Flame className="h-3.5 w-3.5" /> };
  if (tier === "WARM") return { bg: "rgba(245,158,11,0.10)", fg: "#fbbf24", border: "rgba(245,158,11,0.4)", icon: <Zap className="h-3.5 w-3.5" /> };
  return                       { bg: "rgba(113,113,122,0.10)", fg: "#a1a1aa", border: "rgba(113,113,122,0.35)", icon: <Snowflake className="h-3.5 w-3.5" /> };
}

function scoreColor(score: number) {
  if (score >= 75) return "#ef4444";
  if (score >= 40) return "#f59e0b";
  return "#71717a";
}

export default function LeadScoresClient({
  campaignId,
  campaignName,
  initialThreshold,
  initialSortByScore,
  initialScoringEnabled,
}: {
  campaignId: string;
  campaignName: string;
  initialThreshold: number;
  initialSortByScore: boolean;
  initialScoringEnabled: boolean;
}) {
  const [scores, setScores] = useState<LeadScore[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, hot: 0, warm: 0, cold: 0, avgScore: 0 });
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [filterTier, setFilterTier] = useState<"ALL" | "HOT" | "WARM" | "COLD">("ALL");
  const [search, setSearch] = useState("");
  const [threshold, setThreshold] = useState<number>(initialThreshold);
  const [sortByScore, setSortByScore] = useState<boolean>(initialSortByScore);
  const [scoringEnabled, setScoringEnabled] = useState<boolean>(initialScoringEnabled);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/scores`);
      const d = await r.json();
      setScores(d.scores || []);
      setSummary(d.summary || { total: 0, hot: 0, warm: 0, cold: 0, avgScore: 0 });
    } catch (e: any) {
      setError(e.message || "Failed to load scores");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function runScoring(refresh = false) {
    setScoring(true); setError("");
    try {
      const r = await fetch("/api/campaigns/score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, refresh }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Scoring failed");
      setScores(d.scores || []);
      setSummary(d.summary || { total: 0, hot: 0, warm: 0, cold: 0, avgScore: 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setScoring(false);
    }
  }

  async function saveSettings() {
    setSavingSettings(true); setError(""); setSettingsSaved(false);
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/scores`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minScoreThreshold: threshold, sortByScore, scoringEnabled }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || "Save failed"); }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 1800);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingSettings(false);
    }
  }

  function exportCSV() {
    const rows = [
      ["Score", "Tier", "Name", "Email", "Company", "Reasoning", "Signals", "Red Flags", "Status"],
      ...visible.map(s => [
        String(s.score),
        s.tier,
        s.leadName || "",
        s.leadEmail,
        s.leadCompany || "",
        s.reasoning,
        s.signals.join("; "),
        s.redFlags.join("; "),
        s.contacted ? "Contacted" : s.score >= threshold ? "Queued" : "Below threshold",
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campaignName.replace(/[^a-z0-9]/gi, "_")}_leads.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visible = useMemo(() => {
    return scores.filter(s => {
      if (filterTier !== "ALL" && s.tier !== filterTier) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.leadEmail.toLowerCase().includes(q) &&
            !s.leadName.toLowerCase().includes(q) &&
            !(s.leadCompany || "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [scores, filterTier, search]);

  const willContact = scores.filter(s => s.score >= threshold).length;
  const willSkip = scores.length - willContact;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/campaigns" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
              <Sparkles className="h-7 w-7" style={{ color: BRAND }} />
              Lead Intelligence
            </h1>
            <p className="text-zinc-500 mt-1">
              <span className="text-white font-semibold">{campaignName}</span>
              <span className="mx-2">·</span>
              AI-graded prospects, hottest first.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {visible.length > 0 && (
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a1a1aa",
                }}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            )}
            <button
              onClick={() => runScoring(scores.length > 0)}
              disabled={scoring}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${BRAND}, #6d28d9)`,
                boxShadow: `0 0 24px ${BRAND}40`,
              }}
            >
              {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {scores.length === 0 ? "Score My Leads" : "Re-score"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 text-sm flex items-start gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Total" value={summary.total} color="#a78bfa" icon={<Trophy className="h-4 w-4" />} />
        <KpiCard label="HOT"   value={summary.hot}   color="#f87171" icon={<Flame className="h-4 w-4" />} />
        <KpiCard label="WARM"  value={summary.warm}  color="#fbbf24" icon={<Zap className="h-4 w-4" />} />
        <KpiCard label="COLD"  value={summary.cold}  color="#a1a1aa" icon={<Snowflake className="h-4 w-4" />} />
        <KpiCard label="Avg score" value={summary.avgScore} color={scoreColor(summary.avgScore)} suffix="/100" />
      </div>

      {/* Settings strip */}
      <div className="rounded-2xl p-5 mb-6"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold mb-2">Min score to email</div>
            <div className="flex items-center gap-3">
              <input
                type="range" min={0} max={100} step={5}
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                className="w-48 accent-violet-500"
              />
              <div className="rounded-lg px-2.5 py-1 text-sm font-black text-white min-w-[3rem] text-center"
                style={{ background: `${scoreColor(threshold)}22`, border: `1px solid ${scoreColor(threshold)}55`, color: scoreColor(threshold) }}>
                {threshold}
              </div>
            </div>
            {scores.length > 0 && (
              <div className="text-xs text-zinc-500 mt-2">
                <span className="text-emerald-400 font-semibold">{willContact}</span> will be contacted,{" "}
                <span className="text-zinc-400 font-semibold">{willSkip}</span> will be skipped
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sortByScore} onChange={(e) => setSortByScore(e.target.checked)} className="accent-violet-500" />
            <span className="text-sm text-zinc-300">Process hottest leads first</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={scoringEnabled} onChange={(e) => setScoringEnabled(e.target.checked)} className="accent-violet-500" />
            <span className="text-sm text-zinc-300">Auto-score on every run</span>
          </label>

          <div className="ml-auto flex items-center gap-2">
            {settingsSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
              </span>
            )}
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save settings
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {(["ALL", "HOT", "WARM", "COLD"] as const).map(t => {
          const active = filterTier === t;
          const s = t === "ALL"
            ? { bg: "rgba(124,58,237,0.12)", fg: BRAND, border: "rgba(124,58,237,0.35)" }
            : tierStyle(t as any);
          return (
            <button key={t} onClick={() => setFilterTier(t)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
              style={{
                background: active ? s.bg : "rgba(255,255,255,0.03)",
                color: active ? s.fg : "#a1a1aa",
                border: `1px solid ${active ? s.border : "rgba(255,255,255,0.08)"}`,
              }}>
              {t}
            </button>
          );
        })}
        <div className="relative ml-auto">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            type="text" placeholder="Search lead, email, company…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg pl-9 pr-3 py-2 text-sm bg-transparent text-white placeholder-zinc-600 w-64"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-zinc-500" />
        </div>
      ) : scores.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Sparkles className="h-10 w-10 mx-auto mb-3" style={{ color: BRAND }} />
          <div className="text-white font-bold mb-1">No scores yet</div>
          <div className="text-sm text-zinc-500 mb-4">
            Click "Score My Leads" to grade each prospect 1–100 before you burn a single run.
          </div>
          <button
            onClick={() => runScoring(false)}
            disabled={scoring}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #6d28d9)`, boxShadow: `0 0 24px ${BRAND}40` }}>
            {scoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Score My Leads
          </button>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-5 py-3 font-semibold">Score</th>
                  <th className="px-5 py-3 font-semibold">Lead</th>
                  <th className="px-5 py-3 font-semibold">Company</th>
                  <th className="px-5 py-3 font-semibold">Tier</th>
                  <th className="px-5 py-3 font-semibold">Why</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((s, i) => {
                  const ts = tierStyle(s.tier);
                  const willEmail = s.score >= threshold;
                  return (
                    <tr key={s.id} className="group" style={{ borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-5 py-4 align-top">
                        <ScoreBar score={s.score} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-white">{s.leadName || "(unnamed)"}</div>
                        <div className="text-xs text-zinc-500">{s.leadEmail}</div>
                      </td>
                      <td className="px-5 py-4 align-top text-zinc-400">{s.leadCompany || "—"}</td>
                      <td className="px-5 py-4 align-top">
                        <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold"
                          style={{ background: ts.bg, color: ts.fg, border: `1px solid ${ts.border}` }}>
                          {ts.icon}{s.tier}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top max-w-md">
                        <div className="text-zinc-300 text-xs leading-relaxed">{s.reasoning}</div>
                        {s.signals.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.signals.slice(0, 3).map((sig, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                                style={{ background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                                + {sig}
                              </span>
                            ))}
                          </div>
                        )}
                        {s.redFlags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {s.redFlags.slice(0, 2).map((f, j) => (
                              <span key={j} className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                                style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}>
                                ⚠ {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {s.contacted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Contacted
                          </span>
                        ) : !willEmail ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500">
                            <XCircle className="h-3.5 w-3.5" /> Below threshold
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-violet-300">
                            <MinusCircle className="h-3.5 w-3.5" /> Queued
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── small components ── */

function KpiCard({ label, value, color, icon, suffix }: { label: string; value: number; color: string; icon?: React.ReactNode; suffix?: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold mb-2" style={{ color }}>
        {icon} {label}
      </div>
      <div className="text-3xl font-black text-white">
        {value}
        {suffix && <span className="text-base text-zinc-500 font-bold ml-0.5">{suffix}</span>}
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="text-lg font-black w-9 text-right" style={{ color }}>{score}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div className="h-full rounded-full transition-all"
          style={{
            width: `${score}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            boxShadow: `0 0 8px ${color}66`,
          }} />
      </div>
    </div>
  );
}
