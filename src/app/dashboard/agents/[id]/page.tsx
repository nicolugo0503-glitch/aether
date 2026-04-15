import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/ai";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { centsToUSD, formatDate } from "@/lib/utils";
import { StatusPill } from "../../page";

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
      name: String(formData.get("name") || agent.name),
      role: String(formData.get("role") || agent.role),
      description: String(formData.get("description") || ""),
      systemPrompt: String(formData.get("systemPrompt") || agent.systemPrompt),
      knowledge: String(formData.get("knowledge") || ""),
      temperature: Number(formData.get("temperature") || agent.temperature),
      model: String(formData.get("model") || agent.model),
    },
  });
  redirect(`/dashboard/agents/${id}`);
}

async function triggerRun(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const input = String(formData.get("input") || "").trim();
  if (!input) redirect(`/dashboard/agents/${id}`);

  // Usage gate
  const limit = PLAN_LIMITS[toPlanKey(user.plan)].monthlyRuns;
  if (user.runsUsedThisPeriod >= limit) {
    redirect("/dashboard/billing?error=run_limit");
  }

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
  });
  if (!agent) redirect("/dashboard/agents");

  const run = await prisma.run.create({
    data: {
      agentId: agent.id,
      userId: user.id,
      input,
      status: "running",
    },
  });

  try {
    const { output, tokensIn, tokensOut, costCents } = await runAgent({
      systemPrompt: agent.systemPrompt,
      knowledge: agent.knowledge,
      input,
      model: agent.model,
      temperature: agent.temperature,
    });
    await prisma.run.update({
      where: { id: run.id },
      data: {
        output,
        status: "success",
        tokensIn,
        tokensOut,
        costCents,
        finishedAt: new Date(),
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { runsUsedThisPeriod: { increment: 1 } },
    });
  } catch (e: any) {
    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "error",
        error: String(e?.message || e),
        finishedAt: new Date(),
      },
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
    where: { id, userId: user.id },
    include: { runs: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!agent) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{agent.name}</h1>
        <p className="text-sm text-muted">{agent.role}</p>
      </div>

      {/* Run */}
      <div className="card">
        <h2 className="font-semibold">Run this employee</h2>
        <p className="mt-1 text-sm text-muted">
          Give {agent.name.split(" ")[0]} a task. Usage counts toward your plan.
        </p>
        <form action={triggerRun} className="mt-4 space-y-3">
          <input type="hidden" name="id" value={agent.id} />
          <textarea
            name="input"
            required
            className="input min-h-32"
            placeholder="e.g. Draft a cold email to Jordan Chen, VP of Growth at Lumen AI. Our product: Aether."
          />
          <button className="btn-primary">Run agent</button>
        </form>
      </div>

      {/* Configure */}
      <div className="card">
        <h2 className="font-semibold">Configure</h2>
        <form action={updateAgent} className="mt-4 grid gap-4 md:grid-cols-2">
          <input type="hidden" name="id" value={agent.id} />
          <div>
            <label className="label">Name</label>
            <input className="input mt-1" name="name" defaultValue={agent.name} />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input mt-1" name="role" defaultValue={agent.role} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description</label>
            <input
              className="input mt-1"
              name="description"
              defaultValue={agent.description ?? ""}
            />
          </div>
          <div>
            <label className="label">Model</label>
            <select className="input mt-1" name="model" defaultValue={agent.model}>
              <option value="gpt-4o-mini">gpt-4o-mini (fast, cheap)</option>
              <option value="gpt-4o">gpt-4o (best quality)</option>
              <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            </select>
          </div>
          <div>
            <label className="label">Temperature ({agent.temperature})</label>
            <input
              className="input mt-1"
              type="number"
              step="0.1"
              min="0"
              max="1"
              name="temperature"
              defaultValue={agent.temperature}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">System prompt</label>
            <textarea
              className="input mt-1 min-h-32"
              name="systemPrompt"
              defaultValue={agent.systemPrompt}
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Knowledge</label>
            <textarea
              className="input mt-1 min-h-24"
              name="knowledge"
              defaultValue={agent.knowledge}
            />
          </div>
          <div className="md:col-span-2">
            <button className="btn-secondary">Save changes</button>
          </div>
        </form>
      </div>

      {/* Recent runs */}
      <div className="card">
        <h2 className="mb-4 font-semibold">Recent runs</h2>
        {agent.runs.length === 0 ? (
          <p className="text-sm text-muted">No runs yet.</p>
        ) : (
          <div className="space-y-4">
            {agent.runs.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-bg p-4">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{formatDate(r.createdAt)}</span>
                  <div className="flex items-center gap-3">
                    <StatusPill status={r.status} />
                    <span>{centsToUSD(r.costCents)}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <div className="label">Input</div>
                  <p className="mt-1 whitespace-pre-wrap">{r.input}</p>
                </div>
                {r.output && (
                  <div className="mt-3 text-sm">
                    <div className="label">Output</div>
                    <p className="mt-1 whitespace-pre-wrap text-white/90">{r.output}</p>
                  </div>
                )}
                {r.error && (
                  <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
                    {r.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
