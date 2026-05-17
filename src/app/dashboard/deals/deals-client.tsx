"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  DollarSign, TrendingUp, Sparkles, Plus, Bot, Trophy, Flame,
  ArrowUpRight, X, Loader2, Target, Activity,
} from "lucide-react";
import { formatMoney } from "@/lib/attribution";

type Stage = "NEW" | "CONTACTED" | "QUALIFIED" | "DEMO" | "PROPOSAL" | "WON" | "LOST";

interface Deal {
  id: string;
  leadEmail: string;
  leadName: string | null;
  company: string | null;
  title: string | null;
  stage: string;
  valueCents: number;
  currency: string;
  probability: number;
  expectedRevenue: number;
  sourceAgentId: string | null;
  sourceCampaignId: string | null;
  sourceType: string;
  notes: string;
  positionRank: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  lastEventAt: string | null;
  expectedCloseAt: string | null;
}

interface PipelineStats {
  total: number;
  byStage: Record<string, { count: number; valueCents: number }>;
  openPipelineCents: number;
  forecastCents: number;
  wonCents: number;
  wonCount: number;
  lostCount: number;
  winRate: number;
  aiSourcedCount: number;
  aiSourcedRevenueCents: number;
}

interface AgentAttribution {
  agentId: string;
  agentName: string;
  agentRole: string;
  deals: number;
  wonRevenueCents: number;
  openPipelineCents: number;
  forecastCents: number;
}

interface AgentLite { id: string; name: string; role: string; }

export default function DealsClient({
  initialDeals, initialStats, initialAgents, agentsList,
  stages, stageLabels, stageColors,
}: {
  initialDeals: Deal[];
  initialStats: PipelineStats;
  initialAgents: AgentAttribution[];
  agentsList: AgentLite[];
  stages: Stage[];
  stageLabels: Record<string, string>;
  stageColors: Record<string, string>;
}) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [stats, setStats] = useState<PipelineStats>(initialStats);
  const [agentAttr, setAgentAttr] = useState<AgentAttribution[]>(initialAgents);
  const [showCreate, setShowCreate] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Stage | null>(null);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"pipeline" | "agents">("pipeline");

  const grouped = useMemo(() => {
    const g: Record<string, Deal[]> = {};
    for (const s of stages) g[s] = [];
    for (const d of deals) {
      g[d.stage] ||= [];
      g[d.stage].push(d);
    }
    return g;
  }, [deals, stages]);

  async function refreshAll() {
    try {
      const [dealsRes, statsRes] = await Promise.all([
        fetch("/api/deals").then((r) => r.json()),
        fetch("/api/deals/stats").then((r) => r.json()),
      ]);
      if (Array.isArray(dealsRes)) setDeals(dealsRes);
      if (statsRes?.stats) setStats(statsRes.stats);
      if (statsRes?.agents) setAgentAttr(statsRes.agents);
    } catch (err) { console.error("refresh failed", err); }
  }

  async function moveDeal(dealId: string, newStage: Stage) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));

    startTransition(async () => {
      try {
        await fetch(`/api/deals/${dealId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: newStage }),
        });
        await refreshAll();
      } catch { await refreshAll(); }
    });
  }

  function onDragStart(id: string) { setDragging(id); }
  function onDragEnd() { setDragging(null); setDragOver(null); }
  function onDrop(stage: Stage) {
    if (dragging) moveDeal(dragging, stage);
    setDragging(null); setDragOver(null);
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen" style={{ background: "#000" }}>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-7 w-7 text-violet-400" strokeWidth={2.25} />
            <h1 className="text-3xl font-black text-white tracking-tight">Revenue Attribution</h1>
            <span className="ml-2 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full"
              style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>
              New
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            See exactly how much revenue each AI employee has created. Drag deals between stages to update the pipeline.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["pipeline", "agents"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  background: view === v ? "rgba(124,58,237,0.18)" : "transparent",
                  color: view === v ? "#fff" : "#71717a",
                }}
              >
                {v === "pipeline" ? "Pipeline" : "Per-Agent ROI"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
              boxShadow: "0 0 16px rgba(124,58,237,0.4)",
            }}
          >
            <Plus className="h-4 w-4" /> New Deal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard icon={<Target className="h-4 w-4" />} label="Open Pipeline"
          value={formatMoney(stats.openPipelineCents)}
          sub={`${(stats.total - stats.wonCount - stats.lostCount)} deals`}
          color="#a78bfa" />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Forecast"
          value={formatMoney(stats.forecastCents)}
          sub="probability-weighted" color="#06b6d4" />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Closed Won"
          value={formatMoney(stats.wonCents)}
          sub={`${stats.wonCount} deals · ${stats.winRate}% win rate`}
          color="#10b981" />
        <StatCard icon={<Sparkles className="h-4 w-4" />} label="AI-Sourced"
          value={`${stats.aiSourcedCount}`}
          sub={`${formatMoney(stats.aiSourcedRevenueCents)} closed`}
          color="#ec4899" />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Avg Deal Size"
          value={stats.wonCount > 0 ? formatMoney(Math.round(stats.wonCents / stats.wonCount)) : "—"}
          sub="from closed-won" color="#f59e0b" />
      </div>

      {view === "pipeline" ? (
        <KanbanView
          stages={stages} stageLabels={stageLabels} stageColors={stageColors}
          grouped={grouped} dragging={dragging} dragOver={dragOver}
          setDragOver={setDragOver} onDragStart={onDragStart}
          onDragEnd={onDragEnd} onDrop={onDrop} isPending={isPending}
        />
      ) : (
        <AgentROIView attr={agentAttr} />
      )}

      {showCreate && (
        <CreateDealModal
          agentsList={agentsList}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refreshAll(); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl p-4 transition-transform hover:scale-[1.01]"
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>
        {icon} {label}
      </div>
      <div className="text-2xl font-black text-white tracking-tight">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function KanbanView({
  stages, stageLabels, stageColors, grouped, dragging, dragOver,
  setDragOver, onDragStart, onDragEnd, onDrop, isPending,
}: any) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 500 }}>
      {stages.map((s: Stage) => {
        const list: Deal[] = grouped[s] || [];
        const totalCents = list.reduce((sum, d) => sum + d.valueCents, 0);
        const color = stageColors[s];
        const isOver = dragOver === s;
        return (
          <div key={s} className="w-72 shrink-0 rounded-xl flex flex-col"
            style={{
              background: "rgba(8,8,12,0.7)",
              border: `1px solid ${isOver ? color + "55" : "rgba(255,255,255,0.04)"}`,
              boxShadow: isOver ? `0 0 16px ${color}44` : "none",
              transition: "all 0.15s ease",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(s); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => onDrop(s)}>
            <div className="px-3 py-2.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                <span className="text-sm font-bold text-white">{stageLabels[s]}</span>
                <span className="text-xs text-zinc-600">{list.length}</span>
              </div>
              <div className="text-xs font-bold" style={{ color }}>{formatMoney(totalCents)}</div>
            </div>
            <div className="p-2 flex flex-col gap-2 flex-1">
              {list.length === 0 && (
                <div className="text-xs text-zinc-700 italic text-center py-8">Drop deals here</div>
              )}
              {list.map((d) => (
                <DealCard key={d.id} deal={d} color={color}
                  dragging={dragging === d.id}
                  onDragStart={() => onDragStart(d.id)}
                  onDragEnd={onDragEnd} />
              ))}
            </div>
          </div>
        );
      })}
      {isPending && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 text-xs text-zinc-400 bg-zinc-900/80 px-3 py-2 rounded-lg border border-white/5">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving...
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, color, dragging, onDragStart, onDragEnd }: {
  deal: Deal; color: string; dragging: boolean; onDragStart: () => void; onDragEnd: () => void;
}) {
  const isAI = deal.sourceType !== "manual";
  return (
    <Link href={`/dashboard/deals/${deal.id}`}
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd}
      className="block rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all"
      style={{
        background: dragging ? "rgba(124,58,237,0.18)" : "rgba(20,20,26,0.7)",
        border: `1px solid ${dragging ? color + "55" : "rgba(255,255,255,0.05)"}`,
        opacity: dragging ? 0.7 : 1,
        transform: dragging ? "rotate(2deg)" : "rotate(0)",
      }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-white truncate">{deal.leadName || deal.leadEmail}</div>
          {deal.company && (<div className="text-xs text-zinc-500 truncate">{deal.company}</div>)}
        </div>
        {isAI && (
          <span title={`AI-sourced: ${deal.sourceType}`} className="shrink-0">
            <Sparkles className="h-3.5 w-3.5" style={{ color: "#a78bfa" }} />
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-base font-black tracking-tight" style={{ color }}>
          {formatMoney(deal.valueCents, deal.currency)}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
          <Activity className="h-3 w-3" /> {deal.eventCount}
        </div>
      </div>
      {deal.probability > 0 && deal.probability < 100 && (
        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full"
            style={{ width: `${deal.probability}%`, background: color, boxShadow: `0 0 6px ${color}66` }} />
        </div>
      )}
    </Link>
  );
}

function AgentROIView({ attr }: { attr: AgentAttribution[] }) {
  if (attr.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
        <Bot className="h-12 w-12 mx-auto mb-3 text-zinc-700" strokeWidth={1.5} />
        <h3 className="text-lg font-bold text-white mb-1">No AI-sourced deals yet</h3>
        <p className="text-sm text-zinc-500 max-w-md mx-auto">
          When a hot reply lands in your Smart Inbox, Aether will automatically create a deal and credit the AI employee that originated the outreach. You'll see ROI per agent here.
        </p>
      </div>
    );
  }
  const maxRev = Math.max(...attr.map((a) => a.wonRevenueCents), 1);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-bold text-white">AI Employee Leaderboard</span>
          <span className="text-xs text-zinc-500">— ranked by closed-won revenue</span>
        </div>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {attr.map((a, i) => (
          <Link key={a.agentId} href={`/dashboard/agents/${a.agentId}`}
            className="block px-5 py-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                style={{
                  background: i === 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" : "rgba(124,58,237,0.15)",
                  color: i === 0 ? "#fff" : "#a78bfa",
                }}>
                {i === 0 ? <Flame className="h-4 w-4" /> : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white truncate">{a.agentName}</span>
                  <span className="text-xs text-zinc-600">{a.agentRole}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, (a.wonRevenueCents / maxRev) * 100)}%`,
                      background: "linear-gradient(90deg, #7c3aed, #ec4899)",
                      boxShadow: "0 0 6px rgba(124,58,237,0.5)",
                    }} />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-black text-emerald-400 tracking-tight">{formatMoney(a.wonRevenueCents)}</div>
                <div className="text-[11px] text-zinc-500">{a.deals} deals · {formatMoney(a.openPipelineCents)} open</div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-zinc-600" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CreateDealModal({ agentsList, onClose, onCreated }: {
  agentsList: AgentLite[]; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    leadName: "", leadEmail: "", company: "", title: "",
    stage: "NEW", valueCents: "", sourceAgentId: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!form.leadEmail.includes("@")) { setError("Valid email required"); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: form.leadName || null,
          leadEmail: form.leadEmail,
          company: form.company || null,
          title: form.title || null,
          stage: form.stage,
          valueCents: form.valueCents ? Math.round(parseFloat(form.valueCents) * 100) : 0,
          sourceAgentId: form.sourceAgentId || null,
          sourceType: "manual",
          notes: form.notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Could not create deal");
      }
      onCreated();
    } catch (e: any) {
      setError(e.message); setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl p-6"
        style={{ background: "#0a0a10", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 8px 48px rgba(124,58,237,0.18)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white">New Deal</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <Field label="Lead Name">
            <input value={form.leadName} onChange={(e) => setForm({ ...form, leadName: e.target.value })} className={inputCls} placeholder="Jane Doe" />
          </Field>
          <Field label="Lead Email *">
            <input value={form.leadEmail} onChange={(e) => setForm({ ...form, leadEmail: e.target.value })} className={inputCls} placeholder="jane@acme.com" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} placeholder="Acme Inc" />
            </Field>
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="VP Marketing" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Stage">
              <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })} className={inputCls}>
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="DEMO">Demo</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </Field>
            <Field label="Value ($)">
              <input type="number" value={form.valueCents} onChange={(e) => setForm({ ...form, valueCents: e.target.value })} className={inputCls} placeholder="5000" />
            </Field>
          </div>
          <Field label="Source AI Employee (optional)">
            <select value={form.sourceAgentId} onChange={(e) => setForm({ ...form, sourceAgentId: e.target.value })} className={inputCls}>
              <option value="">— None —</option>
              {agentsList.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.role}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls + " min-h-[80px] resize-y"} placeholder="Context, next steps..." />
          </Field>
          {error && <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          <button onClick={submit} disabled={submitting}
            className="w-full mt-2 px-4 py-2.5 rounded-xl font-bold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
            {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating...</span> : "Create Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full text-sm bg-black/40 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/40";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-zinc-400 mb-1 uppercase tracking-wider">{label}</div>
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8 }}>{children}</div>
    </label>
  );
}
