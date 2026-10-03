import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { devanagari } from "@/lib/fonts";
import { siteUrl } from "@/lib/paths";
import { searchConsoleVerification } from "@/lib/seo";
import "../globals.css";

const verification = searchConsoleVerification();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "न्यूट्रल पॉलिटिक्स", template: "%s | Neutral Politics" },
  description: "दो या अधिक स्रोतों से जाँचा हुआ। कोई प्रचार नहीं।",
  applicationName: "Neutral Politics",
  icons: { icon: "/favicon.svg" },
  robots: process.env.VERCEL_ENV === "preview" ? { index: false, follow: false } : undefined,
  ...(verification ? { verification } : {}),
};

export default function HindiLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className={devanagari.variable}>
      <body>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter lang="hi" />
      </body>
    </html>
  );
}
