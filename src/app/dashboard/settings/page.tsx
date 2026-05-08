import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DeleteAccountButton } from "./delete-account-button";
import { Settings, User, Mail, Globe, Share2, ShieldAlert, CheckCircle2, ExternalLink } from "lucide-react";

async function updateProfile(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await prisma.user.update({ where: { id: user.id }, data: { name: String(formData.get("name") || user.name) } });
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

const SOCIAL_STEPS = [
  { n:"1", title:"Switch Instagram to Business", body:"In the Instagram app → Settings → Account → Switch to Professional Account → choose Business." },
  { n:"2", title:"Link Instagram to your Facebook Page", body:"In Facebook → Settings → Linked Accounts → Instagram. Log in and connect." },
  { n:"3", title:"Open the Graph API Explorer", link:{ href:"https://developers.facebook.com/tools/explorer/", label:"developers.facebook.com/tools/explorer →" } },
  { n:"4", title:"Generate an Access Token", body:"Click 'Generate Access Token'. Check: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish." },
  { n:"5", title:"Get your Facebook Page ID", body:"In the Explorer type: me/accounts — click Submit, find your Page and copy its 'id'." },
  { n:"6", title:"Get your Instagram Business Account ID", body:"Query: YOUR_PAGE_ID?fields=instagram_business_account — copy the 'id' inside instagram_business_account." },
  { n:"7", title:"Extend to 60-day token (recommended)", body:"In the Explorer click the blue 'i' next to your token → Open in Access Token Tool → Extend Access Token." },
];

export default async function SettingsPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const user = (await getCurrentUser())!;
  const { saved } = await searchParams;

  const Section = ({ icon: Icon, title, subtitle, color = "#7c3aed", children }: {
    icon: React.ElementType; title: string; subtitle?: string; color?: string; children: React.ReactNode;
  }) => (
    <div className="rounded-3xl overflow-hidden" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)" }}>
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(255,255,255,0.01)" }}>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background:`${color}18`, border:`1px solid ${color}30` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <div>
          <h2 className="font-bold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-zinc-600 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-2xl flex items-center justify-center"
          style={{ background:"linear-gradient(135deg,rgba(124,58,237,0.2),rgba(109,40,217,0.1))", border:"1px solid rgba(124,58,237,0.25)" }}>
          <Settings style={{ width:18, height:18 }} className="text-violet-400" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Settings</h1>
      </div>

      {/* ── Success Banner ── */}
      {saved && (
        <div className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
          style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)" }}>
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-semibold text-sm">Changes saved successfully.</span>
        </div>
      )}

      {/* ── Profile ── */}
      <Section icon={User} title="Profile" subtitle="Your identity across the platform">
        <form action={updateProfile} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Email address</label>
            <input className="input opacity-50 cursor-not-allowed" value={user.email} disabled readOnly />
            <p className="text-xs text-zinc-700 mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Display Name</label>
            <input className="input" name="name" placeholder="Your name or username" defaultValue={user.name ?? ""} />
          </div>
          <button type="submit" className="rounded-xl px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            Save Profile
          </button>
        </form>
      </Section>

      {/* ── Email Sending ── */}
      <Section icon={Mail} title="Email Sending" subtitle="Used by Campaigns to send AI-generated emails" color="#0ea5e9">
        <form action={updateIntegrations} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Resend API Key</label>
            <input className="input" name="resendApiKey" type="password" placeholder="re_..." defaultValue={user.resendApiKey ?? ""} />
            <p className="text-xs text-zinc-700 mt-1">
              Get a free key at{" "}
              <a href="https://resend.com" target="_blank" className="text-violet-400 hover:text-violet-300 inline-flex items-center gap-0.5">
                resend.com<ExternalLink className="h-2.5 w-2.5" />
              </a>
            </p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">From Email</label>
            <input className="input" name="fromEmail" type="email" placeholder="ava@yourdomain.com" defaultValue={user.fromEmail ?? ""} />
            <p className="text-xs text-zinc-700 mt-1">Must be a verified domain in Resend.</p>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">
              Serper API Key <span className="text-zinc-700 normal-case">(web search — optional)</span>
            </label>
            <input className="input" name="serperApiKey" type="password" placeholder="Get free key at serper.dev" defaultValue={user.serperApiKey ?? ""} />
            <p className="text-xs text-zinc-700 mt-1">If set, agents will research leads on Google before writing emails.</p>
          </div>
          <button type="submit" className="rounded-xl px-5 py-2 text-sm font-bold text-zinc-300 transition-all hover:text-white"
            style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
            Save Integrations
          </button>
        </form>
      </Section>

      {/* ── Social Media ── */}
      <Section icon={Share2} title="Social Media" subtitle="Connect Facebook + Instagram for automatic posting" color="#ec4899">
        <div className="space-y-5">
          {/* Steps */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs uppercase tracking-widest text-zinc-600">10-minute setup guide</p>
            {SOCIAL_STEPS.map(s => (
              <div key={s.n} className="flex gap-3">
                <div className="h-5 w-5 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5"
                  style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                  {s.n}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                  {s.body && <p className="text-zinc-600 text-xs mt-0.5 leading-relaxed">{s.body}</p>}
                  {s.link && (
                    <a href={s.link.href} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-violet-400 hover:text-violet-300 transition-colors mt-0.5 inline-flex items-center gap-1">
                      {s.link.label}<ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <form action={updateSocial} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Facebook Page Access Token</label>
              <input className="input" name="fbPageToken" type="password" placeholder="EAA..." defaultValue={user.fbPageToken ?? ""} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Facebook Page ID</label>
              <input className="input" name="fbPageId" placeholder="123456789" defaultValue={user.fbPageId ?? ""} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">Instagram Business Account ID</label>
              <input className="input" name="igUserId" placeholder="17841400000000000" defaultValue={user.igUserId ?? ""} />
            </div>
            <button type="submit" className="rounded-xl px-5 py-2 text-sm font-bold text-zinc-300 transition-all hover:text-white"
              style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)" }}>
              Save Social Accounts
            </button>
          </form>
        </div>
      </Section>

      {/* ── Workspace ── */}
      <Section icon={Globe} title="Workspace" color="#f59e0b">
        <p className="text-sm text-zinc-500">
          You&apos;re on the <span className="text-white font-semibold">{user.plan}</span> plan.
          {" "}<a href="/dashboard/billing" className="text-violet-400 hover:text-violet-300 transition-colors">Manage billing →</a>
        </p>
      </Section>

      {/* ── Danger Zone ── */}
      <div className="rounded-3xl overflow-hidden" style={{ border:"1px solid rgba(239,68,68,0.2)" }}>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom:"1px solid rgba(239,68,68,0.15)", background:"rgba(239,68,68,0.04)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)" }}>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <h2 className="font-bold text-red-400">Danger Zone</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-zinc-500 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <DeleteAccountButton action={deleteAccount} />
        </div>
      </div>
    </div>
  );
}
