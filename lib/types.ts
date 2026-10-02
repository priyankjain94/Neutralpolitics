export type Lang = "en" | "hi";

export type Verdict =
  | "false"
  | "misleading"
  | "missing-context"
  | "unverified"
  | "true"
  | "partly-true";

export type IgPost = {
  shortcode: string;
  url: string;
  type: "reel" | "carousel" | "image";
  headline?: string;
};

export type Source = {
  outlet: string;
  url: string;
  published?: string;
  headline?: string;
  group?: string;
};

export type Side = { label: string; text: string };

export type Correction = { at: string; note: string };

export type Factcheck = {
  verdict: Verdict;
  claimant: string;
  claimDate: string;
  claim: string;
  evidence: string[];
};

export type TranslationMeta = {
  engine?: string;
  model?: string | null;
  at?: string;
  glossary_version?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  status?: "machine" | "reviewed";
  note?: string;
};

export type Article = {
  lang: Lang;
  slug: string;
  year: string;
  month: string;
  status: "draft" | "published";
  title: string;
  standfirst: string;
  body: string;
  keyFacts: string[];
  sides: Side[];
  notConfirmed: string[];
  category: string;
  secondary: string[];
  breaking: boolean;
  pinned: boolean;
  tags: string[];
  publishedAt: string;
  updatedAt: string | null;
  igShortcode: string;
  igUrl: string;
  igType: "reel" | "carousel" | "image";
  igMore: IgPost[];
  eventId: string | null;
  followUpOf: string | null;
  sources: Source[];
  photoCredits: string[];
  byline: string;
  corrections: Correction[];
  factcheck: Factcheck | null;
  sample: boolean;
  poster: string;
  translation: TranslationMeta | null;
  readingMinutes: number;
};

export type PageCopy = { title: string; description: string; body: string };
