import Link from "next/link";
import { articlesWithDesk } from "@/lib/desk";
import { articleHref } from "@/lib/paths";
import type { Lang } from "@/lib/types";

const TICKER_COUNT = 10;
const PIXELS_PER_SECOND = 50;
const SEPARATOR_PX = 28;
// Average glyph width at 13px in the site font, measured so one copy travels near 50px/s.
const CHAR_PX: Record<Lang, number> = { en: 6.5, hi: 5.3 };

type Item = { href: string; title: string };

function estimateCopyWidth(items: Item[], lang: Lang): number {
  const charPx = CHAR_PX[lang];
  return items.reduce((width, item) => width + Math.ceil(item.title.length * charPx) + SEPARATOR_PX, 0);
}

function HeadlineList({ items, clone }: { items: Item[]; clone?: boolean }) {
  return (
    <ul className={clone ? "live-list live-clone" : "live-list"} aria-hidden={clone ? true : undefined}>
      {items.map((item) => (
        <li className="live-item" key={item.href}>
          <Link href={item.href} tabIndex={clone ? -1 : undefined}>
            {item.title}
          </Link>
          <span className="live-sep" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
}

export async function LiveTicker({ lang }: { lang: Lang }) {
  const stories = (await articlesWithDesk(lang)).slice(0, TICKER_COUNT);
  if (stories.length === 0) return null;

  const items = stories.map((story) => ({
    href: articleHref(story.lang, story.year, story.month, story.slug),
    title: story.title,
  }));
  const duration = Math.max(24, Math.round(estimateCopyWidth(items, lang) / PIXELS_PER_SECOND));

  return (
    <div className="live-ticker" style={{ "--ticker-duration": `${duration}s` } as React.CSSProperties}>
      <p className="live-pill">
        <span className="live-dot" aria-hidden="true" />
        {lang === "hi" ? "लाइव" : "LIVE"}
      </p>
      <div className="live-viewport" role="region" aria-label="Latest headlines">
        <div className="live-track">
          <HeadlineList items={items} />
          <HeadlineList items={items} clone />
        </div>
      </div>
    </div>
  );
}
