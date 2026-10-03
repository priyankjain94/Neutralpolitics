import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { articleHref } from "@/lib/paths";
import type { Article, Lang } from "@/lib/types";

export function TopicView({ lang, tag, stories }: { lang: Lang; tag: string; stories: Article[] }) {
  const m = t(lang);
  return (
    <div className="wrap">
      <h1 className="page-title">{tag}</h1>
      <p className="lede">{m.topicIntro}</p>
      <div className="latest">
        <ol>
          {stories.map((article) => (
            <li key={article.slug}>
              <Link href={articleHref(lang, article.year, article.month, article.slug)}>{article.title}</Link>
              <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, lang)}</time>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
