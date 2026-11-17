import { pagesSitemapXml } from "@/lib/sitemaps";

export const dynamic = "force-static";

export async function GET() {
  return new Response(await pagesSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
