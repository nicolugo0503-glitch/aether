import OpenAI from "openai";

// Lazy singleton — only instantiated when first called, so build-time
// collection doesn't crash if OPENAI_API_KEY isn't set in the environment.
let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "placeholder-set-in-vercel",
    });
  }
  return _openai;
}

export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const PRICING_CENTS_PER_1K = {
  "gpt-4o-mini":  { in: 0.015, out: 0.06 },
  "gpt-4o":       { in: 0.25,  out: 1.0 },
  "gpt-4.1-mini": { in: 0.04,  out: 0.16 },
} as Record<string, { in: number; out: number }>;

export function estimateCostCents(
  model: string,
  tokensIn: number,
  tokensOut: number,
): number {
  const p = PRICING_CENTS_PER_1K[model] || PRICING_CENTS_PER_1K["gpt-4o-mini"];
  return Math.ceil((tokensIn / 1000) * p.in + (tokensOut / 1000) * p.out);
}

export interface AgentRunParams {
  systemPrompt: string;
  knowledge?: string;
  tools?: string[];
  input: string;
  model?: string;
  temperature?: number;
}

export async function runAgent(params: AgentRunParams) {
  const {
    systemPrompt,
    knowledge = "",
    input,
    model = DEFAULT_MODEL,
    temperature = 0.4,
  } = params;

  const messages = [
    {
      role: "system" as const,
      content: [
        systemPrompt,
        knowledge
          ? `\n\n---\nRELEVANT CONTEXT / KNOWLEDGE:\n${knowledge}\n---`
          : "",
      ].join(""),
    },
    { role: "user" as const, content: input },
  ];

  const completion = await getOpenAI().chat.completions.create({
    model,
    temperature,
    messages,
  });

  const output = completion.choices[0]?.message?.content ?? "";
  const tokensIn = completion.usage?.prompt_tokens ?? 0;
  const tokensOut = completion.usage?.completion_tokens ?? 0;

  return {
    output,
    tokensIn,
    tokensOut,
    costCents: estimateCostCents(model, tokensIn, tokensOut),
  };
}
