"use client";

export function DeleteAccountButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action} className="mt-4">
      <button
        type="submit"
        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
        onClick={(e) => {
          if (!confirm("Are you sure? This will permanently delete your account and all data.")) {
            e.preventDefault();
          }
        }}
      >
        Delete my account
      </button>
    </form>
  );
}
