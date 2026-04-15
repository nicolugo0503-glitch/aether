# How to deploy Aether live

Easiest stack: **Vercel** (hosting) + **Neon** (free Postgres). Takes ~10 minutes.

---

## Step 1 — Get a free Postgres database (Neon)

1. Go to **https://neon.tech** → Sign up free
2. Create a new project (any name, e.g. "aether")
3. Copy the **Connection string** — it looks like:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   Keep this — you'll paste it into Vercel in Step 3.

---

## Step 2 — Push your code to GitHub

1. Go to **https://github.com** → New repository → name it `aether` → Create
2. Inside the `aether/` folder (your extracted project), open a terminal and run:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/aether.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3 — Deploy on Vercel

1. Go to **https://vercel.com** → Sign up / Log in with GitHub
2. Click **"Add New Project"** → Import your `aether` repo
3. Vercel auto-detects Next.js — leave all build settings as-is
4. Before clicking Deploy, click **"Environment Variables"** and add these:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Neon connection string from Step 1 |
| `AUTH_SECRET` | Any long random string (64 chars) — generate at https://generate-secret.vercel.app/64 |
| `AUTH_URL` | `https://YOUR-PROJECT-NAME.vercel.app` (you'll know this after first deploy — update it after) |
| `OPENAI_API_KEY` | Your OpenAI key from https://platform.openai.com/api-keys |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `NEXT_PUBLIC_APP_URL` | `https://YOUR-PROJECT-NAME.vercel.app` |
| `STRIPE_SECRET_KEY` | `sk_test_placeholder` (or real key if you have one) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_placeholder` |

5. Click **Deploy** — wait ~2 minutes

---

## Step 4 — Set up the database

After first deploy, go to **Vercel → your project → Settings → Functions** and in any terminal run:

```bash
# In your local aether/ folder, with DATABASE_URL set to your Neon URL:
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npm run db:seed
```

Or set `DATABASE_URL` in your local `.env` temporarily to the Neon URL and run:
```bash
npx prisma db push
npm run db:seed
```

This creates the tables and seeds the demo account (`demo@aether.ai` / `demo1234`).

---

## Step 5 — Update AUTH_URL

1. Copy your live URL (e.g. `https://aether-abc123.vercel.app`)
2. Go to Vercel → Settings → Environment Variables
3. Update `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to that URL
4. Redeploy (Vercel → Deployments → Redeploy)

---

## Your app is live! 🎉

Visit your Vercel URL. Sign up for a new account or use `demo@aether.ai` / `demo1234`.

---

## Stripe (to take real payments)

1. Go to https://dashboard.stripe.com → Products → Create 3 products:
   - Starter — $49/month recurring
   - Growth — $299/month recurring
   - Scale — $1,499/month recurring
2. Copy each **Price ID** (`price_...`) into Vercel env vars:
   - `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_SCALE`
3. Replace placeholder Stripe keys with your real `sk_live_...` and `pk_live_...` keys
4. In Stripe → Webhooks → Add endpoint:
   - URL: `https://YOUR-APP.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`
5. Copy the webhook secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`
6. Redeploy on Vercel

---

## Custom domain

Vercel → your project → Settings → Domains → Add your domain.
Point your domain's DNS to Vercel as instructed. Takes ~5 minutes to propagate.
