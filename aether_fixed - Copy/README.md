# Aether

**Hire autonomous AI employees.**

Aether is a production-ready starter for an AI-employee-as-a-service SaaS. Users sign up, provision specialized AI agents ("SDR", "Researcher", "Support Rep"), configure their prompts and knowledge, run them from the dashboard or via API, and are billed on per-seat subscriptions through Stripe.

This repo is a complete, runnable project — not a sketch. Marketing site, auth, dashboard, agent CRUD, live OpenAI-powered runs, Stripe Checkout, Stripe Customer Portal, and Stripe webhooks are all wired up.

---

## What you get

- **Marketing site** (`/`, `/pricing`) — dark, gradient-heavy, conversion-focused landing page
- **Auth** — email + password with JWT session cookies (no OAuth provider required to get started)
- **Dashboard** — agents CRUD, run UI, run history with tokens/cost, billing, settings
- **Agent runtime** — real OpenAI Chat Completions with system prompt + knowledge injection, token + cost tracking
- **API** — `POST /api/agents/:id/run` lets external systems trigger agents (keyed by session cookie; swap for an API key for prod)
- **Stripe** — Checkout session, Billing Portal, and webhook handler that upgrades/downgrades plans automatically
- **Prisma + SQLite** in dev (switch to Postgres in one line for prod)
- **Docs** — Pitch, GTM, and architecture notes in `docs/`

---

## Quick start

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env
#    Fill in OPENAI_API_KEY and (optionally) Stripe test keys

# 3. Database
npx prisma db push
npm run db:seed     # creates demo@aether.ai / demo1234 with three pre-built agents

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Sign in with `demo@aether.ai` / `demo1234`, go to **AI Employees**, pick Ava, and run her with any input. You'll see the real OpenAI response, tokens, and cost.

---

## Stripe setup (for real billing)

1. Create a Stripe account. In **test mode**, go to Products and create three recurring prices:
   - Starter — $49/mo
   - Growth — $299/mo
   - Scale — $1,499/mo
2. Copy each price ID (`price_...`) into your `.env`.
3. Install the Stripe CLI, then from another terminal:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.
4. Go to `/pricing` or `/dashboard/billing` and click "Upgrade". Use test card `4242 4242 4242 4242`.

When checkout completes, the webhook updates the user's plan and resets their usage window.

---

## Production deployment

The cleanest path is Vercel + Neon (Postgres) + Stripe live mode.

1. Change `prisma/schema.prisma` → `provider = "postgresql"`, set `DATABASE_URL` to your Neon connection string.
2. `npx prisma db push` against the Neon DB.
3. Deploy to Vercel. Set all `.env` vars as Vercel env vars (use **production** Stripe keys and webhook secret).
4. In Stripe → Webhooks, add `https://YOUR_DOMAIN/api/stripe/webhook` and subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`

---

## Project structure

```
aether/
├── prisma/              # Schema + seed
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing
│   │   ├── pricing/              # Pricing
│   │   ├── login, signup/        # Auth pages (server actions)
│   │   ├── dashboard/            # Authenticated app
│   │   │   ├── agents/           # CRUD + run UI
│   │   │   ├── runs/             # History
│   │   │   ├── billing/          # Plan + Stripe portal
│   │   │   └── settings/
│   │   └── api/
│   │       ├── auth/logout
│   │       ├── agents/           # REST-ish endpoints
│   │       └── stripe/           # checkout, portal, webhook
│   ├── components/               # Nav, footer
│   └── lib/                      # db, auth, stripe, ai, utils
└── docs/
    ├── PITCH.md                  # Investor-facing narrative
    ├── GTM.md                    # Go-to-market plan
    └── ARCHITECTURE.md           # How the pieces fit
```

---

## What's intentionally left as v2 work

This is a strong starter, not a unicorn. To actually operationalize this product you'd add:

- **OAuth + SSO** (Google, Microsoft, SAML)
- **Real tool-calling runtime** — MCP, function-calling with a typed SDK, parallel tool use
- **Retrieval** — vector store over uploaded docs and SaaS connectors (Drive, Notion, Salesforce)
- **Scheduled + event-triggered agents** — cron + inbound webhooks
- **Usage-based metering** in Stripe in addition to seats
- **Multi-tenant workspaces + roles**
- **Evals harness** — per-agent test sets, regression checks
- **Observability** — structured logs, tracing, PII redaction

See `docs/ARCHITECTURE.md` for the reasoning.

---

## License

MIT — go build.
