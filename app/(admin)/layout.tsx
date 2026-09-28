import type { Metadata } from "next";
import { siteUrl } from "@/lib/paths";
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Desk | Neutral Politics",
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.svg" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="admin-body">{children}</body>
    </html>
  );
}
