const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;
const DESCRIPTION_MIN = 140;
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
  const token = process.env.GOOGLE_SITE_VERIFICATION?.trim() || process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();
  return token || undefined;
}

export function bingSiteVerificationToken(): string | undefined {
  const token = process.env.BING_SITE_VERIFICATION?.trim();
  return token || undefined;
}

export function fitDescription(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= DESCRIPTION_MAX) return clean;
  let cut = clean.slice(0, DESCRIPTION_MAX).trimEnd();
  const space = cut.lastIndexOf(" ");
  if (space >= DESCRIPTION_MIN) cut = cut.slice(0, space).trimEnd();
  return cut;
}

function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build a description from existing sentences. Stops inside 140–160 when the source is long enough. */
export function metaDescription(...parts: string[]): string {
  const sentences = parts
    .flatMap((part) => plain(part).split(/(?<=[.!?।])\s+/))
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  let text = "";
  for (const sentence of sentences) {
    if (text.includes(sentence)) continue;
    const next = text ? `${text} ${sentence}` : sentence;
    if (next.length > DESCRIPTION_MAX) return fitDescription(next);
    text = next;
    if (text.length >= DESCRIPTION_MIN) break;
  }
  return fitDescription(text);
}
