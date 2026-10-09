import assert from "node:assert/strict";
import { LEAD_MAX_AGE_MS, pickFeatured, sortStories } from "../lib/story-order.ts";

const HOUR = 60 * 60 * 1000;
const now = Date.parse("2026-10-02T04:20:00Z");

function story(slug, hoursAgo, extra = {}) {
  return {
    slug,
    publishedAt: new Date(now - hoursAgo * HOUR).toISOString(),
    breaking: false,
    pinned: false,
    ...extra,
  };
}

const newestWins = pickFeatured(
  [story("old-breaking", 40, { breaking: true }), story("newest", 2), story("middle", 10)],
  now,
);
assert.equal(newestWins.lead.slug, "newest");
assert.deepEqual(newestWins.top.map((item) => item.slug), ["middle", "old-breaking"]);

const freshBreakingLeads = pickFeatured(
  [story("newer-plain", 1), story("fresh-breaking", 5, { breaking: true }), story("old-breaking", 48, { breaking: true })],
  now,
);
assert.equal(freshBreakingLeads.lead.slug, "fresh-breaking");
assert.equal(freshBreakingLeads.top[0].slug, "newer-plain");

const freshPinLeads = pickFeatured(
  [story("newer-plain", 1), story("fresh-pin", 8, { pinned: true })],
  now,
);
assert.equal(freshPinLeads.lead.slug, "fresh-pin");

const stalePinDoesNotLead = pickFeatured(
  [story("newer", 2), story("stale-pin", 37, { pinned: true })],
  now,
);
assert.equal(stalePinDoesNotLead.lead.slug, "newer");

const onlyOld = pickFeatured(
  [story("older-breaking", 80, { breaking: true }), story("less-old", 50)],
  now,
);
assert.equal(onlyOld.lead.slug, "less-old");

const istLater = sortStories([
  { slug: "earlier", publishedAt: "2026-10-01T22:00:00+05:30" },
  { slug: "later", publishedAt: "2026-10-02T07:44:00+05:30" },
]);
assert.equal(istLater[0].slug, "later");
assert.equal(LEAD_MAX_AGE_MS, 36 * HOUR);

const tied = sortStories([
  { slug: "b-slug", publishedAt: "2026-10-02T07:44:00+05:30" },
  { slug: "a-slug", publishedAt: "2026-10-02T07:44:00+05:30" },
]);
assert.deepEqual(tied.map((item) => item.slug), ["a-slug", "b-slug"]);

console.log("story-order checks passed");

import fs from "node:fs";
import path from "node:path";

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith(".json")) acc.push(full);
  }
  return acc;
}

const published = [];
for (const file of walk(path.join(process.cwd(), "content", "news"))) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (data.status !== "published") continue;
  published.push({
    slug: data.slug,
    publishedAt: data.published_at,
    breaking: Boolean(data.breaking),
    pinned: Boolean(data.pinned),
  });
}
const live = pickFeatured(published, Date.parse("2026-10-02T04:20:00Z"));
const top5 = [live.lead, ...live.rest].slice(0, 5).map((item) => item.slug);
assert.deepEqual(live.top.map((item) => item.slug), live.rest.slice(0, 3).map((item) => item.slug));
assert.equal(live.lead.slug, "lucknow-gomti-floods-still-rising");
assert.deepEqual(top5.slice(0, 3), [
  "lucknow-gomti-floods-still-rising",
  "indian-embassy-saudi-advisory-remain-alert-abha-riyadh-attacks",
  "gst-council-57th-meeting-arrest-powers-prosecution-5-crore",
]);
assert.equal(top5.includes("delhi-judge-letter-pocso-survivor"), false);
assert.equal(top5.includes("nia-sonu-barnala-deportation"), false);
assert.equal(top5.includes("sc-ahmedabad-blasts-death-stay"), false);
assert.equal(top5.includes("navpreet-singh-deported-turkiye-custody"), false);
assert.equal(top5.includes("pune-123-girls-kidnap-claim-fake"), false);
assert.equal(top5.includes("cec-sir-protests-mumbai-march-delhi-journalists"), false);
assert.equal(top5.includes("sc-refuses-to-suspend-cec-notice"), false);
assert.equal(top5.includes("hormuz-mt-on-peace-11-indians-injured"), false);
assert.equal(top5.includes("viral-or-verified-4-ec-protest-claims-checked"), false);
assert.equal(top5.includes("delhi-seemapuri-building-collapse"), false);
assert.equal(top5.includes("jantar-mantar-permission-rule-explained-cec-row-firs"), false);
assert.equal(top5.includes("nepal-flood-search-ends-189-indians-missing"), false);
console.log("live lead", live.lead.slug);
console.log("live top5", top5.join(", "));
