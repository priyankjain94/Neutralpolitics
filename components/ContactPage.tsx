import Link from "next/link";
import { ReportForm } from "./ReportForm";
import { Markdown } from "./Markdown";
import { loadPage } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/env";
import { t } from "@/lib/i18n";
import { withLang } from "@/lib/paths";
import type { Lang } from "@/lib/types";

export function ContactPage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const page = loadPage("contact", lang);
  return (
    <div className="wrap prose-page">
      <h1 className="page-title">{page?.title || m.contact}</h1>
      <p className="lede">{m.contactBlurb}</p>
      {page ? <Markdown>{page.body}</Markdown> : null}
      <ul>
        <li>
          {m.desk}: <a href="mailto:desk@theneutralpolitics.in">desk@theneutralpolitics.in</a>
        </li>
        <li>
          {m.correctionsEmail}: <a href="mailto:corrections@theneutralpolitics.in">corrections@theneutralpolitics.in</a>
        </li>
        <li>
          {m.contributeEmail}: <a href="mailto:contribute@theneutralpolitics.in">contribute@theneutralpolitics.in</a>
        </li>
        <li>
          <a href="https://www.instagram.com/theneutralpolitics/">{m.instagram}</a>
        </li>
        <li>
          <Link href={withLang(lang, "/contribute")}>{m.contributorLink}</Link>
        </li>
      </ul>
      <ReportForm lang={lang} type="contact" enabled={isDatabaseConfigured()} />
    </div>
  );
}
