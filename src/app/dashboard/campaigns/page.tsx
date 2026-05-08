"use client";

import { useState, useEffect } from "react";
import { Play, Trash2, Plus, RefreshCw, Megaphone, ChevronDown, ChevronUp, Mail, CheckCircle2, XCircle, Loader2, Clock, Users, Zap } from "lucide-react";

interface Agent { id: string; name: string; role: string; }
interface Campaign {
  id: string; name: string; agentId: string; sheetUrl: string;
  status: string; results: string; schedule?: string; createdAt: string;
}
interface LeadResult { lead: string; status: string; output?: string; error?: string; }

function StatusBadge({ status }: { status: string }) {
  if (status === "done") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(16,185,129,0.1)", color:"#10b981", border:"1px solid rgba(16,185,129,0.2)" }}>
      <CheckCircle2 className="h-3 w-3" />done
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.2)" }}>
      <XCircle className="h-3 w-3" />error
    </span>
  );
  if (status === "running") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(245,158,11,0.1)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.2)" }}>
      <Loader2 className="h-3 w-3 animate-spin" />running
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
      style={{ background:"rgba(255,255,255,0.04)", color:"#71717a", border:"1px solid rgba(255,255,255,0.08)" }}>
      <Clock className="h-3 w-3" />{status || "idle"}
    </span>
  );
}

export default function CampaignsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: "", agentId: "", sheetUrl: "", schedule: "" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/agents").then(r => r.json()).then(d => setAgents(d.agents || d || []));
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    const r = await fetch("/api/campaigns");
    const d = await r.json();
    setCampaigns(Array.isArray(d) ? d : []);
  }

  async function createCampaign() {
    if (!form.name || !form.agentId || !form.sheetUrl) { setError("All fields are required"); return; }
    setLoading(true); setError("");
    const r = await fetch("/api/campaigns", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok) { setError(d.error); setLoading(false); return; }
    setShowForm(false);
    setForm({ name: "", agentId: "", sheetUrl: "", schedule: "" });
    await loadCampaigns();
    setLoading(false);
  }

  async function runCampaign(id: string) {
    setRunningId(id); setError("");
    const r = await fetch("/api/campaigns/run", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: id }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error || "Campaign failed");
    await loadCampaigns();
    setRunningId(null);
  }

  async function deleteCampaign(id: string) {
    await fetch("/api/campaigns", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    await loadCampaigns();
    if (selected?.id === id) setSelected(null);
  }

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes camp-enter{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .camp-card{animation:camp-enter 0.35s ease both}
        .run-btn:hover{box-shadow:0 0 20px rgba(124,58,237,0.4)!important;filter:brightness(1.1)}
        .run-btn:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))", border:"1px solid rgba(124,58,237,0.25)" }}>
            <Megaphone style={{ width:18, height:18 }} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Campaigns</h1>
            <p className="text-sm text-zinc-500">Import leads → AI writes emails → Sends automatically.</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow:"0 0 16px rgba(124,58,237,0.25)" }}>
          <Plus className="h-4 w-4" />New Campaign
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl px-5 py-3 flex items-center gap-3"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)" }}>
          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* ── Create Form ── */}
      {showForm && (
        <div className="rounded-3xl overflow-hidden"
          style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(124,58,237,0.18)" }}>
          <div className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(124,58,237,0.05)" }}>
            <Mail className="h-4 w-4 text-violet-400" />
            <h2 className="font-bold text-white">Create Campaign</h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Campaign Name</label>
              <input className="input" placeholder="e.g. Cold Outreach April" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">AI Agent</label>
              <select className="input" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}>
                <option value="">Select an agent...</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Google Sheet URL</label>
              <input className="input" placeholder="https://docs.google.com/spreadsheets/d/..."
                value={form.sheetUrl} onChange={e => setForm({ ...form, sheetUrl: e.target.value })} />
              <p className="text-xs text-zinc-700 mt-1">Sheet must have columns: name, email, company. Share as "Anyone with the link can view".</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Auto-Schedule</label>
              <select className="input" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}>
                <option value="">Manual only</option>
                <option value="daily">Every day at 9am</option>
                <option value="weekly">Every Monday at 9am</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={createCampaign} disabled={loading}
                className="rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                {loading ? (
                  <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Creating...</span>
                ) : "Create Campaign"}
              </button>
              <button onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition-all"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {campaigns.length === 0 && !showForm && (
        <div className="rounded-3xl py-16 text-center"
          style={{ background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(255,255,255,0.08)" }}>
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)" }}>
            <Megaphone className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">No campaigns yet</h3>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto">
            Create one to start sending AI-powered emails from a Google Sheet.
          </p>
        </div>
      )}

      {/* ── Campaign Cards ── */}
      <div className="space-y-3">
        {campaigns.map((c, i) => {
          const results: LeadResult[] = (() => { try { return JSON.parse(c.results); } catch { return []; } })();
          const sent   = results.filter(r => r.status === "sent").length;
          const failed = results.filter(r => r.status === "error").length;
          const total  = results.length;
          const sentPct = total ? Math.round((sent / total) * 100) : 0;
          const isExpanded = selected?.id === c.id;
          const isRunning  = runningId === c.id;

          return (
            <div key={c.id} className="camp-card rounded-3xl overflow-hidden"
              style={{ animationDelay:`${i * 0.05}s`, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-white truncate">{c.name}</h3>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-600">
                      {c.schedule && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />{c.schedule}
                        </span>
                      )}
                      {total > 0 && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />{total} leads
                        </span>
                      )}
                      {sent > 0 && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <Mail className="h-3 w-3" />{sent} sent
                        </span>
                      )}
                      {failed > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                          <XCircle className="h-3 w-3" />{failed} failed
                        </span>
                      )}
                    </div>

                    {total > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-zinc-700 mb-1">
                          <span>Delivery</span>
                          <span>{sentPct}%</span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width:`${sentPct}%`, background:"linear-gradient(90deg,#7c3aed,#6d28d9)" }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => runCampaign(c.id)} disabled={!!runningId}
                      className="run-btn flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-all"
                      style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow:"0 0 12px rgba(124,58,237,0.2)" }}>
                      {isRunning ? (
                        <><RefreshCw className="h-3 w-3 animate-spin" />Running</>
                      ) : (
                        <><Zap className="h-3 w-3" />Run</>
                      )}
                    </button>
                    <button onClick={() => setSelected(isExpanded ? null : c)}
                      className="rounded-xl p-2 text-zinc-600 hover:text-white transition-all"
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => deleteCampaign(c.id)}
                      className="rounded-xl p-2 text-zinc-700 hover:text-red-400 transition-all"
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Results Expand ── */}
              {isExpanded && results.length > 0 && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(0,0,0,0.3)" }}>
                  <div className="px-5 py-3 text-xs uppercase tracking-widest text-zinc-700">Lead Results</div>
                  <div className="max-h-64 overflow-y-auto divide-y" style={{ borderColor:"rgba(255,255,255,0.04)" }}>
                    {results.map((r, idx) => (
                      <div key={idx} className="px-5 py-2.5 flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {r.status === "sent"
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            : <XCircle className="h-3.5 w-3.5 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 truncate">{r.lead}</p>
                          {r.error && <p className="text-xs text-red-400 mt-0.5 truncate">{r.error}</p>}
                          {r.output && <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{r.output}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
