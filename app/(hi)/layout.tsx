import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Noto_Serif_Devanagari } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteUrl } from "@/lib/paths";
import "../globals.css";

const serif = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "न्यूट्रल पॉलिटिक्स", template: "%s | Neutral Politics" },
  description: "दो या अधिक स्रोतों से जाँचा हुआ। कोई प्रचार नहीं।",
  applicationName: "Neutral Politics",
  icons: { icon: "/favicon.svg" },
  robots: process.env.VERCEL_ENV === "preview" ? { index: false, follow: false } : undefined,
};

export default function HindiLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body className={`${serif.variable} ${sans.variable}`} style={{ "--font-body": "var(--font-sans)" } as React.CSSProperties}>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter lang="hi" />
      </body>
    </html>
  );
}
