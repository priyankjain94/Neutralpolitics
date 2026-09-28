import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { siteUrl } from "@/lib/paths";
import "../globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700"],
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
  title: "Desk | Neutral Politics",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} admin-body`} style={{ "--font-body": "var(--font-serif)" } as React.CSSProperties}>
        {children}
      </body>
    </html>
  );
}
