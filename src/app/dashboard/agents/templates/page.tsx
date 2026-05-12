import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PLAN_LIMITS, toPlanKey } from "@/lib/stripe";
import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { TemplateGrid } from "./_components/template-grid";

export const metadata = { title: "Agent Templates | Aether" };

export default async function TemplatesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const agentCount = await prisma.agent.count({ where: { userId: user.id } });
  const limit      = PLAN_LIMITS[toPlanKey(user.plan)].agents;
  const canAdd     = agentCount < limit;


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Link href="/dashboard/agents" style={{
          width: 34, height: 34, borderRadius: 10,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
        }}>
          <ArrowLeft size={15} color="#71717a" />
        </Link>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
            Agent Marketplace
          </h1>
          <p style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>
            One-click deploy · {agentCount}/{limit} agents used
          </p>
        </div>
        {!canAdd && (
          <Link href="/dashboard/billing" style={{
            marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none",
            boxShadow: "0 0 20px rgba(124,58,237,0.4)",
          }}>
            <Zap size={12} />
            Upgrade to add more agents
          </Link>
        )}
      </div>

      <TemplateGrid canAdd={canAdd} />
    </div>
  );
}
