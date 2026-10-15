import { sitemapIndexXml } from "@/lib/sitemaps";

export const revalidate = 60;

export function GET() {
  return new Response(sitemapIndexXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
