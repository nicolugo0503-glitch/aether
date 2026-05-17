"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Trash2, Save, Mail, Bot, Megaphone, Flame,
  Calendar, MessageCircle, Trophy, X as XIcon, Activity, Plus,
  ExternalLink, Sparkles, Clock,
} from "lucide-react";
import { formatMoney } from "@/lib/attribution";

interface Deal {
  id: string;
  leadEmail: string;
  leadName: string | null;
  company: string | null;
  title: string | null;
  linkedinUrl: string | null;
  stage: string;
  valueCents: number;
  currency: string;
  probability: number;
  expectedRevenue: number;
  sourceAgentId: string | null;
  sourceCampaignId: string | null;
  sourceReplyId: string | null;
  sourceType: string;
  notes: string;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  contactedAt: string | null;
  qualifiedAt: string | null;
  demoBookedAt: string | null;
  proposalAt: string | null;
  expectedCloseAt: string | null;
  closeReason?: string | null;
}

interface Event {
  id: string;
  type: string;
  title: string;
  detail: string;
  valueCents: number;
  source: string;
  createdAt: string;
  agentId?: string | null;
  campaignId?: string | null;
  replyId?: string | null;
}

interface Props {
  deal: Deal;
  events: Event[];
  agent: { id: string; name: string; role: string } | null;
  campaign: { id: string; name: string } | null;
  reply: { id: string; subject: string | null; summary: string; intent: string; score: number } | null;
  stages: string[];
  stageLabels: Record<string, string>;
  stageColors: Record<string, string>;
}

const EVENT_ICONS: Record<string, any> = {
  EMAIL_SENT: Mail, EMAIL_REPLIED: MessageCircle, EMAIL_OPENED: Mail,
  EMAIL_CLICKED: ExternalLink, DEMO_BOOKED: Calendar, DEMO_HELD: Calendar,
  PROPOSAL_SENT: Megaphone, DEAL_WON: Trophy, DEAL_LOST: XIcon,
  AGENT_RUN: Bot, SOCIAL_POST_PUBLISHED: Sparkles, NOTE: MessageCircle,
  STAGE_CHANGED: Activity, VALUE_CHANGED: Activity, WEBHOOK: Activity,
  COMPETITOR_ALERT: Activity,
};

const EVENT_COLORS: Record<string, string> = {
  EMAIL_SENT: "#6366f1", EMAIL_REPLIED: "#ec4899", EMAIL_OPENED: "#06b6d4",
  EMAIL_CLICKED: "#06b6d4", DEMO_BOOKED: "#f59e0b", DEMO_HELD: "#f59e0b",
  PROPOSAL_SENT: "#06b6d4", DEAL_WON: "#10b981", DEAL_LOST: "#ef4444",
  AGENT_RUN: "#a78bfa", SOCIAL_POST_PUBLISHED: "#ec4899", NOTE: "#71717a",
  STAGE_CHANGED: "#a78bfa", VALUE_CHANGED: "#a78bfa", WEBHOOK: "#06b6d4",
  COMPETITOR_ALERT: "#f59e0b",
};

export default function DealDetailClient({
  deal: initialDeal, events: initialEvents, agent, campaign, reply,
  stages, stageLabels, stageColors,
}: Props) {
  const router = useRouter();
  const [deal, setDeal] = useState(initialDeal);
  const [events, setEvents] = useState(initialEvents);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState(deal.leadName || "");
  const [editCompany, setEditCompany] = useState(deal.company || "");
  const [editTitle, setEditTitle] = useState(deal.title || "");
  const [editValue, setEditValue] = useState((deal.valueCents / 100).toString());
  const [editProbability, setEditProbability] = useState(deal.probability.toString());
  const [editNotes, setEditNotes] = useState(deal.notes || "");
  const [dirty, setDirty] = useState(false);

  function markDirty<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setDirty(true); };
  }

  async function refresh() {
    const res = await fetch(`/api/deals/${deal.id}`).then((r) => r.json());
    if (res?.deal) setDeal(res.deal);
    if (res?.events) setEvents(res.events);
  }

  async function changeStage(newStage: string) {
    setSaving(true);
    await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    await refresh();
    setSaving(false);
  }

  async function saveEdits() {
    setSaving(true);
    await fetch(`/api/deals/${deal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadName: editName,
        company: editCompany,
        title: editTitle,
        valueCents: Math.round(parseFloat(editValue || "0") * 100),
        probability: parseInt(editProbability || "0", 10),
        notes: editNotes,
      }),
    });
    await refresh();
    setDirty(false);
    setSaving(false);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    await fetch(`/api/deals/${deal.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NOTE", title: noteText.trim().slice(0, 100), detail: noteText.trim() }),
    });
    setNoteText("");
    await refresh();
    setSaving(false);
  }

  async function deleteDeal() {
    if (!confirm("Delete this deal? This cannot be undone.")) return;
    await fetch(`/api/deals/${deal.id}`, { method: "DELETE" });
    router.push("/dashboard/deals");
  }

  return (
    <div className="p-6 lg:p-8 min-h-screen" style={{ background: "#000" }}>
      <Link href="/dashboard/deals" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to pipeline
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-white tracking-tight">
              {deal.leadName || deal.leadEmail}
            </h1>
            {deal.sourceType !== "manual" && (
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>
                <Sparkles className="h-3 w-3" /> AI-sourced
              </span>
            )}
          </div>
          <div className="text-sm text-zinc-500">{deal.company || "—"} · {deal.leadEmail}</div>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <button onClick={saveEdits} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl"
              style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
              <Save className="h-4 w-4" /> Save changes
            </button>
          )}
          <button onClick={deleteDeal} className="px-3 py-2 text-sm font-bold rounded-xl text-red-400 hover:bg-red-500/10"
            style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-6 p-1 rounded-xl"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
        {stages.map((s) => {
          const c = stageColors[s];
          const active = deal.stage === s;
          return (
            <button key={s} onClick={() => changeStage(s)} disabled={saving || active}
              className="flex-1 min-w-[80px] px-3 py-2 text-xs font-bold rounded-lg transition-all"
              style={{
                background: active ? c + "22" : "transparent",
                color: active ? "#fff" : "#71717a",
                border: active ? `1px solid ${c}55` : "1px solid transparent",
                boxShadow: active ? `0 0 12px ${c}44` : "none",
              }}>
              {stageLabels[s]}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Deal value" value={formatMoney(deal.valueCents, deal.currency)} color="#a78bfa" />
              <Stat label="Probability" value={`${deal.probability}%`} color="#06b6d4" />
              <Stat label="Forecast" value={formatMoney(deal.expectedRevenue, deal.currency)} color="#10b981" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <NumField label="Value ($)" value={editValue} onChange={markDirty(setEditValue)} />
              <NumField label="Probability (%)" value={editProbability} onChange={markDirty(setEditProbability)} />
            </div>
          </div>

          <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Lead Details</div>
            <TxtField label="Name" value={editName} onChange={markDirty(setEditName)} />
            <div className="grid grid-cols-2 gap-3">
              <TxtField label="Company" value={editCompany} onChange={markDirty(setEditCompany)} />
              <TxtField label="Title" value={editTitle} onChange={markDirty(setEditTitle)} />
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Notes</div>
            <textarea value={editNotes} onChange={(e) => markDirty(setEditNotes)(e.target.value)}
              className="w-full min-h-[100px] text-sm bg-black/40 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/40 resize-y"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              placeholder="Add context, talking points, follow-ups..." />
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-4 w-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Log activity</span>
            </div>
            <div className="flex gap-2">
              <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Sent pricing PDF, waiting on procurement…"
                className="flex-1 text-sm bg-black/40 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/40"
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} />
              <button onClick={addNote} disabled={saving || !noteText.trim()}
                className="px-4 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a78bfa)" }}>
                Log
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-bold text-white">Attribution Source</span>
            </div>
            {agent ? (
              <Link href={`/dashboard/agents/${agent.id}`} className="block mb-2 p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1"><Bot className="h-3 w-3" /> AI Employee</div>
                <div className="text-sm font-bold text-white">{agent.name}</div>
                <div className="text-xs text-zinc-500">{agent.role}</div>
              </Link>
            ) : (
              <div className="text-xs text-zinc-600 italic">No AI agent attributed</div>
            )}
            {campaign && (
              <Link href={`/dashboard/campaigns/${campaign.id}`} className="block mb-2 p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                style={{ background: "rgba(6,182,212,0.06)", border: "1px solid rgba(6,182,212,0.15)" }}>
                <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1"><Megaphone className="h-3 w-3" /> Campaign</div>
                <div className="text-sm font-bold text-white">{campaign.name}</div>
              </Link>
            )}
            {reply && (
              <Link href={`/dashboard/inbox`} className="block p-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.15)" }}>
                <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-wider mb-1"><Flame className="h-3 w-3" /> Triggering Reply</div>
                <div className="text-sm font-bold text-white truncate">{reply.subject || "(no subject)"}</div>
                <div className="text-xs text-zinc-500">Intent: {reply.intent} · Score {reply.score}</div>
              </Link>
            )}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-violet-400" />
              <span className="text-sm font-bold text-white">Activity Timeline</span>
              <span className="text-xs text-zinc-500">({events.length})</span>
            </div>
            {events.length === 0 ? (
              <div className="text-xs text-zinc-600 italic">No activity yet.</div>
            ) : (
              <ol className="space-y-3 relative" style={{ borderLeft: "1px solid rgba(255,255,255,0.05)" }}>
                {events.map((e) => {
                  const Icon = EVENT_ICONS[e.type] || Activity;
                  const c = EVENT_COLORS[e.type] || "#71717a";
                  return (
                    <li key={e.id} className="pl-5 relative">
                      <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full"
                        style={{ background: c, boxShadow: `0 0 6px ${c}88` }} />
                      <div className="flex items-start gap-2">
                        <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: c }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-white truncate">{e.title}</div>
                          {e.detail && <div className="text-[11px] text-zinc-500 line-clamp-3 mt-0.5">{e.detail}</div>}
                          <div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(e.createdAt).toLocaleString()}
                            {e.source !== "internal" && (
                              <span className="px-1.5 rounded-full" style={{ background: c + "22", color: c }}>{e.source}</span>
                            )}
                            {e.valueCents > 0 && (
                              <span className="font-bold text-emerald-400">+{formatMoney(e.valueCents)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color }}>{label}</div>
      <div className="text-xl font-black text-white tracking-tight">{value}</div>
    </div>
  );
}

function TxtField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm bg-black/40 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/40"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
    </label>
  );
}

function NumField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm bg-black/40 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/40"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }} />
    </label>
  );
}
