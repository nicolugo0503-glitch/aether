"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bot, ListChecks, Share2, Menu, X,
  Megaphone, BarChart3, Users, Gift, CreditCard, Settings,
} from "lucide-react";

const PRIMARY_TABS = [
  { href: "/dashboard",        label: "Home",   icon: LayoutDashboard, exact: true },
  { href: "/dashboard/agents", label: "Agents", icon: Bot },
  { href: "/dashboard/runs",   label: "Runs",   icon: ListChecks },
  { href: "/dashboard/social", label: "Social", icon: Share2 },
];

const MORE_ITEMS = [
  { href: "/dashboard/campaigns",  label: "Campaigns", icon: Megaphone },
  { href: "/dashboard/analytics",  label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team",       label: "Team",      icon: Users },
  { href: "/dashboard/referrals",  label: "Referrals", icon: Gift },
  { href: "/dashboard/billing",    label: "Billing",   icon: CreditCard },
  { href: "/dashboard/settings",   label: "Settings",  icon: Settings },
];

export function MobileTabBar() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact = false) =>
    exact ? path === href : path === href || (href !== "/dashboard" && path.startsWith(href));

  const isMoreActive = MORE_ITEMS.some((t) => path.startsWith(t.href));

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[9980]"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 0, left: 0, right: 0,
              borderRadius: "20px 20px 0 0",
              background: "rgba(4,4,8,0.98)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "20px 16px 8px",
              paddingBottom: "calc(env(safe-area-inset-bottom, 8px) + 72px)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.02em" }}>
                More sections
              </span>
              <button onClick={() => setOpen(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer",
                  color: "#a1a1aa", width: 28, height: 28, borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={15} />
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {MORE_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                      padding: "14px 8px", borderRadius: 14, textDecoration: "none",
                      background: active ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.06)"}`,
                      color: active ? "#a78bfa" : "#a1a1aa",
                    }}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: "rgba(4,4,8,0.97)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}>
        {PRIMARY_TABS.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;
          return (
            <Link key={tab.href} href={tab.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]"
              style={{ color: active ? "#a78bfa" : "#52525b", background: active ? "rgba(124,58,237,0.1)" : "transparent" }}>
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]"
          style={{ color: isMoreActive ? "#a78bfa" : "#52525b",
            background: isMoreActive ? "rgba(124,58,237,0.1)" : "transparent",
            border: "none", cursor: "pointer" }}>
          <Menu className="h-5 w-5 shrink-0" strokeWidth={isMoreActive ? 2.5 : 1.75} />
          <span className="text-[10px] font-semibold leading-none">More</span>
        </button>
      </nav>
    </>
  );
}
