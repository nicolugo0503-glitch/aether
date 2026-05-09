"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Bot, ListChecks, CreditCard,
  Settings, Megaphone, Share2, LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard, Bot, ListChecks, CreditCard, Settings, Megaphone, Share2,
};

export function NavLink({
  href,
  icon,
  label,
  exact = false,
}: {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
}) {
  const Icon = ICON_MAP[icon] ?? LayoutDashboard;
  const path = usePathname();
  const isActive = exact ? path === href : (path === href || path.startsWith(href + "/"));

  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 relative overflow-hidden group"
      style={{
        color: isActive ? "#fff" : "#52525b",
        background: isActive ? "rgba(124,58,237,0.12)" : "transparent",
        fontWeight: isActive ? 600 : 400,
      }}
    >
      {/* active indicator bar */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full transition-all duration-200"
        style={{
          background: "linear-gradient(to bottom, #a78bfa, #7c3aed)",
          opacity: isActive ? 1 : 0,
          boxShadow: isActive ? "0 0 8px rgba(167,139,250,0.6)" : "none",
        }}
      />

      {/* icon */}
      <Icon
        className="h-4 w-4 shrink-0 transition-colors duration-150"
        style={{ color: isActive ? "#a78bfa" : undefined }}
        strokeWidth={isActive ? 2.25 : 1.75}
      />

      {/* label */}
      <span className="transition-transform duration-150 group-hover:translate-x-0.5">
        {label}
      </span>

      {/* hover glow */}
      {!isActive && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "rgba(255,255,255,0.03)" }}
        />
      )}
    </Link>
  );
}
