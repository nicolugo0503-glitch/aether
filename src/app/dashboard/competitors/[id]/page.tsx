import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChevronLeft, ExternalLink, Trash2 } from "lucide-react";
import { CompetitorDetailClient } from "./_components/CompetitorDetailClient";

async function deleteCompetitor(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") || "");
  if (!id) return;
  const owned = await prisma.competitor.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.competitor.delete({ where: { id } });
  redirect("/dashboard/competitors");
}

export default async function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = (await getCurrentUser())!;

  const competitor = await prisma.competitor.findFirst({
    where: { id, userId: user.id },
  });
  if (!competitor) notFound();

  const [changes, snapshotCount] = await Promise.all([
    prisma.competitorChange.findMany({
      where: { competitorId: id },
      orderBy: { detectedAt: "desc" },
      take: 100,
    }),
    prisma.competitorSnapshot.count({ where: { competitorId: id } }),
  ]);

  const serializableCompetitor = {
    id: competitor.id,
    name: competitor.name,
    url: competitor.url,
    category: competitor.category,
    focus: competitor.focus,
    enabled: competitor.enabled,
    frequency: competitor.frequency,
    notifyEmail: competitor.notifyEmail,
    lastSeverity: competitor.lastSeverity,
    lastSummary: competitor.lastSummary,
    lastFetchedAt: competitor.lastFetchedAt?.toISOString() || null,
    lastChangeAt: competitor.lastChangeAt?.toISOString() || null,
    lastError: competitor.lastError,
    totalScans: competitor.totalScans,
    totalChanges: competitor.totalChanges,
    nextScanAt: competitor.nextScanAt?.toISOString() || null,
  };

  const serializableChanges = changes.map((c) => ({
    id: c.id,
    summary: c.summary,
    details: c.details,
    severity: c.severity,
    signals: c.signals,
    charsAdded: c.charsAdded,
    charsRemoved: c.charsRemoved,
    read: c.read,
    pinned: c.pinned,
    emailedAt: c.emailedAt?.toISOString() || null,
    detectedAt: c.detectedAt.toISOString(),
  }));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard/competitors"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white mb-4"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> All trackers
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-white truncate">{competitor.name}</h1>
          <a
            href={competitor.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-xs text-zinc-500 hover:text-violet-300 inline-flex items-center gap-1 mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{competitor.url}</span>
          </a>
        </div>

        <form action={deleteCompetitor}>
          <input type="hidden" name="id" value={competitor.id} />
          <button
            type="submit"
            className="rounded-xl px-3 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.20)",
              color: "#fca5a5",
            }}
          >
            <Trash2 className="h-3 w-3" />
            Delete tracker
          </button>
        </form>
      </div>

      <CompetitorDetailClient
        competitor={serializableCompetitor}
        initialChanges={serializableChanges}
        snapshotCount={snapshotCount}
      />
    </div>
  );
}
