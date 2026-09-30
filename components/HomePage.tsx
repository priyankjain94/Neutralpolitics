import Link from "next/link";
import { Suspense } from "react";
import { LanguageBanner } from "./LanguageBanner";
import { NewsletterForm } from "./NewsletterForm";
import { JsonLd } from "./JsonLd";
import { LatestList, LeadStory, SecondaryStory, StoryGrid } from "./Stories";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { articlesWithDesk, publicCorrections } from "@/lib/desk";
import { isDatabaseConfigured } from "@/lib/env";
import { formatDay } from "@/lib/format";
import { t } from "@/lib/i18n";
import { articleHref, withLang } from "@/lib/paths";
import { homeJsonLd } from "@/lib/seo";
import type { Lang } from "@/lib/types";

export async function HomePage({ lang }: { lang: Lang }) {
  const m = t(lang);
  const articles = await articlesWithDesk(lang);
  const lead = articles.find((article) => article.breaking) || articles[0];
  const rest = articles.filter((article) => article !== lead);
  const secondary = rest.slice(0, 4);
  const latest = rest.slice(0, 8);
  const trending = [...rest.filter((article) => article.breaking), ...rest.filter((article) => !article.breaking)].slice(0, 5);
  const sections = CATEGORIES.map((category) => ({
    slug: category.slug,
    articles: articles.filter((article) => article.category === category.slug && article.slug !== lead?.slug).slice(0, 4),
  })).filter((section) => section.articles.length > 0);
  const checks = articles.filter((article) => article.category === "fact-check").slice(0, 2);
  const corrections = (await publicCorrections(lang)).slice(0, 2);

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
            <div className="home-rail">
              <LatestList lang={lang} articles={latest.length ? latest : rest} />
              <LatestList lang={lang} articles={trending} title={m.trending} />
              <Link className="callout callout-compact" href={withLang(lang, "/contribute")}>
                <span>{m.contributorTitle}</span>
                <strong>{m.contributorLink}</strong>
              </Link>
            </div>
          </div>
        ) : (
          <p>{m.emptyCategory}</p>
        )}

        <section className="signup-band">
          <NewsletterForm lang={lang} source="/" enabled={isDatabaseConfigured()} compact band />
        </section>

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
                <p className="story-card" key={article.slug}>
                  <Link className="story-hit" href={articleHref(lang, article.year, article.month, article.slug)}>
                    {article.title}
                  </Link>
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
              {corrections.map((entry) => (
                <p className={entry.article ? "story-card" : undefined} key={entry.key}>
                  <time dateTime={entry.at}>{formatDay(entry.at, lang)}</time> — {entry.note}{" "}
                  {entry.article ? (
                    <Link className="story-hit" href={articleHref(lang, entry.article.year, entry.article.month, entry.article.slug)}>
                      {entry.article.title}
                    </Link>
                  ) : null}
                </p>
              ))}
              <Link href={withLang(lang, "/corrections")}>{m.allCorrections}</Link>
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
