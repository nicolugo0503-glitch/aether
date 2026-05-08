import { redirect } from "next/navigation";
import { getCurrentUser, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DeleteAccountButton } from "./delete-account-button";
import { Settings, User, Mail, Globe, Share2, ShieldAlert, CheckCircle2, ExternalLink, Key, Wifi, WifiOff } from "lucide-react";

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

/* ── Connected status badge ── */
function ConnectedBadge({ connected }: { connected: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${connected ? "text-emerald-400" : "text-zinc-600"}`}
      style={{
        background: connected ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.04)",
        border: connected ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.08)",
      }}>
      {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {connected ? "Connected" : "Not set"}
    </span>
  );
}

/* ── User avatar ── */
function UserAvatar({ name, email }: { name: string | null; email: string }) {
  const initials = name
    ? name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2)
    : email[0].toUpperCase();
  return (
    <div className="relative h-20 w-20 shrink-0">
      <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
        style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow:"0 0 28px rgba(124,58,237,0.35)" }}>
        {initials}
      </div>
      {/* Orbit ring */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ border:"1px solid rgba(124,58,237,0.3)", transform:"scale(1.12)", borderRadius:"18px" }} />
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: { searchParams: Promise<{ saved?: string }> }) {
  const user = (await getCurrentUser())!;
  const { saved } = await searchParams;

  return (
    <div className="space-y-7">
      <style>{`
        @keyframes top-flow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes section-in{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes step-in{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}
        .section-card{animation:section-in 0.4s ease both}
        .section-card:nth-child(1){animation-delay:0.05s}.section-card:nth-child(2){animation-delay:0.1s}
        .section-card:nth-child(3){animation-delay:0.15s}.section-card:nth-child(4){animation-delay:0.2s}
        .section-card:nth-child(5){animation-delay:0.25s}
        .step-item{animation:step-in 0.3s ease both}
        .top-bar{animation:top-flow 5s ease infinite;background-size:200% 200%}
        .save-btn:hover{filter:brightness(1.12);transform:translateY(-1px)}
        .save-btn{transition:all 0.2s ease}
        .input:focus{border-color:rgba(124,58,237,0.5)!important;box-shadow:0 0 0 3px rgba(124,58,237,0.1)!important}
      `}</style>

      {/* ── Animated top bar ── */}
      <div className="h-0.5 w-full rounded-full top-bar"
        style={{ background:"linear-gradient(90deg,#7c3aed,#0ea5e9,#10b981,#ec4899,#7c3aed)" }} />

      {/* ── Hero Header ── */}
      <div className="relative rounded-3xl overflow-hidden p-8"
        style={{
          background:"linear-gradient(135deg,rgba(124,58,237,0.07) 0%,rgba(4,4,8,0.98) 60%,rgba(0,0,0,1) 100%)",
          border:"1px solid rgba(124,58,237,0.15)",
          backgroundImage:"radial-gradient(rgba(124,58,237,.06) 1px,transparent 1px)",
          backgroundSize:"28px 28px",
        }}>
        <div className="flex items-center gap-6">
          <UserAvatar name={user.name} email={user.email} />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background:"rgba(124,58,237,0.2)", border:"1px solid rgba(124,58,237,0.3)" }}>
                <Settings className="h-4 w-4 text-violet-400" />
              </div>
              <span className="text-xs uppercase tracking-widest text-violet-500">Account Settings</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">{user.name || "Your Account"}</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                style={{ background:"rgba(124,58,237,0.15)", color:"#a78bfa", border:"1px solid rgba(124,58,237,0.3)" }}>
                {user.plan} plan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Success Banner ── */}
      {saved && (
        <div className="section-card rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.3)", boxShadow:"0 0 20px rgba(16,185,129,0.06)" }}>
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-bold">Changes saved successfully.</span>
        </div>
      )}

      {/* ── Profile ── */}
      <div className="section-card rounded-3xl overflow-hidden"
        style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(124,58,237,0.04)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(124,58,237,0.18)", border:"1px solid rgba(124,58,237,0.3)" }}>
            <User className="h-4 w-4 text-violet-400" />
          </div>
          <h2 className="font-bold text-white">Profile</h2>
          <span className="text-xs text-zinc-600 ml-1">Your identity across the platform</span>
        </div>
        <div className="p-6">
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
            <button type="submit" className="save-btn rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background:"linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow:"0 0 16px rgba(124,58,237,0.2)" }}>
              Save Profile
            </button>
          </form>
        </div>
      </div>

      {/* ── Email Sending ── */}
      <div className="section-card rounded-3xl overflow-hidden"
        style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(14,165,233,0.04)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(14,165,233,0.18)", border:"1px solid rgba(14,165,233,0.3)" }}>
            <Mail className="h-4 w-4" style={{ color:"#0ea5e9" }} />
          </div>
          <h2 className="font-bold text-white">Email Sending</h2>
          <span className="text-xs text-zinc-600 ml-1">Used by Campaigns to send AI-generated emails</span>
          <div className="ml-auto">
            <ConnectedBadge connected={!!user.resendApiKey} />
          </div>
        </div>
        <div className="p-6">
          <form action={updateIntegrations} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase tracking-widest text-zinc-600">Resend API Key</label>
                <Key className="h-3.5 w-3.5 text-zinc-700" />
              </div>
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs uppercase tracking-widest text-zinc-600">
                  Serper API Key <span className="text-zinc-700 normal-case">(web search — optional)</span>
                </label>
                <ConnectedBadge connected={!!user.serperApiKey} />
              </div>
              <input className="input" name="serperApiKey" type="password" placeholder="Get free key at serper.dev" defaultValue={user.serperApiKey ?? ""} />
              <p className="text-xs text-zinc-700 mt-1">If set, agents will research leads on Google before writing emails.</p>
            </div>
            <button type="submit" className="save-btn rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background:"linear-gradient(135deg,#0ea5e9,#0284c7)", boxShadow:"0 0 16px rgba(14,165,233,0.15)" }}>
              Save Integrations
            </button>
          </form>
        </div>
      </div>

      {/* ── Social Media ── */}
      <div className="section-card rounded-3xl overflow-hidden"
        style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(236,72,153,0.04)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(236,72,153,0.18)", border:"1px solid rgba(236,72,153,0.3)" }}>
            <Share2 className="h-4 w-4" style={{ color:"#ec4899" }} />
          </div>
          <h2 className="font-bold text-white">Social Media</h2>
          <span className="text-xs text-zinc-600 ml-1">Facebook + Instagram auto-posting</span>
          <div className="ml-auto">
            <ConnectedBadge connected={!!user.fbPageToken} />
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Steps timeline */}
          <div className="rounded-2xl p-5"
            style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs uppercase tracking-widest text-zinc-600 mb-4">10-minute setup guide</p>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3.5 top-4 bottom-4 w-px"
                style={{ background:"linear-gradient(180deg,rgba(236,72,153,0.4),rgba(124,58,237,0.2))" }} />
              <div className="space-y-5">
                {SOCIAL_STEPS.map((s, idx) => (
                  <div key={s.n} className="step-item flex gap-4" style={{ animationDelay:`${idx*0.06}s` }}>
                    <div className="h-7 w-7 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 z-10"
                      style={{ background:`linear-gradient(135deg,#ec4899,#7c3aed)`, boxShadow:"0 0 12px rgba(236,72,153,0.3)" }}>
                      {s.n}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-white font-semibold text-sm">{s.title}</p>
                      {s.body && <p className="text-zinc-600 text-xs mt-0.5 leading-relaxed">{s.body}</p>}
                      {s.link && (
                        <a href={s.link.href} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-pink-400 hover:text-pink-300 transition-colors mt-0.5 inline-flex items-center gap-1">
                          {s.link.label}<ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Social form */}
          <form action={updateSocial} className="space-y-4">
            {[
              { name:"fbPageToken", label:"Facebook Page Access Token", placeholder:"EAA...", type:"password" },
              { name:"fbPageId", label:"Facebook Page ID", placeholder:"123456789", type:"text" },
              { name:"igUserId", label:"Instagram Business Account ID", placeholder:"17841400000000000", type:"text" },
            ].map(f => (
              <div key={f.name}>
                <label className="text-xs uppercase tracking-widest text-zinc-600 mb-1.5 block">{f.label}</label>
                <input className="input" name={f.name} type={f.type} placeholder={f.placeholder}
                  defaultValue={f.name === "fbPageToken" ? (user.fbPageToken ?? "") : f.name === "fbPageId" ? (user.fbPageId ?? "") : (user.igUserId ?? "")} />
              </div>
            ))}
            <button type="submit" className="save-btn rounded-xl px-5 py-2.5 text-sm font-bold text-white"
              style={{ background:"linear-gradient(135deg,#ec4899,#be185d)", boxShadow:"0 0 16px rgba(236,72,153,0.15)" }}>
              Save Social Accounts
            </button>
          </form>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="section-card rounded-3xl overflow-hidden"
        style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(245,158,11,0.04)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(245,158,11,0.18)", border:"1px solid rgba(245,158,11,0.3)" }}>
            <Globe className="h-4 w-4" style={{ color:"#f59e0b" }} />
          </div>
          <h2 className="font-bold text-white">Workspace</h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-zinc-500">
            You&apos;re on the <span className="text-white font-bold">{user.plan}</span> plan.{" "}
            <a href="/dashboard/billing" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
              Manage billing →
            </a>
          </p>
        </div>
      </div>

      {/* ── Danger Zone ── */}
      <div className="section-card rounded-3xl overflow-hidden"
        style={{ background:"rgba(4,4,8,0.9)", border:"1px solid rgba(239,68,68,0.2)" }}>
        <div className="px-6 py-4 flex items-center gap-3"
          style={{ borderBottom:"1px solid rgba(239,68,68,0.15)", background:"rgba(239,68,68,0.04)" }}>
          <div className="h-8 w-8 rounded-xl flex items-center justify-center"
            style={{ background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)" }}>
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
