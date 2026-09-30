import Link from "next/link";
import { notFound } from "next/navigation";
import { LatestList, LeadStory, StoryGrid } from "./Stories";
import { categoryLabel, isCategory } from "@/lib/categories";
import { articlesWithDesk } from "@/lib/desk";
import { t } from "@/lib/i18n";
import { articleHref, withLang } from "@/lib/paths";
import type { Lang } from "@/lib/types";

const PAGE_SIZE = 12;

export async function CategoryView({ lang, name, page }: { lang: Lang; name: string; page: number }) {
  if (!isCategory(name)) notFound();
  const m = t(lang);
  const live = await articlesWithDesk(lang);
  const all = live.filter((article) => article.category === name);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pages);
  const slice = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const [lead, ...rest] = slice;
  const blurb = m.categoryBlurbs[name];
  const base = withLang(lang, `/category/${name}`);

  return (
    <div className="wrap">
      <h1 className="page-title">{categoryLabel(name, lang)}</h1>
      <p className="lede">{blurb}</p>
      <p className="fine">
        <a href={`${base}/rss.xml`}>RSS</a>
      </p>
      {lead ? (
        <div className="home-top two">
          <LeadStory article={lead} figure={false} />
          <LatestList lang={lang} articles={live.slice(0, 6)} />
          <Link className="lead-photo" href={articleHref(lead.lang, lead.year, lead.month, lead.slug)} aria-label={lead.title}>
            <img src={lead.poster} alt="" fetchPriority="high" decoding="async" />
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
      <nav className="pager">
        {current > 1 ? <Link href={`${base}?page=${current - 1}`}>{m.newer}</Link> : null}
        <span>
          {m.page} {current}
        </span>
        {current < pages ? <Link href={`${base}?page=${current + 1}`}>{m.older}</Link> : null}
      </nav>
    </div>
  );
}
