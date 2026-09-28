import Link from "next/link";
import { IgEmbed } from "./IgEmbed";
import { JsonLd } from "./JsonLd";
import { LatestList } from "./Stories";
import { Markdown } from "./Markdown";
import { NewsletterForm } from "./NewsletterForm";
import { ReportForm } from "./ReportForm";
import { ShareBar } from "./ShareBar";
import { categoryLabel } from "@/lib/categories";
import { findByFollowUp, publishedArticles, relatedArticles } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime, formatSourceTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { absoluteUrl, articleHref, siteUrl, withLang } from "@/lib/paths";
import { articleJsonLd } from "@/lib/seo";
import type { Article } from "@/lib/types";

export function ArticleView({ article }: { article: Article }) {
  const m = t(article.lang);
  const path = `/news/${article.year}/${article.month}/${article.slug}`;
  const url = absoluteUrl(article.lang, path);
  const other = article.lang === "en" ? "hi" : "en";
  const otherLive = publishedArticles(other).some(
    (item) => item.year === article.year && item.month === article.month && item.slug === article.slug,
  );
  const parent = article.followUpOf ? findByFollowUp(article.lang, article.followUpOf) : undefined;
  const related = relatedArticles(article);
  const latest = publishedArticles(article.lang).filter((item) => item.slug !== article.slug).slice(0, 6);
  const image = article.poster.startsWith("http") ? article.poster : `${siteUrl()}${article.poster}`;
  const verdict = article.factcheck ? m.verdicts[article.factcheck.verdict] : "";

  return (
    <article className="wrap article-layout">
      <JsonLd data={articleJsonLd(article, [image])} />
      <div>
        <div className="kicker-row">
          {article.breaking ? <span className="breaking">{m.breaking}</span> : null}
          <Link className="kicker" href={withLang(article.lang, `/category/${article.category}`)}>
            {categoryLabel(article.category, article.lang)}
          </Link>
          {article.factcheck ? <span className="verdict">{verdict}</span> : null}
        </div>
        <h1 className="story-title">{article.title}</h1>
        <p className="standfirst">{article.standfirst}</p>
        <div className="meta">
          <span>{article.byline}</span>
          <time dateTime={article.publishedAt}>{formatDateTime(article.publishedAt, article.lang)}</time>
          {article.updatedAt ? (
            <span>
              {m.updated} <time dateTime={article.updatedAt}>{formatDateTime(article.updatedAt, article.lang)}</time>
            </span>
          ) : null}
          <span>
            {article.readingMinutes} {m.minRead}
          </span>
        </div>
        {article.lang === "hi" ? (
          <p className="translated-note">
            {otherLive ? <Link href={articleHref("en", article.year, article.month, article.slug)}>{m.readOther}</Link> : m.comingSoon}
            {article.translation?.status === "reviewed" ? ` ${m.translatedNote}` : ""}
          </p>
        ) : (
          <p className="translated-note">
            {otherLive ? (
              <Link href={articleHref("hi", article.year, article.month, article.slug)}>{m.readOther}</Link>
            ) : (
              m.comingSoon
            )}
          </p>
        )}
        {article.sample ? <p className="sample-banner">{m.sampleBanner}</p> : null}
        {parent ? (
          <p className="dek">
            {m.followUp}{" "}
            <Link href={articleHref(parent.lang, parent.year, parent.month, parent.slug)}>{parent.title}</Link>
          </p>
        ) : null}
        <IgEmbed
          lang={article.lang}
          shortcode={article.igShortcode}
          type={article.igType}
          poster={article.poster}
          sample={article.sample}
        />
        {article.igMore.length ? (
          <p className="embed-note">
            {m.alsoOnInstagram}{" "}
            {article.igMore.map((item, index) => (
              <span key={item.shortcode}>
                {index ? " · " : ""}
                <a href={item.url}>{item.headline || item.shortcode}</a>
              </span>
            ))}
          </p>
        ) : null}
        {article.photoCredits.length ? <p className="credit">{m.photo}: {article.photoCredits.join("; ")}</p> : null}
        <ShareBar lang={article.lang} title={article.title} url={url} />
        <div className="prose" data-pagefind-body>
          <Markdown>{article.body}</Markdown>
        </div>
        {article.keyFacts.length ? (
          <section className="facts">
            <h2>{m.keyFacts}</h2>
            <ol>
              {article.keyFacts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ol>
          </section>
        ) : null}
        {article.sides.length ? (
          <section className="sides">
            <h2>{m.sides}</h2>
            <div className="sides-grid">
              {article.sides.map((side) => (
                <article key={side.label}>
                  <h3>{side.label}</h3>
                  <p>{side.text}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
        {article.notConfirmed.length ? (
          <section className="unconfirmed">
            <h2>{m.notConfirmed}</h2>
            <ul>
              {article.notConfirmed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {article.factcheck ? (
          <section className="facts">
            <h2>{m.factCheck}</h2>
            <p>
              <span className="verdict">{verdict}</span>
            </p>
            <p>{article.factcheck.claim}</p>
            <ul>
              {article.factcheck.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="sources">
          <h2>{m.sources}</h2>
          <ol>
            {article.sources.map((source) => (
              <li key={source.url}>
                <strong>{source.outlet}</strong>
                {source.headline ? ` — ${source.headline}` : ""}{" "}
                <a href={source.url} rel="noopener noreferrer">
                  {source.url}
                </a>
                {source.published ? <span className="fine"> · {formatSourceTime(source.published, article.lang)}</span> : null}
              </li>
            ))}
          </ol>
        </section>
        {related.length ? (
          <section className="related">
            <h2 className="rule-title">{m.related}</h2>
            <ul>
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={articleHref(item.lang, item.year, item.month, item.slug)}>{item.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <NewsletterForm lang={article.lang} source={path} enabled={isDatabaseConfigured()} />
        <ReportForm lang={article.lang} type="correction" enabled={isDatabaseConfigured()} articleUrl={url} />
      </div>
      <aside className="rail">
        <LatestList lang={article.lang} articles={latest} />
        <aside className="callout">
          <h2>{m.contributorTitle}</h2>
          <p>{m.contributorBody}</p>
          <Link href={withLang(article.lang, "/contribute")}>{m.contributorLink}</Link>
        </aside>
      </aside>
    </article>
  );
}
