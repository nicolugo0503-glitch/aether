"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Bot, ListChecks, CreditCard, Settings,
  Megaphone, Share2, Search, ArrowRight, Plus, Zap, X,
} from "lucide-react";

const BASE_COMMANDS = [
  { id: "overview",   label: "Go to Overview",       group: "Navigate", icon: LayoutDashboard, href: "/dashboard",            exact: true },
  { id: "agents",     label: "Go to AI Employees",   group: "Navigate", icon: Bot,             href: "/dashboard/agents" },
  { id: "campaigns",  label: "Go to Campaigns",      group: "Navigate", icon: Megaphone,       href: "/dashboard/campaigns" },
  { id: "social",     label: "Go to Social Media",   group: "Navigate", icon: Share2,          href: "/dashboard/social" },
  { id: "runs",       label: "Go to Runs",           group: "Navigate", icon: ListChecks,      href: "/dashboard/runs" },
  { id: "billing",    label: "Go to Billing",        group: "Navigate", icon: CreditCard,      href: "/dashboard/billing" },
  { id: "settings",   label: "Go to Settings",       group: "Navigate", icon: Settings,        href: "/dashboard/settings" },
  { id: "new-agent",  label: "Hire new AI Employee", group: "Actions",  icon: Plus,            href: "/dashboard/agents" },
  { id: "upgrade",    label: "Upgrade to Pro",       group: "Actions",  icon: Zap,             href: "/dashboard/billing" },
];

function fuzzy(str: string, pat: string): boolean {
  str = str.toLowerCase(); pat = pat.toLowerCase();
  let si = 0;
  for (let pi = 0; pi < pat.length; pi++) {
    let found = false;
    while (si < str.length) { if (str[si++] === pat[pi]) { found = true; break; } }
    if (!found) return false;
  }
  return true;
}

export function CommandPalette({
  agents,
}: {
  agents: { id: string; name: string; role: string }[];
}) {
  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(0);
  const router  = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands = [
    ...BASE_COMMANDS,
    ...agents.map(a => ({
      id:    `agent-${a.id}`,
      label: `Open ${a.name}`,
      group: "AI Employees",
      icon:  Bot,
      href:  `/dashboard/agents/${a.id}`,
      sub:   a.role,
    })),
  ];

  const filtered  = query ? allCommands.filter(c => fuzzy(c.label, query) || fuzzy(c.group, query)) : allCommands;
  const groups    = [...new Set(filtered.map(c => c.group))];
  const flat      = groups.flatMap(g => filtered.filter(c => c.group === g));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(o => !o); setQuery(""); setSelected(0); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 10); }, [open]);
  useEffect(() => { setSelected(0); }, [query]);

  const nav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(i => Math.min(i + 1, flat.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); const c = flat[selected]; if (c) { router.push(c.href); setOpen(false); } }
  };

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "14vh", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{ width: "100%", maxWidth: 560, background: "rgba(8,4,18,0.98)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 18, overflow: "hidden", boxShadow: "0 0 0 1px rgba(124,58,237,0.08), 0 30px 70px rgba(0,0,0,0.8), 0 0 100px rgba(124,58,237,0.1)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={15} color="#52525b" strokeWidth={2} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={nav}
            placeholder="Search pages, agents, actions..."
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, fontFamily: "inherit" }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#52525b", padding: 0, display: "flex" }}>
              <X size={13} />
            </button>
          )}
          <kbd style={{ fontSize: 10, color: "#3f3f46", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "2px 7px" }}>esc</kbd>
        </div>

        <div style={{ maxHeight: 380, overflowY: "auto", padding: "6px 0" }}>
          {flat.length === 0 && (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "#52525b", fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}
          {groups.map(group => {
            const items = flat.filter(c => c.group === group);
            const groupStart = flat.findIndex(c => c.group === group);
            return (
              <div key={group}>
                <div style={{ padding: "8px 18px 4px", fontSize: 10, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 600 }}>
                  {group}
                </div>
                {items.map((cmd, i) => {
                  const idx = groupStart + i;
                  const active = idx === selected;
                  const Icon = cmd.icon;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => { router.push(cmd.href); setOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", cursor: "pointer", background: active ? "rgba(124,58,237,0.1)" : "transparent", borderLeft: `2px solid ${active ? "#7c3aed" : "transparent"}`, transition: "all 0.08s" }}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: active ? "rgba(124,58,237,0.18)" : "rgba(255,255,255,0.04)", border: `1px solid ${active ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.08s" }}>
                        <Icon size={13} color={active ? "#a78bfa" : "#71717a"} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: active ? "#fff" : "#d4d4d8", fontWeight: active ? 500 : 400 }}>{cmd.label}</div>
                        {"sub" in cmd && cmd.sub && <div style={{ fontSize: 11, color: "#52525b" }}>{cmd.sub as string}</div>}
                      </div>
                      <ArrowRight size={11} color={active ? "#7c3aed" : "#2d2d2d"} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "8px 18px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 14, alignItems: "center" }}>
          {[["↑↓","navigate"],["↵","open"],["esc","close"]].map(([k,l]) => (
            <span key={k} style={{ fontSize: 10, color: "#3f3f46", display: "flex", gap: 4, alignItems: "center" }}>
              <kbd style={{ fontSize: 10, color: "#52525b", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 5px" }}>{k}</kbd> {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
