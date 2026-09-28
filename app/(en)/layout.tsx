import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteUrl } from "@/lib/paths";
import "../globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Neutral Politics", template: "%s | Neutral Politics" },
  description: "Verified by 2+ sources. No propaganda.",
  applicationName: "Neutral Politics",
  icons: { icon: "/favicon.svg" },
  robots: process.env.VERCEL_ENV === "preview" ? { index: false, follow: false } : undefined,
};

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable}`} style={{ "--font-body": "var(--font-serif)" } as React.CSSProperties}>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter lang="en" />
      </body>
    </html>
  );
}
