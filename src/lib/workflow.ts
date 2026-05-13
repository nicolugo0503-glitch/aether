/**
 * Multi-Step Workflow Engine
 *
 * Executes a chain of AI agents where each step's output becomes available
 * as a variable in subsequent steps. Variables are interpolated with
 * Handlebars-style {{...}} syntax.
 *
 * Available variables inside any step's input template:
 *   {{input}}              — the initial trigger input
 *   {{step_N.output}}      — full text output of step N (1-indexed)
 *   {{step_N.summary}}     — first 240 chars of step N's output
 *   {{stepId.output}}      — output of a step referenced by its stable id
 *
 * Conditions can short-circuit a step:
 *   { kind: "contains" | "notContains" | "matches", value: "..." }
 *   evaluated against the previous step's output. If it fails, the step
 *   is marked "skipped" and execution continues.
 */

import { prisma } from "./db";
import { runAgent, estimateCostCents } from "./ai";
import { PLAN_LIMITS, toPlanKey } from "./stripe";

// ── Types ──────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  agentId: string;
  name: string;
  inputTemplate: string;
  stopOnError?: boolean;
  condition?: {
    kind: "contains" | "notContains" | "matches";
    value: string;
    // Which variable to check against. Defaults to the most recent step's output.
    target?: string;
  };
}

export interface StepResult {
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
  startedAt: string;
  finishedAt: string;
  skipped?: boolean;
  skipReason?: string;
}

export interface WorkflowExecutionResult {
  status: "success" | "error" | "partial";
  output: string;
  stepResults: StepResult[];
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostCents: number;
  durationMs: number;
  error?: string;
}

// ── Step parsing ───────────────────────────────────────────────────

export function parseSteps(stepsJson: string): WorkflowStep[] {
  try {
    const parsed = JSON.parse(stepsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is WorkflowStep =>
        s &&
        typeof s === "object" &&
        typeof s.id === "string" &&
        typeof s.agentId === "string" &&
        typeof s.inputTemplate === "string",
    );
  } catch {
    return [];
  }
}

export function serializeSteps(steps: WorkflowStep[]): string {
  return JSON.stringify(steps);
}

// ── Variable interpolation ─────────────────────────────────────────

/**
 * Resolves {{...}} variables inside an input template using:
 *   - the initial workflow input
 *   - results from previously-executed steps (by index and by id)
 */
export function interpolateTemplate(
  template: string,
  initialInput: string,
  priorResults: StepResult[],
  stepsConfig: WorkflowStep[],
): string {
  // Build a lookup keyed by both stable id and 1-based index.
  const byKey: Record<string, StepResult> = {};
  priorResults.forEach((r, i) => {
    byKey[`step_${i + 1}`] = r;
    byKey[r.stepId] = r;
    // Also allow {{stepName}} if the name is safely alphanumeric
    const step = stepsConfig.find(s => s.id === r.stepId);
    if (step) {
      const safeName = step.name.replace(/[^A-Za-z0-9_]/g, "_");
      if (safeName) byKey[safeName] = r;
    }
  });

  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, raw) => {
    const expr = String(raw).trim();
    if (expr === "input") return initialInput;

    const dotIdx = expr.indexOf(".");
    if (dotIdx === -1) {
      const r = byKey[expr];
      return r ? r.output : "";
    }

    const head = expr.slice(0, dotIdx);
    const tail = expr.slice(dotIdx + 1);
    const r = byKey[head];
    if (!r) return "";

    switch (tail) {
      case "output":  return r.output;
      case "summary": return r.output.slice(0, 240);
      case "status":  return r.status;
      case "error":   return r.error || "";
      default:        return r.output;
    }
  });
}

// ── Condition evaluation ───────────────────────────────────────────

function evaluateCondition(
  cond: WorkflowStep["condition"],
  priorResults: StepResult[],
): { passed: boolean; reason?: string } {
  if (!cond) return { passed: true };

  // Default target: the most recent step's output.
  const last = priorResults[priorResults.length - 1];
  const targetText = cond.target
    ? (priorResults.find(r => r.stepId === cond.target)?.output ?? "")
    : (last?.output ?? "");

  const needle = String(cond.value || "");

  switch (cond.kind) {
    case "contains":
      return targetText.toLowerCase().includes(needle.toLowerCase())
        ? { passed: true }
        : { passed: false, reason: `condition: did not contain "${needle}"` };
    case "notContains":
      return !targetText.toLowerCase().includes(needle.toLowerCase())
        ? { passed: true }
        : { passed: false, reason: `condition: contained "${needle}"` };
    case "matches":
      try {
        const re = new RegExp(needle);
        return re.test(targetText)
          ? { passed: true }
          : { passed: false, reason: `condition: regex /${needle}/ did not match` };
      } catch {
        return { passed: false, reason: "condition: invalid regex" };
      }
    default:
      return { passed: true };
  }
}

// ── Execution ──────────────────────────────────────────────────────

/**
 * Execute a workflow end-to-end. Each step pulls a fresh copy of the
 * referenced Agent at run time so edits to agents are picked up.
 */
export async function executeWorkflow(opts: {
  workflowId: string;
  userId: string;
  steps: WorkflowStep[];
  initialInput: string;
  triggeredBy?: "manual" | "cron" | "webhook";
}): Promise<{ runId: string; result: WorkflowExecutionResult }> {
  const { workflowId, userId, steps, initialInput, triggeredBy = "manual" } = opts;

  const startedAt = Date.now();

  // Pre-flight: load all agents in one query to avoid N+1.
  const agentIds = Array.from(new Set(steps.map(s => s.agentId)));
  const agents = await prisma.agent.findMany({
    where: { id: { in: agentIds }, userId },
  });
  const agentById = new Map(agents.map(a => [a.id, a]));

  // Create the run record up front so the UI can poll.
  const runRecord = await prisma.workflowRun.create({
    data: {
      workflowId,
      userId,
      input: initialInput,
      status: "running",
      triggeredBy,
    },
  });

  const stepResults: StepResult[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;
  let totalCostCents = 0;
  let workflowStatus: "success" | "error" | "partial" = "success";
  let workflowError: string | undefined;

  for (const step of steps) {
    const stepStartedAt = new Date();
    const stepStartMs = Date.now();
    const agent = agentById.get(step.agentId);

    // Missing agent — record error, decide whether to continue.
    if (!agent) {
      const stepResult: StepResult = {
        stepId: step.id,
        agentId: step.agentId,
        agentName: "(missing agent)",
        input: "",
        output: "",
        status: "error",
        error: "Agent not found or deleted",
        tokensIn: 0,
        tokensOut: 0,
        costCents: 0,
        durationMs: Date.now() - stepStartMs,
        startedAt: stepStartedAt.toISOString(),
        finishedAt: new Date().toISOString(),
      };
      stepResults.push(stepResult);
      workflowStatus = step.stopOnError ? "error" : "partial";
      if (step.stopOnError) {
        workflowError = stepResult.error;
        break;
      }
      continue;
    }

    // Evaluate conditional skip.
    const condCheck = evaluateCondition(step.condition, stepResults);
    if (!condCheck.passed) {
      stepResults.push({
        stepId: step.id,
        agentId: agent.id,
        agentName: agent.name,
        input: "",
        output: "",
        status: "skipped",
        skipped: true,
        skipReason: condCheck.reason,
        tokensIn: 0,
        tokensOut: 0,
        costCents: 0,
        durationMs: Date.now() - stepStartMs,
        startedAt: stepStartedAt.toISOString(),
        finishedAt: new Date().toISOString(),
      });
      continue;
    }

    // Interpolate this step's input from prior results.
    const stepInput = interpolateTemplate(
      step.inputTemplate || "{{input}}",
      initialInput,
      stepResults,
      steps,
    );

    try {
      const result = await runAgent({
        systemPrompt: agent.systemPrompt,
        knowledge: agent.knowledge,
        input: stepInput,
        model: agent.model,
        temperature: agent.temperature,
        memoryContext: agent.memoryContext,
        memoryEnabled: agent.memoryEnabled,
      });

      // Also record a Run row for the agent so per-agent analytics still work.
      await prisma.run
        .create({
          data: {
            agentId: agent.id,
            userId,
            input: stepInput,
            output: result.output,
            status: "success",
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            costCents: result.costCents,
            triggeredBy: `workflow:${workflowId}`,
            finishedAt: new Date(),
          },
        })
        .catch(() => {/* non-fatal */});

      totalTokensIn += result.tokensIn;
      totalTokensOut += result.tokensOut;
      totalCostCents += result.costCents;

      stepResults.push({
        stepId: step.id,
        agentId: agent.id,
        agentName: agent.name,
        input: stepInput,
        output: result.output,
        status: "success",
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        costCents: result.costCents,
        durationMs: Date.now() - stepStartMs,
        startedAt: stepStartedAt.toISOString(),
        finishedAt: new Date().toISOString(),
      });
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      stepResults.push({
        stepId: step.id,
        agentId: agent.id,
        agentName: agent.name,
        input: stepInput,
        output: "",
        status: "error",
        error: errMsg,
        tokensIn: 0,
        tokensOut: 0,
        costCents: 0,
        durationMs: Date.now() - stepStartMs,
        startedAt: stepStartedAt.toISOString(),
        finishedAt: new Date().toISOString(),
      });
      workflowStatus = step.stopOnError ? "error" : "partial";
      if (step.stopOnError) {
        workflowError = errMsg;
        break;
      }
    }
  }

  // If every step ran but at least one was skipped/errored, downgrade to "partial".
  if (workflowStatus === "success") {
    const anyBad = stepResults.some(r => r.status !== "success");
    if (anyBad) workflowStatus = "partial";
  }

  const successfulSteps = stepResults.filter(r => r.status === "success");
  const lastSuccessful = successfulSteps[successfulSteps.length - 1];
  const finalOutput = lastSuccessful?.output ?? "";
  const durationMs = Date.now() - startedAt;

  // Persist final run state.
  await prisma.workflowRun.update({
    where: { id: runRecord.id },
    data: {
      output: finalOutput,
      status: workflowStatus,
      stepResults: JSON.stringify(stepResults),
      totalTokensIn,
      totalTokensOut,
      totalCostCents,
      durationMs,
      error: workflowError,
      finishedAt: new Date(),
    },
  });

  // Bump workflow aggregates.
  await prisma.workflow.update({
    where: { id: workflowId },
    data: {
      totalRuns: { increment: 1 },
      successfulRuns: { increment: workflowStatus === "success" ? 1 : 0 },
      totalCostCents: { increment: totalCostCents },
      lastRunAt: new Date(),
    },
  });

  return {
    runId: runRecord.id,
    result: {
      status: workflowStatus,
      output: finalOutput,
      stepResults,
      totalTokensIn,
      totalTokensOut,
      totalCostCents,
      durationMs,
      error: workflowError,
    },
  };
}

// ── Plan / quota helpers ───────────────────────────────────────────

/**
 * Checks whether a user has enough run budget for a workflow of N steps.
 * Each step counts as one agent run.
 */
export function canAffordWorkflow(
  plan: string,
  runsUsedThisPeriod: number,
  referralBonusRuns: number,
  stepCount: number,
): { ok: boolean; remaining: number; needed: number } {
  const limit = PLAN_LIMITS[toPlanKey(plan)].monthlyRuns + (referralBonusRuns || 0);
  const remaining = Math.max(0, limit - runsUsedThisPeriod);
  return { ok: remaining >= stepCount, remaining, needed: stepCount };
}

// Cost estimator for a 0-step dry-run (e.g. when previewing).
export function estimateWorkflowCostCents(
  steps: { model?: string; estTokensIn?: number; estTokensOut?: number }[],
): number {
  return steps.reduce((sum, s) => {
    return sum + estimateCostCents(
      s.model || "gpt-4o-mini",
      s.estTokensIn ?? 800,
      s.estTokensOut ?? 600,
    );
  }, 0);
}

// ── Scheduling helpers ─────────────────────────────────────────────

export function nextScheduledRunDate(cron: string | null | undefined): Date {
  const now = new Date();
  switch (cron) {
    case "every2days": return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    case "weekly":     return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:           return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}
