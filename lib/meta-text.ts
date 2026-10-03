const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;
const TITLE_SUFFIX = " | Neutral Politics";

/** Document title, including the site name, capped at 60 characters. */
export function documentTitle(headline: string): { absolute: string } {
  const clean = headline.replace(/\s+/g, " ").trim();
  if (!clean) return { absolute: "Neutral Politics" };
  const full = `${clean}${TITLE_SUFFIX}`;
  if (full.length <= TITLE_MAX) return { absolute: full };
  const room = TITLE_MAX - TITLE_SUFFIX.length - 1;
  let cut = clean.slice(0, Math.max(room, 0)).trimEnd();
  const space = cut.lastIndexOf(" ");
  if (space >= 16) cut = cut.slice(0, space).trimEnd();
  if (!cut) cut = clean.slice(0, Math.max(room, 0)).trimEnd();
  return { absolute: `${cut}…${TITLE_SUFFIX}` };
}

export function googleSiteVerificationToken(): string | undefined {
  const token = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();
  return token || undefined;
}

export function fitDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= DESCRIPTION_MAX) return clean;
  let cut = clean.slice(0, DESCRIPTION_MAX).trimEnd();
  const space = cut.lastIndexOf(" ");
  if (space >= 80) cut = cut.slice(0, space).trimEnd();
  return cut;
}
