import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Plus } from "lucide-react";

async function createAgent(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const count = await prisma.agent.count({ where: { userId: user.id } });
  const limit = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  if (count >= limit) redirect("/dashboard/billing?error=agent_limit");

  const agent = await prisma.agent.create({
    data: {
      userId: user.id,
      name: String(formData.get("name") || "New Agent"),
      role: String(formData.get("role") || "Specialist"),
      description: String(formData.get("description") || ""),
      systemPrompt: String(
        formData.get("systemPrompt") || "You are a helpful specialist.",
      ),
      knowledge: String(formData.get("knowledge") || ""),
    },
  });
  redirect(`/dashboard/agents/${agent.id}`);
}

export default async function AgentsPage() {
  const user = (await getCurrentUser())!;
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">AI Employees</h1>
          <p className="text-sm text-muted">
            {agents.length} of {PLAN_LIMITS[toPlanKey(user.plan)].agents} employees hired.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/agents/${a.id}`}
            className="card transition hover:border-accent/60"
          >
            <div className="flex items-baseline gap-2">
              <h3 className="text-lg font-semibold">{a.name}</h3>
              <span className="text-xs text-muted">{a.role}</span>
            </div>
            {a.description && (
              <p className="mt-2 text-sm text-muted">{a.description}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <h2 className="font-semibold">Hire a new AI employee</h2>
        </div>
        <form action={createAgent} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input className="input mt-1" name="name" required placeholder="e.g. Nova — AI Outbound" />
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input mt-1" name="role" required placeholder="e.g. SDR" />
          </div>
          <div className="md:col-span-2">
            <label className="label">Description (shown in UI)</label>
            <input className="input mt-1" name="description" />
          </div>
          <div className="md:col-span-2">
            <label className="label">System prompt</label>
            <textarea
              className="input mt-1 min-h-28"
              name="systemPrompt"
              required
              placeholder="You are an expert ..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Knowledge / playbook (optional)</label>
            <textarea
              className="input mt-1 min-h-24"
              name="knowledge"
              placeholder="Paste company context, playbook, FAQs, or anything the agent should know."
            />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary">Hire</button>
          </div>
        </form>
      </div>
    </div>
  );
}
