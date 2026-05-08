export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    error:   "bg-red-500/10 text-red-300 border-red-500/30",
    running: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    pending: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
  };
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${map[status] ?? map.pending}`}>
      {status}
    </span>
  );
}
