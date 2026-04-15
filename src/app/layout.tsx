import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aether — Hire autonomous AI employees",
  description:
    "Aether gives your team a workforce of specialized AI employees — SDRs, researchers, support reps — trained on your data and wired into your tools.",
  openGraph: {
    title: "Aether — Hire autonomous AI employees",
    description:
      "Provision AI employees for sales, research, and support. Per-seat pricing. Live in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
