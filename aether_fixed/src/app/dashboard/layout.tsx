import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoMark, Wordmark } from "@/components/nav";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import {
  LayoutDashboard,
  Bot,
  ListChecks,
  CreditCard,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const nav = [
  { href: "/dashboard",          label: "Overview",      icon: LayoutDashboard },
  { href: "/dashboard/agents",   label: "AI Employees",  icon: Bot },
  { href: "/dashboard/runs",     label: "Runs",          icon: ListChecks },
  { href: "/dashboard/billing",  label: "Billing",       icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings",      icon: Settings },
];

const planColors: Record<string, string> = {
  FREE:    "text-muted border-border bg-elevated",
  STARTER: "text-violet-300 border-violet-500/30 bg-violet-500/10",
  GROWTH:  "text-cyan-300 border-cyan-500/30 bg-cyan-500/10",
  SCALE:   "text-amber-300 border-amber-500/30 bg-amber-500/10",
};

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const planKey = toPlanKey(user.plan);
  const limits = PLAN_LIMITS[planKey];
  const usagePct = Math.min(100, (user.runsUsedThisPeriod / limits.monthlyRuns) * 100);
  const planColor = planColors[planKey] ?? planColors.FREE;

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border/50 bg-surface/60 backdrop-blur-sm p-5 md:flex md:flex-col">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <LogoMark size={26} />
          <Wordmark />
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="sidebar-link group"
            >
              <n.icon className="h-4 w-4 shrink-0 text-muted group-hover:text-text transition-colors" />
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>

        {/* Usage card */}
        {planKey !== "SCALE" && (
          <div className="mb-3 rounded-xl border border-border bg-panel p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted">Runs this period</div>
              <span className="text-xs text-muted">{user.runsUsedThisPeriod} / {limits.monthlyRuns.toLocaleString()}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {usagePct >= 80 && (
              <Link href="/dashboard/billing" className="mt-3 flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors">
                <Sparkles className="h-3 w-3" />
                Upgrade for more runs
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}

        {/* User card */}
        <div className="rounded-xl border border-border bg-panel p-3.5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold shrink-0">
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.name || "You"}</div>
              <div className="text-[11px] text-muted truncate">{user.email}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`pill text-[11px] ${planColor}`}>
              {planKey}
            </span>
            <Link href="/dashboard/billing" className="text-[11px] text-muted hover:text-text transition-colors">
              {planKey === "FREE" ? "Upgrade →" : "Manage"}
            </Link>
          </div>
        </div>

        {/* Sign out */}
        <form action="/api/auth/logout" method="POST" className="mt-2">
          <button className="sidebar-link w-full text-xs">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </form>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        {/* Top bar (mobile logo + context) */}
        <div className="flex items-center gap-4 border-b border-border/50 bg-surface/30 px-6 py-4 md:hidden">
          <Link href="/">
            <LogoMark size={24} />
          </Link>
          <span className="text-sm text-muted">{user.email}</span>
        </div>

        <div className="px-6 py-8 md:px-10 md:py-10 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
