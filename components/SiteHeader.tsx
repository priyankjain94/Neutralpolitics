"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MORE_NAV, PRIMARY_NAV, categoryLabel } from "@/lib/categories";
import { formatMastheadDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import { stripLang, switchLang, withLang } from "@/lib/paths";

export function SiteHeader() {
  const pathname = usePathname() || "/";
  const { lang, path } = stripLang(pathname);
  const m = t(lang);
  const section = path.startsWith("/category/") ? path.split("/")[2] : "";

  return (
    <header>
      <a className="skip" href="#main">
        {m.skip}
      </a>
      <div className="toprule" />
      <div className="wrap topbar">
        <time suppressHydrationWarning dateTime={new Date().toISOString()}>
          {formatMastheadDate(new Date(), lang)}
        </time>
        <div className="topbar-links">
          <span className="lang-toggle">
            <Link href={switchLang(pathname, "en")} hrefLang="en-IN" aria-current={lang === "en" ? "true" : undefined}>
              EN
            </Link>
            <span aria-hidden="true">|</span>
            <Link href={switchLang(pathname, "hi")} hrefLang="hi-IN" aria-current={lang === "hi" ? "true" : undefined}>
              हिंदी
            </Link>
          </span>
          <Link href={withLang(lang, "/search")}>{m.search}</Link>
          <Link className="contribute-link" href={withLang(lang, "/contribute")}>
            {m.contribute}
          </Link>
        </div>
      </div>
      <div className="wrap masthead">
        <Link href={withLang(lang, "/")}>
          <img src="/brand/np-logo.png" alt="Neutral Politics" width={932} height={240} />
        </Link>
        <p className="tagline">{m.tagline}</p>
      </div>
      <nav className="sections" aria-label="Sections">
        <div className="wrap sections-inner">
          <Link className="nav-mark" href={withLang(lang, "/")} aria-label="Neutral Politics">
            <img src="/brand/np-logo.png" alt="" width={932} height={240} />
          </Link>
          <ul>
            {PRIMARY_NAV.map((slug) => (
              <li key={slug}>
                <Link href={withLang(lang, `/category/${slug}`)} aria-current={section === slug ? "page" : undefined}>
                  {categoryLabel(slug, lang)}
                </Link>
              </li>
            ))}
            <li>
              <details className="more">
                <summary>{m.more}</summary>
                <div className="more-panel">
                  {MORE_NAV.map((slug) => (
                    <Link key={slug} href={withLang(lang, `/category/${slug}`)} aria-current={section === slug ? "page" : undefined}>
                      {categoryLabel(slug, lang)}
                    </Link>
                  ))}
                </div>
              </details>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
