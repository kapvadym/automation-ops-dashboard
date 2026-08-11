import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { StatusRail } from "@/components/ui/StatusRail";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"],
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "automation-ops-dashboard",
  description:
    "A live systems console demonstrating 4 backend/AI-agent projects: a RAG docs agent, a workflow automation pipeline, a tool-calling agent, and an API key manager.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col bg-void font-body text-ink md:flex-row">
        <StatusRail />
        <main className="min-w-0 flex-1">{children}</main>
      </body>
    </html>
  );
}
