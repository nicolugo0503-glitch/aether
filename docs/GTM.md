# Aether — Go-To-Market Plan

## Positioning

**For** growth-stage B2B teams **who** can't hire fast enough to keep up with demand, **Aether is** an autonomous AI workforce **that** gives you specialized AI employees for sales, research, support, and ops **— unlike** generic chatbots, **we** ship role-specific, tool-wired employees that produce real business outcomes in days, not quarters.

## ICP (Phase 1)

- US-based Series A–C B2B SaaS, 30–500 employees
- Revenue: $1M–$50M ARR
- Pain: outbound capacity constrained, support volume growing faster than headcount, research/analyst work backlogged

## Wedge

Start with **Ava (AI SDR)** as the tip of the spear. Two reasons:

1. Value is obvious and easy to measure — meetings booked per dollar spent.
2. VPs of Sales already have budget for SDR tooling, and outbound is the canonical "underfilled team" problem.

Once Ava is in production, expand into support (Sage) and research (Rex) via the same workspace.

## Channels

### 1. Founder-led outbound (Months 0–6)
- Hand-pick 100 design-partner targets; personal LinkedIn + email from founder
- Pitch: "Give me 45 minutes and a lead list — I'll show you a working AI SDR on your data"
- Goal: 25 logos at $299/mo = $90k ARR

### 2. Content + SEO (Months 3–18)
- Publish one technical teardown per week:
  - "We built an AI SDR in 48 hours. Here's the architecture."
  - "Why AI support agents fail in production (and how to fix it)."
- Target long-tail keywords: "ai sdr pricing", "ai agent for support", "replace salesloft with ai"
- Repurpose into Twitter / LinkedIn threads, Substack

### 3. Performance marketing (Month 4+)
- Google Ads on high-intent keywords: `ai sdr`, `ai sales agent`, `artisan alternative`, `11x alternative`
- LinkedIn Ads to VP Sales / VP Support titles at ICP companies
- Target CAC <$1,500, payback <6 months

### 4. Partnerships
- Integrations = distribution. Prioritize: HubSpot, Salesforce, Gong, Intercom, Zendesk, Notion
- List on each vendor's marketplace
- Co-marketing with complementary tools

### 5. Community
- Build in public on Twitter and LinkedIn
- Sponsor relevant podcasts (20VC, Latent Space, How I Built This)
- Host a monthly "AI Ops" virtual meetup for practitioners

## Funnel metrics targets (steady state)

| Stage              | Target        |
|--------------------|---------------|
| Site visitors → trial signup | 2.5%  |
| Trial → first agent run      | 60%   |
| First run → paid             | 18%   |
| Monthly churn (SMB)          | <4%   |
| NRR (mid-market)             | >120% |

## Pricing strategy

- Publish prices publicly. Transparency beats "contact sales" for self-serve.
- Three tiers → 80% of revenue comes from Growth tier.
- Enterprise (>$20k ACV) is a separate motion starting Month 9.

## Year 1 ARR build

| Month | New MRR | Ending MRR | ARR   |
|-------|---------|------------|-------|
| 3     | $7k     | $15k       | $180k |
| 6     | $20k    | $55k       | $660k |
| 9     | $35k    | $130k      | $1.56M|
| 12    | $55k    | $250k      | $3.0M |

## Risks & mitigations

- **Model costs eat margin** → route to cheaper models by default; let Growth+ upgrade to premium models
- **OpenAI builds a competing "agents marketplace"** → ship multi-model, BYO-model; own the workflow layer
- **Enterprise wants on-prem** → VPC + BYO-model for Scale plan; single-tenant option at $50k+ ACV
