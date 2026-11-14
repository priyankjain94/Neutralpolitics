export const CANONICAL_HOST = "www.neutralpolitics.in";

export type PublishedLists = { en: readonly string[]; hi: readonly string[] };

export function shouldNoindexHost(host: string): boolean {
  return host.toLowerCase() !== CANONICAL_HOST;
}

export function searchQueryNoindex(pathname: string, searchParams: { has(name: string): boolean }): boolean {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return (path === "/search" || path === "/hi/search") && searchParams.has("q");
}

/** Unpublished or unknown story URLs. Null when that language's file is published. */
export function articleRedirect(pathname: string, published: PublishedLists): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") || "/" : pathname;
  const hindi = path.match(/^\/hi\/news\/(\d{4})\/(\d{2})\/([^/]+)$/);
  const english = path.match(/^\/news\/(\d{4})\/(\d{2})\/([^/]+)$/);
  const match = hindi || english;
  if (!match) return null;
  const key = `${match[1]}/${match[2]}/${match[3]}`;
  const listed = (hindi ? published.hi : published.en).includes(key);
  if (listed) return null;
  return hindi ? "/hi?notice=hi-soon" : "/?notice=en-soon";
}
