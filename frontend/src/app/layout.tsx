import type { Metadata } from "next";
import { Familjen_Grotesk, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const heading = Familjen_Grotesk({ subsets: ["latin"], variable: "--font-familjen" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: { default: "WorkspaceOS — Calm operations for focused teams", template: "%s · WorkspaceOS" },
  description: "Plan projects, coordinate live work, and keep team operations accountable in one workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn(heading.variable, body.variable, mono.variable, "font-sans")}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
