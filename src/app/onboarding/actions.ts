"use server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function completeOnboarding(
  industry: string,
  goal: string,
  customPrompt: string,
) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Mark onboarding complete
  await prisma.user.update({
    where: { id: user.id },
    data: { onboardingComplete: true },
  });

  // Personalize Ava's system prompt based on industry + goal
  const ava = await prisma.agent.findFirst({
    where: { userId: user.id, name: { startsWith: "Ava" } },
  });
  if (ava) {
    await prisma.agent.update({
      where: { id: ava.id },
      data: { systemPrompt: customPrompt },
    });
  }

  redirect("/dashboard");
}
