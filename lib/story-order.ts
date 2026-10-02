/** How long a pin or breaking flag may hold the lead. */
export const LEAD_MAX_AGE_MS = 36 * 60 * 60 * 1000;

export type StoryOrderFields = {
  slug: string;
  publishedAt: string;
  breaking?: boolean;
  pinned?: boolean;
};

/** Parse an ISO timestamp, including a +05:30 offset, to epoch milliseconds. */
export function publishedTimeMs(publishedAt: string): number {
  const value = Date.parse(publishedAt);
  return Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
}

/** Newest published instant first. Equal instants fall back to slug, A to Z. */
export function sortStories<T extends StoryOrderFields>(stories: T[]): T[] {
  return [...stories].sort((a, b) => {
    const delta = publishedTimeMs(b.publishedAt) - publishedTimeMs(a.publishedAt);
    if (delta !== 0) return delta;
    return a.slug.localeCompare(b.slug);
  });
}

function isFreshBoost(story: StoryOrderFields, now: number): boolean {
  if (!story.pinned && !story.breaking) return false;
  const age = now - publishedTimeMs(story.publishedAt);
  return age >= 0 && age <= LEAD_MAX_AGE_MS;
}

/**
 * Lead is the newest story, unless a pinned or breaking story published within
 * the last 36 hours exists — then the newest of those leads. A pin or breaking
 * flag older than 36 hours never outranks a newer story.
 */
export function pickFeatured<T extends StoryOrderFields>(stories: T[], now = Date.now()) {
  const sorted = sortStories(stories);
  const boost = sorted.find((story) => isFreshBoost(story, now));
  const lead = boost || sorted[0];
  const rest = lead ? sorted.filter((story) => story !== lead) : [];
  return { lead, top: rest.slice(0, 3), rest };
}
