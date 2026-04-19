import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Check, Settings, User, Shield, Key } from "lucide-react";

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
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted">Manage your workspace and account preferences.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-emerald-300">
          <Check className="h-4 w-4 shrink-0" />
          Changes saved successfully.
        </div>
      )}

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <User className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold">Profile</h2>
            <p className="text-xs text-muted">Your personal information</p>
          </div>
        </div>

        <form action={updateProfile} className="space-y-5">
          <div>
            <label className="label mb-2 block">Email address</label>
            <input
              className="input opacity-60 cursor-not-allowed"
              value={user.email}
              disabled
            />
            <p className="mt-1.5 text-xs text-muted">Email cannot be changed.</p>
          </div>
          <div>
            <label className="label mb-2 block">Display name</label>
            <input
              className="input"
              name="name"
              defaultValue={user.name ?? ""}
              placeholder="Your name"
            />
          </div>
          <button className="btn-primary px-6 py-2.5 rounded-xl">
            Save changes
          </button>
        </form>
      </div>

      {/* Account avatar */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-2xl font-bold">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">{user.name || "Your workspace"}</div>
            <div className="text-sm text-muted">{user.email}</div>
            <div className="mt-1">
              <span className="pill pill-neutral text-[11px]">{user.plan} plan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-2/10">
            <Settings className="h-5 w-5 text-accent-2" />
          </div>
          <div>
            <h2 className="font-semibold">Workspace</h2>
            <p className="text-xs text-muted">Your plan and usage details</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Current plan", value: user.plan },
            { label: "Member since", value: new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" }) },
            { label: "Runs used this period", value: String(user.runsUsedThisPeriod) },
            { label: "Plan renewal", value: user.planRenewsAt ? user.planRenewsAt.toLocaleDateString() : "—" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-elevated p-4">
              <div className="label mb-1">{item.label}</div>
              <div className="font-semibold">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
            <Shield className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h2 className="font-semibold">Security</h2>
            <p className="text-xs text-muted">Account security settings</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-border bg-elevated p-4">
            <div>
              <div className="text-sm font-medium">Password</div>
              <div className="text-xs text-muted">Last changed: unknown</div>
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5 rounded-lg" disabled>
              Change password
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-elevated p-4">
            <div>
              <div className="text-sm font-medium">Two-factor authentication</div>
              <div className="text-xs text-muted">Not configured</div>
            </div>
            <button className="btn-secondary text-xs px-3 py-1.5 rounded-lg" disabled>
              Enable 2FA
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-2">
          Password change and 2FA coming soon on Growth and Scale plans.
        </p>
      </div>

      {/* API */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-3/10">
            <Key className="h-5 w-5 text-accent-3" />
          </div>
          <div>
            <h2 className="font-semibold">API Access</h2>
            <p className="text-xs text-muted">Programmatic access to your agents</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-elevated p-4">
          <div className="text-sm text-muted">
            API keys and webhook configuration are available on Growth and Scale plans.
          </div>
        </div>
      </div>
    </div>
  );
}
