"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Trash2, Plus, RefreshCw, Megaphone, ChevronDown, ChevronUp, Mail, CheckCircle2, XCircle, Loader2, Clock, Users, Zap, Target, TrendingUp, Radio } from "lucide-react";

interface Agent { id: string; name: string; role: string; }
interface Campaign {
  id: string; name: string; agentId: string; sheetUrl: string;
  status: string; results: string; schedule?: string; createdAt: string;
}
interface LeadResult { lead: string; status: string; output?: string; error?: string; }

/* ── Animated arc progress ring ── */
function MissionRing({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 6px ${color})`, transition:"stroke-dasharray 1s ease" }}
      />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize={size * 0.22} fontWeight="900" fontFamily="inherit">
        {pct}%
      </text>
    </svg>
  );
}

/* ── Pulse dot ── */
function PulseDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: color }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "done") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold"
      style={{ background:"rgba(16,185,129,0.12)", color:"#10b981", border:"1px solid rgba(16,185,129,0.3)", boxShadow:"0 0 12px rgba(16,185,129,0.15)" }}>
      <CheckCircle2 className="h-3 w-3" />DONE
    </span>
  );
  if (status === "error") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold"
      style={{ background:"rgba(239,68,68,0.12)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)", boxShadow:"0 0 12px rgba(239,68,68,0.15)" }}>
      <XCircle className="h-3 w-3" />ERROR
    </span>
  );
  if (status === "running") return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold"
      style={{ background:"rgba(245,158,11,0.12)", color:"#f59e0b", border:"1px solid rgba(245,158,11,0.3)", boxShadow:"0 0 12px rgba(245,158,11,0.15)" }}>
      <Loader2 className="h-3 w-3 animate-spin" />RUNNING
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold"
      style={{ background:"rgba(255,255,255,0.04)", color:"#71717a", border:"1px solid rgba(255,255,255,0.1)" }}>
      <Clock className="h-3 w-3" />IDLE
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

  const totalLeads = campaigns.reduce((acc, c) => {
    try { return acc + JSON.parse(c.results).length; } catch { return acc; }
  }, 0);
  const totalSent = campaigns.reduce((acc, c) => {
    try { return acc + JSON.parse(c.results).filter((r: LeadResult) => r.status === "sent").length; } catch { return acc; }
  }, 0);
  const activeCount = campaigns.filter(c => c.status === "running").length;
  const doneCount = campaigns.filter(c => c.status === "done").length;
  const overallRate = totalLeads ? Math.round((totalSent / totalLeads) * 100) : 0;

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes camp-in{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes top-flow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes stat-pop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
        @keyframes radar-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes lead-in{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        .camp-card{animation:camp-in 0.4s ease both}
        .camp-card:hover{transform:translateY(-3px)!important;box-shadow:0 20px 60px rgba(0,0,0,0.5)!important;transition:all 0.3s ease}
        .run-btn:hover:not(:disabled){box-shadow:0 0 28px rgba(124,58,237,0.55)!important;filter:brightness(1.15)}
        .run-btn:disabled{opacity:0.45;cursor:not-allowed}
        .stat-card{animation:stat-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both}
        .top-bar{animation:top-flow 4s ease infinite;background-size:200% 200%}
        .lead-row{animation:lead-in 0.25s ease both}
      `}</style>

      {/* ── Animated top bar ── */}
      <div className="h-0.5 w-full rounded-full top-bar"
        style={{ background:"linear-gradient(90deg,#7c3aed,#ec4899,#f59e0b,#10b981,#7c3aed)" }} />

      {/* ── Hero Header ── */}
      <div className="relative rounded-3xl overflow-hidden p-8"
        style={{
          background:"linear-gradient(135deg,rgba(236,72,153,0.08) 0%,rgba(4,4,8,0.98) 50%,rgba(124,58,237,0.08) 100%)",
          border:"1px solid rgba(236,72,153,0.15)",
          backgroundImage:"radial-gradient(rgba(236,72,153,.08) 1px,transparent 1px)",
          backgroundSize:"32px 32px",
        }}>
        <div className="relative z-10 flex items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,rgba(236,72,153,0.25),rgba(236,72,153,0.1))", border:"1px solid rgba(236,72,153,0.35)", boxShadow:"0 0 24px rgba(236,72,153,0.2)" }}>
                <Radio className="h-6 w-6" style={{ color:"#ec4899" }} />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-pink-500 mb-0.5">Mission Control</div>
                <h1 className="text-4xl font-black text-white tracking-tight leading-none">
                  {campaigns.length.toLocaleString()}
                  <span className="text-zinc-600 text-2xl font-bold ml-2">campaigns</span>
                </h1>
              </div>
            </div>
            <p className="text-zinc-500 text-sm ml-15">Leads in → AI writes → Emails delivered automatically.</p>
          </div>

          <div className="flex items-center gap-8">
            {[
              { label:"Active", val: activeCount, color:"#f59e0b" },
              { label:"Done", val: doneCount, color:"#10b981" },
              { label:"Delivery", val: `${overallRate}%`, color:"#ec4899" },
            ].map((s,i) => (
              <div key={s.label} className="stat-card text-center" style={{ animationDelay:`${i*0.1}s` }}>
                <div className="text-3xl font-black tabular-nums" style={{ color:s.color, textShadow:`0 0 20px ${s.color}60` }}>{s.val}</div>
                <div className="text-xs uppercase tracking-widest text-zinc-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="shrink-0 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition-all hover:scale-105"
            style={{ background:"linear-gradient(135deg,#ec4899,#be185d)", boxShadow:"0 0 24px rgba(236,72,153,0.35)" }}>
            <Plus className="h-4 w-4" />New Campaign
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-2xl px-5 py-3 flex items-center gap-3"
          style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", boxShadow:"0 0 20px rgba(239,68,68,0.08)" }}>
          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      )}

      {/* ── Create Form ── */}
      {showForm && (
        <div className="rounded-3xl overflow-hidden"
          style={{ background:"rgba(4,4,8,0.95)", border:"1px solid rgba(236,72,153,0.25)", boxShadow:"0 0 60px rgba(236,72,153,0.08)" }}>
          <div className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(236,72,153,0.05)" }}>
            <div className="h-7 w-7 rounded-xl flex items-center justify-center"
              style={{ background:"rgba(236,72,153,0.2)", border:"1px solid rgba(236,72,153,0.3)" }}>
              <Mail className="h-3.5 w-3.5" style={{ color:"#ec4899" }} />
            </div>
            <h2 className="font-bold text-white">Launch New Campaign</h2>
            <span className="ml-auto text-xs text-pink-500 flex items-center gap-1.5">
              <PulseDot color="#ec4899" />live setup
            </span>
          </div>
          <div className="p-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Campaign Name</label>
              <input className="input" placeholder="e.g. Cold Outreach — Q2 2025" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">AI Agent</label>
              <select className="input" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}>
                <option value="">Select an agent...</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Google Sheet URL</label>
              <input className="input" placeholder="https://docs.google.com/spreadsheets/d/..."
                value={form.sheetUrl} onChange={e => setForm({ ...form, sheetUrl: e.target.value })} />
              <p className="text-xs text-zinc-700 mt-1">Sheet must have columns: name, email, company. Share publicly as &quot;view only&quot;.</p>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Auto-Schedule</label>
              <select className="input" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}>
                <option value="">Manual only</option>
                <option value="daily">Every day at 9am</option>
                <option value="weekly">Every Monday at 9am</option>
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button onClick={createCampaign} disabled={loading}
                className="flex-1 run-btn flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background:"linear-gradient(135deg,#ec4899,#be185d)", boxShadow:"0 0 20px rgba(236,72,153,0.25)" }}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Launching...</>
                ) : <><Target className="h-4 w-4" />Launch Campaign</>}
              </button>
              <button onClick={() => setShowForm(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-500 hover:text-white transition-all"
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {campaigns.length === 0 && !showForm && (
        <div className="rounded-3xl py-20 text-center relative overflow-hidden"
          style={{ background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(236,72,153,0.15)" }}>
          <div className="absolute inset-0" style={{
            backgroundImage:"radial-gradient(rgba(236,72,153,.04) 1px,transparent 1px)",
            backgroundSize:"24px 24px",
          }} />
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
              style={{ background:"linear-gradient(135deg,rgba(236,72,153,0.15),rgba(236,72,153,0.05))", border:"1px solid rgba(236,72,153,0.25)", boxShadow:"0 0 40px rgba(236,72,153,0.1)" }}>
              <Megaphone className="h-9 w-9" style={{ color:"#ec4899" }} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">No campaigns deployed</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-6">
              Launch your first campaign to start sending AI-powered personalized emails from a Google Sheet.
            </p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background:"linear-gradient(135deg,#ec4899,#be185d)", boxShadow:"0 0 24px rgba(236,72,153,0.3)" }}>
              <Plus className="h-4 w-4" />Launch First Campaign
            </button>
          </div>
        </div>
      )}

      {/* ── Campaign Cards ── */}
      <div className="space-y-4">
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
              style={{
                animationDelay:`${i * 0.07}s`,
                background:"rgba(4,4,8,0.9)",
                border: c.status === "running"
                  ? "1px solid rgba(245,158,11,0.4)"
                  : c.status === "done"
                  ? "1px solid rgba(16,185,129,0.25)"
                  : "1px solid rgba(255,255,255,0.07)",
                boxShadow: c.status === "running" ? "0 0 30px rgba(245,158,11,0.08)" : "none",
              }}>

              {/* Running indicator bar */}
              {c.status === "running" && (
                <div className="h-0.5 w-full"
                  style={{ background:"linear-gradient(90deg,#f59e0b,#ec4899,#7c3aed)", animation:"top-flow 2s ease infinite", backgroundSize:"200% 200%" }} />
              )}

              <div className="p-6">
                <div className="flex items-start gap-5">
                  {/* Progress ring */}
                  <div className="shrink-0">
                    <MissionRing pct={sentPct}
                      color={c.status === "done" ? "#10b981" : c.status === "running" ? "#f59e0b" : "#7c3aed"} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-black text-white text-lg truncate">{c.name}</h3>
                      <StatusPill status={c.status} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-600 mb-3">
                      {c.schedule && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-violet-500" />{c.schedule}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3 w-3 text-zinc-500" />{total} leads
                      </span>
                      {sent > 0 && (
                        <span className="flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />{sent} delivered
                        </span>
                      )}
                      {failed > 0 && (
                        <span className="flex items-center gap-1.5 text-red-400">
                          <XCircle className="h-3 w-3" />{failed} failed
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    {total > 0 && (
                      <div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{
                              width:`${sentPct}%`,
                              background: c.status === "done"
                                ? "linear-gradient(90deg,#10b981,#059669)"
                                : "linear-gradient(90deg,#ec4899,#7c3aed)",
                              boxShadow: c.status === "done"
                                ? "0 0 8px rgba(16,185,129,0.5)"
                                : "0 0 8px rgba(236,72,153,0.5)",
                            }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => runCampaign(c.id)} disabled={!!runningId}
                      className="run-btn flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all"
                      style={{ background:"linear-gradient(135deg,#ec4899,#be185d)", boxShadow:"0 0 14px rgba(236,72,153,0.25)" }}>
                      {isRunning ? (
                        <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Running</>
                      ) : (
                        <><Zap className="h-3.5 w-3.5" />Fire</>
                      )}
                    </button>
                    <button onClick={() => setSelected(isExpanded ? null : c)}
                      className="rounded-xl p-2 text-zinc-600 hover:text-white transition-all"
                      style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
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

              {/* ── Expanded Results ── */}
              {isExpanded && (
                <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", background:"rgba(0,0,0,0.4)" }}>
                  <div className="px-6 py-3 flex items-center gap-2"
                    style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                    <TrendingUp className="h-3.5 w-3.5 text-pink-500" />
                    <span className="text-xs uppercase tracking-widest text-zinc-600">Lead Results</span>
                    <span className="ml-auto text-xs text-zinc-700">{results.length} leads</span>
                  </div>
                  {results.length === 0 ? (
                    <div className="px-6 py-8 text-center text-sm text-zinc-700">No results yet — run the campaign first.</div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor:"rgba(255,255,255,0.03)" }}>
                      {results.map((r, idx) => (
                        <div key={idx} className="lead-row px-6 py-3 flex items-start gap-3" style={{ animationDelay:`${idx*0.03}s` }}>
                          <div className="shrink-0 mt-0.5">
                            {r.status === "sent"
                              ? <PulseDot color="#10b981" />
                              : <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-200 font-medium truncate">{r.lead}</p>
                            {r.error && <p className="text-xs text-red-400 mt-0.5 truncate">{r.error}</p>}
                            {r.output && <p className="text-xs text-zinc-600 mt-0.5 line-clamp-1">{r.output}</p>}
                          </div>
                       