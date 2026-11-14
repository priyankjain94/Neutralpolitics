import { languageRss } from "@/lib/feeds";
export const dynamic = "force-static";
export function GET() {
  return new Response(languageRss("en"), {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
