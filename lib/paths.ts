import type { Lang } from "./types";

const PRODUCTION_SITE_URL = "https://www.neutralpolitics.in";

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (process.env.NODE_ENV === "development") return "http://localhost:3000";
  return PRODUCTION_SITE_URL;
}

export function withLang(lang: Lang, href: string): string {
  const path = href.startsWith("/") ? href : `/${href}`;
  if (lang === "en") return path === "" ? "/" : path;
  if (path === "/") return "/hi";
  return `/hi${path}`;
}

export function absoluteUrl(lang: Lang, href: string): string {
  return `${siteUrl()}${withLang(lang, href)}`;
}

export function articleHref(lang: Lang, year: string, month: string, slug: string): string {
  return withLang(lang, `/news/${year}/${month}/${slug}`);
}

export function stripLang(pathname: string): { lang: Lang; path: string } {
  if (pathname === "/hi" || pathname.startsWith("/hi/")) {
    const path = pathname === "/hi" ? "/" : pathname.slice(3) || "/";
    return { lang: "hi", path };
  }
  return { lang: "en", path: pathname || "/" };
}

export function switchLang(pathname: string, target: Lang): string {
  const { path } = stripLang(pathname);
  return withLang(target, path);
}
