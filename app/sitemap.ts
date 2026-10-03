import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { articlesWithDesk } from "@/lib/desk";
import { absoluteUrl } from "@/lib/paths";
import { indexTopics, tagKey, topicPath } from "@/lib/topics";
import type { Article, Lang } from "@/lib/types";

function topicEntries(articles: Article[]): MetadataRoute.Sitemap {
  const grouped = new Map<string, { tag: string; langs: Lang[] }>();
  for (const lang of ["en", "hi"] as const) {
    for (const topic of indexTopics(articles.filter((article) => article.lang === lang))) {
      const row = grouped.get(topic.key) || { tag: topic.tag, langs: [] };
      if (lang === "en") row.tag = topic.tag;
      row.langs.push(lang);
      grouped.set(topic.key, row);
    }
  }
  return [...grouped.values()].flatMap((topic) => {
    const path = topicPath(topic.tag);
    const languages: Record<string, string> = {};
    if (topic.langs.includes("en")) {
      languages["en-IN"] = absoluteUrl("en", path);
      languages["x-default"] = absoluteUrl("en", path);
    }
    if (topic.langs.includes("hi")) languages["hi-IN"] = absoluteUrl("hi", path);
    if (!languages["x-default"]) languages["x-default"] = absoluteUrl("hi", path);
    const times = articles
      .filter(
        (article) =>
          topic.langs.includes(article.lang) && article.tags.some((tag) => tagKey(tag) === tagKey(topic.tag)),
      )
      .map((article) => new Date(article.updatedAt || article.publishedAt).getTime())
      .filter((value) => Number.isFinite(value));
    const lastModified = new Date(times.length ? Math.max(...times) : Date.now());
    return topic.langs.map((lang) => ({
      url: absoluteUrl(lang, path),
      lastModified,
      alternates: { languages },
    }));
  });
}

const PATHS = [
  "/",
  "/about",
  "/editorial-policy",
  "/fact-check",
  "/corrections",
  "/contact",
  "/contribute",
  "/contribute/terms",
  "/privacy",
  "/terms",
];

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = PATHS.map((path) => ({
    url: absoluteUrl("en", path),
    lastModified: now,
    alternates: {
      languages: {
        "en-IN": absoluteUrl("en", path),
        "hi-IN": absoluteUrl("hi", path),
        "x-default": absoluteUrl("en", path),
      },
    },
  }));
  const hindiPages: MetadataRoute.Sitemap = PATHS.map((path) => ({
    url: absoluteUrl("hi", path),
    lastModified: now,
    alternates: {
      languages: {
        "en-IN": absoluteUrl("en", path),
        "hi-IN": absoluteUrl("hi", path),
        "x-default": absoluteUrl("en", path),
      },
    },
  }));
  const categories: MetadataRoute.Sitemap = CATEGORIES.flatMap((category) => {
    const path = `/category/${category.slug}`;
    const alternates = {
      languages: {
        "en-IN": absoluteUrl("en", path),
        "hi-IN": absoluteUrl("hi", path),
        "x-default": absoluteUrl("en", path),
      },
    };
    return [
      { url: absoluteUrl("en", path), lastModified: now, alternates },
      { url: absoluteUrl("hi", path), lastModified: now, alternates },
    ];
  });
  const live = await articlesWithDesk();
  const articles: MetadataRoute.Sitemap = live.map((article) => {
    const path = `/news/${article.year}/${article.month}/${article.slug}`;
    return {
      url: absoluteUrl(article.lang, path),
      lastModified: new Date(article.updatedAt || article.publishedAt),
      alternates: {
        languages: {
          "en-IN": absoluteUrl("en", path),
          "hi-IN": absoluteUrl("hi", path),
          "x-default": absoluteUrl("en", path),
        },
      },
    };
  });
  return [...pages, ...hindiPages, ...categories, ...topicEntries(live), ...articles];
}
