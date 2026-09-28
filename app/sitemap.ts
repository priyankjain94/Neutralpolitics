import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { articlesWithDesk } from "@/lib/desk";
import { absoluteUrl } from "@/lib/paths";

const PATHS = [
  "/",
  "/about",
  "/editorial-policy",
  "/fact-check",
  "/corrections",
  "/contact",
  "/contribute",
  "/contribute/terms",
  "/subscribe",
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
  const articles: MetadataRoute.Sitemap = (await articlesWithDesk()).map((article) => {
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
  return [...pages, ...hindiPages, ...categories, ...articles];
}
