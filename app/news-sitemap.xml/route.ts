import { newsSitemapXml } from "@/lib/feeds";

export const revalidate = 3600;

export function GET() {
  return new Response(newsSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
