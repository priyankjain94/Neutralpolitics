import type { Metadata } from "next";
import { categoryLabel } from "./categories";
import { isoIst } from "./format";
import { documentTitle, fitDescription, googleSiteVerificationToken } from "./meta-text";
import { absoluteUrl, siteUrl, withLang } from "./paths";
import type { Article, Lang } from "./types";

export { documentTitle, fitDescription } from "./meta-text";

export function searchConsoleVerification(): Metadata["verification"] | undefined {
  const token = googleSiteVerificationToken();
  if (!token) return undefined;
  return { google: token };
}

export function robotsForIndex(): Metadata["robots"] {
  if (process.env.VERCEL_ENV === "preview") return { index: false, follow: false };
  return { index: true, follow: true };
}

export function alternates(lang: Lang, path: string): Metadata["alternates"] {
  const en = absoluteUrl("en", path);
  const hi = absoluteUrl("hi", path);
  return {
    canonical: absoluteUrl(lang, path),
    languages: {
      "en-IN": en,
      "hi-IN": hi,
      "x-default": en,
    },
  };
}

export function pageMetadata(input: {
  lang: Lang;
  path: string;
  title: string;
  description: string;
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(input.lang, input.path);
  const title = documentTitle(input.title).absolute;
  const description = fitDescription(input.description);
  return {
    title: { absolute: title },
    description,
    alternates: alternates(input.lang, input.path),
    robots: input.noindex ? { index: false, follow: false } : robotsForIndex(),
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Neutral Politics",
      locale: input.lang === "hi" ? "hi_IN" : "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function articleMetadata(article: Article): Metadata {
  const path = `/news/${article.year}/${article.month}/${article.slug}`;
  const url = absoluteUrl(article.lang, path);
  const title = documentTitle(article.title).absolute;
  const description = fitDescription(article.standfirst);
  const published = isoIst(article.publishedAt);
  const modified = isoIst(article.updatedAt || article.publishedAt);
  return {
    title: { absolute: title },
    description,
    authors: [{ name: article.byline }],
    alternates: alternates(article.lang, path),
    robots: robotsForIndex(),
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: "Neutral Politics",
      locale: article.lang === "hi" ? "hi_IN" : "en_IN",
      publishedTime: published,
      modifiedTime: modified,
      section: categoryLabel(article.category, article.lang),
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

const VERDICT_RATING: Record<string, string> = {
  false: "1",
  misleading: "2",
  "missing-context": "2",
  unverified: "3",
  "partly-true": "4",
  true: "5",
};

export function articleJsonLd(article: Article, imageAbs: string[]) {
  const path = `/news/${article.year}/${article.month}/${article.slug}`;
  const url = absoluteUrl(article.lang, path);
  const enUrl = absoluteUrl("en", path);
  const published = isoIst(article.publishedAt);
  const modified = isoIst(article.updatedAt || article.publishedAt);
  const news: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: fitDescription(article.standfirst),
    datePublished: published,
    dateModified: modified,
    inLanguage: article.lang === "hi" ? "hi-IN" : "en-IN",
    articleSection: categoryLabel(article.category, "en"),
    image: imageAbs,
    author: { "@type": "Organization", name: "Neutral Politics", url: siteUrl() },
    publisher: {
      "@type": "Organization",
      name: "Neutral Politics",
      url: siteUrl(),
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl()}/brand/np-logo.png`,
      },
    },
    mainEntityOfPage: url,
    citation: article.sources.map((source) => source.url),
    isBasedOn: article.sources.map((source) => source.url),
  };
  if (article.lang === "hi") news.translationOfWork = enUrl;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Neutral Politics", item: absoluteUrl(article.lang, "/") },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryLabel(article.category, article.lang),
        item: absoluteUrl(article.lang, `/category/${article.category}`),
      },
      { "@type": "ListItem", position: 3, name: article.title, item: url },
    ],
  };
  const graph: Record<string, unknown>[] = [news, breadcrumb];
  if (article.factcheck?.claim) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "ClaimReview",
      url,
      datePublished: published,
      claimReviewed: article.factcheck.claim,
      author: { "@type": "Organization", name: "Neutral Politics", url: siteUrl() },
      reviewRating: {
        "@type": "Rating",
        ratingValue: VERDICT_RATING[article.factcheck.verdict] || "3",
        bestRating: "5",
        worstRating: "1",
        alternateName: article.factcheck.verdict,
      },
      itemReviewed: {
        "@type": "Claim",
        appearance: article.factcheck.claimant,
        datePublished: article.factcheck.claimDate,
        author: { "@type": "Organization", name: article.factcheck.claimant },
      },
    });
  }
  return graph;
}

export function homeJsonLd(lang: Lang) {
  const url = absoluteUrl(lang, "/");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Neutral Politics",
      url: siteUrl(),
      logo: `${siteUrl()}/brand/np-logo.png`,
      sameAs: ["https://www.instagram.com/theneutralpolitics/"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Neutral Politics",
      url,
      inLanguage: lang === "hi" ? "hi-IN" : "en-IN",
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl(lang, "/search")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function publicPath(lang: Lang, path: string): string {
  return withLang(lang, path);
}
