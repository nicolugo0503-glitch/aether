import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Building2, Users, ArrowRight, Mail } from "lucide-react";
import { acceptInviteAction } from "@/app/dashboard/team/actions";

export const metadata = { title: "Team Invitation | Aether" };

async function AcceptForm({ token }: { token: string }) {
  async function accept() {
    "use server";
    const result = await acceptInviteAction(token);
    if (result.ok) {
      redirect("/dashboard/team?msg=workspace_created");
    }
  }

  return (
    <form action={accept}>
      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-bold text-base text-white transition-all hover:scale-105"
        style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 32px rgba(124,58,237,0.4)" }}>
        Accept Invitation
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();

  // Look up invite
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: {
        include: {
          owner: { select: { name: true, email: true } },
          members: { select: { id: true } },
        },
      },
    },
  });

  const isExpired = invite && invite.expiresAt < new Date();

  // ── SHARED LAYOUT WRAPPER ────────────────────────────────────────
  function Card({ children }: { children: React.ReactNode }) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(124,58,237,0.3) 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute -bottom-40 -right-20 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(14,165,233,0.2) 0%, transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />
        </div>
        <div className="relative z-10 w-full max-w-md mx-auto px-6">
          <div className="rounded-3xl p-8 md:p-10"
            style={{
              background: "rgba(8,8,12,0.9)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(32px)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.02), 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(124,58,237,0.08)",
            }}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity w-fit">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                <span className="text-white font-black text-sm">A</span>
              </div>
              <span className="font-black text-white text-lg tracking-tight">Aether</span>
            </Link>
            {children}
          </div>
        </div>
      </div>
    );
  }

  // ── INVALID / USED ────────────────────────────────────────────────
  if (!invite || isExpired) {
    return (
      <Card>
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <XCircle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">
            {isExpired ? "Invite Expired" : "Invalid Invite"}
          </h1>
          <p className="text-zinc-500 text-sm mb-6">
            {isExpired
              ? "This invitation link has expired. Ask your team admin to send a new one."
              : "This invitation link is invalid or has already been used."}
          </p>
          <Link href="/dashboard"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors text-sm font-semibold">
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    );
  }

  const ownerName = invite.workspace.owner?.name || invite.workspace.owner?.email || "your team admin";

  // ── NOT LOGGED IN ─────────────────────────────────────────────────
  if (!user) {
    return (
      <Card>
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)" }}>
            <Building2 className="h-7 w-7 text-violet-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Team Invitation</h1>
          <p className="text-zinc-400 text-sm">
            <span className="text-zinc-300 font-semibold">{ownerName}</span> invited you to join
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl"
            style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
            <Users className="h-4 w-4 text-violet-400" />
            <span className="text-white font-bold">{invite.workspace.name}</span>
          </div>
          <p className="text-zinc-600 text-xs mt-2">as a {invite.role}</p>
        </div>

        <div className="mb-4 p-3 rounded-xl flex items-start gap-2"
          style={{ background: "rgba(14,165,233,0.07)", border: "1px solid rgba(14,165,233,0.2)" }}>
          <Mail className="h-4 w-4 text-sky-400 mt-0.5 shrink-0" />
          <p className="text-sky-300 text-xs">
            This invite was sent to <span className="font-semibold">{invite.email}</span>.
            Please sign in with that account to accept.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/login`}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-base text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", boxShadow: "0 0 24px rgba(124,58,237,0.3)" }}>
            Sign in to Accept
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/signup`}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-base text-zinc-300 transition-all hover:text-white hover:bg-white/5"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
            Create Account
          </Link>
        </div>

        <p className="text-zinc-700 text-xs text-center mt-4">
          After signing in, return to this URL to accept the invitation.
        </p>
      </Card>
    );
  }

  // ── WRONG EMAIL ────────────────────────────────────────────────────
  if (invite.email !== user.email) {
    return (
      <Card>
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <Mail className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Wrong Account</h1>
          <p className="text-zinc-500 text-sm mb-2">
            This invite was sent to <span className="text-white font-semibold">{invite.email}</span>.
          </p>
          <p className="text-zinc-600 text-xs mb-6">
            You&apos;re logged in as <span className="text-zinc-400">{user.email}</span>.
            Please sign in with the correct account.
          </p>
          <Link href={`/login`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            Switch Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    );
  }

  // ── ALREADY A MEMBER ──────────────────────────────────────────────
  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id, workspaceId: invite.workspaceId },
  });
  if (existingMembership) {
    return (
      <Card>
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Already a Member</h1>
          <p className="text-zinc-500 text-sm mb-6">
            You&apos;re already part of <span className="text-white font-semibold">{invite.workspace.name}</span>.
          </p>
          <Link href="/dashboard/team"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
            View Team <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Card>
    );
  }

  // ── ALREADY IN ANOTHER WORKSPACE ──────────────────────────────────
  const ownedWs = await prisma.workspace.findUnique({ where: { ownerId: user.id } });
  const memberOf = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (ownedWs || memberOf) {
    return (
      <Card>
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <Building2 className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Already in a Workspace</h1>
          <p className="text-zinc-500 text-sm mb-2">
            You&apos;re already part of a workspace.
          </p>
          <p className="text-zinc-600 text-xs mb-6">
            To join <span className="text-white font-semibold">{invite.workspace.name}</span>,
            you&apos;ll need to leave your current workspace first.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/team"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
              View My Workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard"
              className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm text-center">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // ── SHOW ACCEPT PROMPT ─────────────────────────────────────────────
  return (
    <Card>
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)" }}>
          <Building2 className="h-7 w-7 text-violet-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">You&apos;re Invited</h1>
        <p className="text-zinc-400 text-sm">
          <span className="text-zinc-300 font-semibold">{ownerName}</span> invited you to join
        </p>
        <div className="inline-flex items-center gap-2 mt-3 px-5 py-2.5 rounded-xl"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}>
          <Users className="h-5 w-5 text-violet-400" />
          <span className="text-white font-black text-lg">{invite.workspace.name}</span>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-zinc-600">
          <span>{invite.workspace.members.length} member{invite.workspace.members.length !== 1 ? "s" : ""}</span>
          <span>·</span>
          <span>As {invite.role}</span>
          <span>·</span>
          <span>{Math.max(0, Math.ceil((new Date(invite.expiresAt).getTime() - Date.now()) / 86400000))}d remaining</span>
        </div>
      </div>

      <AcceptForm token={token} />

      <p className="text-xs text-zinc-700 text-center mt-4">
        Accepting as <span className="text-zinc-500">{user.email}</span>
      </p>

      <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <Link href="/dashboard"
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-sm text-center block">
          ← Back to Dashboard
        </Link>
      </div>
    </Card>
  );
}
