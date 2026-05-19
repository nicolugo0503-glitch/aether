import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AbTestClient from "./ab-test-client";

export default async function CampaignAbTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const campaign = await prisma.campaign.findFirst({
    where: { id, userId: user.id },
  });
  if (!campaign) redirect("/dashboard/campaigns");

  return (
    <AbTestClient
      campaignId={campaign.id}
      campaignName={campaign.name}
    />
  );
}
