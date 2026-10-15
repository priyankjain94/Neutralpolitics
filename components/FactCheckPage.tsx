import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { PosterImage } from "./PosterImage";
import { Markdown } from "./Markdown";
import { ReportForm } from "./ReportForm";
import { articlesInCategory, loadPage } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";
import { articleHref } from "@/lib/paths";
import { organizationNode } from "@/lib/seo";
import type { Lang } from "@/lib/types";

export function FactCheckPage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const page = loadPage("fact-check", lang);
  const articles = articlesInCategory(lang, "fact-check");
  return (
    <div className="wrap">
      <JsonLd data={organizationNode()} />
      <div className="prose-page">
        <h1 className="page-title">{page?.title || m.factCheck}</h1>
        {page?.description ? <p className="lede">{page.description}</p> : null}
        {page ? <Markdown>{page.body}</Markdown> : null}
      </div>
      <div className="cat-grid">
        {articles.map((article) => (
          <article className="story-card" key={article.slug}>
            <figure className="card-figure">
              <PosterImage src={article.poster} alt={article.title} />
            </figure>
            <div className="kicker-row">
              {article.factcheck ? <span className="verdict">{m.verdicts[article.factcheck.verdict]}</span> : null}
            </div>
            <h2>
              <Link className="story-hit" href={articleHref(lang, article.year, article.month, article.slug)}>
                {article.title}
              </Link>
            </h2>
            <p className="dek">{article.standfirst}</p>
          </article>
        ))}
      </div>
      <div className="prose-page">
        <ReportForm lang={lang} type="factcheck" enabled={isDatabaseConfigured()} />
      </div>
    </div>
  );
}
