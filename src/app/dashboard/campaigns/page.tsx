// deploy trigger
import { redirect } from "// v2 - force build
import { getCurrentUser } from "@/lib/auth";
import CampaignsClient from "./campaigns-client";

export default async function CampaignsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <CampaignsClient />;
}
