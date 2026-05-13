import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Users, UserPlus, Crown, Shield, User as UserIcon,
  Mail, Clock, Copy, LogOut, Trash2, ChevronDown,
  CheckCircle2, AlertCircle, Building2, ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  createWorkspace,
  getUserWorkspace,
  inviteMember,
  removeMember,
  updateMemberRole,
  cancelInvite,
  leaveWorkspace,
} from "./actions";

export const metadata = { title: "Team | Aether Dashboard" };

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://useaether.net";

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof Crown }> = {
  owner:  { label: "Owner",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.3)",  icon: Crown   },hh
  admin:  { label: "Admin",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", icon: Shield  },
  member: { label: "Member", color: "#67e8f9", bg: "rgba(103,232,249,0.1)",  border: "rgba(103,232,249,0.25)", icon: UserIcon },
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] ?? ROLE_META.member;
  const Icon = meta.icon;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ color: meta.color, background: meta.bg, border: `1px solid ${meta.border}` }}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string; inviteEmail?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const msg = params.msg;
  const err = params.err;
  const inviteEmail = params.inviteEmail;

  const wsResult = await getUserWorkspace(user.id);
  const canManage = wsResult?.role === "owner" || wsResult?.role === "admin";
  const isOwner = wsResult?.role === "owner";

  const successMsg: Record<string, string> = {
    workspace_created: "Workspace created! Start inviting your team.",
    invite_sent: `Invitation sent${inviteEmail ? ` to ${inviteEmail}` : ""}!`,
    member_removed: "Member removed from the workspace.",
    role_updated: "Member role updated.",
    invite_cancelled: "Invite cancelled.",
    left_workspace: "You've left the workspace.",
  };
  const errorMsg: Record<string, string> = {
    name_too_short: "Workspace name must be at least 2 characters.",
    name_too_long: "Workspace name must be under 60 characters.",
    already_has_workspace: "You already own a workspace.",
    already_in_workspace: "You're already in a workspace.",
    invalid_email: "Please enter a valid email address.",
    invalid_role: "Invalid role selected.",
    cannot_invite_self: "You can't invite yourself.",
    already_member: "That person is already a member.",
    no_permission: "You don't have permission to do that.",
    missing_id: "Missing required ID.",
    member_not_found: "Member not found.",
    cannot_remove_owner: "The workspace owner cannot be removed.",
    cannot_change_owner: "The owner's role cannot be changed.",
    not_a_member: "You are not a member of any workspace.",
    owner_cannot_leave: "Owners cannot leave their own workspace. Delete the workspace instead.",
  };

  return (
    <div className="relative max-w-4xl">

      {/* ── BACKGROUND ── */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 40% 0%, rgba(124,58,237,0.1), transparent)" }} />

      <div className="relative z-10 space-y-8">

        {/* ── HEADER ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-3">
              <Users className="h-3 w-3" />
              Team &amp; Workspaces
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {wsResult ? wsResult.workspace.name : "Your Team"}
            </h1>
            <p className="text-zinc-500 mt-1">
              {wsResult
                ? `${wsResult.workspace.members.length} member${wsResult.workspace.members.length !== 1 ? "s" : ""} · Collaborate on agents, campaigns, and social posts.`
                : "Create a workspace to collaborate with your team."}
            </p>
          </div>
          {wsResult && isOwner && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              <Crown className="h-3.5 w-3.5" />
              Workspace Owner
            </div>
          )}
        </div>

        {/* ── FEEDBACK BANNERS ── */}
        {msg && successMsg[msg] && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 text-emerald-300 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMsg[msg]}
          </div>
        )}
        {err && errorMsg[err] && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-red-500/25 bg-red-500/8 text-red-300 text-sm font-semibold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {errorMsg[err]}
          </div>
        )}

        {/* ────────────────────────────────────────────
            NO WORKSPACE — CREATE PROMPT
        ──────────────────────────────────────────── */}
        {!wsResult && (
          <>
            {/* Create workspace card */}
            <div className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(109,40,217,0.06))",
                border: "1px solid rgba(124,58,237,0.3)",
                boxShadow: "0 0 60px rgba(124,58,237,0.08)",
              }}>
              <div className="absolute top-0 inset-x-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), transparent)" }} />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4), transparent)" }} />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
                    <Building2 className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-xl">Create your workspace</h2>
                    <p className="text-zinc-500 text-sm">Invite your team, share agents, and collaborate.</p>
                  </div>
                </div>

                <form action={createWorkspace} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <input
                    name="name"
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. Acme Marketing Team"
                    className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/60"
                    style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shrink-0 transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 24px rgba(124,58,237,0.4)" }}>
                    <Building2 className="h-4 w-4" />
                    Create Workspace
                  </button>
                </form>
              </div>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { icon: Users,     title: "Shared Team View",    desc: "All team members can see and manage agents, campaigns, and social posts together." },
                { icon: Shield,    title: "Role-based Access",   desc: "Assign owners, admins, and members with different levels of access." },
                { icon: Sparkles,  title: "Unlimited Members",   desc: "Add as many teammates as you need. No per-seat limits on any paid plan." },
              ].map(f => (
                <div key={f.title} className="rounded-2xl p-6"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
                    <f.icon className="h-4 w-4 text-violet-400" />
                  </div>
                  <h3 className="text-white font-bold mb-2">{f.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ────────────────────────────────────────────
            HAS WORKSPACE — MAIN TEAM VIEW
        ──────────────────────────────────────────── */}
        {wsResult && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Members",        value: wsResult.workspace.members.length, icon: Users,    color: "#7c3aed" },
                { label: "Pending Invites", value: wsResult.workspace.invites.filter(i => i.expiresAt > new Date()).length, icon: Mail, color: "#0ea5e9" },
                { label: "Your Role",      value: wsResult.role.charAt(0).toUpperCase() + wsResult.role.slice(1), icon: Shield, color: "#10b981" },
              ].map(s => (
                <div key={s.label} className="rounded-2xl p-5 relative overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }} />
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full"
                    style={{ background: `radial-gradient(circle, ${s.color}15, transparent)` }} />
                  <div className="flex items-start justify-between mb-3 relative">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{s.label}</p>
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
                      <s.icon className="h-3.5 w-3.5" style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                </div>
              ))}
            </div>

            {/* ── MEMBERS LIST ── */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="px-6 py-4 flex items-center gap-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(124,58,237,0.04)" }}>
                <Users className="h-4 w-4 text-violet-400" />
                <span className="text-white font-bold text-sm">Team Members</span>
                <span className="ml-auto text-xs text-zinc-600 font-medium">{wsResult.workspace.members.length} total</span>
              </div>

              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {wsResult.workspace.members.map((member) => {
                  const displayName = member.user.name || member.user.email.split("@")[0];
                  const initials = displayName[0].toUpperCase();
                  const isYou = member.userId === user.id;
                  const isMemberOwner = member.role === "owner";

                  return (
                    <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background: isMemberOwner ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white text-sm font-semibold truncate">{displayName}</p>
                          {isYou && (
                            <span className="text-xs text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded font-medium">You</span>
                          )}
                        </div>
                        <p className="text-zinc-600 text-xs truncate">{member.user.email}</p>
                      </div>

                      {/* Role */}
                      <div className="shrink-0 hidden sm:block">
                        <RoleBadge role={member.role} />
                      </div>

                      {/* Joined date */}
                      <div className="text-xs text-zinc-700 shrink-0 hidden md:block">
                        {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>

                      {/* Actions (only for owner/admin, not for themselves if owner) */}
                      {canManage && !isYou && !isMemberOwner && (
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Role change form (owner only) */}
                          {isOwner && (
                            <form action={updateMemberRole} className="flex items-center">
                              <input type="hidden" name="memberId" value={member.id} />
                              <div className="relative">
                                <select
                                  name="role"
                                  defaultValue={member.role}
                                  className="appearance-none text-xs font-semibold px-3 py-1.5 pr-7 rounded-lg cursor-pointer outline-none"
                                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#a1a1aa" }}
                                  onChange={(e) => {
                                    const form = e.target.closest("form") as HTMLFormElement;
                                    if (form) form.requestSubmit();
                                  }}
                                >
                                  <option value="member">Member</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <ChevronDown className="h-3 w-3 absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                              </div>
                            </form>
                          )}
                          {/* Remove button */}
                          <form action={removeMember}>
                            <input type="hidden" name="memberId" value={member.id} />
                            <button
                              type="submit"
                              className="h-7 w-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/15 hover:border-red-500/30"
                              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
                              title="Remove member">
                              <Trash2 className="h-3.5 w-3.5 text-zinc-600 hover:text-red-400" />
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── PENDING INVITES ── */}
            {wsResult.workspace.invites.filter(i => i.expiresAt > new Date()).length > 0 && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-6 py-4 flex items-center gap-2"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(14,165,233,0.04)" }}>
                  <Clock className="h-4 w-4 text-sky-400" />
                  <span className="text-white font-bold text-sm">Pending Invites</span>
                </div>
                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {wsResult.workspace.invites
                    .filter(i => i.expiresAt > new Date())
                    .map((invite) => {
                      const inviteUrl = `${APP_URL}/team/invite/${invite.token}`;
                      const daysLeft = Math.max(0, Math.ceil((new Date(invite.expiresAt).getTime() - Date.now()) / 86400000));
                      return (
                        <div key={invite.id} className="flex items-center gap-4 px-6 py-4 flex-wrap">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: "rgba(14,165,233,0.12)", border: "1px solid rgba(14,165,233,0.25)" }}>
                            <Mail className="h-4 w-4 text-sky-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{invite.email}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <RoleBadge role={invite.role} />
                              <span className="text-xs text-zinc-600">· expires in {daysLeft}d</span>
                            </div>
                          </div>
                          {/* Copy invite link */}
                          <div className="hidden md:flex items-center gap-2">
                            <input
                              readOnly
                              value={inviteUrl}
                              className="text-xs font-mono text-violet-400 px-3 py-1.5 rounded-lg truncate max-w-[260px]"
                              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(124,58,237,0.2)" }}
                            />
                          </div>
                          {canManage && (
                            <form action={cancelInvite}>
                              <input type="hidden" name="inviteId" value={invite.id} />
                              <button
                                type="submit"
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-red-500/15"
                                style={{ color: "#71717a", border: "1px solid rgba(255,255,255,0.07)" }}>
                                Cancel
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── INVITE FORM ── */}
            {canManage && (
              <div className="rounded-3xl p-8 relative overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}>
                <div className="absolute top-0 inset-x-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5), transparent)" }} />

                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center"
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)" }}>
                    <UserPlus className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base">Invite a Team Member</h3>
                    <p className="text-zinc-500 text-sm">
                      {user.resendApiKey && user.fromEmail
                        ? "An invitation email will be sent automatically."
                        : "Copy the invite link and share it manually."}
                    </p>
                  </div>
                </div>

                <form action={inviteMember} className="flex flex-col sm:flex-row gap-3">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/50"
                    style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <div className="relative shrink-0">
                    <select
                      name="role"
                      defaultValue="member"
                      className="appearance-none w-full sm:w-auto text-sm font-semibold px-4 py-3 pr-9 rounded-xl cursor-pointer outline-none"
                      style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)", color: "#a1a1aa" }}>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white shrink-0 transition-all hover:scale-105"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}>
                    <UserPlus className="h-4 w-4" />
                    Send Invite
                  </button>
                </form>

                {/* Info about email */}
                {!user.resendApiKey && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600"
                    style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    No Resend API key configured. Invites are generated but not emailed — copy the invite link from Pending Invites above.{" "}
                    <Link href="/dashboard/settings" className="text-violet-400 hover:text-violet-300 font-semibold">
                      Add Resend key →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── NON-OWNER: LEAVE WORKSPACE ── */}
            {!isOwner && wsResult.role !== "owner" && (
              <div className="rounded-2xl p-6 flex items-center justify-between gap-4"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <div>
                  <p className="text-white font-semibold text-sm">Leave Workspace</p>
                  <p className="text-zinc-600 text-xs mt-0.5">You will lose access to all shared team resources.</p>
                </div>
                <form action={leaveWorkspace}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-red-400 transition-all hover:bg-red-500/10"
                    style={{ border: "1px solid rgba(239,68,68,0.2)" }}>
                    <LogOut className="h-4 w-4" />
                    Leave
                  </button>
                </form>
              </div>
            )}

            {/* ── ROLE LEGEND ── */}
            <div className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs text-zinc-600 font-semibold uppercase tracking-widest mb-4">Role Permissions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { role: "owner",  perms: ["Full control", "Billing & plan", "Add/remove admins", "Delete workspace"] },
                  { role: "admin",  perms: ["Invite members", "Remove members", "Manage agents & campaigns", "View all runs"] },
                  { role: "member", perms: ["Run agents", "Create campaigns", "Post social content", "View shared dashboard"] },
                ].map(({ role, perms }) => {
                  const meta = ROLE_META[role];
                  return (
                    <div key={role} className="rounded-xl p-4"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <RoleBadge role={role} />
                      </div>
                      <ul className="space-y-1">
                        {perms.map(p => (
                          <li key={p} className="flex items-center gap-2 text-xs" style={{ color: meta.color + "cc" }}>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

          </>
        )}

      </div>
    </div>
  );
}
