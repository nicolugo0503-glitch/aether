"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, hashPassword, verifyPassword, destroySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function saveApiKeys(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resendApiKey = (formData.get("resendApiKey") as string)?.trim() || null;
  const serperApiKey = (formData.get("serperApiKey") as string)?.trim() || null;
  const fromEmail    = (formData.get("fromEmail")    as string)?.trim() || null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(resendApiKey !== null && { resendApiKey }),
      ...(serperApiKey !== null && { serperApiKey }),
      ...(fromEmail    !== null && { fromEmail    }),
    },
  });

  redirect("/dashboard/settings?msg=API+keys+saved+successfully.");
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 1) redirect("/dashboard/settings?err=Name+cannot+be+empty.");
  if (name.length > 80)         redirect("/dashboard/settings?err=Name+too+long.");

  await prisma.user.update({ where: { id: user.id }, data: { name } });
  redirect("/dashboard/settings?msg=Profile+updated+successfully.");
}

export async function changePassword(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const current = (formData.get("current") as string) ?? "";
  const next    = (formData.get("next")    as string) ?? "";
  const confirm = (formData.get("confirm") as string) ?? "";

  if (!current || !next || !confirm)
    redirect("/dashboard/settings?err=All+password+fields+are+required.");
  if (next.length < 8)
    redirect("/dashboard/settings?err=New+password+must+be+at+least+8+characters.");
  if (next !== confirm)
    redirect("/dashboard/settings?err=Passwords+do+not+match.");

  const ok = await verifyPassword(current, user.passwordHash);
  if (!ok) redirect("/dashboard/settings?err=Current+password+is+incorrect.");

  const newHash = await hashPassword(next);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
  redirect("/dashboard/settings?msg=Password+changed+successfully.");
}

export async function deleteAccount() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Cancel active Stripe subscription before deleting the user
  // so we stop billing them immediately (idempotent — safe if already cancelled)
  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err) {
      // Log but don't block deletion — the subscription may already be cancelled
      console.error("[deleteAccount] Failed to cancel Stripe subscription:", err);
    }
  }

  await prisma.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/");
}
