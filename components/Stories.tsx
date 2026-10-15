import Link from "next/link";
import { PosterImage } from "./PosterImage";
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

export function LeadStory({
  article,
  figure = true,
  heading = "h1",
}: {
  article: Article;
  figure?: boolean;
  heading?: "h1" | "h2";
}) {
  const Title = heading;
  return (
    <article className="lead story-card">
      <Kicker article={article} />
      <Title className="story-title">
        <Link className="story-hit" href={articleHref(article.lang, article.year, article.month, article.slug)}>
          {article.title}
        </Link>
      </Title>
      <p className="standfirst">{article.standfirst}</p>
      <time className="story-time" dateTime={article.publishedAt}>
        {formatDateTime(article.publishedAt, article.lang)}
      </time>
      {figure ? (
        <figure className="figure">
          <PosterImage src={article.poster} alt={article.title} priority />
        </figure>
      ) : null}
    </article>
  );
}

export function SecondaryStory({ article }: { article: Article }) {
  return (
    <article className="story-card">
      <Kicker article={article} />
      <div className="thumb-row">
        <div>
          <h2>
            <Link className="story-hit" href={articleHref(article.lang, article.year, article.month, article.slug)}>
              {article.title}
            </Link>
          </h2>
          <time className="story-time" dateTime={article.publishedAt}>
            {formatDateTime(article.publishedAt, article.lang)}
          </time>
        </div>
        <PosterImage src={article.poster} alt={article.title} variant="thumb" />
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
          <li className="story-card" key={article.slug}>
            <Link className="story-hit" href={articleHref(lang, article.year, article.month, article.slug)}>
              {article.title}
            </Link>
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
            <PosterImage src={article.poster} alt={article.title} />
          </figure>
          <Kicker article={article} />
          <h2>
            <Link className="story-hit" href={articleHref(article.lang, article.year, article.month, article.slug)}>
              {article.title}
            </Link>
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
