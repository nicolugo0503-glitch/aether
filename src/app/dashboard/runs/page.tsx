import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { centsToUSD, formatDate } from "@/lib/utils";
import { StatusPill } from "../page";

export default async function RunsPage() {
  const user = (await getCurrentUser())!;
  const runs = await prisma.run.findMany({
    where: { userId: user.id },
    include: { agent: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Runs</h1>
        <p className="text-sm text-muted">Last 100 executions across all agents.</p>
      </div>

      {runs.length === 0 ? (
        <div className="card text-sm text-muted">
          No runs yet. Head to <span className="text-white">AI Employees</span> and run one.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Agent</th>
                <th>Status</th>
                <th>Tokens</th>
                <th>Cost</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="py-2">{r.agent.name}</td>
                  <td><StatusPill status={r.status} /></td>
                  <td>{r.tokensIn + r.tokensOut}</td>
                  <td>{centsToUSD(r.costCents)}</td>
                  <td className="text-muted">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
