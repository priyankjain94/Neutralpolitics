import { after } from "next/server";
import { newsSitemapXml } from "@/lib/feeds";
import { pingIndexNow } from "@/lib/indexnow";
import { absoluteUrl } from "@/lib/paths";
import { publishedArticles } from "@/lib/content";

export const revalidate = 60;

export function GET() {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const urls = publishedArticles()
    .filter((article) => +new Date(article.publishedAt) >= cutoff)
    .map((article) => absoluteUrl(article.lang, `/news/${article.year}/${article.month}/${article.slug}`));
  after(() => pingIndexNow(urls));
  return new Response(newsSitemapXml(), {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
