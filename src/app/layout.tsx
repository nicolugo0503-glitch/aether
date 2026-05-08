import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CustomCursor } from "@/components/landing/cursor";
import { ChatWidget } from "@/components/chat-widget";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#7c3aed",
};

export const metadata: Metadata = {
  title: "Aether — Hire autonomous AI employees",
  description:
    "Aether gives your team a workforce of autonomous AI employees — SDRs, social media agents, and email marketers — live in minutes.",
  openGraph: {
    title: "Aether — Hire autonomous AI employees",
    description:
      "Deploy AI agents for social media, email, and sales. All on autopilot. Start free.",
    type: "website",
    url: "https://www.useaether.net",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aether — Hire autonomous AI employees",
    description: "Deploy AI agents for social media, email, and sales. All on autopilot.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <CustomCursor />
        <ChatWidget />
        {children}
      </body>
    </html>
  );
}
