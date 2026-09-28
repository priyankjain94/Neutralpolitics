"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MORE_NAV, PRIMARY_NAV, categoryLabel } from "@/lib/categories";
import { formatMastheadDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import { stripLang, switchLang, withLang } from "@/lib/paths";
import type { Lang } from "@/lib/types";

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
          </ul>
          <MoreMenu lang={lang} section={section} label={m.more} />
        </div>
      </nav>
    </header>
  );
}

function MoreMenu({ lang, section, label }: { lang: Lang; section: string; label: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const inMore = MORE_NAV.some((slug) => slug === section);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  function focusItem(index: number) {
    const links = rootRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
    if (!links?.length) return;
    const next = (index + links.length) % links.length;
    links[next]?.focus();
  }

  function onButtonKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(0));
    }
  }

  function onMenuKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const links = rootRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]');
    if (!links?.length) return;
    const index = Array.from(links).findIndex((link) => link === document.activeElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusItem(index < 0 ? 0 : index + 1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      focusItem(index < 0 ? links.length - 1 : index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusItem(links.length - 1);
    }
  }

  return (
    <div className="more" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="more-button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-current={inMore ? "true" : undefined}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKey}
      >
        {label}
      </button>
      {open ? (
        <div id={menuId} className="more-panel" role="menu" aria-label={label} onKeyDown={onMenuKey}>
          {MORE_NAV.map((slug) => (
            <Link
              key={slug}
              role="menuitem"
              href={withLang(lang, `/category/${slug}`)}
              aria-current={section === slug ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {categoryLabel(slug, lang)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
