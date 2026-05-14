"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Play, Save, Trash2, Plus, ChevronUp, ChevronDown,
  Webhook, Calendar, Zap, Copy, AlertCircle, CheckCircle2,
  Sparkles, Bot, Workflow as WorkflowIcon, ArrowRight,
  Clock, GitBranch, Activity, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

type WorkflowStep = {
  id: string;
  agentId: string;
  name: string;
  inputTemplate: string;
  stopOnError?: boolean;
  condition?: {
    kind: "contains" | "notContains" | "matches";
    value: string;
    target?: string;
  };
};

type AgentLite = {
  id: string;
  name: string;
  role: string;
  model: string;
};

type RecentRun = {
  id: string;
  status: string;
  input: string;
  output: string | null;
  totalCostCents: number;
  totalTokensIn: number;
  totalTokensOut: number;
  durationMs: number;
  triggeredBy: string;
  createdAt: string;
  finishedAt: string | null;
  stepResults: string;
};

type StepResult = {
  stepId: string;
  agentId: string;
  agentName: string;
  input: string;
  output: string;
  status: "success" | "error" | "skipped";
  error?: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  durationMs: number;
};

type Initial = {
  name: string;
  description: string | null;
  status: string;
  trigger: string;
  steps: WorkflowStep[];
  scheduleEnabled: boolean;
  scheduleCron: string | null;
  scheduleInput: string | null;
  webhookToken: string | null;
  totalRuns: number;
  successfulRuns: number;
  totalCostCents: number;
};

// ── Helpers ────────────────────────────────────────────────────────

function newStepId() {
  return `s_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

const TRIGGER_OPTIONS = [
  { id: "manual",   label: "Manual",    desc: "Run from this dashboard", icon: Play },
  { id: "schedule", label: "Schedule",  desc: "Run automatically on a cron", icon: Calendar },
  { id: "webhook",  label: "Webhook",   desc: "Run via authenticated HTTP POST", icon: Webhook },
] as const;

const CRON_OPTIONS = [
  { id: "daily",      label: "Every day" },
  { id: "every2days", label: "Every 2 days" },
  { id: "weekly",     label: "Every week" },
] as const;

function fmtMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function fmtCents(c: number) {
  return `$${(c / 100).toFixed(c < 100 ? 3 : 2)}`;
}

function statusColor(s: string): { fg: string; bg: string } {
  switch (s) {
    case "success": return { fg: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    case "running": return { fg: "#a78bfa", bg: "rgba(167,139,250,0.12)" };
    case "partial": return { fg: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    case "error":   return { fg: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    case "skipped": return { fg: "#71717a", bg: "rgba(113,113,122,0.12)" };
    default:        return { fg: "#a1a1aa", bg: "rgba(161,161,170,0.10)" };
  }
}

// ── Component ──────────────────────────────────────────────────────

export function WorkflowEditor({
  workflowId,
  initial,
  agents,
  recentRuns,
}: {
  workflowId: string;
  initial: Initial;
  agents: AgentLite[];
  recentRuns: RecentRun[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [name, setName]             = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [status, setStatus]         = useState(initial.status);
  const [trigger, setTrigger]       = useState(initial.trigger);
  const [steps, setSteps]           = useState<WorkflowStep[]>(initial.steps);
  const [scheduleEnabled, setScheduleEnabled] = useState(initial.scheduleEnabled);
  const [scheduleCron, setScheduleCron]       = useState<string>(initial.scheduleCron ?? "daily");
  const [scheduleInput, setScheduleInput]     = useState(initial.scheduleInput ?? "");
  const [webhookToken, setWebhookToken]       = useState(initial.webhookToken);

  const [testInput, setTestInput] = useState("");
  const [running, setRunning]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [latestResult, setLatestResult] = useState<{
    status: string;
    output: string;
    stepResults: StepResult[];
    totalCostCents: number;
    durationMs: number;
    error?: string;
  } | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const showToast = (kind: "ok" | "err", msg: string) => {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const successRate = initial.totalRuns > 0
    ? Math.round((initial.successfulRuns / initial.totalRuns) * 100)
    : null;

  // ── Step CRUD ────────────────────────────────────────────────────
  function addStep() {
    if (agents.length === 0) {
      showToast("err", "Create an AI Employee first.");
      return;
    }
    const fallbackAgent = agents[0];
    const idx = steps.length + 1;
    setSteps([
      ...steps,
      {
        id: newStepId(),
        agentId: fallbackAgent.id,
        name: `Step ${idx}`,
        inputTemplate: idx === 1 ? "{{input}}" : `{{step_${idx - 1}.output}}`,
        stopOnError: true,
      },
    ]);
  }

  function updateStep(id: string, patch: Partial<WorkflowStep>) {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
  }

  function moveStep(id: string, dir: -1 | 1) {
    setSteps(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const out = [...prev];
      [out[idx], out[target]] = [out[target], out[idx]];
      return out;
    });
  }

  // ── Save / Delete / Run ──────────────────────────────────────────
  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          status,
          trigger,
          steps,
          scheduleEnabled,
          scheduleCron: trigger === "schedule" ? scheduleCron : null,
          scheduleInput,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "save failed");
      }
      showToast("ok", "Workflow saved.");
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      showToast("err", e instanceof Error ? e.message : "save failed");
    } finally {
      setSaving(false);
    }
  }

  async function runWorkflow() {
    if (steps.length === 0) {
      showToast("err", "Add at least one step first.");
      return;
    }
    setRunning(true);
    setLatestResult(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: testInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "run failed");
      setLatestResult({
        status: data.status,
        output: data.output ?? "",
        stepResults: data.stepResults ?? [],
        totalCostCents: data.totalCostCents ?? 0,
        durationMs: data.durationMs ?? 0,
        error: data.error,
      });
      showToast(data.status === "success" ? "ok" : "err", `Run ${data.status}`);
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      showToast("err", e instanceof Error ? e.message : "run failed");
    } finally {
      setRunning(false);
    }
  }

  async function regenerateWebhook() {
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateWebhookToken: true, trigger: "webhook" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      setWebhookToken(data.workflow.webhookToken);
      showToast("ok", "Webhook token rotated.");
    } catch (e: unknown) {
      showToast("err", e instanceof Error ? e.message : "failed");
    }
  }

  async function deleteWorkflow() {
    if (!confirm("Delete this workflow? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      router.push("/dashboard/workflows");
    } catch (e: unknown) {
      showToast("err", e instanceof Error ? e.message : "delete failed");
    }
  }

  // ── Variable hints ───────────────────────────────────────────────
  const availableVars = useMemo(() => {
    const vars = ["{{input}}"];
    steps.forEach((s, i) => {
      vars.push(`{{step_${i + 1}.output}}`);
      vars.push(`{{step_${i + 1}.summary}}`);
    });
    return vars;
  }, [steps]);

  return (
    <div className="space-y-6">
      {/* ── Top bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Link
          href="/dashboard/workflows"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All workflows
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={deleteWorkflow}
            className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={runWorkflow}
            disabled={running || steps.length === 0}
            className="rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.32)",
            }}
          >
            {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Running…" : "Run now"}
          </button>
        </div>
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <div className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(0,0,0,0.4))",
          border: "1px solid rgba(124,58,237,0.18)",
        }}>
        <div className="flex items-start gap-4 mb-4">
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 0 24px rgba(124,58,237,0.4)",
            }}
          >
            <WorkflowIcon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-2xl font-black text-white bg-transparent outline-none w-full border-b border-transparent focus:border-violet-500/40 pb-1"
            />
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe what this workflow does…"
              className="mt-2 text-sm text-zinc-400 placeholder-zinc-600 bg-transparent outline-none w-full"
            />
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white outline-none cursor-pointer"
            style={{
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
            }}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/[0.05]">
          <Stat label="Steps"            value={steps.length}                accent="#a78bfa" icon={GitBranch} />
          <Stat label="Lifetime runs"    value={initial.totalRuns}           accent="#7c3aed" icon={Zap} />
          <Stat label="Success rate"     value={successRate === null ? "—" : `${successRate}%`} accent="#22c55e" icon={CheckCircle2} />
          <Stat label="Lifetime spend"   value={`$${(initial.totalCostCents / 100).toFixed(2)}`} accent="#f59e0b" icon={Activity} />
        </div>
      </div>

      {/* ── Trigger selector ────────────────────────────── */}
      <Section title="Trigger" subtitle="How this workflow starts running" icon={Sparkles}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TRIGGER_OPTIONS.map(t => {
            const Icon = t.icon;
            const active = trigger === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTrigger(t.id)}
                className="text-left rounded-xl p-4 transition-all"
                style={{
                  background: active ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${active ? "rgba(124,58,237,0.45)" : "rgba(255,255,255,0.05)"}`,
                  boxShadow: active ? "0 0 16px rgba(124,58,237,0.15)" : "none",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4" style={{ color: active ? "#a78bfa" : "#71717a" }} />
                  <span className="font-bold text-sm" style={{ color: active ? "#fff" : "#d4d4d8" }}>{t.label}</span>
                </div>
                <div className="text-xs text-zinc-500">{t.desc}</div>
              </button>
            );
          })}
        </div>

        {trigger === "schedule" && (
          <div className="mt-4 rounded-xl p-4 space-y-3"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={e => setScheduleEnabled(e.target.checked)}
                className="accent-violet-500"
              />
              <span className="text-sm font-semibold text-white">Enable scheduled runs</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block uppercase tracking-wider">Cadence</label>
                <select
                  value={scheduleCron}
                  onChange={e => setScheduleCron(e.target.value)}
                  className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  {CRON_OPTIONS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block uppercase tracking-wider">Default input</label>
                <input
                  value={scheduleInput}
                  onChange={e => setScheduleInput(e.target.value)}
                  placeholder='Becomes {{input}} for scheduled runs'
                  className="w-full rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none"
                  style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
                />
              </div>
            </div>
          </div>
        )}

        {trigger === "webhook" && (
          <div className="mt-4 rounded-xl p-4 space-y-3"
            style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Endpoint</div>
            <CopyBlock value={`POST ${typeof window !== "undefined" ? window.location.origin : ""}/api/workflows/${workflowId}/trigger`} />
            <div className="text-xs text-zinc-500 uppercase tracking-wider mt-3">Authorization header</div>
            <div className="flex gap-2">
              <CopyBlock value={webhookToken ? `Bearer ${webhookToken}` : "(save with trigger=webhook to generate)"} />
              <button
                onClick={regenerateWebhook}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
                style={{ border: "1px solid rgba(124,58,237,0.25)" }}
              >
                <RefreshCw className="h-3 w-3" />
                Rotate
              </button>
            </div>
            <div className="text-xs text-zinc-600 mt-2">
              <span className="text-violet-400 font-semibold">Body:</span>{" "}
              <code className="text-zinc-400">{`{ "input": "string passed to {{input}}" }`}</code>
            </div>
          </div>
        )}
      </Section>

      {/* ── Steps editor ────────────────────────────────── */}
      <Section title="Steps" subtitle="Agents execute top-to-bottom. Each step can reference prior outputs." icon={GitBranch}>
        {agents.length === 0 ? (
          <div className="rounded-xl p-6 text-center text-sm text-amber-400/80"
            style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <AlertCircle className="h-4 w-4 inline mr-1.5" />
            You need at least one AI Employee.{" "}
            <Link href="/dashboard/agents" className="underline">Create one →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {steps.map((step, i) => (
              <StepCard
                key={step.id}
                index={i}
                step={step}
                isFirst={i === 0}
                isLast={i === steps.length - 1}
                agents={agents}
                availableVars={availableVars}
                onChange={p => updateStep(step.id, p)}
                onRemove={() => removeStep(step.id)}
                onMoveUp={() => moveStep(step.id, -1)}
                onMoveDown={() => moveStep(step.id, 1)}
              />
            ))}
            <button
              onClick={addStep}
              className="w-full rounded-xl py-3 text-sm font-semibold text-violet-300 transition-all hover:bg-violet-500/10 flex items-center justify-center gap-2"
              style={{
                background: "rgba(124,58,237,0.04)",
                border: "1px dashed rgba(124,58,237,0.35)",
              }}
            >
              <Plus className="h-4 w-4" />
              Add step
            </button>
          </div>
        )}
      </Section>

      {/* ── Manual run / test ───────────────────────────── */}
      <Section title="Test run" subtitle='Provide an input — it becomes {{input}} for step 1' icon={Play}>
        <textarea
          value={testInput}
          onChange={e => setTestInput(e.target.value)}
          rows={3}
          placeholder="Type the trigger input here…"
          className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none font-mono"
          style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
        />
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-zinc-500">
            Uses {steps.length} runs from your monthly quota.
          </div>
          <button
            onClick={runWorkflow}
            disabled={running || steps.length === 0}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.32)",
            }}
          >
            {running ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Executing chain…" : "Execute workflow"}
          </button>
        </div>

        {latestResult && <ResultPanel result={latestResult} />}
      </Section>

      {/* ── Recent runs ─────────────────────────────────── */}
      <Section title="Recent runs" subtitle="Last 20 executions" icon={Clock}>
        {recentRuns.length === 0 ? (
          <div className="text-sm text-zinc-600 py-6 text-center">No runs yet.</div>
        ) : (
          <div className="space-y-2">
            {recentRuns.map(r => <RunRow key={r.id} run={r} />)}
          </div>
        )}
      </Section>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 rounded-xl px-4 py-3 text-sm font-semibold shadow-2xl z-50"
          style={{
            background: toast.kind === "ok" ? "rgba(34,197,94,0.95)" : "rgba(239,68,68,0.95)",
            color: "#fff",
          }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function Section({
  title, subtitle, icon: Icon, children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" style={{ color: "#a78bfa" }} />
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-zinc-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function Stat({
  label, value, accent, icon: Icon,
}: {
  label: string;
  value: string | number;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}1a`, border: `1px solid ${accent}33` }}>
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </div>
      <div>
        <div className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</div>
        <div className="text-lg font-black text-white">{value}</div>
      </div>
    </div>
  );
}

function StepCard({
  index, step, isFirst, isLast, agents, availableVars,
  onChange, onRemove, onMoveUp, onMoveDown,
}: {
  index: number;
  step: WorkflowStep;
  isFirst: boolean;
  isLast: boolean;
  agents: AgentLite[];
  availableVars: string[];
  onChange: (patch: Partial<WorkflowStep>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const agent = agents.find(a => a.id === step.agentId);
  return (
    <div className="rounded-xl p-4 relative"
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
      {/* Connector line below */}
      {!isLast && (
        <div className="absolute left-7 -bottom-3 h-3 w-px z-10"
          style={{ background: "linear-gradient(180deg, rgba(167,139,250,0.6), rgba(167,139,250,0.1))" }} />
      )}

      <div className="flex items-start gap-3">
        {/* Step number */}
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "#fff",
            boxShadow: "0 0 12px rgba(124,58,237,0.4)",
          }}
        >
          {index + 1}
        </div>

        {/* Main fields */}
        <div className="flex-1 space-y-3 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={step.name}
              onChange={e => onChange({ name: e.target.value })}
              placeholder="Step name"
              className="rounded-xl px-3 py-2 text-sm font-semibold text-white placeholder-zinc-600 outline-none"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
            <select
              value={step.agentId}
              onChange={e => onChange({ agentId: e.target.value })}
              className="rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} — {a.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-zinc-500 uppercase tracking-wider">Input template</label>
              <div className="flex gap-1 flex-wrap justify-end">
                {availableVars.slice(0, 4).map(v => (
                  <button
                    key={v}
                    onClick={() => onChange({ inputTemplate: (step.inputTemplate || "") + " " + v })}
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono text-violet-300 hover:bg-violet-500/10"
                    style={{ border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={step.inputTemplate}
              onChange={e => onChange({ inputTemplate: e.target.value })}
              rows={3}
              placeholder="e.g. Research {{input}} and summarize their tech stack."
              className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none font-mono"
              style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}
            />
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={step.stopOnError !== false}
                onChange={e => onChange({ stopOnError: e.target.checked })}
                className="accent-violet-500"
              />
              Stop chain on error
            </label>
            {agent && (
              <div className="text-[10px] text-zinc-600">
                <span className="text-violet-400">{agent.model}</span> · {agent.role}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-20"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all disabled:opacity-20"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CopyBlock({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-xs text-zinc-300"
      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <span className="truncate flex-1">{value}</span>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="text-violet-400 hover:text-violet-300 shrink-0"
      >
        {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function ResultPanel({
  result,
}: {
  result: {
    status: string;
    output: string;
    stepResults: StepResult[];
    totalCostCents: number;
    durationMs: number;
    error?: string;
  };
}) {
  const sc = statusColor(result.status);
  return (
    <div className="mt-4 rounded-xl p-4 space-y-3"
      style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${sc.fg}33` }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ color: sc.fg, background: sc.bg, border: `1px solid ${sc.fg}33` }}>
            {result.status}
          </span>
          <span className="text-xs text-zinc-500">{fmtMs(result.durationMs)} · {fmtCents(result.totalCostCents)}</span>
        </div>
        {result.error && <span className="text-xs text-red-400">{result.error}</span>}
      </div>

      <div className="space-y-2">
        {result.stepResults.map((s, i) => {
          const ssc = statusColor(s.status);
          return (
            <details key={s.stepId} className="rounded-lg" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <summary className="cursor-pointer px-3 py-2 flex items-center gap-2 text-xs">
                <span className="h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
                  {i + 1}
                </span>
                <span className="font-semibold text-white truncate flex-1">{s.agentName}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: ssc.fg, background: ssc.bg }}>
                  {s.status}
                </span>
                <span className="text-zinc-600">{fmtMs(s.durationMs)}</span>
                <span className="text-zinc-600">{fmtCents(s.costCents)}</span>
              </summary>
              <div className="px-3 pb-3 pt-1 space-y-2">
                {s.input && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Input</div>
                    <pre className="text-xs text-zinc-400 whitespace-pre-wrap break-words font-mono">{s.input.slice(0, 600)}{s.input.length > 600 ? "…" : ""}</pre>
                  </div>
                )}
                {s.output && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Output</div>
                    <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words">{s.output}</pre>
                  </div>
                )}
                {s.error && <div className="text-xs text-red-400">{s.error}</div>}
              </div>
            </details>
          );
        })}
      </div>

      {result.output && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" /> Final output
          </div>
          <pre className="text-sm text-white whitespace-pre-wrap break-words rounded-lg px-3 py-2"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}>
            {result.output}
          </pre>
        </div>
      )}
    </div>
  );
}

function RunRow({ run }: { run: RecentRun }) {
  const sc = statusColor(run.status);
  let stepCount = 0;
  try { stepCount = JSON.parse(run.stepResults).length; } catch { /* ignore */ }
  return (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-xs"
      style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)" }}>
      <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider"
        style={{ color: sc.fg, background: sc.bg }}>
        {run.status}
      </span>
      <span className="text-zinc-500 flex items-center gap-1">
        <Bot className="h-3 w-3" />
        {stepCount} steps
      </span>
      <span className="text-zinc-500">{fmtMs(run.durationMs)}</span>
      <span className="text-zinc-500">{fmtCents(run.totalCostCents)}</span>
      <span className="text-zinc-600 ml-auto">
        {run.triggeredBy} · {new Date(run.createdAt).toLocaleString()}
      </span>
    </div>
  );
}
