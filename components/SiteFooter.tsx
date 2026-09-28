import Link from "next/link";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { t } from "@/lib/i18n";
import { withLang } from "@/lib/paths";
import type { Lang } from "@/lib/types";

export function SiteFooter({ lang }: { lang: Lang }) {
  const m = t(lang);
  const desk = [
    ["/about", m.about],
    ["/editorial-policy", m.editorial],
    ["/fact-check", m.factCheck],
    ["/corrections", m.corrections],
    ["/contact", m.contact],
    ["/contribute", m.contribute],
    ["/subscribe", m.subscribe],
    ["/privacy", m.privacy],
    ["/terms", m.terms],
  ] as const;
  return (
    <footer className="site-footer">
      <div className="wrap footer-cols">
        <div>
          <img src="/brand/np-logo.png" alt="Neutral Politics" width={932} height={240} />
          <p>{m.footerBlurb}</p>
          <p>
            <a href="https://www.instagram.com/theneutralpolitics/">Instagram @theneutralpolitics</a>
          </p>
          <p className="fine">© {new Date().getFullYear()} Neutral Politics</p>
        </div>
        <div>
          <h2>{m.sectionsLabel}</h2>
          <div className="footer-links">
            {CATEGORIES.map((category) => (
              <Link key={category.slug} href={withLang(lang, `/category/${category.slug}`)}>
                {categoryLabel(category.slug, lang)}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2>{m.desk}</h2>
          <div className="footer-links">
            {desk.map(([href, label]) => (
              <Link key={href} href={withLang(lang, href)}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
