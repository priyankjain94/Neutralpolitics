import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { formatTime } from "@/lib/format";
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
      <figure className="figure">
        <img src={article.poster} alt="" width={1200} height={675} />
      </figure>
    </article>
  );
}

export function SecondaryStory({ article }: { article: Article }) {
  return (
    <article>
      <Kicker article={article} />
      <div className="thumb-row">
        <h2>
          <Link href={articleHref(article.lang, article.year, article.month, article.slug)}>{article.title}</Link>
        </h2>
        <img src={article.poster} alt="" width={84} height={84} />
      </div>
    </article>
  );
}

export function LatestList({ lang, articles }: { lang: Lang; articles: Article[] }) {
  const m = t(lang);
  return (
    <aside className="latest">
      <h2>{m.latest}</h2>
      <ol>
        {articles.map((article) => (
          <li key={article.slug}>
            <time dateTime={article.publishedAt}>{formatTime(article.publishedAt, lang)}</time>
            <Link href={articleHref(lang, article.year, article.month, article.slug)}>{article.title}</Link>
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
        <article key={article.slug}>
          <Kicker article={article} />
          <h2>
            <Link href={articleHref(article.lang, article.year, article.month, article.slug)}>{article.title}</Link>
          </h2>
          <p className="dek">{article.standfirst}</p>
        </article>
      ))}
    </div>
  );
}
