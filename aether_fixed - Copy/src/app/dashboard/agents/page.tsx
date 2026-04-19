import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Plus, Bot, ChevronRight, Sparkles, Briefcase, Search, Headphones, LineChart } from "lucide-react";

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

const templates = [
  {
    icon: Briefcase,
    name: "Ava — AI SDR",
    role: "Sales Development Rep",
    description: "Crafts hyper-personalized cold outreach from lead context.",
    prompt: "You are Ava, an elite B2B SDR. Given a lead profile, produce a tight 80-word cold email with a specific hook. No fluff, one CTA.",
    color: "from-violet-500/15 to-purple-600/5 border-violet-500/20",
  },
  {
    icon: Search,
    name: "Rex — AI Researcher",
    role: "Research Analyst",
    description: "Produces sourced market briefs and competitor teardowns.",
    prompt: "You are Rex, a senior research analyst. Given a topic or company, produce a concise, sourced research brief with key findings, market context, and recommendations. Be specific and cite sources when possible.",
    color: "from-cyan-500/15 to-sky-600/5 border-cyan-500/20",
  },
  {
    icon: Headphones,
    name: "Sage — AI Support",
    role: "Support Specialist",
    description: "Resolves tickets end-to-end using your knowledge base.",
    prompt: "You are Sage, a senior customer support specialist. Given a customer issue, provide a clear, empathetic resolution using the knowledge base. If escalation is needed, summarize the issue for the human agent.",
    color: "from-emerald-500/15 to-teal-600/5 border-emerald-500/20",
  },
  {
    icon: LineChart,
    name: "Opus — AI Ops",
    role: "Operations Analyst",
    description: "Monitors metrics, flags anomalies, writes exec reports.",
    prompt: "You are Opus, a senior operations analyst. Given data or metrics, identify anomalies, summarize trends, and provide clear recommendations. Write exec-ready summaries: short, specific, actionable.",
    color: "from-orange-500/15 to-amber-600/5 border-orange-500/20",
  },
];

export default async function AgentsPage() {
  const user = (await getCurrentUser())!;
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { runs: true } },
    },
  });

  const planKey = toPlanKey(user.plan);
  const limit = PLAN_LIMITS[planKey].agents;
  const atLimit = agents.length >= limit;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Employees</h1>
          <p className="mt-1 text-muted">
            {agents.length} of {limit} employees hired on your {planKey} plan.
          </p>
        </div>
        {atLimit && (
          <Link href="/dashboard/billing" className="btn-primary">
            <Sparkles className="h-4 w-4" />
            Upgrade to hire more
          </Link>
        )}
      </div>

      {/* Existing agents */}
      {agents.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/agents/${a.id}`}
              className="card-hover group flex items-start gap-4"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated group-hover:border-accent/30 transition-colors">
                <Bot className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <h3 className="font-semibold">{a.name}</h3>
                  <span className="text-xs text-muted">{a.role}</span>
                </div>
                {a.description && (
                  <p className="mt-1 text-sm text-muted line-clamp-2">{a.description}</p>
                )}
                <div className="mt-2 text-xs text-muted-2">{a._count.runs} runs</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {agents.length === 0 && (
        <div className="rounded-2xl border border-border bg-panel p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-elevated">
            <Bot className="h-7 w-7 text-muted" />
          </div>
          <h3 className="font-semibold mb-2">No AI employees yet</h3>
          <p className="text-sm text-muted mb-6">
            Hire your first AI employee below or choose from a pre-built template.
          </p>
        </div>
      )}

      {/* Templates */}
      {!atLimit && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Start from a template
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((t) => (
              <form key={t.name} action={createAgent}>
                <input type="hidden" name="name" value={t.name} />
                <input type="hidden" name="role" value={t.role} />
                <input type="hidden" name="description" value={t.description} />
                <input type="hidden" name="systemPrompt" value={t.prompt} />
                <button
                  type="submit"
                  className={`w-full rounded-2xl border bg-gradient-to-br ${t.color} p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <t.icon className="h-5 w-5 text-white/80" />
                    <span className="font-semibold text-sm">{t.name}</span>
                    <span className="ml-auto text-xs text-muted">{t.role}</span>
                  </div>
                  <p className="text-xs text-muted">{t.description}</p>
                  <div className="mt-3 text-xs text-accent flex items-center gap-1">
                    Hire this employee <ChevronRight className="h-3 w-3" />
                  </div>
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

      {/* Custom agent form */}
      {!atLimit && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Plus className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold">Hire a custom AI employee</h2>
              <p className="text-xs text-muted">Build your own from scratch with a custom role and system prompt.</p>
            </div>
          </div>

          <form action={createAgent} className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="label mb-2 block">Name</label>
              <input
                className="input"
                name="name"
                required
                placeholder="e.g. Nova — AI Outbound"
              />
            </div>
            <div>
              <label className="label mb-2 block">Role</label>
              <input
                className="input"
                name="role"
                required
                placeholder="e.g. SDR, Researcher, Support Rep"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label mb-2 block">Description <span className="normal-case text-muted-2">(shown in dashboard)</span></label>
              <input className="input" name="description" placeholder="What does this agent do?" />
            </div>
            <div className="md:col-span-2">
              <label className="label mb-2 block">System prompt <span className="text-danger">*</span></label>
              <textarea
                className="input min-h-32 font-mono text-xs"
                name="systemPrompt"
                required
                placeholder="You are an expert at... Given [input], produce [output]..."
              />
              <p className="mt-1.5 text-xs text-muted">
                This is the instruction set your AI employee follows on every run.
                Be specific about input format, output format, and tone.
              </p>
            </div>
            <div className="md:col-span-2">
              <label className="label mb-2 block">Knowledge / Playbook <span className="normal-case text-muted-2">(optional)</span></label>
              <textarea
                className="input min-h-28 text-xs"
                name="knowledge"
                placeholder="Paste company context, playbooks, product FAQs, competitor info, or anything the agent should know..."
              />
            </div>
            <div className="md:col-span-2">
              <button className="btn-primary px-8 py-3 rounded-xl">
                Hire this employee
              </button>
            </div>
          </form>
        </div>
      )}

      {atLimit && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
          <Sparkles className="h-8 w-8 text-accent mx-auto mb-3" />
          <h3 className="font-semibold mb-2">You've reached your employee limit</h3>
          <p className="text-sm text-muted mb-4">
            Upgrade your plan to hire more AI employees and unlock more runs per month.
          </p>
          <Link href="/dashboard/billing" className="btn-primary">
            Upgrade plan →
          </Link>
        </div>
      )}
    </div>
  );
}
