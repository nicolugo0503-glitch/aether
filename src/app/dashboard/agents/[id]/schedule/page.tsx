"use client";

import { useActionState, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { saveSchedule, ScheduleFormState } from "./actions";
import { ChevronLeft, Clock, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

/* ─── tiny hook to load agent data from the DB via a server route ─────── */
function useAgent(id: string) {
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/agents/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setAgent(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  return { agent, loading };
}

const FIELD: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
  color: "#e4e4e7", outline: "none", boxSizing: "border-box", fontFamily: "inherit",
};

const TIMEZONES = [
  "UTC","America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "America/Toronto","America/Sao_Paulo","Europe/London","Europe/Paris","Europe/Berlin",
  "Europe/Madrid","Europe/Rome","Asia/Tokyo","Asia/Shanghai","Asia/Singapore",
  "Asia/Kolkata","Asia/Dubai","Australia/Sydney","Pacific/Auckland",
];

const CRON_OPTIONS = [
  { value: "daily",     label: "Daily",        desc: "Runs every 24 hours" },
  { value: "every2days",label: "Every 2 days",  desc: "Runs every 48 hours" },
  { value: "weekly",    label: "Weekly",        desc: "Runs every 7 days" },
];

export default function AgentSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const agentId = String(params.id);

  const { agent, loading } = useAgent(agentId);

  const boundAction = saveSchedule.bind(null, agentId);
  const [state, formAction, pending] = useActionState<ScheduleFormState, FormData>(
    boundAction,
    {}
  );

  // Local form state (controlled for toggles/selects)
  const [enabled, setEnabled]   = useState(false);
  const [cron,    setCron]      = useState("daily");
  const [tz,      setTz]        = useState("UTC");

  // Populate once agent loads
  useEffect(() => {
    if (agent) {
      setEnabled(agent.scheduleEnabled ?? false);
      setCron(agent.scheduleCron ?? "daily");
      setTz(agent.scheduleTimezone ?? "UTC");
    }
  }, [agent]);

  const isPaidPlan = agent?.user?.plan && agent.user.plan !== "FREE";

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 20px" }}>
      {/* Back link */}
      <Link
        href={`/dashboard/agents/${agentId}`}
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#a1a1aa",
                 fontSize: 13, textDecoration: "none", marginBottom: 28 }}
      >
        <ChevronLeft size={16} /> Back to agent
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                        display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={20} color="#fff" />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fafafa" }}>
            Scheduled Runs
          </h1>
        </div>
        <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14 }}>
          {loading ? "Loading…" : agent ? `Configure automatic runs for "${agent.name}"` : "Agent not found"}
        </p>
      </div>

      {/* Upgrade gate */}
      {!loading && agent && !isPaidPlan && (
        <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)",
                      borderRadius: 12, padding: "16px 20px", marginBottom: 24,
                      display: "flex", alignItems: "flex-start", gap: 12 }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ color: "#f59e0b", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              Starter plan required
            </div>
            <div style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 10 }}>
              Scheduled runs are available on STARTER and above. Upgrade to automate your agents.
            </div>
            <Link href="/dashboard/billing"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                       background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff",
                       borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              <Zap size={14} /> Upgrade now
            </Link>
          </div>
        </div>
      )}

      {/* Form */}
      {!loading && agent && (
        <form action={formAction}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", gap: 22 }}>

            {/* Enable toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "#fafafa", fontWeight: 600, fontSize: 15 }}>Enable automatic runs</div>
                <div style={{ color: "#a1a1aa", fontSize: 13, marginTop: 2 }}>
                  When on, this agent runs on the schedule below — even without you.
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
                <input
                  type="checkbox"
                  name="scheduleEnabled"
                  checked={enabled}
                  onChange={e => setEnabled(e.target.checked)}
                  disabled={!isPaidPlan}
                  style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
                />
                <div style={{
                  width: 44, height: 24, borderRadius: 12, transition: "background 0.2s",
                  background: enabled && isPaidPlan ? "#7c3aed" : "rgba(255,255,255,0.1)",
                  position: "relative", cursor: isPaidPlan ? "pointer" : "not-allowed",
                }}>
                  <div style={{
                    position: "absolute", top: 3, left: enabled ? 23 : 3, width: 18, height: 18,
                    borderRadius: "50%", background: "#fff", transition: "left 0.2s",
                  }} />
                </div>
              </label>
            </div>

            {/* Frequency */}
            <div>
              <label style={{ display: "block", color: "#d4d4d8", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Run frequency
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
                {CRON_OPTIONS.map(opt => (
                  <label key={opt.value} style={{
                    border: `2px solid ${cron === opt.value ? "#7c3aed" : "rgba(255,255,255,0.1)"}`,
                    borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                    background: cron === opt.value ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
                    transition: "all 0.15s",
                  }}>
                    <input
                      type="radio"
                      name="scheduleCron"
                      value={opt.value}
                      checked={cron === opt.value}
                      onChange={() => setCron(opt.value)}
                      style={{ display: "none" }}
                    />
                    <div style={{ color: "#fafafa", fontWeight: 600, fontSize: 13 }}>{opt.label}</div>
                    <div style={{ color: "#71717a", fontSize: 11, marginTop: 3 }}>{opt.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Default prompt */}
            <div>
              <label style={{ display: "block", color: "#d4d4d8", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Default prompt{" "}
                <span style={{ color: "#71717a", fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                name="scheduleInput"
                rows={4}
                placeholder="Leave blank to use 'Run your scheduled task.' or write a custom prompt here…"
                defaultValue={agent.scheduleInput ?? ""}
                style={{ ...FIELD, resize: "vertical" }}
              />
              <p style={{ margin: "6px 0 0", color: "#71717a", fontSize: 12 }}>
                This prompt is sent to the agent on every scheduled run.
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label style={{ display: "block", color: "#d4d4d8", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
                Timezone
              </label>
              <select
                name="scheduleTimezone"
                value={tz}
                onChange={e => setTz(e.target.value)}
                style={{ ...FIELD, cursor: "pointer" }}
              >
                {TIMEZONES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p style={{ margin: "6px 0 0", color: "#71717a", fontSize: 12 }}>
                Displayed for reference — Vercel cron runs in UTC.
              </p>
            </div>

            {/* Status / feedback */}
            {state.error && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                            borderRadius: 10, padding: "12px 16px", color: "#ef4444", fontSize: 13,
                            display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} /> {state.error}
              </div>
            )}
            {state.success && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
                            borderRadius: 10, padding: "12px 16px", color: "#10b981", fontSize: 13,
                            display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={14} /> {state.success}
              </div>
            )}

            {/* Next run info */}
            {agent.scheduleEnabled && agent.scheduleNextRun && (
              <div style={{ color: "#71717a", fontSize: 12 }}>
                Next scheduled run:{" "}
                <span style={{ color: "#a1a1aa" }}>
                  {new Date(agent.scheduleNextRun).toLocaleString()}
                </span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={pending || !isPaidPlan}
              style={{
                padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14,
                background: isPaidPlan ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "rgba(255,255,255,0.06)",
                color: isPaidPlan ? "#fff" : "#71717a",
                border: "none", cursor: isPaidPlan ? "pointer" : "not-allowed",
                opacity: pending ? 0.6 : 1, transition: "opacity 0.2s",
                alignSelf: "flex-end",
              }}
            >
              {pending ? "Saving…" : "Save schedule"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
