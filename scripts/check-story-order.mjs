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
assert.equal(live.lead.slug, "asian-para-games-2026-mona-agarwal-nishad-kumar-gold-day1");
assert.deepEqual(top5.slice(0, 3), [
  "asian-para-games-2026-mona-agarwal-nishad-kumar-gold-day1",
  "isro-lme1100-lox-methane-gas-generator-first-ignition",
  "tiger-shroff-car-firing-juhu-3-held-kota",
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
assert.equal(top5.includes("us-ofac-sanctions-mumbai-firms-iran-oil"), false);
assert.equal(top5.includes("mt-gem-no2-sharjah-22-indians-safe"), false);
assert.equal(top5.includes("mamata-banerjee-detained-delhi-south-avenue-dharna"), false);
assert.equal(top5.includes("tahir-hussain-convicted-abetment-dayalpur-riots-case-12-acquitted"), false);
assert.equal(top5.includes("cjp-leaders-dipke-das-ranka-released-after-preventive-detention"), false);
assert.equal(top5.includes("india-rejects-un-rights-office-concern-delhi-detentions"), false);
assert.equal(top5.includes("sc-delhi-barricades-should-go-unless-warranted"), false);
assert.equal(top5.includes("mumbai-fir-tushar-gandhi-actor-imran-khan-cjp-protest"), false);
assert.equal(top5.includes("manipur-kuki-naga-clashes-9-dead"), false);
assert.equal(top5.includes("pakistan-kp-emergency-governor-rule"), false);
assert.equal(top5.includes("trump-russia-ukraine-energy-ceasefire-claim"), false);
assert.equal(top5.includes("hormuz-petro-dolphin-valthera-2-indians-missing"), false);
assert.equal(top5.includes("kejriwal-aap-fir-bangla-sahib-dsgmc-complaint"), false);
assert.equal(top5.includes("delhi-metro-6-stations-shut-day-after-sc-12-oct"), false);
assert.equal(top5.includes("john-brittas-detained-cp-writes-to-cji-alleges-assault"), false);
assert.equal(top5.includes("jantar-mantar-denotified-protest-site-3-new-venues"), false);
assert.equal(top5.includes("bimol-akoijam-jnu-dismissed-delhi-police-fir"), false);
assert.equal(top5.includes("cjp-leaders-saurav-das-ashutosh-ranka-5-day-judicial-custody-tihar"), false);
assert.equal(top5.includes("mamata-banerjee-kalighat-alleged-knife-attack-claim-civic-volunteer-detained"), false);
assert.equal(top5.includes("germany-bochum-building-fire-3-indians-killed-resident-arrested"), false);
assert.equal(top5.includes("rahul-gandhi-letter-president-dushyant-gautam-sikkim-governor-ankita-bhandari"), false);
assert.equal(top5.includes("ed-detains-amardeep-grewal-delhi-airport-loc"), false);
assert.equal(top5.includes("kota-coaching-toy-gun-assault-police-no-gunfire"), false);
console.log("live lead", live.lead.slug);
console.log("live top5", top5.join(", "));
