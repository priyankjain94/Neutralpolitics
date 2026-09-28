import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isCategory } from "./categories";
import { readingMinutes } from "./format";
import type {
  Article,
  Correction,
  Factcheck,
  Lang,
  PageCopy,
  Side,
  Source,
  TranslationMeta,
  Verdict,
} from "./types";

const NEWS = path.join(process.cwd(), "content", "news");
const PAGES = path.join(process.cwd(), "content", "pages");

type Shared = {
  slug?: string;
  status?: "draft" | "published";
  status_hi?: "draft" | "published";
  published_at: string;
  updated_at?: string | null;
  category: string;
  secondary?: string[];
  breaking?: boolean;
  tags?: string[];
  ig_shortcode: string;
  ig_url: string;
  ig_type?: "reel" | "carousel" | "image";
  event_id?: string | null;
  follow_up_of?: string | null;
  sources?: Source[];
  photo_credits?: string[];
  byline?: string;
  corrections?: { at: string }[];
  factcheck?: { verdict: Verdict; claimant: string; claim_date: string } | null;
  sample?: boolean;
  poster?: string;
};

let cache: Article[] | null = null;

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

function sides(value: unknown): Side[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as { label?: unknown; text?: unknown };
      if (!row.label || !row.text) return null;
      return { label: String(row.label), text: String(row.text) };
    })
    .filter((item): item is Side => Boolean(item));
}

function translation(value: unknown): TranslationMeta | null {
  if (!value || typeof value !== "object") return null;
  return value as TranslationMeta;
}

function build(
  lang: Lang,
  year: string,
  month: string,
  shared: Shared,
  data: Record<string, unknown>,
  body: string,
): Article {
  const status = lang === "hi" ? shared.status_hi || shared.status || "draft" : shared.status || "draft";
  const notes = strings(data.correction_notes);
  const corrections: Correction[] = (shared.corrections || []).map((item, index) => ({
    at: item.at,
    note: notes[index] || "",
  }));
  const fc = shared.factcheck;
  const factcheck: Factcheck | null = fc
    ? {
        verdict: fc.verdict,
        claimant: fc.claimant,
        claimDate: fc.claim_date,
        claim: String(data.factcheck_claim || ""),
        evidence: strings(data.factcheck_evidence),
      }
    : null;
  const title = String(data.title || shared.slug || "");
  const standfirst = String(data.standfirst || "");
  const keyFacts = strings(data.key_facts);
  const text = [title, standfirst, body, ...keyFacts].join(" ");
  return {
    lang,
    slug: shared.slug || "",
    year,
    month,
    status: status === "published" ? "published" : "draft",
    title,
    standfirst,
    body: body.trim(),
    keyFacts,
    sides: sides(data.sides),
    notConfirmed: strings(data.not_confirmed),
    category: shared.category,
    secondary: shared.secondary || [],
    breaking: Boolean(shared.breaking),
    tags: shared.tags || [],
    publishedAt: shared.published_at,
    updatedAt: shared.updated_at || null,
    igShortcode: shared.ig_shortcode,
    igUrl: shared.ig_url,
    igType: shared.ig_type || "reel",
    eventId: shared.event_id || null,
    followUpOf: shared.follow_up_of || null,
    sources: shared.sources || [],
    photoCredits: shared.photo_credits || [],
    byline: shared.byline || (lang === "hi" ? "न्यूट्रल पॉलिटिक्स डेस्क" : "Neutral Politics Desk"),
    corrections,
    factcheck,
    sample: Boolean(shared.sample),
    poster: shared.poster || "/media/sample-poster.svg",
    translation: translation(data.translation),
    readingMinutes: readingMinutes(text),
  };
}

export function loadArticles(): Article[] {
  if (process.env.NODE_ENV === "production" && cache) return cache;
  const articles: Article[] = [];
  if (!fs.existsSync(NEWS)) return articles;
  for (const year of fs.readdirSync(NEWS)) {
    const yearDir = path.join(NEWS, year);
    if (!fs.statSync(yearDir).isDirectory()) continue;
    for (const month of fs.readdirSync(yearDir)) {
      const monthDir = path.join(yearDir, month);
      if (!fs.statSync(monthDir).isDirectory()) continue;
      for (const file of fs.readdirSync(monthDir)) {
        if (!file.endsWith(".json")) continue;
        const slug = file.replace(/\.json$/, "");
        const shared = JSON.parse(fs.readFileSync(path.join(monthDir, file), "utf8")) as Shared;
        shared.slug = shared.slug || slug;
        if (!isCategory(shared.category)) continue;
        for (const lang of ["en", "hi"] as const) {
          const mdPath = path.join(monthDir, `${slug}.${lang}.md`);
          if (!fs.existsSync(mdPath)) continue;
          const parsed = matter(fs.readFileSync(mdPath, "utf8"));
          articles.push(
            build(lang, year, month, shared, parsed.data as Record<string, unknown>, parsed.content),
          );
        }
      }
    }
  }
  articles.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  cache = articles;
  return articles;
}

export function publishedArticles(lang?: Lang): Article[] {
  return loadArticles().filter((article) => article.status === "published" && (!lang || article.lang === lang));
}

export function getArticle(lang: Lang, year: string, month: string, slug: string): Article | undefined {
  return publishedArticles(lang).find(
    (article) => article.year === year && article.month === month && article.slug === slug,
  );
}

export function relatedArticles(article: Article, limit = 4): Article[] {
  const pool = publishedArticles(article.lang).filter((item) => item.slug !== article.slug);
  const same = pool.filter((item) => item.category === article.category);
  const rest = pool.filter((item) => item.category !== article.category);
  return [...same, ...rest].slice(0, limit);
}

export function articlesInCategory(lang: Lang, category: string): Article[] {
  return publishedArticles(lang).filter((article) => article.category === category);
}

export function allCorrections(lang: Lang): { article: Article; correction: Correction }[] {
  return publishedArticles(lang)
    .flatMap((article) => article.corrections.map((correction) => ({ article, correction })))
    .filter((item) => item.correction.note)
    .sort((a, b) => +new Date(b.correction.at) - +new Date(a.correction.at));
}

export function loadPage(name: string, lang: Lang): PageCopy | null {
  const file = path.join(PAGES, `${name}.${lang}.md`);
  if (!fs.existsSync(file)) return null;
  const parsed = matter(fs.readFileSync(file, "utf8"));
  const data = parsed.data as { title?: string; description?: string };
  return {
    title: data.title || name,
    description: data.description || "",
    body: parsed.content.trim(),
  };
}

export function findByFollowUp(lang: Lang, eventIdOrSlug: string): Article | undefined {
  return publishedArticles(lang).find(
    (article) => article.slug === eventIdOrSlug || article.eventId === eventIdOrSlug,
  );
}
