import type { Lang } from "./types";

export const CATEGORIES = [
  { slug: "politics", en: "Politics", hi: "राजनीति" },
  { slug: "courts", en: "Courts", hi: "अदालत" },
  { slug: "economy", en: "Economy", hi: "अर्थव्यवस्था" },
  { slug: "world", en: "World", hi: "दुनिया" },
  { slug: "sports", en: "Sports", hi: "खेल" },
  { slug: "defence-security", en: "Defence & Security", hi: "रक्षा व सुरक्षा" },
  { slug: "disasters-weather", en: "Disasters & Weather", hi: "आपदा व मौसम" },
  { slug: "law-order", en: "Law & Order", hi: "क़ानून व्यवस्था" },
  { slug: "explainers", en: "Explainers", hi: "समझिए" },
  { slug: "np-facts", en: "NP Facts", hi: "रोचक तथ्य" },
  { slug: "fact-check", en: "Fact-check", hi: "फ़ैक्ट चेक" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export const PRIMARY_NAV: CategorySlug[] = [
  "politics",
  "courts",
  "economy",
  "world",
  "sports",
  "fact-check",
];

export const MORE_NAV: CategorySlug[] = [
  "defence-security",
  "disasters-weather",
  "law-order",
  "explainers",
  "np-facts",
];

export function isCategory(slug: string): slug is CategorySlug {
  return CATEGORIES.some((c) => c.slug === slug);
}

export function categoryLabel(slug: string, lang: Lang): string {
  const found = CATEGORIES.find((c) => c.slug === slug);
  if (!found) return slug;
  return lang === "hi" ? found.hi : found.en;
}
