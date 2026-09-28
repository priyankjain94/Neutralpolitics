import Link from "next/link";
import { Suspense } from "react";
import { LanguageBanner } from "./LanguageBanner";
import { NewsletterForm } from "./NewsletterForm";
import { JsonLd } from "./JsonLd";
import { LatestList, LeadStory, SecondaryStory, StoryGrid } from "./Stories";
import { categoryLabel } from "@/lib/categories";
import { allCorrections, publishedArticles } from "@/lib/content";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDay } from "@/lib/format";
import { t } from "@/lib/i18n";
import { articleHref, withLang } from "@/lib/paths";
import { homeJsonLd } from "@/lib/seo";
import type { Lang } from "@/lib/types";

export function HomePage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const articles = publishedArticles(lang);
  const lead = articles.find((article) => article.breaking) || articles[0];
  const rest = articles.filter((article) => article !== lead);
  const secondary = rest.slice(0, 2);
  const latest = rest.slice(2, 10);
  const used = new Set([lead?.slug, ...secondary.map((article) => article.slug)]);
  const sections = ["politics", "courts", "economy", "world", "sports", "fact-check"]
    .map((slug) => ({
      slug,
      articles: articles.filter((article) => article.category === slug && !used.has(article.slug)).slice(0, 4),
    }))
    .filter((section) => section.articles.length > 0);
  const checks = articles.filter((article) => article.category === "fact-check").slice(0, 2);
  const corrections = allCorrections(lang).slice(0, 2);

  return (
    <>
      <JsonLd data={homeJsonLd(lang)} />
      <Suspense fallback={null}>
        <LanguageBanner />
      </Suspense>
      <div className="wrap">
        {lead ? (
          <div className="home-top">
            <LeadStory article={lead} />
            <div className="secondary">
              {secondary.map((article) => (
                <SecondaryStory key={article.slug} article={article} />
              ))}
            </div>
            <div>
              <LatestList lang={lang} articles={latest.length ? latest : rest} />
              <NewsletterForm lang={lang} source="/" enabled={isDatabaseConfigured()} compact />
            </div>
          </div>
        ) : (
          <p>{m.emptyCategory}</p>
        )}

        {sections.map((section) => (
          <section className="section-block" key={section.slug}>
            <h2 className="rule-title">
              <Link href={withLang(lang, `/category/${section.slug}`)}>{categoryLabel(section.slug, lang)}</Link>
            </h2>
            <StoryGrid articles={section.articles} />
          </section>
        ))}

        {checks.length ? (
          <section className="strip">
            <h2 className="rule-title">{m.factStrip}</h2>
            <div>
              {checks.map((article) => (
                <p key={article.slug}>
                  <Link href={articleHref(lang, article.year, article.month, article.slug)}>{article.title}</Link>
                </p>
              ))}
              <Link href={withLang(lang, "/fact-check")}>{m.allFactChecks}</Link>
            </div>
          </section>
        ) : null}

        {corrections.length ? (
          <section className="strip">
            <h2 className="rule-title">{m.correctionsStrip}</h2>
            <div>
              {corrections.map(({ article, correction }) => (
                <p key={correction.at}>
                  <time dateTime={correction.at}>{formatDay(correction.at, lang)}</time> — {correction.note}{" "}
                  <Link href={articleHref(lang, article.year, article.month, article.slug)}>{article.title}</Link>
                </p>
              ))}
              <Link href={withLang(lang, "/corrections")}>{m.allCorrections}</Link>
            </div>
          </section>
        ) : null}

        <aside className="callout">
          <h2>{m.contributorTitle}</h2>
          <p>{m.contributorBody}</p>
          <Link href={withLang(lang, "/contribute")}>{m.contributorLink}</Link>
        </aside>
      </div>
    </>
  );
}
