import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteUrl } from "@/lib/paths";
import { searchConsoleVerification } from "@/lib/seo";
import "../globals.css";

const verification = searchConsoleVerification();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Neutral Politics", template: "%s | Neutral Politics" },
  description: "Verified by 2+ sources. No propaganda.",
  applicationName: "Neutral Politics",
  icons: { icon: "/favicon.svg" },
  robots: process.env.VERCEL_ENV === "preview" ? { index: false, follow: false } : undefined,
  ...(verification ? { verification } : {}),
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter lang="en" />
      </body>
    </html>
  );
}
