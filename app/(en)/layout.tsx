import type { Metadata } from "next";
import { LiveTicker } from "@/components/LiveTicker";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteUrl } from "@/lib/paths";
import { feedAlternates, searchConsoleVerification } from "@/lib/seo";
import "../globals.css";

export const revalidate = 60;

const verification = searchConsoleVerification();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Neutral Politics", template: "%s | Neutral Politics" },
  description: "Verified by 2+ sources. No propaganda.",
  applicationName: "Neutral Politics",
  icons: { icon: "/favicon.svg" },
  robots: process.env.VERCEL_ENV === "preview" ? { index: false, follow: false } : undefined,
  alternates: { types: feedAlternates("en") },
  ...(verification ? { verification } : {}),
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>
        <LiveTicker lang="en" />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter lang="en" />
      </body>
    </html>
  );
}
