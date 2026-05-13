"use client";
import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/widgets/ChatWidget";

/**
 * Renders the floating chat bubble only on marketing / public pages.
 * Automatically hides itself on /dashboard and /onboarding routes.
 */
export function LandingChatWidget() {
  const path = usePathname();
  if (path.startsWith("/dashboard") || path.startsWith("/onboarding")) return null;
  return <ChatWidget />;
}
