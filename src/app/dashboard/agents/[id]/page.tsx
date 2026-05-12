import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runAgent } from "@/lib/ai";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import { centsToUSD, formatDate } from "@/lib/utils";
import { Bot, Play, Settings, Clock, CheckCircle2, XCircle, Loader2, ChevronLeft, Zap, Brain, Thermometer } from "lucide-react";
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
      name: String(formData.get("name") || agent.name),
      role: String(formData.get("role") || agent.role),
      description: String(formData.get("description") || ""),
      systemPrompt: String(formData.get("systemPrompt") || agent.systemPrompt),
      knowledge: String(formData.get("knowledge") || ""),
      temperature: Number(formData.get("temperature") || agent.temperature),
      model: String(formData.get("model") || agent.model),
    },
  });
  redirect(`/dashboard/agents/${id}?saved=1`);
}

async function triggerRun(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id"));
  const input = String(formData.get("input") || "").trim();
  if (!input) redirect(`/dashboard/agents/${id}`);

  const effectiveLimit = PLAN_LIMITS[toPlanKey(user.plan)].monthlyRuns + (user.referralBonusRuns ?? 0);
  if (user.runsUsedThisPeriod >= effectiveLimit) {
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
      knowledge: agent.knowledge,
      input,
      model: agent.model,
      temperature: agent.temperature,
    });
    await prisma.run.update({
      where: { id: run.id },
      data: { output, status: "success", tokensIn, tokensOut, costCents, finishedAt: new Date() },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { runsUsedThisPeriod: { increment: 1 } },
    });
  } catch (e: any) {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "error", error: String(e?.message || e), finishedAt: new Date() },
    });
  }

  redirect(`/dashboard/agents/${id}`);
}

const STATUS_CFG: Record<string, { color: string; bg: string; label: string; Icon: React.ElementType }> = {
  success: { color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Success", Icon: CheckCircle2 },
  error:   { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   label: "Error",   Icon: XCircle },
  running: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Running", Icon: Loader2 },
  pending: { color: "#6366f1", bg: "rgba(99,102,241,0.1)",  label: "Pending", Icon: Clock },
};

const MODELS = [
  { value: "gpt-4o-mini",  label: "gpt-4o-mini",  desc: "Fast & cheap" },
  { value: "gpt-4o",       label: "gpt-4o",        desc: "Best quality" },
  { value: "gpt-4.1-mini", label: "gpt-4.1-mini",  desc: "Balanced" },
];

const FIELD_STYLE = {
  width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 13,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#e4e4e7", outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit",
};

export default async function AgentDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = (await getCurrentUser())!;
  const { id } = await params;
  const sp = await searchParams;
  const saved = sp.saved === "1";

  const agent = await prisma.agent.findFirst({
    where: { id, userId: user.id },
    include: { runs: { orderBy: { createdAt: "desc" }, take: 15 } },
  });
  if (!agent) notFound();

  const successCount = agent.runs.filter(r => r.status === "success").length;
  const totalCost = agent.runs.reduce((s, r) => s + (r.costCents ?? 0), 0);
  const initials = agent.name.slice(0, 2).toUpperCase();
  const COLORS = ["#7c3aed", "#6d28d9"];

  return (
    <div style={{ maxWidth: 780 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        .agent-section { animation: fadeUp 0.3s ease both; }
        .agent-section:nth-child(2) { animation-delay: 0.05s }
        .agent-section:nth-child(3) { animation-delay: 0.1s }
        .agent-section:nth-child(4) { animation-delay: 0.15s }
        .run-textarea:focus { border-color: rgba(124,58,237,0.5) !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; }
      `}</style>

      {/* Back nav */}
      <Link href="/dashboard/agents" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#52525b", textDecoration: "none", marginBottom: 20 }}>
        <ChevronLeft size={14} /> All AI Employees
      </Link>

      {/* Header */}
      <div className="agent-section" style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, flexShrink: 0,
          background: `linear-gradient(135deg, ${COLORS[0]}, ${COLORS[1]})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 900, color: "#fff",
          boxShadow: `0 0 20px ${COLORS[0]}55`,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.4px", margin: 0, marginBottom: 2 }}>
            {agent.name}
          </h1>
          <p style={{ fontSize: 13, color: "#52525b", margin: 0 }}>{agent.role}</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981" }}>{successCount}</div>
            <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Runs</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa" }}>{centsToUSD(totalCost)}</div>
            <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Spent</div>
          </div>
        </div>
      </div>

      {/* Saved confirmation */}
      {saved && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", marginBottom: 20, fontSize: 13, color: "#10b981" }}>
          <CheckCircle2 size={14} /> Changes saved successfully.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Run this agent */}
        <div className="agent-section" style={{ borderRadius: 16, padding: "22px 24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Play size={15} color="#a78bfa" />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Run this employee</h2>
          </div>
          <form action={triggerRun}>
            <input type="hidden" name="id" value={agent.id} />
            <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Task / Input
            </label>
            <textarea
              name="input"
              required
              rows={4}
              className="run-textarea"
              placeholder={`e.g. Draft a cold email to Jordan Chen, VP of Growth at Lumen AI. Our product: Aether.`}
              style={{ ...FIELD_STYLE, resize: "vertical", marginBottom: 14, transition: "border-color 0.2s, box-shadow 0.2s" }}
            />
            <button type="submit" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)", color: "#fff",
              borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700,
              border: "none", cursor: "pointer", boxShadow: "0 0 16px rgba(124,58,237,0.35)",
            }}>
              <Zap size={14} /> Run agent
            </button>
          </form>
        </div>

        {/* Configure */}
        <div className="agent-section" style={{ borderRadius: 16, padding: "22px 24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Settings size={15} color="#a78bfa" />
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Configure</h2>
          </div>
          <form action={updateAgent}>
            <input type="hidden" name="id" value={agent.id} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Name</label>
                <input name="name" type="text" defaultValue={agent.name} style={FIELD_STYLE} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Role</label>
                <input name="role" type="text" defaultValue={agent.role} style={FIELD_STYLE} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Description</label>
              <input name="description" type="text" defaultValue={agent.description ?? ""} placeholder="Brief description of this employee's purpose" style={FIELD_STYLE} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  <Brain size={11} style={{ display: "inline", marginRight: 4 }} />Model
                </label>
                <select name="model" defaultValue={agent.model} style={{ ...FIELD_STYLE, cursor: "pointer" }}>
                  {MODELS.map(m => (
                    <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                  <Thermometer size={11} style={{ display: "inline", marginRight: 4 }} />Temperature ({agent.temperature})
                </label>
                <input name="temperature" type="number" step="0.1" min="0" max="1" defaultValue={agent.temperature} style={FIELD_STYLE} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>System Prompt</label>
              <textarea name="systemPrompt" rows={5} defaultValue={agent.systemPrompt}
                style={{ ...FIELD_STYLE, resize: "vertical" }} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Knowledge Base <span style={{ color: "#3f3f46", fontWeight: 400, textTransform: "none" }}>(optional — product info, FAQs, etc.)</span>
              </label>
              <textarea name="knowledge" rows={4} defaultValue={agent.knowledge}
                placeholder="Add any context, facts, or reference material this employee should know..."
                style={{ ...FIELD_STYLE, resize: "vertical" }} />
            </div>

            <button type="submit" style={{
              padding: "9px 20px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)", color: "#e4e4e7",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Save changes
            </button>
          </form>
        </div>

        {/* Recent runs */}
        <div className="agent-section" style={{ borderRadius: 16, padding: "22px 24px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={15} color="#a78bfa" />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Recent Runs</h2>
            </div>
            <span style={{ fontSize: 11, color: "#52525b" }}>{agent.runs.length} shown</span>
          </div>

          {agent.runs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#3f3f46" }}>
              <Bot size={28} style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13 }}>No runs yet — give this employee their first task above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {agent.runs.map((r) => {
                const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.pending;
                const StatusIcon = cfg.Icon;
                return (
                  <div key={r.id} style={{
                    borderRadius: 12, padding: "14px 16px",
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
                      }}>
                        <StatusIcon size={11} />
                        {cfg.label}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#52525b" }}>
                        <span>{centsToUSD(r.costCents)}</span>
                        <span>{r.tokensIn + r.tokensOut} tokens</span>
                        <span>{formatDate(r.createdAt)}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: r.output || r.error ? 8 : 0 }}>
                      <div style={{ fontSize: 10, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Input</div>
                      <p style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5, margin: 0, whiteSpace: "pre-wrap" }}>
                        {r.input.length > 200 ? r.input.slice(0, 200) + "…" : r.input}
                      </p>
                    </div>

                    {r.output && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: 10, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Output</div>
                        <p style={{ fontSize: 12, color: "#d4d4d8", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>
                          {r.output.length > 600 ? r.output.slice(0, 600) + "…" : r.output}
                        </p>
                      </div>
                    )}

                    {r.error && (
                      <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 11, color: "#ef4444" }}>
                        Error: {r.error}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
