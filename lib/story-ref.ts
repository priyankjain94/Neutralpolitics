export function storyParts(value: string): { year: string; month: string; slug: string; path: string } | null {
  const match = value.trim().match(/(?:^|\/)(?:hi\/)?news\/(\d{4})\/(\d{2})\/([^/?#\s]+)/);
  if (!match) return null;
  const slug = decodeURIComponent(match[3]);
  return { year: match[1], month: match[2], slug, path: `/news/${match[1]}/${match[2]}/${slug}` };
}
