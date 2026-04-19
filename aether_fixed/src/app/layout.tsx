import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Aether — Hire Autonomous AI Employees",
    template: "%s | Aether",
  },
  description:
    "Aether is the platform for autonomous AI employees — specialized agents for sales, research, support, and ops. Trained on your data, wired into your tools, live in minutes.",
  keywords: [
    "AI employees", "autonomous AI", "AI agents", "sales automation",
    "AI SDR", "support automation", "AI workforce", "AI SaaS",
  ],
  openGraph: {
    title: "Aether — Hire Autonomous AI Employees",
    description:
      "Provision AI employees for sales, research, support, and ops. Per-seat pricing. SOC 2. Live in 10 minutes.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aether — Hire Autonomous AI Employees",
    description:
      "Provision AI employees for sales, research, support, and ops. Per-seat pricing. SOC 2. Live in 10 minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
