import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LogOut } from "lucide-react";
import { AetherMark } from "@/components/ui/logo";
import { MobileTabBar } from "@/components/dashboard/mobile-tab-bar";
import { NavLink } from "@/components/dashboard/nav-link";
import { ChatWidget } from "@/components/widgets/ChatWidget";
import { FeedbackWidget } from "@/components/widgets/FeedbackWidget";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [inboxUnread, competitorChanges] = await Promise.all([
    prisma.emailReply
      .count({ where: { userId: user.id, status: "new" } })
      .catch(() => 0),
    prisma.competitorChange
      .count({
        where: {
          userId: user.id,
          detectedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
      .catch(() => 0),
  ]);

  const NAV = [
    { href: "/dashboard", label: "Overview", icon: "LayoutDashboard", exact: true },
    { href: "/dashboard/agents", label: "AI Employees", icon: "Bot" },
    { href: "/dashboard/workflows", label: "Workflows", icon: "Workflow" },
    { href: "/dashboard/campaigns", label: "Campaigns", icon: "Megaphone" },
    { href: "/dashboard/social", label: "Social Media", icon: "Share2" },
    { href: "/dashboard/inbox", label: "Smart Inbox", icon: "Inbox", badge: inboxUnread },
    { href: "/dashboard/competitors", label: "Competitors", icon: "Radar", badge: competitorChanges },
    { href: "/dashboard/runs", label: "Runs", icon: "ListChecks" },
    { href: "/dashboard/analytics", label: "Analytics", icon: "BarChart3" },
    { href: "/dashboard/team", label: "Team", icon: "Users" },
    { href: "/dashboard/referrals", label: "Referrals", icon: "Gift" },
    { href: "/dashboard/billing", label: "Billing", icon: "CreditCard" },
    { href: "/dashboard/settings", label: "Settings", icon: "Settings" },
    { href: "/dashboard/help", label: "Help", icon: "HelpCircle" },
  ];

  const initials = (user.name || user.email || "U")[0].toUpperCase();
  const displayName = user.name || user.email.split("@")[0];

  const CSS = `
    body { background: #f4f5f7; }
    .dash-sidebar { background: #fff; border-right: 1px solid #eaecf0; }
    .dash-main { background: #f4f5f7; }
    .dash-mobile-header { background: #fff; border-bottom: 1px solid #eaecf0; }

    /* Sidebar nav links â override dark styles if NavLink uses global classes */
    .nav-link-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 12px; border-radius: 8px;
      font-size: 0.85rem; font-weight: 500; color: #4b5563;
      text-decoration: none; transition: all 0.15s;
      margin-bottom: 2px;
    }
    .nav-link-item:hover { background: #f9fafb; color: #111827; }
    .nav-link-item.active { background: rgba(124,58,237,0.07); color: #7c3aed; font-weight: 600; }
    .nav-link-item svg { width: 16px; height: 16px; }

    .nav-badge {
      margin-left: auto; min-width: 18px; height: 18px;
      border-radius: 999px; background: #7c3aed; color: #fff;
      font-size: 0.65rem; font-weight: 800; padding: 0 5px;
      display: flex; align-items: center; justify-content: center;
    }
    .logout-btn:hover { background: #f9fafb !important; color: #374151 !important; }
  `;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ââ SIDEBAR ââ */}
      <aside className="hidden md:flex dash-sidebar" style={{
        width: 236, flexShrink: 0, flexDirection: "column",
        position: "sticky", top: 0, height: "100vh", overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #f3f4f6" }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 9, textDecoration: "none",
          }}>
            <AetherMark size={26} glow />
            <span style={{
              fontWeight: 900, color: "#0f0f10", fontSize: "1.05rem",
              letterSpacing: "-0.025em",
            }}>Aether</span>
          </Link>
          {/* Platform chips */}
          <div style={{ marginTop: 12, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {([
              { label: "IG", color: "#e1306c" },
              { label: "FB", color: "#1877f2" },
              { label: "X",  color: "#374151" },
              { label: "Email", color: "#7c3aed" },
            ] as { label: string; color: string }[]).map(p => (
              <span key={p.label} style={{
                fontSize: "0.62rem", fontWeight: 700, padding: "2px 7px",
                borderRadius: 999, letterSpacing: "0.03em",
                background: `${p.color}10`, color: p.color,
                border: `1px solid ${p.color}25`,
              }}>
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px", overflowY: "auto" }}>
          {NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              exact={item.exact}
              badge={item.badge}
            />
          ))}
          {user.email === "useaether.ai@gmail.com" && (
            <NavLink href="/dashboard/feedback" icon="MessageSquare" label="Feedback" />
          )}
        </nav>

        {/* User section */}
        <div style={{ padding: "10px 10px 14px", borderTop: "1px solid #f3f4f6" }}>
          <div style={{
            borderRadius: 10, padding: "11px 12px", marginBottom: 6,
            background: "#fafafa", border: "1px solid #f3f4f6",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.78rem", fontWeight: 900, color: "#fff",
                boxShadow: "0 2px 8px rgba(124,58,237,0.28)",
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: "0.78rem", fontWeight: 700, color: "#111827",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {displayName}
                </div>
                <div style={{
                  fontSize: "0.68rem", color: "#9ca3af", marginTop: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {user.email}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.68rem", color: "#9ca3af" }}>Plan</span>
              <span style={{
                fontSize: "0.68rem", fontWeight: 800, padding: "2px 9px",
                borderRadius: 999, letterSpacing: "0.04em",
                background: user.plan === "FREE" ? "#f3f4f6" : "rgba(124,58,237,0.07)",
                color:      user.plan === "FREE" ? "#6b7280" : "#7c3aed",
                border: `1px solid ${user.plan === "FREE" ? "#e5e7eb" : "rgba(124,58,237,0.2)"}`,
              }}>
                {user.plan}
              </span>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button className="logout-btn" style={{
              display: "flex", width: "100%", alignItems: "center", gap: 8,
              borderRadius: 8, padding: "8px 10px",
              fontSize: "0.78rem", fontWeight: 500, color: "#9ca3af",
              background: "transparent", border: "none", cursor: "pointer",
              transition: "all 0.15s",
            }}>
              <LogOut style={{ width: 13, height: 13 }} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ââ MAIN AREA ââ */}
      <main style={{ flex: 1, minWidth: 0, position: "relative" }}>
        {/* Thin violet top bar */}
        <div style={{
          height: 2, background: "linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed)",
          position: "sticky", top: 0, zIndex: 50,
        }} />

        {/* Mobile header */}
        <div className="md:hidden dash-mobile-header" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", position: "sticky", top: 2, zIndex: 40,
        }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
          }}>
            <AetherMark size={22} glow />
            <span style={{ fontWeight: 900, color: "#0f0f10", letterSpacing: "-0.025em" }}>
              Aether
            </span>
          </Link>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.72rem", fontWeight: 900, color: "#fff",
          }}>
            {initials}
          </div>
        </div>

        <div className="px-4 py-6 md:px-10 md:py-10 pb-24 md:pb-10">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileTabBar />

      {/* Floating widgets â desktop only */}
      <div className="hidden md:block">
        <ChatWidget />
        <FeedbackWidget />
      </div>
    </div>
  );
}

// build trigger
