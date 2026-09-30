import Link from "next/link";
import { Markdown } from "./Markdown";
import { ErrorReportForm } from "./ErrorReportForm";
import { loadPage } from "@/lib/content";
import { publicCorrections } from "@/lib/desk";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { articleHref } from "@/lib/paths";
import type { Lang } from "@/lib/types";

export async function CorrectionsPage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const page = loadPage("corrections", lang);
  const entries = await publicCorrections(lang);
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">{page?.title || m.corrections}</h1>
      {page?.description ? <p className="lede">{page.description}</p> : null}
      {page ? <Markdown>{page.body}</Markdown> : null}
      <ul className="log">
        {entries.map((entry) => (
          <li className={entry.article ? "story-card" : undefined} key={entry.key}>
            <time dateTime={entry.at}>{formatDateTime(entry.at, lang)}</time>
            <p>{entry.note}</p>
            {entry.article ? (
              <Link className="story-hit" href={articleHref(lang, entry.article.year, entry.article.month, entry.article.slug)}>
                {entry.article.title}
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
      <ErrorReportForm lang={lang} enabled={isDatabaseConfigured()} />
    </div>
  );
}
