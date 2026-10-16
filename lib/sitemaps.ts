import fs from "fs";
import path from "path";
import { CATEGORIES } from "./categories";
import { articlesWithDesk } from "./desk";
import { xmlEscape, isoIst } from "./format";
import { absoluteUrl, siteUrl } from "./paths";
import { indexableTopics, tagKey, topicPath } from "./topics";
import type { Article, Lang } from "./types";

const PAGE_NAMES: { path: string; file?: string }[] = [
  { path: "/" },
  { path: "/about", file: "about" },
  { path: "/editorial-policy", file: "editorial-policy" },
  { path: "/fact-check", file: "fact-check" },
  { path: "/corrections", file: "corrections" },
  { path: "/contact", file: "contact" },
  { path: "/ownership", file: "ownership" },
  { path: "/contribute" },
  { path: "/contribute/terms", file: "contribute-terms" },
  { path: "/privacy", file: "privacy" },
  { path: "/terms", file: "terms" },
];

function fileMtime(name: string): string | null {
  const en = path.join(process.cwd(), "content", "pages", `${name}.en.md`);
  if (!fs.existsSync(en)) return null;
  return isoIst(fs.statSync(en).mtime.toISOString());
}

function latest(articles: Article[]): string {
  const times = articles
    .map((article) => new Date(article.updatedAt || article.publishedAt).getTime())
    .filter((value) => Number.isFinite(value));
  return isoIst(new Date(times.length ? Math.max(...times) : Date.now()).toISOString());
}

function posterUrl(article: Article): string {
  return article.poster.startsWith("http") ? article.poster : `${siteUrl()}${article.poster}`;
}

function alternates(locPath: string, langs: Lang[]): string {
  const links: string[] = [];
  if (langs.includes("en")) {
    const en = absoluteUrl("en", locPath);
    links.push(`<xhtml:link rel="alternate" hreflang="en-IN" href="${xmlEscape(en)}"/>`);
    links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(en)}"/>`);
  }
  if (langs.includes("hi")) links.push(`<xhtml:link rel="alternate" hreflang="hi-IN" href="${xmlEscape(absoluteUrl("hi", locPath))}"/>`);
  if (!langs.includes("en") && langs.includes("hi")) {
    links.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(absoluteUrl("hi", locPath))}"/>`);
  }
  return links.join("");
}

function urlNode(
  locPath: string,
  lang: Lang,
  lastmod: string,
  images: { loc: string; title?: string }[] = [],
  langs: Lang[] = ["en", "hi"],
): string {
  const imageXml = images
    .map(
      (image) =>
        `<image:image><image:loc>${xmlEscape(image.loc)}</image:loc>${image.title ? `<image:title>${xmlEscape(image.title)}</image:title>` : ""}</image:image>`,
    )
    .join("");
  return `<url><loc>${xmlEscape(absoluteUrl(lang, locPath))}</loc><lastmod>${xmlEscape(lastmod)}</lastmod>${alternates(locPath, langs)}${imageXml}</url>`;
}

export async function pagesSitemapXml(): Promise<string> {
  const live = await articlesWithDesk();
  const nodes: string[] = [];
  for (const page of PAGE_NAMES) {
    const lastmod = (page.file && fileMtime(page.file)) || latest(live);
    nodes.push(urlNode(page.path, "en", lastmod));
    nodes.push(urlNode(page.path, "hi", lastmod));
  }
  for (const category of CATEGORIES) {
    const inSection = live.filter((article) => article.category === category.slug);
    const lastmod = latest(inSection.length ? inSection : live);
    const route = `/category/${category.slug}`;
    nodes.push(urlNode(route, "en", lastmod));
    nodes.push(urlNode(route, "hi", lastmod));
  }
  const grouped = new Map<string, { tag: string; langs: Lang[] }>();
  for (const lang of ["en", "hi"] as const) {
    for (const topic of indexableTopics(live.filter((article) => article.lang === lang))) {
      const row = grouped.get(topic.key) || { tag: topic.tag, langs: [] };
      if (lang === "en") row.tag = topic.tag;
      row.langs.push(lang);
      grouped.set(topic.key, row);
    }
  }
  for (const topic of grouped.values()) {
    const route = topicPath(topic.tag);
    const stories = live.filter(
      (article) => topic.langs.includes(article.lang) && article.tags.some((tag) => tagKey(tag) === tagKey(topic.tag)),
    );
    const lastmod = latest(stories);
    for (const lang of topic.langs) nodes.push(urlNode(route, lang, lastmod, [], topic.langs));
  }
  for (const article of live) {
    const route = `/news/${article.year}/${article.month}/${article.slug}`;
    const lastmod = isoIst(article.updatedAt || article.publishedAt);
    const og = absoluteUrl(article.lang, `${route}/opengraph-image`);
    nodes.push(
      urlNode(route, article.lang, lastmod, [
        { loc: posterUrl(article), title: article.title },
        { loc: og, title: article.title },
      ]),
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${nodes.join("\n")}
</urlset>`;
}

export function sitemapIndexXml(): string {
  const base = siteUrl();
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${xmlEscape(`${base}/sitemap-pages.xml`)}</loc></sitemap>
  <sitemap><loc>${xmlEscape(`${base}/news-sitemap.xml`)}</loc></sitemap>
</sitemapindex>`;
}
