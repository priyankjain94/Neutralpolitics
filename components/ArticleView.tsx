import Link from "next/link";
import { IgEmbed } from "./IgEmbed";
import { JsonLd } from "./JsonLd";
import { LatestList } from "./Stories";
import { Markdown } from "./Markdown";
import { NewsletterForm } from "./NewsletterForm";
import { ShareBar } from "./ShareBar";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { articlesWithDesk } from "@/lib/desk";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDateTime, formatSourceTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { absoluteUrl, articleHref, siteUrl, withLang } from "@/lib/paths";
import { articleJsonLd } from "@/lib/seo";
import type { Article } from "@/lib/types";

export async function ArticleView({ article }: { article: Article }) {
  const m = t(article.lang);
  const path = `/news/${article.year}/${article.month}/${article.slug}`;
  const url = absoluteUrl(article.lang, path);
  const other = article.lang === "en" ? "hi" : "en";
  const live = await articlesWithDesk(article.lang);
  const otherLive = (await articlesWithDesk(other)).some(
    (item) => item.year === article.year && item.month === article.month && item.slug === article.slug,
  );
  const parent = article.followUpOf
    ? live.find((item) => item.slug === article.followUpOf || item.eventId === article.followUpOf)
    : undefined;
  const pool = live.filter((item) => item.slug !== article.slug);
  const related = [...pool.filter((item) => item.category === article.category), ...pool.filter((item) => item.category !== article.category)].slice(0, 4);
  const latest = pool.slice(0, 6);
  const trending = [...pool.filter((item) => item.breaking), ...pool.filter((item) => !item.breaking)].slice(0, 5);
  const image = article.poster.startsWith("http") ? article.poster : `${siteUrl()}${article.poster}`;
  const verdict = article.factcheck ? m.verdicts[article.factcheck.verdict] : "";

  return (
    <article className="wrap article-layout">
      <JsonLd data={articleJsonLd(article, [image])} />
      <div>
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={withLang(article.lang, "/")}>{m.home}</Link>
            </li>
            <li>
              <Link href={withLang(article.lang, `/category/${article.category}`)}>
                {categoryLabel(article.category, article.lang)}
              </Link>
            </li>
          </ol>
        </nav>
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
        <p className="report-link">
          <Link href={withLang(article.lang, `/report-error?story=${encodeURIComponent(`/news/${article.year}/${article.month}/${article.slug}`)}`)}>
            {m.reportError}
          </Link>
        </p>
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
                <li className="story-card related-row" key={item.slug}>
                  <img src={item.poster} alt="" loading="lazy" decoding="async" />
                  <div>
                    <Link className="story-hit" href={articleHref(item.lang, item.year, item.month, item.slug)}>
                      {item.title}
                    </Link>
                    <time dateTime={item.publishedAt}>{formatDateTime(item.publishedAt, item.lang)}</time>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <NewsletterForm lang={article.lang} source={path} enabled={isDatabaseConfigured()} />
      </div>
      <aside className="rail">
        <LatestList lang={article.lang} articles={latest} />
        <LatestList lang={article.lang} articles={trending} title={m.trending} />
        <nav className="rail-cats">
          <h2>{m.sectionsLabel}</h2>
          <ul>
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link href={withLang(article.lang, `/category/${category.slug}`)}>
                  {categoryLabel(category.slug, article.lang)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link className="callout callout-compact" href={withLang(article.lang, "/contribute")}>
          <span>{m.contributorTitle}</span>
          <strong>{m.contributorLink}</strong>
        </Link>
      </aside>
    </article>
  );
}
