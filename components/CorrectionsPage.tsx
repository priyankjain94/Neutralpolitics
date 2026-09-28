import Link from "next/link";
import { Markdown } from "./Markdown";
import { ReportForm } from "./ReportForm";
import { allCorrections, loadPage } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { articleHref } from "@/lib/paths";
import type { Lang } from "@/lib/types";

export function CorrectionsPage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const page = loadPage("corrections", lang);
  const entries = allCorrections(lang);
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">{page?.title || m.corrections}</h1>
      {page?.description ? <p className="lede">{page.description}</p> : null}
      {page ? <Markdown>{page.body}</Markdown> : null}
      <ul className="log">
        {entries.map(({ article, correction }) => (
          <li key={`${article.slug}-${correction.at}`}>
            <time dateTime={correction.at}>{formatDateTime(correction.at, lang)}</time>
            <p>{correction.note}</p>
            <Link href={articleHref(lang, article.year, article.month, article.slug)}>{article.title}</Link>
          </li>
        ))}
      </ul>
      <ReportForm lang={lang} type="correction" enabled={isDatabaseConfigured()} />
    </div>
  );
}
