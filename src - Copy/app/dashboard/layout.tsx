import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  LayoutDashboard, Bot, ListChecks, CreditCard,
  Settings, LogOut, Megaphone, Share2,
} from "lucide-react";
import { AetherMark } from "@/components/ui/logo";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";

const NAV = [
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

  const initials = (user.name || user.email)[0].toUpperCase();
  const displayName = user.name || user.email.split("@")[0];

  return (
    <div className="flex min-h-screen bg-black">
      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col"
        style={{ borderRight: "1px solid rgba(255,255,255,0.04)", background: "rgba(4,4,8,0.98)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <AetherMark size={30} glow />
            <span className="font-black text-white text-lg tracking-tight">Aether</span>
          </Link>
          <span className="ml-auto text-xs text-violet-400 font-bold bg-violet-500/10 border border-violet-500/20 rounded-full px-2 py-0.5">AI</span>
        </div>

        {/* Platform pills */}
        <div className="px-4 py-2.5 mx-3 mt-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="text-xs text-zinc-700 mb-1.5 uppercase tracking-widest">Platforms</div>
          <div className="flex gap-1.5 flex-wrap">
            {[
              { label: "IG", color: "#e1306c" },
              { label: "FB", color: "#1877f2" },
              { label: "X", color: "#e7e9ea" },
              { label: "Email", color: "#a78bfa" },
            ].map(p => (
              <div key={p.label} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: `${p.color}12`, color: p.color, border: `1px solid ${p.color}22` }}>
                {p.label}
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-all duration-150 group relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-violet-500 opacity-0 group-hover:opacity-70 transition-opacity" />
              <item.icon className="h-4 w-4 shrink-0 group-hover:text-violet-400 transition-colors" />
              <span className="group-hover:translate-x-0.5 transition-transform">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="rounded-2xl p-3 mb-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 12px rgba(124,58,237,0.35)" }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">{displayName}</div>
                <div className="text-xs text-zinc-600 truncate">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-600">Plan</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  background: user.plan === "FREE" ? "rgba(113,113,122,0.12)" : "rgba(124,58,237,0.15)",
                  color: user.plan === "FREE" ? "#71717a" : "#a78bfa",
                  border: `1px solid ${user.plan === "FREE" ? "rgba(113,113,122,0.18)" : "rgba(124,58,237,0.25)"}`,
                }}>
                {user.plan}
              </span>
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

      {/* ── MAIN ─────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 relative">
        <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.25), transparent)" }} />

        {/* Mobile top header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]"
          style={{ background: "rgba(4,4,8,0.98)", backdropFilter: "blur(20px)" }}>
          <Link href="/" className="flex items-center gap-2">
            <AetherMark size={26} glow />
            <span className="font-black text-white tracking-tight">Aether</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}>
              {initials}
            </div>
          </div>
        </div>

        <div className="px-4 py-6 md:px-10 md:py-10 pb-24 md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileTabBar />
    </div>
  );
}
