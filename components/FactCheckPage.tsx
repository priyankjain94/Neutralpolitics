import Link from "next/link";
import { Markdown } from "./Markdown";
import { ReportForm } from "./ReportForm";
import { articlesInCategory, loadPage } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";
import { articleHref } from "@/lib/paths";
import type { Lang } from "@/lib/types";

export function FactCheckPage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const page = loadPage("fact-check", lang);
  const articles = articlesInCategory(lang, "fact-check");
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">{page?.title || m.factCheck}</h1>
      {page?.description ? <p className="lede">{page.description}</p> : null}
      {page ? <Markdown>{page.body}</Markdown> : null}
      <ul className="log">
        {articles.map((article) => (
          <li key={article.slug}>
            {article.factcheck ? <span className="verdict">{m.verdicts[article.factcheck.verdict]}</span> : null}{" "}
            <Link href={articleHref(lang, article.year, article.month, article.slug)}>{article.title}</Link>
            <p className="dek">{article.standfirst}</p>
          </li>
        ))}
      </ul>
      <ReportForm lang={lang} type="factcheck" enabled={isDatabaseConfigured()} />
    </div>
  );
}
