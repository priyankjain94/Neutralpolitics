import { pagesSitemapXml } from "@/lib/sitemaps";

export const revalidate = 60;

export async function GET() {
  return new Response(await pagesSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
