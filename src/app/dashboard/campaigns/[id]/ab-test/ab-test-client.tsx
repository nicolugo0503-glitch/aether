"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, FlaskConical, Sparkles, Trophy, Loader2, RefreshCw,
  Save, Trash2, Power, PowerOff, Crown, BarChart3, Eye, MousePointerClick,
  MessageCircle, Flame, AlertTriangle, CheckCircle2, Wand2, Plus, ShieldCheck,
} from "lucide-react";

const BRAND = "#7c3aed";

type WinnerMetric = "reply_rate" | "hot_reply_rate" | "open_rate" | "click_rate";

interface Variant {
  id: string;
  label: string;
  name: string;
  angle: string;
  subjectTemplate: string;
  bodyTemplate: string;
  tone: string;
  weight: number;
  active: boolean;
  isControl: boolean;
  isWinner: boolean;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  hotRepliedCount: number;
  errorCount: number;
}

interface VariantStat {
  id: string;
  label: string;
  name: string;
  isControl: boolean;
  isWinner: boolean;
  active: boolean;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  hotReplied: number;
  errors: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  hotReplyRate: number;
  liftVsControl: number | null;
  pValue: number | null;
  isSignificant: boolean;
  metricValue: number;
}

interface CampaignConfig {
  id: string;
  name: string;
  abTestEnabled: boolean;
  abAutoPickWinner: boolean;
  abMinSampleSize: number;
  abConfidence: number;
  abWinnerMetric: WinnerMetric;
  abWinnerVariantId: string | null;
  abWinnerPickedAt: string | null;
}

const METRIC_LABEL: Record<WinnerMetric, string> = {
  reply_rate: "Reply rate",
  hot_reply_rate: "Hot-reply rate",
  open_rate: "Open rate",
  click_rate: "Click rate",
};

const TONE_LABEL: Record<string, string> = {
  professional: "Professional",
  casual: "Casual",
  bold: "Bold",
  warm: "Warm",
};

function variantColor(label: string): string {
  // Distinct accent per variant.
  switch (label) {
    case "A": return "#7c3aed";
    case "B": return "#06b6d4";
    case "C": return "#f59e0b";
    case "D": return "#ec4899";
    default:  return "#7c3aed";
  }
}

export default function AbTestClient({
  campaignId,
  campaignName,
}: {
  campaignId: string;
  campaignName: string;
}) {
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [stats, setStats] = useState<VariantStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState("");

  // Generator form
  const [genOpen, setGenOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [basePrompt, setBasePrompt] = useState("");
  const [numVariants, setNumVariants] = useState<2 | 3 | 4>(2);
  const [audience, setAudience] = useState("");

  // Editor
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Variant>>({});

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to load A/B test");
      setConfig(d.campaign);
      setVariants(d.variants);
      setStats(d.stats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function generateVariants() {
    if (!basePrompt.trim()) { setError("Tell Aether what to pitch first."); return; }
    setGenerating(true); setError("");
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ basePrompt, numVariants, audience, replaceExisting: true }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed");
      setGenOpen(false);
      setBasePrompt("");
      await load();
      flash("Variants generated and live.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function patchConfig(patch: Partial<CampaignConfig>) {
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Save failed");
      }
      if (config) setConfig({ ...config, ...patch } as CampaignConfig);
      await load();
      flash("Saved.");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteVariant(id: string) {
    if (!confirm("Delete this variant? All of its stats will be lost.")) return;
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants/${id}`, { method: "DELETE" });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Delete failed");
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleActive(v: Variant) {
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !v.active }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Update failed");
      }
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function saveEdit(id: string) {
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Save failed");
      }
      setEditing(null);
      setEditDraft({});
      await load();
      flash("Variant updated.");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function autoPickWinner() {
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants/pick-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auto: true }),
      });
      const d = await r.json();
      if (!d.winnerId) { setError(d.reason || "Not enough data yet."); return; }
      await load();
      flash(`Winner elected: ${d.winnerLabel}. ${d.reason}`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function forcePickWinner(id: string, label: string) {
    if (!confirm(`Lock variant ${label} as the winner? Remaining sends will all use it.`)) return;
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants/pick-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: id }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Pick failed");
      }
      await load();
      flash(`Variant ${label} is now the winner.`);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function resetWinner() {
    if (!confirm("Resume the test? All variants will become active again.")) return;
    try {
      const r = await fetch(`/api/campaigns/${campaignId}/variants/pick-winner`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      if (!r.ok) {
        const d = await r.json();
        throw new Error(d.error || "Reset failed");
      }
      await load();
      flash("Test resumed.");
    } catch (e: any) {
      setError(e.message);
    }
  }

  function flash(msg: string) {
    setSavedFlash(msg);
    setTimeout(() => setSavedFlash(""), 2200);
  }

  const totalSent = useMemo(() => stats.reduce((s, v) => s + v.sent, 0), [stats]);
  const totalReplied = useMemo(() => stats.reduce((s, v) => s + v.replied, 0), [stats]);
  const totalHot = useMemo(() => stats.reduce((s, v) => s + v.hotReplied, 0), [stats]);
  const overallReplyRate = totalSent === 0 ? 0 : Math.round((totalReplied / totalSent) * 1000) / 10;

  const winnerStat = stats.find(s => s.isWinner);
  const winnerLocked = !!config?.abWinnerVariantId;

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
              <FlaskConical className="h-7 w-7" style={{ color: BRAND }} />
              A/B Testing Lab
            </h1>
            <p className="text-zinc-500 mt-1">
              <span className="text-white font-semibold">{campaignName}</span>
              <span className="mx-2">·</span>
              Run multiple email variants, auto-elect the winner.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa" }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setGenOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #6d28d9)`, boxShadow: `0 0 24px ${BRAND}40` }}
            >
              <Wand2 className="h-4 w-4" />
              {variants.length === 0 ? "Generate variants" : "Re-generate variants"}
            </button>
          </div>
        </div>
      </div>

      {savedFlash && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}
        >
          <CheckCircle2 className="h-4 w-4" />
          {savedFlash}
        </div>
      )}
      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
        >
          <AlertTriangle className="h-4 w-4" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-xs underline">dismiss</button>
        </div>
      )}

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Kpi icon={<BarChart3 className="h-4 w-4" />} label="Total sent" value={totalSent.toString()} />
        <Kpi icon={<MessageCircle className="h-4 w-4" />} label="Replies" value={totalReplied.toString()} accent="#06b6d4" />
        <Kpi icon={<Flame className="h-4 w-4" />} label="Hot replies" value={totalHot.toString()} accent="#ef4444" />
        <Kpi icon={<Trophy className="h-4 w-4" />} label="Overall reply rate" value={`${overallReplyRate}%`} accent={BRAND} />
      </div>

      {/* Config card */}
      {config && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: "linear-gradient(180deg, rgba(124,58,237,0.06), rgba(0,0,0,0))",
            border: "1px solid rgba(124,58,237,0.18)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4" style={{ color: BRAND }} />
            <h3 className="text-sm font-bold text-white">Experiment configuration</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Toggle
              label="A/B testing"
              checked={config.abTestEnabled}
              onChange={v => patchConfig({ abTestEnabled: v })}
              hint="If off, the campaign uses agent-generated emails per lead."
            />
            <Toggle
              label="Auto-elect winner"
              checked={config.abAutoPickWinner}
              onChange={v => patchConfig({ abAutoPickWinner: v })}
              hint="When stats hit significance, lock in the winner."
            />

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Winner metric</label>
              <select
                value={config.abWinnerMetric}
                onChange={e => patchConfig({ abWinnerMetric: e.target.value as WinnerMetric })}
                className="mt-1 w-full rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
              >
                <option value="reply_rate">Reply rate</option>
                <option value="hot_reply_rate">Hot-reply rate</option>
                <option value="open_rate">Open rate</option>
                <option value="click_rate">Click rate</option>
              </select>
              <p className="text-[11px] text-zinc-500 mt-1.5">Which KPI decides the winner.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Min sample</label>
                <input
                  type="number" min={5} max={500} value={config.abMinSampleSize}
                  onChange={e => patchConfig({ abMinSampleSize: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Confidence</label>
                <select
                  value={config.abConfidence}
                  onChange={e => patchConfig({ abConfidence: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
                >
                  <option value={90}>90%</option>
                  <option value={95}>95%</option>
                  <option value={99}>99%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Winner banner */}
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            {winnerLocked && winnerStat ? (
              <div
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm flex-1 min-w-[280px]"
                style={{
                  background: "linear-gradient(135deg, rgba(16,185,129,0.10), rgba(16,185,129,0.04))",
                  border: "1px solid rgba(16,185,129,0.3)",
                }}
              >
                <Crown className="h-5 w-5" style={{ color: "#34d399" }} />
                <div className="flex-1">
                  <div className="text-white font-bold">
                    Variant {winnerStat.label} won —{" "}
                    <span style={{ color: "#34d399" }}>{winnerStat.metricValue}%</span>{" "}
                    {METRIC_LABEL[config.abWinnerMetric].toLowerCase()}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {winnerStat.pValue !== null ? `p = ${winnerStat.pValue}` : ""}{" "}
                    {winnerStat.liftVsControl !== null ? `· +${winnerStat.liftVsControl}pp lift vs control` : ""}
                  </div>
                </div>
                <button
                  onClick={resetWinner}
                  className="text-xs font-bold text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Resume test
                </button>
              </div>
            ) : (
              <button
                onClick={autoPickWinner}
                disabled={stats.length < 2}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#34d399" }}
              >
                <Trophy className="h-4 w-4" />
                Try auto-pick winner
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl p-12 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-violet-500" />
          <p className="mt-3 text-sm text-zinc-500">Loading variants…</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && variants.length === 0 && (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ background: "rgba(124,58,237,0.04)", border: "1px dashed rgba(124,58,237,0.3)" }}
        >
          <FlaskConical className="h-10 w-10 mx-auto" style={{ color: BRAND }} />
          <h3 className="mt-4 text-lg font-bold text-white">No variants yet</h3>
          <p className="mt-1 text-sm text-zinc-500 max-w-md mx-auto">
            Describe what you want to pitch and Aether will generate 2-4 strategically different
            email variants. Each lead gets randomly assigned and we'll auto-elect the winner
            once we have statistical significance.
          </p>
          <button
            onClick={() => setGenOpen(true)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${BRAND}, #6d28d9)`, boxShadow: `0 0 24px ${BRAND}40` }}
          >
            <Sparkles className="h-4 w-4" />
            Generate variants with AI
          </button>
        </div>
      )}

      {/* Variant grid */}
      {!loading && variants.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {variants.map(v => {
            const stat = stats.find(s => s.id === v.id);
            const color = variantColor(v.label);
            const isEditing = editing === v.id;
            return (
              <div
                key={v.id}
                className="rounded-2xl p-5"
                style={{
                  background: v.isWinner
                    ? "linear-gradient(180deg, rgba(16,185,129,0.08), rgba(0,0,0,0))"
                    : "rgba(255,255,255,0.025)",
                  border: v.isWinner
                    ? "1px solid rgba(16,185,129,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: v.isWinner ? "0 0 32px rgba(16,185,129,0.15)" : undefined,
                  opacity: !v.active && !v.isWinner ? 0.6 : 1,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center h-10 w-10 rounded-xl text-base font-black text-white"
                      style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 0 16px ${color}50` }}
                    >
                      {v.label}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold text-base">{v.name}</h4>
                        {v.isControl && (
                          <span
                            className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(255,255,255,0.06)", color: "#a1a1aa" }}
                          >Control</span>
                        )}
                        {v.isWinner && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                            style={{ background: "rgba(16,185,129,0.15)", color: "#34d399" }}
                          ><Crown className="h-3 w-3" /> Winner</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {v.angle || TONE_LABEL[v.tone] || "Variant"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!v.isWinner && !winnerLocked && stat && stat.sent > 0 && (
                      <button
                        onClick={() => forcePickWinner(v.id, v.label)}
                        title="Lock this variant as winner"
                        className="p-2 rounded-lg hover:bg-white/5 transition"
                      >
                        <Crown className="h-4 w-4 text-zinc-500 hover:text-emerald-400" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleActive(v)}
                      title={v.active ? "Pause this variant" : "Resume this variant"}
                      className="p-2 rounded-lg hover:bg-white/5 transition"
                    >
                      {v.active
                        ? <Power className="h-4 w-4 text-emerald-400" />
                        : <PowerOff className="h-4 w-4 text-zinc-600" />}
                    </button>
                    <button
                      onClick={() => deleteVariant(v.id)}
                      title="Delete variant"
                      className="p-2 rounded-lg hover:bg-white/5 transition"
                    >
                      <Trash2 className="h-4 w-4 text-zinc-500 hover:text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                {stat && (
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <StatCell label="Sent" value={stat.sent} icon={<BarChart3 className="h-3 w-3" />} />
                    <StatCell label="Open" value={`${stat.openRate}%`} sub={`${stat.opened}`} icon={<Eye className="h-3 w-3" />} />
                    <StatCell label="Click" value={`${stat.clickRate}%`} sub={`${stat.clicked}`} icon={<MousePointerClick className="h-3 w-3" />} />
                    <StatCell
                      label="Reply"
                      value={`${stat.replyRate}%`}
                      sub={`${stat.replied}${stat.hotReplied > 0 ? ` • ${stat.hotReplied}🔥` : ""}`}
                      icon={<MessageCircle className="h-3 w-3" />}
                      accent={color}
                    />
                  </div>
                )}

                {/* Significance / lift bar */}
                {stat && !stat.isControl && stat.pValue !== null && (
                  <div
                    className="rounded-lg px-3 py-2 mb-4 text-xs flex items-center gap-2 flex-wrap"
                    style={{
                      background: stat.isSignificant ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
                      border: stat.isSignificant
                        ? "1px solid rgba(16,185,129,0.25)"
                        : "1px solid rgba(255,255,255,0.06)",
                      color: stat.isSignificant ? "#34d399" : "#a1a1aa",
                    }}
                  >
                    <span className="font-bold">
                      {stat.liftVsControl !== null && stat.liftVsControl > 0 ? "+" : ""}
                      {stat.liftVsControl}pp vs control
                    </span>
                    <span className="opacity-70">·</span>
                    <span>p = {stat.pValue}</span>
                    <span className="opacity-70">·</span>
                    <span className="font-bold">
                      {stat.isSignificant ? "Statistically significant" : "Not yet significant"}
                    </span>
                  </div>
                )}

                {/* Body — view or edit */}
                {!isEditing ? (
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Subject</div>
                      <div
                        className="text-sm text-white font-medium rounded-lg px-3 py-2"
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        {v.subjectTemplate}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">Body</div>
                      <pre
                        className="text-xs text-zinc-300 rounded-lg px-3 py-2 whitespace-pre-wrap font-sans leading-relaxed"
                        style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", maxHeight: 220, overflow: "auto" }}
                      >{v.bodyTemplate}</pre>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-zinc-500">Weight: {v.weight}%</span>
                      <button
                        onClick={() => { setEditing(v.id); setEditDraft({ name: v.name, angle: v.angle, subjectTemplate: v.subjectTemplate, bodyTemplate: v.bodyTemplate, tone: v.tone, weight: v.weight }); }}
                        className="text-xs font-bold text-zinc-400 hover:text-white"
                      >Edit variant →</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      value={editDraft.name as string || ""}
                      onChange={e => setEditDraft({ ...editDraft, name: e.target.value })}
                      placeholder="Variant name"
                      className="w-full rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
                    />
                    <input
                      value={editDraft.subjectTemplate as string || ""}
                      onChange={e => setEditDraft({ ...editDraft, subjectTemplate: e.target.value })}
                      placeholder="Subject (supports {{firstName}}, {{company}})"
                      className="w-full rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
                    />
                    <textarea
                      value={editDraft.bodyTemplate as string || ""}
                      onChange={e => setEditDraft({ ...editDraft, bodyTemplate: e.target.value })}
                      placeholder="Body (supports {{firstName}}, {{name}}, {{company}})"
                      rows={8}
                      className="w-full rounded-lg bg-zinc-900 text-white text-xs font-mono px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editDraft.tone as string || "professional"}
                        onChange={e => setEditDraft({ ...editDraft, tone: e.target.value })}
                        className="rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="bold">Bold</option>
                        <option value="warm">Warm</option>
                      </select>
                      <input
                        type="number" min={1} max={100}
                        value={editDraft.weight as number || 50}
                        onChange={e => setEditDraft({ ...editDraft, weight: Number(e.target.value) })}
                        className="rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
                        placeholder="Weight %"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => saveEdit(v.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                        style={{ background: BRAND }}
                      >
                        <Save className="h-3.5 w-3.5" /> Save
                      </button>
                      <button
                        onClick={() => { setEditing(null); setEditDraft({}); }}
                        className="text-xs font-bold text-zinc-400 hover:text-white px-2"
                      >Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Generation modal */}
      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div
            className="w-full max-w-2xl rounded-2xl p-6"
            style={{
              background: "linear-gradient(180deg, #0f0f10, #09090b)",
              border: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "0 0 60px rgba(124,58,237,0.25)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Wand2 className="h-5 w-5" style={{ color: BRAND }} />
              <h3 className="text-white font-black text-lg">Generate A/B variants</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-5">
              Aether will write {numVariants} strategically different cold-email variants —
              each with its own hook and angle — using GPT-4o-mini.
            </p>

            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">What are you pitching?</label>
            <textarea
              value={basePrompt}
              onChange={e => setBasePrompt(e.target.value)}
              placeholder="e.g. 'Intro Aether to founders of B2B SaaS companies — lead with the time savings of replacing 3 contractors with an AI workforce.'"
              rows={4}
              className="mt-1 w-full rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
            />

            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4 block">Audience (optional)</label>
            <input
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="e.g. 'Series A founders in B2B SaaS, 10-200 employees'"
              className="mt-1 w-full rounded-lg bg-zinc-900 text-white text-sm px-3 py-2 border border-zinc-800 focus:border-violet-500 outline-none"
            />

            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-4 block"># of variants</label>
            <div className="mt-2 flex gap-2">
              {[2, 3, 4].map(n => (
                <button
                  key={n}
                  onClick={() => setNumVariants(n as 2 | 3 | 4)}
                  className="flex-1 rounded-lg px-3 py-2 text-sm font-bold transition"
                  style={{
                    background: numVariants === n ? BRAND : "rgba(255,255,255,0.04)",
                    border: numVariants === n ? `1px solid ${BRAND}` : "1px solid rgba(255,255,255,0.08)",
                    color: numVariants === n ? "white" : "#a1a1aa",
                  }}
                >
                  {n} variants
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-6">
              <button
                onClick={generateVariants}
                disabled={generating || !basePrompt.trim()}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${BRAND}, #6d28d9)`, boxShadow: `0 0 24px ${BRAND}40` }}
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? "Generating…" : "Generate"}
              </button>
              <button
                onClick={() => setGenOpen(false)}
                className="text-sm font-bold text-zinc-400 hover:text-white px-3 py-2.5"
              >Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
        <span style={{ color: accent || "#71717a" }}>{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-xl font-black text-white">{value}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={() => onChange(!checked)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition"
          style={{ background: checked ? BRAND : "rgba(255,255,255,0.1)" }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white transition"
            style={{ transform: `translateX(${checked ? "22px" : "4px"})` }}
          />
        </button>
        <span className="text-sm text-white">{checked ? "On" : "Off"}</span>
      </div>
      {hint && <p className="text-[11px] text-zinc-500 mt-1.5">{hint}</p>}
    </div>
  );
}

function StatCell({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div
      className="rounded-lg px-2.5 py-2"
      style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}
    >
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
        <span style={{ color: accent || "#71717a" }}>{icon}</span>{label}
      </div>
      <div className="text-base font-black text-white mt-0.5" style={{ color: accent || "white" }}>{value}</div>
      {sub && <div className="text-[10px] text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}
