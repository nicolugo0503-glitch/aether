import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { Plus, Bot, ChevronRight, Zap, Users, Sparkles } from "lucide-react";

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

const ROLE_PRESETS = [
  { label: "SDR", desc: "Cold outreach & lead qualification" },
  { label: "Copywriter", desc: "Emails, ads, landing pages" },
  { label: "Analyst", desc: "Data research & insights" },
  { label: "Support", desc: "Customer service & FAQs" },
];

export default async function AgentsPage() {
  const user = (await getCurrentUser())!;
  const agents = await prisma.agent.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { runs: true } } },
  });

  const limit = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  const usedPct = Math.min(100, (agents.length / limit) * 100);

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes agent-enter{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .agent-card{animation:agent-enter 0.4s ease both}
        .agent-card:nth-child(1){animation-delay:0.05s}.agent-card:nth-child(2){animation-delay:0.1s}
        .agent-card:nth-child(3){animation-delay:0.15s}.agent-card:nth-child(4){animation-delay:0.2s}
        .agent-card:nth-child(5){animation-delay:0.25s}
        .agent-card:hover .agent-arrow{transform:translateX(4px)}
        .agent-arrow{transition:transform 0.2s ease}
        .hire-glow:hover{box-shadow:0 0 28px rgba(124,58,237,0.4)!important}
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))", border: "1px solid rgba(124,58,237,0.25)" }}>
              <Bot className="h-4.5 w-4.5 text-violet-400" style={{ width: 18, height: 18 }} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">AI Employees</h1>
          </div>
          <p className="text-sm text-zinc-500 ml-12">Your workforce — always on, never tired.</p>
        </div>

        <div className="shrink-0 rounded-2xl px-4 py-3 text-right"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-zinc-600 mb-1">Headcount</div>
          <div className="text-xl font-black text-white tabular-nums">
            {agents.length}<span className="text-zinc-600 font-normal text-sm"> / {limit}</span>
          </div>
          <div className="mt-2 h-1.5 w-24 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-700" style={{
              width: `${usedPct}%`,
              background: usedPct > 80 ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg,#7c3aed,#6d28d9)",
            }} />
          </div>
        </div>
      </div>

      {/* ── Agent Grid ── */}
      {agents.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {agents.map((a, i) => {
            const initials = a.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
            const palette = ["#7c3aed","#0ea5e9","#10b981","#f59e0b","#ec4899","#06b6d4"];
            const color = palette[i % palette.length];
            return (
              <Link key={a.id} href={`/dashboard/agents/${a.id}`}
                className="agent-card group relative overflow-hidden rounded-2xl p-5 transition-all"
                style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
                <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
                  style={{ background:`${color}25` }} />
                <div className="flex items-start gap-4 relative">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 transition-transform group-hover:scale-105"
                    style={{ background:`linear-gradient(135deg,${color}cc,${color}77)`, boxShadow:`0 0 20px ${color}33` }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate">{a.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                        style={{ background:`${color}15`, color, border:`1px solid ${color}30` }}>
                        {a.role}
                      </span>
                    </div>
                    {a.description && <p className="mt-1 text-sm text-zinc-500 line-clamp-2">{a.description}</p>}
                    <div className="mt-2.5 flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs text-zinc-600">
                        <Zap className="h-3 w-3" />{a._count.runs} runs
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" style={{ boxShadow:"0 0 6px #10b981" }} />
                        Active
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="agent-arrow h-4 w-4 text-zinc-700 shrink-0 mt-1" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl py-16 text-center"
          style={{ background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(255,255,255,0.08)" }}>
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background:"rgba(124,58,237,0.1)", border:"1px solid rgba(124,58,237,0.2)" }}>
            <Users className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="font-bold text-white text-lg mb-2">No employees yet</h3>
          <p className="text-zinc-500 text-sm">Hire your first AI employee below.</p>
        </div>
      )}

      {/* ── Hire Form ── */}
      {agents.length < limit && (
        <div className="rounded-3xl overflow-hidden"
          style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(124,58,237,0.18)" }}>
          <div className="px-6 py-4 flex items-center gap-3"
            style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(124,58,237,0.05)" }}>
            <div className="h-7 w-7 rounded-xl flex items-center justify-center"
              style={{ background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.3)" }}>
              <Plus className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <h2 className="font-bold text-white">Hire a new AI employee</h2>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-violet-400">
              <Sparkles className="h-3 w-3" />AI-powered
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-600 mb-2">Quick role presets</p>
              <div className="flex gap-2 flex-wrap">
                {ROLE_PRESETS.map(p => (
                  <div key={p.label}
                    className="cursor-default rounded-xl px-3 py-1.5 transition-all hover:border-violet-500/40 hover:bg-violet-500/8"
                    style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-xs font-semibold text-zinc-300">{p.label}</span>
                    <span className="text-xs text-zinc-600 ml-1 hidden sm:inline">· {p.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <form action={createAgent} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Name</label>
                <input className="input" name="name" required placeholder="e.g. Nova — AI Outbound" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Role</label>
                <input className="input" name="role" required placeholder="e.g. SDR, Copywriter" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Description</label>
                <input className="input" name="description" placeholder="Brief description shown in the UI" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">System Prompt</label>
                <textarea className="input min-h-28 resize-none" name="systemPrompt" required
                  placeholder="You are an expert SDR who specializes in cold outreach. Your goal is to..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">
                  Knowledge / Playbook <span className="text-zinc-700 normal-case">(optional)</span>
                </label>
                <textarea className="input min-h-24 resize-none" name="knowledge"
                  placeholder="Paste company context, playbook, FAQs, pricing, or anything the agent should know..." />
              </div>
              <div className="md:col-span-2">
                <button type="submit"
                  className="hire-glow relative overflow-hidden rounded-xl px-6 py-2.5 text-sm font-bold text-white transition-all"
                  style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow:"0 0 16px rgba(124,58,237,0.2)" }}>
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />Hire Employee
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {agents.length >= limit && (
        <div className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{ background:"rgba(124,58,237,0.06)", border:"1px solid rgba(124,58,237,0.2)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background:"rgba(124,58,237,0.15)" }}>
            <Users className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Headcount full</p>
            <p className="text-xs text-zinc-500 mt-0.5">You&apos;ve hired {limit} of {limit} employees on your plan.</p>
          </div>
          <Link href="/dashboard/billing"
            className="shrink-0 rounded-xl px-4 py-2 text-xs font-bold text-violet-300 hover:text-white transition-all"
            style={{ background:"rgba(124,58,237,0.15)", border:"1px solid rgba(124,58,237,0.25)" }}>
            Upgrade →
          </Link>
        </div>
      )}
    </div>
  );
}
