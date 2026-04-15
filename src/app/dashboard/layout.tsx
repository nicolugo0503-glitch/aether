import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LogoMark } from "@/components/nav";
import {
  LayoutDashboard,
  Bot,
  ListChecks,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

const nav = [
  { href: "/dashboard",          label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/agents",   label: "AI Employees", icon: Bot },
  { href: "/dashboard/runs",     label: "Runs", icon: ListChecks },
  { href: "/dashboard/billing",  label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-panel/40 p-4 md:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 font-semibold">
          <LogoMark />
          <span>Aether</span>
        </Link>
        <nav className="space-y-1 text-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-muted hover:bg-panel hover:text-white"
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <form action="/api/auth/logout" method="POST" className="mt-8">
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted hover:bg-panel hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
        <div className="mt-8 rounded-md border border-border bg-bg p-3 text-xs text-muted">
          Signed in as <br />
          <span className="text-white">{user.email}</span>
          <div className="mt-2">Plan: <span className="text-accent-2">{user.plan}</span></div>
        </div>
      </aside>
      <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
    </div>
  );
}
