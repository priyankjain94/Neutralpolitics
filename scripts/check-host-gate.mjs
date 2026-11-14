import assert from "node:assert/strict";
import { articleRedirect, searchQueryNoindex, shouldNoindexHost } from "../lib/host-gate.ts";

const lists = { en: ["2026/11/live-story"], hi: ["2026/11/live-story"] };
assert.equal(articleRedirect("/news/2026/11/live-story", lists), null);
assert.equal(articleRedirect("/news/2026/11/live-story/", lists), null);
assert.equal(articleRedirect("/hi/news/2026/11/live-story", lists), null);
assert.equal(articleRedirect("/news/2026/11/not-yet", lists), "/?notice=en-soon");
assert.equal(articleRedirect("/hi/news/2026/11/not-yet/", lists), "/hi?notice=hi-soon");
assert.equal(articleRedirect("/category/world", lists), null);
assert.equal(shouldNoindexHost("www.neutralpolitics.in"), false);
assert.equal(shouldNoindexHost("neutralpolitics.vercel.app"), true);
assert.equal(shouldNoindexHost("neutralpolitics.pages.dev"), true);
assert.equal(shouldNoindexHost("localhost"), true);
assert.equal(searchQueryNoindex("/search", new URLSearchParams("q=budget")), true);
assert.equal(searchQueryNoindex("/hi/search/", new URLSearchParams("q=1")), true);
assert.equal(searchQueryNoindex("/search", new URLSearchParams()), false);
console.log("host-gate ok");
