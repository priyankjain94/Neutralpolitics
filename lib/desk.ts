import { revalidatePath } from "next/cache";
import { loadArticles } from "./content";
import { getDb } from "./db";
import { readingMinutes } from "./format";
import type { Article, Lang, Source } from "./types";

export type StoryOverride = {
  slug: string;
  year: string;
  month: string;
  lang: string;
  status?: string | null;
  sensitive?: boolean | null;
  title?: string | null;
  standfirst?: string | null;
  body?: string | null;
  category?: string | null;
  sources?: Source[] | null;
};

export async function listOverrides(): Promise<StoryOverride[]> {
  const db = getDb();
  if (!db) return [];
  const { data } = await db.from("story_overrides").select("*").limit(500);
  return (data || []) as StoryOverride[];
}

export function mergeArticle(article: Article, override?: StoryOverride | null): Article {
  if (!override) return article;
  const next: Article = { ...article };
  if (override.title) next.title = override.title;
  if (override.standfirst) next.standfirst = override.standfirst;
  if (override.body) next.body = override.body;
  if (override.category) next.category = override.category;
  if (override.sources && override.sources.length) next.sources = override.sources;
  if (override.status === "published" || override.status === "draft") next.status = override.status;
  next.readingMinutes = readingMinutes([next.title, next.standfirst, next.body, ...next.keyFacts].join(" "));
  return next;
}

export async function allMerged(): Promise<Article[]> {
  const overrides = await listOverrides();
  return loadArticles().map((article) =>
    mergeArticle(
      article,
      overrides.find((item) => item.slug === article.slug && item.lang === article.lang),
    ),
  );
}

export async function articlesWithDesk(lang?: Lang): Promise<Article[]> {
  return (await allMerged())
    .filter((article) => article.status === "published" && (!lang || article.lang === lang))
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export type PublicCorrection = {
  key: string;
  at: string;
  note: string;
  article: Article | null;
};

export async function publicCorrections(lang: Lang): Promise<PublicCorrection[]> {
  const articles = await articlesWithDesk(lang);
  const fromFiles: PublicCorrection[] = articles.flatMap((article) =>
    article.corrections
      .filter((correction) => correction.note)
      .map((correction) => ({
        key: `${article.slug}-${correction.at}`,
        at: correction.at,
        note: correction.note,
        article,
      })),
  );
  const db = getDb();
  const fromDesk: PublicCorrection[] = [];
  if (db) {
    const { data } = await db.from("desk_corrections").select("*").limit(200);
    for (const row of (data || []) as Record<string, unknown>[]) {
      if (row.visible === false) continue;
      if (row.lang !== lang && row.lang !== "both") continue;
      const article =
        articles.find(
          (item) => item.slug === row.article_slug && (!row.article_year || item.year === row.article_year),
        ) || null;
      fromDesk.push({
        key: String(row.id),
        at: String(row.created_at || ""),
        note: String(row.note || ""),
        article,
      });
    }
  }
  return [...fromDesk, ...fromFiles].sort((a, b) => +new Date(b.at) - +new Date(a.at));
}

export async function articleWithDesk(lang: Lang, year: string, month: string, slug: string): Promise<Article | undefined> {
  const base = loadArticles().find((article) => article.lang === lang && article.year === year && article.month === month && article.slug === slug);
  if (!base) return undefined;
  const overrides = await listOverrides();
  const merged = mergeArticle(base, overrides.find((item) => item.slug === slug && item.lang === lang));
  return merged.status === "published" ? merged : undefined;
}

export async function writeAudit(action: string, target: string, detail?: string) {
  const db = getDb();
  if (!db) return;
  await db.from("audit_log").insert({
    actor: process.env.ADMIN_EMAIL || "admin",
    action,
    target,
    detail: detail || null,
  });
}

export function revalidateStory(year: string, month: string, slug: string, category?: string) {
  revalidatePath("/");
  revalidatePath("/hi");
  revalidatePath(`/news/${year}/${month}/${slug}`);
  revalidatePath(`/hi/news/${year}/${month}/${slug}`);
  if (category) {
    revalidatePath(`/category/${category}`);
    revalidatePath(`/hi/category/${category}`);
  }
  revalidatePath("/corrections");
  revalidatePath("/hi/corrections");
}
