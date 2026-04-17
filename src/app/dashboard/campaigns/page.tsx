"use client";

import { useState, useEffect } from "react";
import { Play, Trash2, Plus, RefreshCw } from "lucide-react";

interface Agent { id: string; name: string; role: string; }
interface Campaign {
  id: string; name: string; agentId: string; sheetUrl: string;
  status: string; results: string; schedule?: string; createdAt: string;
}
interface LeadResult { lead: string; status: string; output?: string; error?: string; }

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
    if (!form.name || !form.agentId || !form.sheetUrl) {
      setError("All fields are required"); return;
    }
    setLoading(true); setError("");
    const r = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: id }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error || "Campaign failed");
    await loadCampaigns();
    setRunningId(null);
  }

  async function deleteCampaign(id: string) {
    await fetch("/api/campaigns", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await loadCampaigns();
    if (selected?.id === id) setSelected(null);
  }

  const statusColor = (s: string) =>
    s === "done" ? "text-emerald-400" : s === "error" ? "text-red-400" : s === "running" ? "text-yellow-400" : "text-muted";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campaigns</h1>
          <p className="text-sm text-muted mt-1">Import leads from Google Sheets → AI writes emails → Sends automatically</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" /> New Campaign
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
      )}

      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-semibold">Create Campaign</h2>
          <div>
            <label className="label">Campaign Name</label>
            <input className="input mt-1" placeholder="e.g. Cold Outreach April" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">AI Agent</label>
            <select className="input mt-1" value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}>
              <option value="">Select an agent...</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name} — {a.role}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Google Sheet URL</label>
            <input className="input mt-1" placeholder="https://docs.google.com/spreadsheets/d/..."
              value={form.sheetUrl} onChange={e => setForm({ ...form, sheetUrl: e.target.value })} />
            <p className="text-xs text-muted mt-1">Sheet must have columns: name, email, company. Share as "Anyone with the link can view".</p>
          </div>
          <div>
            <label className="label">Auto-Schedule (optional)</label>
            <select className="input mt-1" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}>
              <option value="">Manual only</option>
              <option value="daily">Every day at 9am</option>
              <option value="weekly">Every Monday at 9am</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={createCampaign} disabled={loading}>
              {loading ? "Creating..." : "Create Campaign"}
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {campaigns.length === 0 && !showForm && (
        <div className="card text-center py-12 text-muted">
          <p>No campaigns yet.</p>
          <p className="text-sm mt-1">Create one to start sending AI-powered emails from a Google Sheet.</p>
        </div>
      )}

      <div className="grid gap-4">
        {campaigns.map(c => {
          const results: LeadResult[] = (() => { try { return JSON.parse(c.results); } catch { return []; } })();
          const sent = results.filter(r => r.status === "sent").length;
          const failed = results.filter(r => r.status === "error").length;

          return (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="text-xs text-muted mt-1">
                    Agent: {agents.find(a => a.id === c.agentId)?.name || c.agentId}
                    {c.schedule && ` · ${c.schedule}`}
                  </p>
                  <p className="text-xs text-muted mt-1 truncate max-w-md">{c.sheetUrl}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${statusColor(c.status)}`}>{c.status}</span>
                  <button
                    className="btn-primary flex items-center gap-1 text-xs py-1 px-3"
                    onClick={() => runCampaign(c.id)}
                    disabled={runningId === c.id}
                  >
                    {runningId === c.id
                      ? <><RefreshCw className="h-3 w-3 animate-spin" /> Running...</>
                      : <><Play className="h-3 w-3" /> Run</>}
                  </button>
                  <button className="text-muted hover:text-red-400" onClick={() => deleteCampaign(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {results.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-muted">{sent} sent · {failed} failed · {results.length} total</p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {results.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs rounded bg-bg p-2">
                        <span className={r.status === "sent" ? "text-emerald-400" : "text-red-400"}>
                          {r.status === "sent" ? "✓" : "✗"}
                        </span>
                        <span className="text-muted">{r.lead}</span>
                        {r.error && <span className="text-red-400">{r.error}</span>}
                        {r.output && (
                          <button className="text-accent-2 underline ml-auto" onClick={() => setSelected(c)}>
                            View
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Output modal */}
      {selected && (() => {
        const results: LeadResult[] = (() => { try { return JSON.parse(selected.results); } catch { return []; } })();
        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-panel border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold">{selected.name} — Results</h2>
                <button onClick={() => setSelected(null)} className="text-muted hover:text-white">✕</button>
              </div>
              {results.map((r, i) => (
                <div key={i} className="border border-border rounded p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={r.status === "sent" ? "text-emerald-400 text-xs" : "text-red-400 text-xs"}>{r.status}</span>
                    <span className="text-sm font-medium">{r.lead}</span>
                  </div>
                  {r.output && <pre className="text-xs text-muted whitespace-pre-wrap">{r.output}</pre>}
                  {r.error && <p className="text-xs text-red-400">{r.error}</p>}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
