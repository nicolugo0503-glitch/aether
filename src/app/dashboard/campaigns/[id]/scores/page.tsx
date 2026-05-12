import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import LeadScoresClient from "./scores-client";

export default async function CampaignScoresPage({
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
    <LeadScoresClient
      campaignId={campaign.id}
      campaignName={campaign.name}
      initialThreshold={campaign.minScoreThreshold}
      initialSortByScore={campaign.sortByScore}
      initialScoringEnabled={campaign.scoringEnabled}
    />
  );
}
