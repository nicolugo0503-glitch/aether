import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import {
  Workflow as WorkflowIcon,
  Plus,
  Play,
  ChevronRight,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bot,
  Webhook,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { parseSteps } from "@/lib/workflow";

async function createWorkflow(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const wf = await prisma.workflow.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") || "Untitled Workflow"),
      description: String(formData.get("description") || ""),
      trigger: "manual",
      steps: "[]",
    },
  });
  redirect(`/dashboard/workflows/${wf.id}`);
}

function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return "never";
  const date = typeof d === "string" ? new Date(d) : d;
  const ms = Date.now() - date.getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1)   return "just now";
  if (min < 60)  return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)   return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString();
}

const TRIGGER_BADGE = {
  manual:   { label: "Manual",   color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: Play },
  schedule: { label: "Scheduled", color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: Calendar },
  webhook:  { label: "Webhook",  color: "#06b6d4", bg: "rgba(6,182,212,0.12)",   icon: Webhook },
} as const;

export default async function WorkflowsPage() {
  const user = (await getCurrentUser())!;
  const planKey = toPlanKey(user.plan);
  const limits = PLAN_LIMITS[planKey];

  const [workflows, agentCount] = await Promise.all([
    prisma.workflow.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    }).catch(() => []),
    prisma.agent.count({ where: { userId: user.id } }).catch(() => 0),
  ]);

  const activeCount  = workflows.filter(w => w.status === "active").length;
  const totalRuns    = workflows.reduce((s, w) => s + w.totalRuns, 0);
  const totalCost    = workflows.reduce((s, w) => s + w.totalCostCents, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.06))",
                  border: "1px solid rgba(124,58,237,0.25)",
                  boxShadow: "0 0 24px rgba(124,58,237,0.18)",
                }}
              >
                <WorkflowIcon className="h-5 w-5" style={{ color: "#a78bfa" }} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Workflows</h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Chain AI agents together — research → write → follow up, autonomously.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard label="Total workflows"     value={workflows.length}                accent="#a78bfa" />
          <StatCard label="Active"              value={activeCount}                     accent="#22c55e" />
          <StatCard label="Runs (lifetime)"     value={totalRuns}                       accent="#7c3aed" />
          <StatCard label="Spend (lifetime)"    value={`$${(totalCost / 100).toFixed(2)}`} accent="#f59e0b" />
        </div>
      </div>

      {/* ── Create-new form ────────────────────────────── */}
      <form action={createWorkflow} className="mb-8 rounded-2xl p-5"
        style={{
          background: "rgba(124,58,237,0.04)",
          border: "1px solid rgba(124,58,237,0.18)",
        }}>
        <div className="flex items-center gap-2 mb-3">
          <Plus className="h-4 w-4" style={{ color: "#a78bfa" }} />
          <h2 className="text-sm font-bold text-white">Create a workflow</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-3">
          <input
            name="name"
            required
            placeholder="Workflow name"
            className="rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <input
            name="description"
            placeholder="Optional description"
            className="rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
          <button
            type="submit"
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.32)",
            }}
          >
            Create →
          </button>
        </div>
        {agentCount === 0 && (
          <p className="text-xs text-amber-400/80 mt-3 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            You need at least one AI Employee before a workflow can run.{" "}
            <Link href="/dashboard/agents" className="underline">Create one →</Link>
          </p>
        )}
      </form>

      {/* ── List ───────────────────────────────────────── */}
      {workflows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {workflows.map(w => {
            const steps = parseSteps(w.steps);
            const successRate =
              w.totalRuns > 0 ? Math.round((w.successfulRuns / w.totalRuns) * 100) : null;
            const trigger = TRIGGER_BADGE[w.trigger as keyof typeof TRIGGER_BADGE] || TRIGGER_BADGE.manual;
            const TriggerIcon = trigger.icon;
            const statusColor =
              w.status === "active"   ? "#22c55e" :
              w.status === "archived" ? "#71717a" : "#a78bfa";
            const statusBg =
              w.status === "active"   ? "rgba(34,197,94,0.12)" :
              w.status === "archived" ? "rgba(113,113,122,0.12)" : "rgba(167,139,250,0.12)";

            return (
              <Link
                key={w.id}
                href={`/dashboard/workflows/${w.id}`}
                className="block rounded-2xl p-5 transition-all hover:scale-[1.005] group"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Left — chain visualization */}
                  <ChainPreview steps={steps.length} />

                  {/* Middle — info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <h3 className="text-base font-bold text-white truncate">{w.name}</h3>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{ color: statusColor, background: statusBg, border: `1px solid ${statusColor}33` }}
                      >
                        {w.status}
                      </span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{ color: trigger.color, background: trigger.bg, border: `1px solid ${trigger.color}33` }}
                      >
                        <TriggerIcon className="h-3 w-3" />
                        {trigger.label}
                      </span>
                    </div>

                    {w.description && (
                      <p className="text-sm text-zinc-500 mb-2 line-clamp-1">{w.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-zinc-600 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Bot className="h-3 w-3" />
                        {steps.length} {steps.length === 1 ? "step" : "steps"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" />
                        {w.totalRuns} runs
                      </span>
                      {successRate !== null && (
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" style={{ color: successRate >= 80 ? "#22c55e" : "#f59e0b" }} />
                          {successRate}% success
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {timeAgo(w.lastRunAt) === "never" ? "never run" : `last run ${timeAgo(w.lastRunAt)}`}
                      </span>
                    </div>
                  </div>

                  {/* Right — chevron */}
                  <ChevronRight className="h-5 w-5 text-zinc-700 group-hover:text-violet-400 transition-colors mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quota hint */}
      <div className="mt-6 text-xs text-zinc-600 text-center">
        <TrendingUp className="h-3 w-3 inline mr-1 align-middle" />
        Each step consumes one agent run from your monthly quota ({limits.monthlyRuns}/month).
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="text-xs text-zinc-600 uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-2xl font-black" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function ChainPreview({ steps }: { steps: number }) {
  const dots = Math.min(Math.max(steps, 1), 5);
  return (
    <div className="hidden md:flex items-center gap-1 h-14 w-28 shrink-0 rounded-xl px-3"
      style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
      {Array.from({ length: dots }).map((_, i) => (
        <div key={i} className="flex items-center gap-1">
          <div
            className="h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-bold"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              color: "#fff",
              boxShadow: "0 0 8px rgba(124,58,237,0.5)",
            }}
          >
            {i + 1}
          </div>
          {i < dots - 1 && (
            <div className="h-px w-1.5" style={{ background: "rgba(167,139,250,0.4)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl p-12 text-center"
      style={{
        background: "rgba(124,58,237,0.03)",
        border: "1px dashed rgba(124,58,237,0.2)",
      }}>
      <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(167,139,250,0.06))",
          border: "1px solid rgba(124,58,237,0.25)",
        }}>
        <WorkflowIcon className="h-6 w-6" style={{ color: "#a78bfa" }} />
      </div>
      <h3 className="text-lg font-bold text-white mb-1">No workflows yet</h3>
      <p className="text-sm text-zinc-500 max-w-md mx-auto">
        A workflow chains your AI Employees together. Build pipelines like
        <span className="text-violet-400 font-semibold"> Rex researches</span> →
        <span className="text-violet-400 font-semibold"> Ava writes</span> →
        <span className="text-violet-400 font-semibold"> Sage follows up</span> and run them on demand, on a schedule, or via webhook.
      </p>
    </div>
  );
}
