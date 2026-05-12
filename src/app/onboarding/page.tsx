import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  // Must be logged in
  if (!user) redirect("/login");

  // Already onboarded → send to dashboard
  if (user.onboardingComplete) redirect("/dashboard");

  return <OnboardingClient />;
}
