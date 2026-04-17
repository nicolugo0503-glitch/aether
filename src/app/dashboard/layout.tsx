import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard, Bot, ListChecks, CreditCard,
  Settings, LogOut, Megaphone, Share2, ChevronRight,
} from "lucide-react";

const nav = [
  { href: "/dashboard",           label: "Overview",     icon: LayoutDashboard },
  { href: "/dashboard/agents",    label: "AI Employees", icon: Bot },
  { href: "/dashboard/campaigns", label: "Campaigns",    icon: Megaphone },
  { href: "/dashboard/social",    label: "Social Media", icon: Share2 },
  { href: "/dashboard/runs",      label: "Runs",         icon: ListChecks },
  { href: "/dashboard/billing",   label: "Billing",      icon: CreditCard },
  { href: "/dashboard/settings",  label: "Settings",     icon: Settings },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-black">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/[0.05] bg-black">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/[0.05]">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center glow-purple-sm">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-semibold text-white">Aether</span>
          <span className="ml-auto text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">AI</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all duration-150 group"
            >
              <n.icon className="h-4 w-4 shrink-0 group-hover:text-violet-400 transition-colors" />
              {n.label}
              <ChevronRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="px-3 pb-4 space-y-2 border-t border-white/[0.05] pt-4">
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-7 w-7 rounded-lg bg-violet-600/30 flex items-center justify-center text-xs font-bold text-violet-300">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-white truncate">{user.name || user.email.split("@")[0]}</div>
                <div className="text-xs text-zinc-600 truncate">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">Plan</span>
              <span className="text-xs text-violet-400 font-medium">{user.plan}</span>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-zinc-600 hover:text-white hover:bg-white/[0.04] transition-all">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 px-6 py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}
