import type { Metadata } from "next";
import { categoryLabel } from "./categories";
import { isoIst } from "./format";
import { bingSiteVerificationToken, documentTitle, fitDescription, googleSiteVerificationToken, metaDescription } from "./meta-text";
import { absoluteUrl, siteUrl, withLang } from "./paths";
import type { Article, Lang } from "./types";

export { documentTitle, fitDescription } from "./meta-text";

export function searchConsoleVerification(): Metadata["verification"] | undefined {
  const google = googleSiteVerificationToken();
  const bing = bingSiteVerificationToken();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

export function organizationNode() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Neutral Politics",
    url: siteUrl(),
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl()}/brand/np-logo.png`,
      width: 932,
      height: 240,
    },
    sameAs: ["https://www.instagram.com/theneutralpolitics/"],
  };
}

export function schemaHeadline(title: string): string {
  const clean = title.replace(/\s+/g, " ").trim();
  if (clean.length <= 110) return clean;
  const cut = clean.slice(0, 110).trimEnd();
  const space = cut.lastIndexOf(" ");
  return (space >= 60 ? cut.slice(0, space) : cut).trimEnd();
}

export function breadcrumbJsonLd(lang: Lang, crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(lang, crumb.path),
    })),
  };
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
  const image = absoluteUrl(input.lang, "/opengraph-image");
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
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function articleMetadata(article: Article): Metadata {
  const path = `/news/${article.year}/${article.month}/${article.slug}`;
  const url = absoluteUrl(article.lang, path);
  const title = documentTitle(article.title).absolute;
  const description = metaDescription(article.standfirst, article.body);
  const published = isoIst(article.publishedAt);
  const modified = isoIst(article.updatedAt || article.publishedAt);
  const image = absoluteUrl(article.lang, `${path}/opengraph-image`);
  const poster = article.poster.startsWith("http") ? article.poster : `${siteUrl()}${article.poster}`;
  return {
    title: { absolute: title },
    description,
    authors: [{ name: article.byline || "Neutral Politics Desk" }],
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
      images: [
        { url: image, width: 1200, height: 630, alt: article.title },
        { url: poster, alt: article.title },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
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
  const ogImage = absoluteUrl(article.lang, `${path}/opengraph-image`);
  const news: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: schemaHeadline(article.title),
    description: metaDescription(article.standfirst, article.body),
    datePublished: published,
    dateModified: modified,
    inLanguage: article.lang === "hi" ? "hi-IN" : "en-IN",
    articleSection: categoryLabel(article.category, "en"),
    isAccessibleForFree: true,
    image: [
      { "@type": "ImageObject", url: ogImage, width: 1200, height: 630 },
      ...imageAbs.map((url) => ({ "@type": "ImageObject", url })),
    ],
    author: { "@type": "Organization", name: article.byline || "Neutral Politics Desk", url: siteUrl() },
    publisher: {
      "@type": "Organization",
      name: "Neutral Politics",
      url: siteUrl(),
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl()}/brand/np-logo.png`,
        width: 932,
        height: 240,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
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
  const rating = article.factcheck ? VERDICT_RATING[article.factcheck.verdict] : "";
  if (article.factcheck?.claim && rating) {
    const claimDate = /^\d{4}-\d{2}-\d{2}/.test(article.factcheck.claimDate) ? article.factcheck.claimDate : "";
    graph.push({
      "@context": "https://schema.org",
      "@type": "ClaimReview",
      url,
      datePublished: published,
      claimReviewed: article.factcheck.claim,
      author: { "@type": "Organization", name: article.byline || "Neutral Politics Desk", url: siteUrl() },
      reviewRating: {
        "@type": "Rating",
        ratingValue: rating,
        bestRating: "5",
        worstRating: "1",
        alternateName: article.factcheck.verdict,
      },
      itemReviewed: {
        "@type": "Claim",
        name: article.factcheck.claim,
        ...(claimDate ? { datePublished: claimDate } : {}),
        ...(article.factcheck.claimant
          ? { author: { "@type": "Organization", name: article.factcheck.claimant } }
          : {}),
      },
    });
  }
  return graph;
}

export function homeJsonLd(lang: Lang) {
  const url = absoluteUrl(lang, "/");
  return [
    organizationNode(),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Neutral Politics",
      url,
      inLanguage: lang === "hi" ? "hi-IN" : "en-IN",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${absoluteUrl(lang, "/search")}?q={search_term_string}`,
        },
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
