# Aether — Architecture

## Stack

- **Runtime:** Next.js 15 (App Router, Server Actions, RSC)
- **Language:** TypeScript strict
- **DB:** Prisma — SQLite for dev, Postgres for prod (one-line swap)
- **Auth:** JWT session cookies (jose) + bcrypt
- **AI:** OpenAI Chat Completions, model-swappable per agent
- **Payments:** Stripe Checkout + Billing Portal + Webhook
- **Styling:** Tailwind + lucide-react icons

## Why this stack

- Next.js 15 collapses frontend and backend into one codebase, one deploy, one mental model. For a pre-PMF SaaS this is decisive.
- Prisma gives us a strongly-typed DB layer that moves SQLite → Postgres with a single line change.
- JWT cookies beat NextAuth for a starter: fewer moving parts, no provider setup required, still secure for first-principles auth.
- Stripe is the obvious call. The starter exercises checkout, customer portal, and webhook — the three pieces that always bite teams later.

## Core data model

```
User ── has many ──▶ Agent ── has many ──▶ Run
  │
  └── billing fields (stripeCustomerId, subscriptionId, plan, runsUsedThisPeriod)
```

- `User.plan` ∈ FREE | STARTER | GROWTH | SCALE
- `User.runsUsedThisPeriod` — reset on `invoice.paid` webhook
- `Agent` owns its prompt, knowledge string, model, and temperature
- `Run` captures input / output / status / tokens / cost for observability and billing

## Request flows

### Running an agent (UI)

1. User POSTs to the server action `triggerRun` from `/dashboard/agents/:id`
2. Action checks plan gate, creates `Run` row with status `running`
3. Calls `runAgent()` → OpenAI Chat Completions with `systemPrompt + knowledge + input`
4. On success: updates Run row + increments `user.runsUsedThisPeriod`
5. On error: marks Run row `error` with message
6. Redirects back to the agent detail page

### Running an agent (API)

Same logic, exposed at `POST /api/agents/:id/run` for external triggers (webhooks, cron, Zapier).

### Subscription lifecycle

1. User POSTs `/api/stripe/checkout` → creates Stripe customer if missing, creates Checkout Session, 303 redirects
2. User completes Checkout → Stripe fires `checkout.session.completed` to `/api/stripe/webhook`
3. Webhook looks up `userId` from session metadata, retrieves the subscription, maps the price → plan, updates user
4. On renewal (`invoice.paid`), usage window resets
5. On cancel (`customer.subscription.deleted`), user falls back to FREE

## Security notes (starter-grade; harden for prod)

- Passwords hashed with bcrypt (cost 10)
- Session JWTs signed with HS256 + `AUTH_SECRET`
- HttpOnly + Lax cookies, Secure in production
- Stripe webhook verified with `constructEvent` against `STRIPE_WEBHOOK_SECRET`
- User-scoped queries on every agent/run endpoint (`where: { userId: user.id }`) to prevent horizontal privilege escalation

For production, add: rate limiting (Upstash Ratelimit), CSRF tokens on state-changing POSTs, PII redaction in logs, short-lived API tokens for `/api/agents/:id/run`.

## Observability plan (v2)

- Emit structured JSON logs per run (run_id, user_id, model, tokens, cost)
- Ship to Logflare / Datadog / Axiom
- Add OpenTelemetry traces around the OpenAI call + DB writes
- Per-agent eval suite: a small set of input/expected-output pairs run on CI and on every prompt change

## Scaling plan

- **0–1M ARR:** single Vercel project + single Neon Postgres branch. No problem.
- **1–10M ARR:** split agent execution into a queue (Inngest / Temporal / SQS) so long-running agents don't block edge functions.
- **10M+ ARR:** dedicate a separate agent-runtime service (Node + Redis + Postgres read-replica), add a vector store (Pinecone or pgvector), and introduce per-tenant rate limits.

## Where this repo stops

This starter intentionally does **not** ship:

- Tool-calling / MCP integrations — huge surface area, need to be scoped per vertical
- Vector retrieval over docs — needs a vector DB and ingestion pipeline
- SSO / SCIM — every enterprise wants a different flavor; gate behind the Scale plan
- Multi-tenant workspaces (vs single-user) — trivial to add (`Workspace` table + membership), but adds UX complexity a solo-founder shouldn't pay upfront

These are the *right* things to build after PMF — not before.
