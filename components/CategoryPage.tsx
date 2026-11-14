import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "./JsonLd";
import { PosterImage } from "./PosterImage";
import { LatestList, LeadStory, StoryGrid } from "./Stories";
import { categoryLabel, isCategory } from "@/lib/categories";
import { articlesWithDesk } from "@/lib/desk";
import { sortStories } from "@/lib/story-order";
import { t } from "@/lib/i18n";
import { articleHref, withLang } from "@/lib/paths";
import { breadcrumbJsonLd } from "@/lib/seo";
import type { Lang } from "@/lib/types";

const PAGE_SIZE = 12;

export async function CategoryView({ lang, name }: { lang: Lang; name: string }) {
  if (!isCategory(name)) notFound();
  const m = t(lang);
  const live = sortStories(await articlesWithDesk(lang));
  const all = sortStories(live.filter((article) => article.category === name));
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const blurb = m.categoryBlurbs[name];
  const base = withLang(lang, `/category/${name}`);
  const chunks = Array.from({ length: pages }, (_, index) => all.slice(index * PAGE_SIZE, (index + 1) * PAGE_SIZE));

  const label = categoryLabel(name, lang);
  return (
    <div className="wrap">
      <JsonLd
        data={breadcrumbJsonLd(lang, [
          { name: m.home, path: "/" },
          { name: label, path: `/category/${name}` },
        ])}
      />
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href={withLang(lang, "/")}>{m.home}</Link>
          </li>
          <li>{label}</li>
        </ol>
      </nav>
      <h1 className="page-title">{label}</h1>
      <p className="lede">{blurb}</p>
      <p className="fine">
        <a href={`${base}/rss.xml`}>RSS</a>
      </p>
      {chunks.map((slice, index) => {
        const [lead, ...rest] = slice;
        const page = index + 1;
        return (
          <div key={page} data-cat-page={page} hidden={page !== 1}>
            {lead ? (
              <div className="home-top two">
                <LeadStory article={lead} figure={false} heading="h2" />
                <LatestList lang={lang} articles={live.slice(0, 6)} />
                <Link className="lead-photo" href={articleHref(lead.lang, lead.year, lead.month, lead.slug)} aria-label={lead.title}>
                  <PosterImage src={lead.poster} alt={lead.title} priority={page === 1} />
                </Link>
              </div>
            ) : (
              <p>{m.emptyCategory}</p>
            )}
            {rest.length ? (
              <div className="section-block">
                <StoryGrid articles={rest} />
              </div>
            ) : null}
          </div>
        );
      })}
      <nav className="pager">
        <a data-pager="newer" href={`${base}?page=1`} hidden>
          {m.newer}
        </a>
        <span data-pager="label">
          {m.page} 1
        </span>
        <a data-pager="older" href={`${base}?page=2`} hidden={pages < 2}>
          {m.older}
        </a>
      </nav>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var pages=document.querySelectorAll("[data-cat-page]");var n=pages.length||1;var q=parseInt(new URLSearchParams(location.search).get("page")||"1",10);if(!q||q<1)q=1;if(q>n)q=n;pages.forEach(function(el){el.hidden=Number(el.getAttribute("data-cat-page"))!==q;});var label=document.querySelector("[data-pager=label]");if(label)label.textContent=${JSON.stringify(m.page)}+" "+q;var newer=document.querySelector("[data-pager=newer]");var older=document.querySelector("[data-pager=older]");var base=${JSON.stringify(base)};if(newer){newer.hidden=q<=1;if(q>1)newer.setAttribute("href",base+"?page="+(q-1));}if(older){older.hidden=q>=n;if(q<n)older.setAttribute("href",base+"?page="+(q+1));}})();`,
        }}
      />
    </div>
  );
}
