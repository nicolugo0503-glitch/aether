/**
 * Agent Memory — extract learnings from past runs and compress them into
 * a reusable context that gets injected into every future run.
 *
 * This makes agents smarter over time: they remember what worked, what
 * didn't, and which patterns consistently produce good results.
 */

import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "placeholder-set-in-vercel",
    });
  }
  return _openai;
}

export interface RunSample {
  input: string;
  output: string;
  status: "success" | "error";
  createdAt: Date;
}

/**
 * Analyze a batch of recent runs and distill them into a concise memory context.
 */
export async function buildMemoryContext(
  agentName: string,
  agentRole: string,
  agentSystemPrompt: string,
  runs: RunSample[],
): Promise<string> {
  const successRuns = runs.filter(r => r.status === "success" && r.output.trim().length > 20);

  if (successRuns.length === 0) {
    return "";
  }

  const runSummaries = successRuns
    .slice(0, 20)
    .map((r, i) => {
      const inputSnippet = r.input.slice(0, 200);
      const outputSnippet = r.output.slice(0, 400);
      return `Run ${i + 1}:\nINPUT: ${inputSnippet}\nOUTPUT: ${outputSnippet}`;
    })
    .join("\n\n---\n\n");

  const analysisPrompt = `You are analyzing the recent run history of an AI agent to extract learnings.

AGENT NAME: ${agentName}
AGENT ROLE: ${agentRole}
AGENT SYSTEM PROMPT (excerpt): ${agentSystemPrompt.slice(0, 300)}

RECENT SUCCESSFUL RUNS (${successRuns.length} total):
${runSummaries}

Extract the most useful learnings from these runs. Focus on:
1. Patterns that produce high-quality outputs
2. Specific phrases, formats, or approaches that worked well
3. Common input types and how this agent handles them best
4. Any recurring themes or domain knowledge that helped

Write a concise memory context (150-250 words) that will help this agent perform better on future tasks. Write it as direct knowledge/guidance the agent can use — NOT as a list of observations. This will be prepended to the agent's system prompt.

Start with "Based on past experience:" and write in second person ("you have found...", "you should...").`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "user", content: analysisPrompt },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

/**
 * Inject memory context into a system prompt if memory is enabled.
 */
export function injectMemory(
  systemPrompt: string,
  memoryContext: string,
  memoryEnabled: boolean,
): string {
  if (!memoryEnabled || !memoryContext.trim()) return systemPrompt;

  return `${systemPrompt}

---
AGENT MEMORY (learnings from past runs):
${memoryContext}
---`;
}
