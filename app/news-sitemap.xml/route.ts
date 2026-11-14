import { newsSitemapXml } from "@/lib/feeds";

export const dynamic = "force-static";

export function GET() {
  return new Response(newsSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
