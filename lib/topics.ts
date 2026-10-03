import { publishedTimeMs, sortStories } from "./story-order";
import type { Article } from "./types";

export const TOPIC_MIN_STORIES = 2;

/** Hashtags that mark the desk or the country, not a story-to-story link. */
const RELATED_UMBRELLA_TAGS = new Set(["india", "teamindia", "neutralpolitics", "npnow"]);

function specificTagKeys(tags: string[]): Set<string> {
  return new Set(tags.map((tag) => tagKey(tag)).filter((key) => key && !RELATED_UMBRELLA_TAGS.has(key)));
}

export type Topic = {
  tag: string;
  key: string;
  slugs: string[];
};

export function tagKey(tag: string): string {
  return tag.trim().toLowerCase();
}

export function decodeTag(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function topicPath(tag: string): string {
  return `/topic/${encodeURIComponent(tag)}`;
}

/** Tags that appear on at least two distinct published stories. One slug counts once. */
export function indexTopics(articles: Article[]): Topic[] {
  const seenSlug = new Set<string>();
  const groups = new Map<string, { casings: Map<string, number>; slugs: Set<string> }>();
  for (const article of articles) {
    if (article.status !== "published") continue;
    if (seenSlug.has(article.slug)) continue;
    seenSlug.add(article.slug);
    const used = new Set<string>();
    for (const raw of article.tags) {
      const label = raw.trim();
      if (!label) continue;
      const key = tagKey(label);
      if (used.has(key)) continue;
      used.add(key);
      let group = groups.get(key);
      if (!group) {
        group = { casings: new Map(), slugs: new Set() };
        groups.set(key, group);
      }
      group.casings.set(label, (group.casings.get(label) || 0) + 1);
      group.slugs.add(article.slug);
    }
  }
  const topics: Topic[] = [];
  for (const [key, group] of groups) {
    if (group.slugs.size < TOPIC_MIN_STORIES) continue;
    const tag = [...group.casings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
    topics.push({ tag, key, slugs: [...group.slugs] });
  }
  topics.sort((a, b) => a.tag.localeCompare(b.tag));
  return topics;
}

export function storiesForTopic(articles: Article[], tag: string): Article[] {
  const key = tagKey(decodeTag(tag));
  return sortStories(
    articles.filter(
      (article) => article.status === "published" && article.tags.some((item) => tagKey(item) === key),
    ),
  );
}

/**
 * Up to four other published stories. Same category and a shared specific tag
 * rank together, then newest. Umbrella tags (India, TeamIndia, NeutralPolitics,
 * NPNOW) do not count. The story itself is excluded.
 */
export function pickRelated(article: Article, pool: Article[], limit = 4): Article[] {
  const keys = specificTagKeys(article.tags);
  const scored = pool
    .filter((item) => item.status === "published" && item.slug !== article.slug)
    .map((item) => {
      const sameCategory = item.category === article.category;
      const sharedTag = item.tags.some((tag) => keys.has(tagKey(tag)));
      return {
        item,
        rank: (sameCategory ? 2 : 0) + (sharedTag ? 2 : 0),
        time: publishedTimeMs(item.publishedAt),
      };
    });
  scored.sort((a, b) => b.rank - a.rank || b.time - a.time || a.item.slug.localeCompare(b.item.slug));
  return scored.slice(0, limit).map((row) => row.item);
}
