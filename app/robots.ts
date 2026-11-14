import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/paths";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/report-error", "/hi/report-error"],
      },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/news-sitemap.xml`],
  };
}
