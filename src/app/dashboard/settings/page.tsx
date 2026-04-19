import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DeleteAccountButton } from "./delete-account-button";

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

async function deleteAccount() {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
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

      <div className="card space-y-5">
        <div>
          <h2 className="font-semibold">Social Media</h2>
          <p className="text-sm text-muted mt-1">Connect Facebook + Instagram to enable automatic posting.</p>
        </div>

        {/* ── Step-by-step guide ── */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3 text-sm">
          <p className="font-semibold text-white text-xs uppercase tracking-widest text-zinc-500">How to get your credentials — 10 min setup</p>

          {[
            {
              n: "1",
              title: "Switch Instagram to a Business account",
              body: "In the Instagram app → Settings → Account → Switch to Professional Account → choose Business. Skip if already done.",
            },
            {
              n: "2",
              title: "Link Instagram to your Facebook Page",
              body: "In Facebook → Settings → Linked Accounts → Instagram. Log in and connect. Both accounts must be linked for posting to work.",
            },
            {
              n: "3",
              title: "Open the Graph API Explorer",
              body: null,
              link: { href: "https://developers.facebook.com/tools/explorer/", label: "developers.facebook.com/tools/explorer →" },
            },
            {
              n: "4",
              title: "Generate an Access Token",
              body: 'In the Explorer, click "Generate Access Token". Log in when prompted. Check these permissions: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish.',
            },
            {
              n: "5",
              title: "Get your Facebook Page ID",
              body: 'In the Explorer query box type: me/accounts — then click Submit. Find your Page in the results and copy its "id". Paste it below.',
            },
            {
              n: "6",
              title: "Get your Instagram Business Account ID",
              body: 'In the Explorer query box type: YOUR_PAGE_ID?fields=instagram_business_account — replace YOUR_PAGE_ID with the number from step 5. Copy the "id" inside instagram_business_account.',
            },
            {
              n: "7",
              title: "Extend your token to 60 days (recommended)",
              body: 'In the Explorer, click the blue "i" icon next to your token → Open in Access Token Tool → Extend Access Token. Copy the new long-lived token and paste it below.',
            },
          ].map((s) => (
            <div key={s.n} className="flex gap-3">
              <div className="h-6 w-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{s.title}</p>
                {s.body && <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{s.body}</p>}
                {s.link && (
                  <a href={s.link.href} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors mt-0.5 inline-block">
                    {s.link.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Inputs ── */}
        <form action={updateSocial} className="space-y-4">
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

      <div className="rounded-md border border-red-500/20 bg-red-500/5 p-5">
        <h2 className="font-semibold text-red-400">Danger zone</h2>
        <p className="mt-1 text-sm text-muted">
          Permanently delete your account and all data. This cannot be undone.
        </p>
        <DeleteAccountButton action={deleteAccount} />
      </div>
    </div>
  );
}
