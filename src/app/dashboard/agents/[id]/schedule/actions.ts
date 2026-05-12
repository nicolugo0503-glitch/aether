"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { toPlanKey } from "@/lib/stripe";

export type ScheduleFormState = {
  error?: string;
  success?: string;
};

function nextRunDate(cron: string): Date {
  const now = new Date();
  switch (cron) {
    case "every2days": return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    case "weekly":     return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:           return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function saveSchedule(
  agentId: string,
  _prev: ScheduleFormState,
  formData: FormData
): Promise<ScheduleFormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated." };

  // Only STARTER+ can use scheduled runs
  const planKey = toPlanKey(user.plan);
  if (planKey === "FREE") {
    return { error: "Scheduled runs require a STARTER plan or higher. Upgrade to unlock this feature." };
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent || agent.userId !== user.id) return { error: "Agent not found." };

  const enabled      = formData.get("scheduleEnabled") === "on";
  const cron         = String(formData.get("scheduleCron") || "daily");
  const input        = String(formData.get("scheduleInput") || "").trim();
  const timezone     = String(formData.get("scheduleTimezone") || "UTC");

  const validCrons = ["daily", "every2days", "weekly"];
  if (!validCrons.includes(cron)) return { error: "Invalid schedule frequency." };

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      scheduleEnabled:  enabled,
      scheduleCron:     cron,
      scheduleInput:    input || null,
      scheduleTimezone: timezone,
      // If enabling, set next run to appropriate future date; if disabling, clear it
      scheduleNextRun:  enabled ? nextRunDate(cron) : null,
    },
  });

  revalidatePath(`/dashboard/agents/${agentId}/schedule`);
  return { success: enabled ? "Schedule saved! Your agent will run automatically." : "Schedule disabled." };
}
