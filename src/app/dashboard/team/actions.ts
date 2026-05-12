"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://useaether.net";

type WorkspaceWithAll = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  members: Array<{
    id: string;
    role: string;
    joinedAt: Date;
    workspaceId: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
  invites: Array<{
    id: string;
    email: string;
    role: string;
    token: string;
    invitedById: string;
    expiresAt: Date;
    createdAt: Date;
    workspaceId: string;
  }>;
};

/** Get the workspace this user can manage (owner or admin) */
export async function getManageableWorkspace(
  userId: string,
): Promise<{ workspace: WorkspaceWithAll; role: string } | null> {
  const owned = await prisma.workspace.findUnique({
    where: { ownerId: userId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: "asc" } },
      invites: { orderBy: { createdAt: "desc" } },
    },
  });
  if (owned) return { workspace: owned as WorkspaceWithAll, role: "owner" };

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, role: "admin" },
    include: {
      workspace: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: "asc" } },
          invites: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (membership) return { workspace: membership.workspace as WorkspaceWithAll, role: "admin" };

  return null;
}

/** Get any workspace the user belongs to (read-only member too) */
export async function getUserWorkspace(userId: string): Promise<{ workspace: WorkspaceWithAll; role: string } | null> {
  const managed = await getManageableWorkspace(userId);
  if (managed) return managed;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: {
      workspace: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { joinedAt: "asc" } },
          invites: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (membership) return { workspace: membership.workspace as WorkspaceWithAll, role: membership.role };

  return null;
}

// ── CREATE WORKSPACE ───────────────────────────────────────────────────────
export async function createWorkspace(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const name = String(formData.get("name") || "").trim();
  if (!name || name.length < 2) return redirect("/dashboard/team?err=name_too_short");
  if (name.length > 60) return redirect("/dashboard/team?err=name_too_long");

  const existing = await prisma.workspace.findUnique({ where: { ownerId: user.id } });
  if (existing) return redirect("/dashboard/team?err=already_has_workspace");

  const memberOf = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (memberOf) return redirect("/dashboard/team?err=already_in_workspace");

  await prisma.workspace.create({
    data: {
      name,
      ownerId: user.id,
      members: { create: { userId: user.id, role: "owner" } },
    },
  });

  redirect("/dashboard/team?msg=workspace_created");
}

// ── INVITE MEMBER ──────────────────────────────────────────────────────────
export async function inviteMember(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const email = String(formData.get("email") || "").toLowerCase().trim();
  const role = String(formData.get("role") || "member");

  if (!email || !email.includes("@")) return redirect("/dashboard/team?err=invalid_email");
  if (!["admin", "member"].includes(role)) return redirect("/dashboard/team?err=invalid_role");
  if (email === user.email) return redirect("/dashboard/team?err=cannot_invite_self");

  const result = await getManageableWorkspace(user.id);
  if (!result) return redirect("/dashboard/team?err=no_permission");
  const { workspace } = result;

  const alreadyMember = workspace.members.some((m) => m.user.email === email);
  if (alreadyMember) return redirect("/dashboard/team?err=already_member");

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = crypto.randomUUID().replace(/-/g, "");

  const invite = await prisma.workspaceInvite.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email } },
    create: { workspaceId: workspace.id, email, role, token, invitedById: user.id, expiresAt },
    update: { role, token, invitedById: user.id, expiresAt },
  });

  // Send email if Resend is configured
  if (user.resendApiKey && user.fromEmail) {
    const inviteUrl = `${APP_URL}/team/invite/${invite.token}`;
    const inviterName = user.name || user.email.split("@")[0];
    try {
      await sendEmail({
        apiKey: user.resendApiKey,
        from: user.fromEmail,
        to: email,
        subject: `${inviterName} invited you to join ${workspace.name} on Aether`,
        body: [
          `Hi there,`,
          ``,
          `${inviterName} has invited you to join "${workspace.name}" on Aether AI as a ${role}.`,
          ``,
          `Accept your invitation:`,
          inviteUrl,
          ``,
          `This link expires in 7 days. If you don't have an account yet, you'll be prompted to create one.`,
          ``,
          `— The Aether Team`,
        ].join("\n"),
      });
    } catch (e) {
      console.error("[team] Failed to send invite email:", e);
    }
  }

  redirect(`/dashboard/team?msg=invite_sent&inviteEmail=${encodeURIComponent(email)}`);
}

// ── REMOVE MEMBER ─────────────────────────────────────────────────────────
export async function removeMember(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const memberId = String(formData.get("memberId") || "");
  if (!memberId) return redirect("/dashboard/team?err=missing_id");

  const result = await getManageableWorkspace(user.id);
  if (!result) return redirect("/dashboard/team?err=no_permission");
  const { workspace } = result;

  const member = workspace.members.find((m) => m.id === memberId);
  if (!member) return redirect("/dashboard/team?err=member_not_found");
  if (member.role === "owner") return redirect("/dashboard/team?err=cannot_remove_owner");
  if (result.role === "admin" && member.role === "admin") return redirect("/dashboard/team?err=no_permission");

  await prisma.workspaceMember.delete({ where: { id: memberId } });
  redirect("/dashboard/team?msg=member_removed");
}

// ── UPDATE MEMBER ROLE ────────────────────────────────────────────────────
export async function updateMemberRole(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const memberId = String(formData.get("memberId") || "");
  const newRole = String(formData.get("role") || "member");

  if (!memberId) return redirect("/dashboard/team?err=missing_id");
  if (!["admin", "member"].includes(newRole)) return redirect("/dashboard/team?err=invalid_role");

  const result = await getManageableWorkspace(user.id);
  if (!result || result.role !== "owner") return redirect("/dashboard/team?err=no_permission");
  const { workspace } = result;

  const member = workspace.members.find((m) => m.id === memberId);
  if (!member || member.role === "owner") return redirect("/dashboard/team?err=cannot_change_owner");

  await prisma.workspaceMember.update({ where: { id: memberId }, data: { role: newRole } });
  redirect("/dashboard/team?msg=role_updated");
}

// ── CANCEL INVITE ─────────────────────────────────────────────────────────
export async function cancelInvite(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const inviteId = String(formData.get("inviteId") || "");
  if (!inviteId) return redirect("/dashboard/team?err=missing_id");

  const result = await getManageableWorkspace(user.id);
  if (!result) return redirect("/dashboard/team?err=no_permission");

  await prisma.workspaceInvite.deleteMany({ where: { id: inviteId, workspaceId: result.workspace.id } });
  redirect("/dashboard/team?msg=invite_cancelled");
}

// ── LEAVE WORKSPACE ───────────────────────────────────────────────────────
export async function leaveWorkspace(_formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return redirect("/login");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  if (!membership) return redirect("/dashboard/team?err=not_a_member");
  if (membership.role === "owner") return redirect("/dashboard/team?err=owner_cannot_leave");

  await prisma.workspaceMember.delete({ where: { id: membership.id } });
  redirect("/dashboard/team?msg=left_workspace");
}

// ── ACCEPT INVITE (called from accept page) ───────────────────────────────
export async function acceptInviteAction(token: string): Promise<{
  ok: boolean;
  error?: string;
  workspaceName?: string;
}> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_logged_in" };

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: true },
  });

  if (!invite) return { ok: false, error: "invalid_token" };
  if (invite.expiresAt < new Date()) return { ok: false, error: "expired" };
  if (invite.email !== user.email) return { ok: false, error: "wrong_email", workspaceName: invite.workspace.name };

  // Already a member?
  const existing = await prisma.workspaceMember.findFirst({
    where: { workspaceId: invite.workspaceId, userId: user.id },
  });
  if (existing) {
    await prisma.workspaceInvite.delete({ where: { token } }).catch(() => {});
    return { ok: true, workspaceName: invite.workspace.name };
  }

  // User can't be in two workspaces
  const ownedWs = await prisma.workspace.findUnique({ where: { ownerId: user.id } });
  if (ownedWs) return { ok: false, error: "already_in_workspace", workspaceName: invite.workspace.name };

  const memberOf = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (memberOf) return { ok: false, error: "already_in_workspace", workspaceName: invite.workspace.name };

  await prisma.workspaceMember.create({
    data: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
  });
  await prisma.workspaceInvite.delete({ where: { token } }).catch(() => {});

  return { ok: true, workspaceName: invite.workspace.name };
}
