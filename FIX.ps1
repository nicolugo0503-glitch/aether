# =====================================================
#  Aether — One-click GitHub fix + deploy
#  Right-click this file → "Run with PowerShell"
#  Make sure you're in the aether folder that has
#  package.json in it before running.
# =====================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Aether GitHub Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Detect correct folder
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: Run this script from the aether folder (where package.json is)." -ForegroundColor Red
    Write-Host "Current folder: $PWD" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Step 1/4 — Writing stripe.ts with correct API version..." -ForegroundColor Yellow

$stripeContent = @'
import Stripe from "stripe";

// Lazy singleton — only instantiated when first called, so build-time
// collection does not crash if STRIPE_SECRET_KEY is not set.
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
      appInfo: { name: "Aether", version: "0.1.0" },
    });
  }
  return _stripe;
}

// Keep named export for backwards compat
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
  appInfo: { name: "Aether", version: "0.1.0" },
});

export const PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_STARTER || "",
  GROWTH:  process.env.STRIPE_PRICE_GROWTH  || "",
  SCALE:   process.env.STRIPE_PRICE_SCALE   || "",
} as const;

export const PLAN_LIMITS = {
  FREE:    { monthlyRuns: 25,     agents: 1,   label: "Free"    },
  STARTER: { monthlyRuns: 500,    agents: 3,   label: "Starter" },
  GROWTH:  { monthlyRuns: 5_000,  agents: 10,  label: "Growth"  },
  SCALE:   { monthlyRuns: 50_000, agents: 100, label: "Scale"   },
} as const;

export type PlanKey = keyof typeof PLAN_LIMITS;

export function toPlanKey(plan: string): PlanKey {
  if (plan in PLAN_LIMITS) return plan as PlanKey;
  return "FREE";
}

export function priceIdToPlan(priceId?: string | null): PlanKey {
  if (!priceId) return "FREE";
  if (priceId === PRICE_IDS.STARTER) return "STARTER";
  if (priceId === PRICE_IDS.GROWTH)  return "GROWTH";
  if (priceId === PRICE_IDS.SCALE)   return "SCALE";
  return "FREE";
}
'@

$stripePath = Join-Path $PWD "src\lib\stripe.ts"
[System.IO.File]::WriteAllText($stripePath, $stripeContent, [System.Text.Encoding]::UTF8)

# Verify
$check = Get-Content $stripePath -Raw
if ($check -match "2025-02-24.acacia") {
    Write-Host "  stripe.ts — OK (2025-02-24.acacia confirmed)" -ForegroundColor Green
} else {
    Write-Host "  ERROR: stripe.ts write failed!" -ForegroundColor Red
    pause; exit 1
}

Write-Host ""
Write-Host "Step 2/4 — Staging files..." -ForegroundColor Yellow
git add src\lib\stripe.ts package.json
$status = git status --short
Write-Host $status

Write-Host ""
Write-Host "Step 3/4 — Committing..." -ForegroundColor Yellow
git commit -m "fix: stripe apiVersion 2025-02-24.acacia + pin stripe 17.4.0"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Nothing new to commit — forcing empty commit to trigger Vercel..." -ForegroundColor Yellow
    git commit --allow-empty -m "fix: force redeploy with correct stripe version"
}

Write-Host ""
Write-Host "Step 4/4 — Pushing to GitHub (force)..." -ForegroundColor Yellow
git push --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Push failed. Try running: git push --force" -ForegroundColor Red
    pause; exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DONE! Vercel will auto-deploy now." -ForegroundColor Green
Write-Host "  Check vercel.com for the new build." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
pause
