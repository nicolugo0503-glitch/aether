import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/ai";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { centsToUSD, formatDate } from "@/lib/utils";
import { StatusPill } from "../../page";
import {
  ArrowLeft, Bot, Play, Settings2, Brain, ChevronRight, Sparkles, Cpu, AlertTriangle,
} from "lucide-react";
import Link from "next/link";

async function updateAgent(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const id = String(formData.get("id"));
  const agent = await prisma.agent.findFirst({ where: { id, userId: user.id } });
  if (!agent) redirect("/dashboard/agents");
  await prisma.agent.update({
    where: { id },
    data: {
      name:         String(formData.get("name")        || agent.name),
      role:         String(formData.get("role")        || agent.role),
      description:  String(formData.get("description") || ""),
      systemPrompt: String(formData.get("systemPrompt")|| agent.systemPrompt),
      knowledge:    String(formData.get("knowledge")   || ""),
      temperature:  Number(formData.get("temperature") || agent.temperature),
      model:        String(formData.get("model")       || agent.model),
    },
  });
  redirect(`/dashboard/agents/${id}`);
}

async function triggerRun(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id    = String(formData.get("id")).trim();
  const input = String(formData.get("input") || "").trim();
  if (!input) redirect(`/dashboard/agents/${id}`);

  const limit = PLAN_LIMITS[toPlanKey(user.plan)].monthlyRuns;
  if (user.runsUsedThisPeriod >= limit) {
    redirect("/dashboard/billing?error=run_limit");
  }

  const agent = await prisma.agent.findFirst({ where: { id, userId: user.id } });
  if (!agent) redirect("/dashboard/agents");

  const run = await prisma.run.create({
    data: { agentId: agent.id, userId: user.id, input, status: "running" },
  });

  try {
    const { output, tokensIn, tokensOut, costCents } = await runAgent({
      systemPrompt: agent.systemPrompt,
      knowledge:    agent.knowledge,
      input,
      model:        agent.model,
      temperature:  agent.temperature,
    });
    await prisma.run.update({
      where: { id: run.id },
      data:  { output, status: "success", tokensIn, tokensOut, costCents, finishedAt: new Date() },
    });
    await prisma.user.update({
      where: { id: user.id },
      data:  { runsUsedThisPeriod: { increment: 1 } },
    });
  } catch (e: any) {
    await prisma.run.update({
      where: { id: run.id },
      data:  { status: "error", error: String(e?.message || e), finishedAt: new Date() },
    });
  }

  redirect(`/dashboard/agents/${id}`);
}

export default async function AgentDetail({
  params,
}: { params: Promise<{ id: string }> }) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const agent = await prisma.agent.findFirst({
    where:   { id, userId: user.id },
    include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!agent) notFound();

  const successRuns = agent.runs.filter((r) => r.status === "success");
  const totalCost   = agent.runs.reduce((s, r) => s + r.costCents, 0);
  const planKey     = toPlanKey(user.plan);
  const limits      = PLAN_LIMITS[planKey];
  const atRunLimit  = user.runsUsedThisPeriod >= limits.monthlyRuns;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back + header */}
      <div>
        <Link href="/dashboard/agents" className="flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          AI Employees
        </Link>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-elevated">
            <Bot className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
            <p className="text-muted mt-0.5">{agent.role}</p>
            {agent.description && (
              <p className="text-sm text-muted mt-1">{agent.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total runs",    value: String(agent.runs.length),  icon: Play },
          { label: "Successful",    value: String(successRuns.length), icon: Sparkles },
          { label: "Total cost",    value: centsToUSD(totalCost),      icon: Cpu },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="flex items-center gap-2 text-muted mb-2">
              <s.icon className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Run */}
      <div className="card border-accent/20 bg-gradient-to-br from-accent/5 to-panel">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            <Play className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Run this employee</h2>
            <p className="text-xs text-muted">
              Give {agent.name.split(" ")[0]} a task. Results appear below instantly.
            </p>
          </div>
        </div>

        {atRunLimit ? (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-medium text-warning">Run limit reached</div>
              <div className="text-xs text-muted mt-1">
                You've used all {limits.monthlyRuns.toLocaleString()} runs this period.
                <Link href="/dashboard/billing" className="ml-1 text-accent hover:underline">Upgrade to continue →</Link>
              </div>
            </div>
          </div>
        ) : (
          <form action={triggerRun} className="space-y-4">
            <input type="hidden" name="id" value={agent.id} />
            <div>
              <label className="label mb-2 block">Task / Input</label>
              <textarea
                name="input"
                required
                className="input min-h-36 font-mono text-sm"
                placeholder={
                  agent.role.toLowerCase().includes("sdr")
                    ? "e.g. Draft a cold email to Jordan Chen, VP of Growth at Lumen AI. Our product: Aether — AI employees for B2B teams."
                    : agent.role.toLowerCase().includes("research")
                    ? "e.g. Research the enterprise AI agent market. Who are the top 5 players, what's their positioning, and where is the gap?"
                    : "Enter your task or input for this agent..."
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted">
                {user.runsUsedThisPeriod} / {limits.monthlyRuns.toLocaleString()} runs used this period
              </div>
              <button className="btn-primary px-6 py-2.5 rounded-xl">
                <Play className="h-4 w-4" />
                Run agent
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Recent runs */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Run history</h2>
          <span className="text-xs text-muted">{agent.runs.length} runs</span>
        </div>

        {agent.runs.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-elevated mb-3">
              <Play className="h-5 w-5 text-muted" />
            </div>
            <p className="text-sm font-medium mb-1">No runs yet</p>
            <p className="text-xs text-muted">Write a task above and hit Run to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agent.runs.map((r) => (
              <div key={r.id} className="rounded-xl border border-border bg-elevated p-5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <StatusPill status={r.status} />
                    <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    {r.status === "success" && (
                      <>
                        <span>{(r.tokensIn + r.tokensOut).toLocaleString()} tokens</span>
                        <span>·</span>
                      </>
                    )}
                    <span>{centsToUSD(r.costCents)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="label mb-1.5">Input</div>
                    <div className="code-block whitespace-pre-wrap">{r.input}</div>
                  </div>
                  {r.output && (
                    <div>
                      <div className="label mb-1.5">Output</div>
                      <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
                        {r.output}
                      </div>
                    </div>
                  )}
                  {r.error && (
                    <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-xs text-red-300">
                      <div className="font-medium mb-1">Error</div>
                      {r.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Configure */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-2/10">
            <Settings2 className="h-5 w-5 text-accent-2" />
          </div>
          <div>
            <h2 className="font-semibold">Configure employee</h2>
            <p className="text-xs text-muted">Edit name, role, model, and instructions.</p>
          </div>
        </div>

        <form action={updateAgent} className="grid gap-5 md:grid-cols-2">
          <input type="hidden" name="id" value={agent.id} />
          <div>
            <label className="label mb-2 block">Name</label>
            <input className="input" name="name" defaultValue={agent.name} required />
          </div>
          <div>
            <label className="label mb-2 block">Role</label>
            <input className="input" name="role" defaultValue={agent.role} required />
          </div>
          <div className="md:col-span-2">
            <label className="label mb-2 block">Description</label>
            <input className="input" name="description" defaultValue={agent.description ?? ""} placeholder="Visible in the dashboard" />
          </div>
          <div>
            <label className="label mb-2 block">Model</label>
            <select className="input" name="model" defaultValue={agent.model}>
              <option value="gpt-4o-mini">gpt-4o-mini — fast &amp; economical</option>
              <option value="gpt-4o">gpt-4o — best quality</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            </select>
          </div>
          <div>
            <label className="label mb-2 block">Temperature — {agent.temperature}</label>
            <input
              className="input"
              type="number"
              step="0.1"
              min="0"
              max="1"
              name="temperature"
              defaultValue={agent.temperature}
            />
            <p className="mt-1 text-xs text-muted">0 = deterministic, 1 = creative</p>
          </div>
          <div className="md:col-span-2">
            <label className="label mb-2 block">System prompt</label>
            <textarea
              className="input min-h-36 font-mono text-xs"
              name="systemPrompt"
              defaultValue={agent.systemPrompt}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label mb-2 block">Knowledge / Playbook</label>
            <textarea
              className="input min-h-28 text-xs"
              name="knowledge"
              defaultValue={agent.knowledge}
              placeholder="Company context, playbooks, FAQs, competitor info..."
            />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary px-8 py-2.5 rounded-xl">
              Save configuration
            </button>
          </div>
        </form>
      </div>

      {/* Brain visualization */}
      <div className="rounded-2xl border border-border bg-gradient-subtle p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-5 w-5 text-accent" />
          <h3 className="font-semibold">How {agent.name.split(" ")[0]} works</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { step: "1. Input", desc: "You provide a task or data for the agent to work with." },
            { step: "2. Process", desc: `${agent.name.split(" ")[0]} applies her system prompt and knowledge base to produce a response.` },
            { step: "3. Output", desc: "The result is saved as a run and displayed here. Every token and cent is tracked." },
          ].map((s) => (
            <div key={s.step} className="rounded-xl border border-border bg-panel/60 p-4">
              <div className="text-xs font-bold text-accent mb-1">{s.step}</div>
              <p className="text-xs text-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
