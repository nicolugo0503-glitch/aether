import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function updateProfile(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.user.update({
    where: { id: user.id },
    data: { name: String(formData.get("name") || user.name) },
  });
  redirect("/dashboard/settings?saved=1");
}

export default async function SettingsPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const user = (await getCurrentUser())!;
  const { saved } = await searchParams;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {saved && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          Saved.
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold">Profile</h2>
        <form action={updateProfile} className="mt-4 space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input mt-1" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input mt-1" name="name" defaultValue={user.name ?? ""} />
          </div>
          <button className="btn-secondary">Save</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-muted">
          You're on plan <span className="text-white">{user.plan}</span>.
        </p>
      </div>
    </div>
  );
}
