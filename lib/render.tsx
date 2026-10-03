import { notFound, redirect } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { CategoryView } from "@/components/CategoryPage";
import { HomePage } from "@/components/HomePage";
import { SearchBox } from "@/components/SearchBox";
import { StaticPage } from "@/components/StaticPage";
import { TopicView } from "@/components/TopicPage";
import { CATEGORIES, categoryLabel, isCategory } from "@/lib/categories";
import { loadPage, publishedArticles } from "@/lib/content";
import { articleWithDesk, articlesWithDesk } from "@/lib/desk";
import { t } from "@/lib/i18n";
import { withLang } from "@/lib/paths";
import { pageMetadata, articleMetadata as articleMetaFromArticle } from "@/lib/seo";
import { decodeTag, indexTopics, storiesForTopic, tagKey, topicPath } from "@/lib/topics";
import type { Lang } from "@/lib/types";

export function articleStaticParams(lang: Lang) {
  return publishedArticles(lang).map((article) => ({
    year: article.year,
    month: article.month,
    slug: article.slug,
  }));
}

export async function articleMeta(lang: Lang, params: Promise<{ year: string; month: string; slug: string }>) {
  const { year, month, slug } = await params;
  const article = await articleWithDesk(lang, year, month, slug);
  if (!article) return {};
  return articleMetaFromArticle(article);
}

export async function ArticleRoute(lang: Lang, params: Promise<{ year: string; month: string; slug: string }>) {
  const { year, month, slug } = await params;
  const article = await articleWithDesk(lang, year, month, slug);
  if (!article) notFound();
  return <ArticleView article={article} />;
}

export function categoryStaticParams() {
  return CATEGORIES.map((category) => ({ name: category.slug }));
}

export async function categoryMeta(lang: Lang, params: Promise<{ name: string }>) {
  const { name } = await params;
  if (!isCategory(name)) return {};
  const m = t(lang);
  return pageMetadata({
    lang,
    path: `/category/${name}`,
    title: categoryLabel(name, lang),
    description: m.categoryBlurbs[name],
  });
}

export async function CategoryRoute(
  lang: Lang,
  params: Promise<{ name: string }>,
  searchParams: Promise<{ page?: string }>,
) {
  const { name } = await params;
  const query = await searchParams;
  const page = Number(query.page || "1");
  return <CategoryView lang={lang} name={name} page={Number.isFinite(page) ? page : 1} />;
}

export function topicStaticParams() {
  return indexTopics(publishedArticles("en")).map((topic) => ({ tag: topic.tag }));
}

export function topicDescription(lang: Lang, tag: string): string {
  return lang === "hi"
    ? `${tag} पर न्यूट्रल पॉलिटिक्स की प्रकाशित खबरें, नई से पुरानी।`
    : `Published Neutral Politics stories tagged ${tag}, newest first.`;
}

export async function topicMeta(lang: Lang, params: Promise<{ tag: string }>) {
  const { tag } = await params;
  const topics = indexTopics(await articlesWithDesk(lang));
  const topic = topics.find((item) => item.key === tagKey(decodeTag(tag)));
  if (!topic) return {};
  return pageMetadata({
    lang,
    path: topicPath(topic.tag),
    title: topic.tag,
    description: topicDescription(lang, topic.tag),
  });
}

export async function TopicRoute(lang: Lang, params: Promise<{ tag: string }>) {
  const { tag } = await params;
  const live = await articlesWithDesk(lang);
  const topic = indexTopics(live).find((item) => item.key === tagKey(decodeTag(tag)));
  if (!topic) notFound();
  if (decodeTag(tag) !== topic.tag) redirect(withLang(lang, topicPath(topic.tag)));
  const stories = storiesForTopic(live, topic.tag);
  if (!stories.length) notFound();
  return <TopicView lang={lang} tag={topic.tag} stories={stories} />;
}

export function homeMeta(lang: Lang) {
  const m = t(lang);
  return {
    ...pageMetadata({
      lang,
      path: "/",
      title: "Neutral Politics",
      description: m.tagline,
    }),
    title: { absolute: lang === "hi" ? "न्यूट्रल पॉलिटिक्स | Neutral Politics" : "Neutral Politics" },
  };
}

export function HomeRoute({ lang }: { lang: Lang }) {
  return <HomePage lang={lang} />;
}

export function staticMeta(lang: Lang, name: string, path: string) {
  const page = loadPage(name, lang);
  return pageMetadata({
    lang,
    path,
    title: page?.title || name,
    description: page?.description || page?.title || name,
  });
}

export function StaticRoute({ lang, name }: { lang: Lang; name: string }) {
  return <StaticPage lang={lang} name={name} />;
}

export function searchMeta(lang: Lang) {
  const m = t(lang);
  return pageMetadata({ lang, path: "/search", title: m.searchTitle, description: m.searchHint, noindex: true });
}

export function SearchRoute({ lang, query }: { lang: Lang; query: string }) {
  const m = t(lang);
  return (
    <div className="wrap">
      <h1 className="page-title">{m.searchTitle}</h1>
      <SearchBox lang={lang} initialQuery={query} />
    </div>
  );
}
