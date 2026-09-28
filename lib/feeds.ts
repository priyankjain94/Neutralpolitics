import { categoryLabel } from "./categories";
import { publishedArticles } from "./content";
import { xmlEscape } from "./format";
import { absoluteUrl, siteUrl } from "./paths";
import type { Article, Lang } from "./types";

function itemXml(article: Article): string {
  const link = absoluteUrl(article.lang, `/news/${article.year}/${article.month}/${article.slug}`);
  const sources = article.sources.map((source) => `${source.outlet}: ${source.url}`).join(" | ");
  const description = `${article.standfirst}\n\nSources: ${sources}`;
  return `<item>
      <title>${xmlEscape(article.title)}</title>
      <link>${xmlEscape(link)}</link>
      <guid isPermaLink="true">${xmlEscape(link)}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description>${xmlEscape(description)}</description>
    </item>`;
}

export function rssDocument(lang: Lang, title: string, path: string, articles: Article[]): string {
  const link = absoluteUrl(lang, path);
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(link)}</link>
    <description>${xmlEscape(lang === "hi" ? "न्यूट्रल पॉलिटिक्स — दो या अधिक स्रोतों से जाँची खबरें।" : "Neutral Politics — news checked against two or more sources.")}</description>
    <language>${lang === "hi" ? "hi-IN" : "en-IN"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${articles.slice(0, 50).map(itemXml).join("\n")}
  </channel>
</rss>`;
}

export function languageRss(lang: Lang): string {
  const title = lang === "hi" ? "न्यूट्रल पॉलिटिक्स" : "Neutral Politics";
  return rssDocument(lang, title, "/", publishedArticles(lang));
}

export function categoryRss(lang: Lang, category: string): string {
  const label = categoryLabel(category, lang);
  const articles = publishedArticles(lang).filter((article) => article.category === category);
  return rssDocument(lang, `Neutral Politics — ${label}`, `/category/${category}`, articles);
}

export function newsSitemapXml(): string {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = publishedArticles().filter((article) => +new Date(article.publishedAt) >= cutoff);
  const urls = recent
    .map((article) => {
      const loc = absoluteUrl(article.lang, `/news/${article.year}/${article.month}/${article.slug}`);
      return `<url>
    <loc>${xmlEscape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>Neutral Politics</news:name>
        <news:language>${article.lang}</news:language>
      </news:publication>
      <news:publication_date>${xmlEscape(article.publishedAt)}</news:publication_date>
      <news:title>${xmlEscape(article.title)}</news:title>
    </news:news>
  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;
}

export function publisherHost(): string {
  return siteUrl();
}
