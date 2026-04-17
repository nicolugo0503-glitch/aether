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

async function updateIntegrations(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resendApiKey: String(formData.get("resendApiKey") || "").trim() || null,
      fromEmail:    String(formData.get("fromEmail") || "").trim() || null,
      serperApiKey: String(formData.get("serperApiKey") || "").trim() || null,
    },
  });
  redirect("/dashboard/settings?saved=1");
}

async function updateSocial(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.user.update({
    where: { id: user.id },
    data: {
      fbPageToken: String(formData.get("fbPageToken") || "").trim() || null,
      fbPageId:    String(formData.get("fbPageId") || "").trim() || null,
      igUserId:    String(formData.get("igUserId") || "").trim() || null,
    },
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
          Saved successfully.
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
        <h2 className="font-semibold">Email Sending</h2>
        <p className="text-sm text-muted mt-1">
          Used by Campaigns to send AI-generated emails. Get a free API key at{" "}
          <a href="https://resend.com" target="_blank" className="text-accent-2 underline">resend.com</a>.
        </p>
        <form action={updateIntegrations} className="mt-4 space-y-4">
          <div>
            <label className="label">Resend API Key</label>
            <input
              className="input mt-1"
              name="resendApiKey"
              type="password"
              placeholder="re_..."
              defaultValue={user.resendApiKey ?? ""}
            />
          </div>
          <div>
            <label className="label">From Email</label>
            <input
              className="input mt-1"
              name="fromEmail"
              type="email"
              placeholder="ava@yourdomain.com"
              defaultValue={user.fromEmail ?? ""}
            />
            <p className="text-xs text-muted mt-1">Must be a verified domain in Resend.</p>
          </div>
          <div>
            <label className="label">Serper API Key (Web Search — optional)</label>
            <input
              className="input mt-1"
              name="serperApiKey"
              type="password"
              placeholder="Get free key at serper.dev"
              defaultValue={user.serperApiKey ?? ""}
            />
            <p className="text-xs text-muted mt-1">If set, agents will research leads on Google before writing emails.</p>
          </div>
          <button className="btn-secondary">Save Integrations</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold">Social Media</h2>
        <p className="text-sm text-muted mt-1">
          Connect Facebook + Instagram to enable automatic posting.{" "}
          <a href="https://developers.facebook.com/docs/pages/access-tokens" target="_blank" className="text-accent-2 underline">
            How to get tokens →
          </a>
        </p>
        <form action={updateSocial} className="mt-4 space-y-4">
          <div>
            <label className="label">Facebook Page Access Token</label>
            <input className="input mt-1" name="fbPageToken" type="password"
              placeholder="EAA..." defaultValue={user.fbPageToken ?? ""} />
          </div>
          <div>
            <label className="label">Facebook Page ID</label>
            <input className="input mt-1" name="fbPageId" placeholder="123456789"
              defaultValue={user.fbPageId ?? ""} />
          </div>
          <div>
            <label className="label">Instagram Business Account ID</label>
            <input className="input mt-1" name="igUserId" placeholder="17841400000000000"
              defaultValue={user.igUserId ?? ""} />
          </div>
          <button className="btn-secondary">Save Social Accounts</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold">Workspace</h2>
        <p className="mt-1 text-sm text-muted">
          You&apos;re on plan <span className="text-white">{user.plan}</span>.
        </p>
      </div>
    </div>
  );
}
