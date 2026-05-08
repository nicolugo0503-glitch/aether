"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, Megaphone, Share2, Settings } from "lucide-react";

const TABS = [
  { href: "/dashboard",           label: "Home",    icon: LayoutDashboard },
  { href: "/dashboard/agents",    label: "Agents",  icon: Bot },
  { href: "/dashboard/campaigns", label: "Campaign",icon: Megaphone },
  { href: "/dashboard/social",    label: "Social",  icon: Share2 },
  { href: "/dashboard/settings",  label: "Settings",icon: Settings },
];

export function MobileTabBar() {
  const path = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around px-2 py-2"
      style={{
        background: "rgba(4,4,8,0.97)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = path === tab.href || (tab.href !== "/dashboard" && path.startsWith(tab.href));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-150 min-w-[52px]"
            style={{
              color: isActive ? "#a78bfa" : "#52525b",
              background: isActive ? "rgba(124,58,237,0.1)" : "transparent",
            }}
          >
            <tab.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.75} />
            <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
