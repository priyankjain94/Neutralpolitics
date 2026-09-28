import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { articleHref, withLang } from "@/lib/paths";
import type { Article, Lang } from "@/lib/types";

export function Kicker({ article }: { article: Article }) {
  const m = t(article.lang);
  return (
    <div className="kicker-row">
      {article.breaking ? <span className="breaking">{m.breaking}</span> : null}
      <Link className="kicker" href={withLang(article.lang, `/category/${article.category}`)}>
        {categoryLabel(article.category, article.lang)}
      </Link>
    </div>
  );
}

export function LeadStory({ article }: { article: Article }) {
  return (
    <article className="lead">
      <Kicker article={article} />
      <h1>
        <Link href={articleHref(article.lang, article.year, article.month, article.slug)}>{article.title}</Link>
      </h1>
      <p className="standfirst">{article.standfirst}</p>
      <time className="story-time" dateTime={article.publishedAt}>
        {formatDateTime(article.publishedAt, article.lang)}
      </time>
      <figure className="figure">
        <img src={article.poster} alt="" />
      </figure>
    </article>
  );
}

export function SecondaryStory({ article }: { article: Article }) {
  return (
    <article>
      <Kicker article={article} />
      <div className="thumb-row">
        <div>
          <h2>
            <Link href={articleHref(article.lang, article.year, article.month, article.slug)}>{article.title}</Link>
          </h2>
          <time className="story-time" dateTime={article.publishedAt}>
            {formatDateTime(article.publishedAt, article.lang)}
          </time>
        </div>
        <img src={article.poster} alt="" />
      </div>
    </article>
  );
}

export function LatestList({ lang, articles, title }: { lang: Lang; articles: Article[]; title?: string }) {
  const m = t(lang);
  return (
    <aside className="latest">
      <h2>{title || m.latest}</h2>
      <ol>
        {articles.map((article) => (
          <li key={article.slug}>
            <Link href={articleHref(lang, article.year, article.month, article.slug)}>{article.title}</Link>
            <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, lang)}</time>
          </li>
        ))}
      </ol>
    </aside>
  );
}

export function StoryGrid({ articles }: { articles: Article[] }) {
  return (
    <div className="cat-grid">
      {articles.map((article) => (
        <article className="story-card" key={article.slug}>
          <figure className="card-figure">
            <img src={article.poster} alt="" />
          </figure>
          <Kicker article={article} />
          <h2>
            <Link href={articleHref(article.lang, article.year, article.month, article.slug)}>{article.title}</Link>
          </h2>
          <time className="story-time" dateTime={article.publishedAt}>
            {formatDateTime(article.publishedAt, article.lang)}
          </time>
          <p className="dek">{article.standfirst}</p>
        </article>
      ))}
    </div>
  );
}
