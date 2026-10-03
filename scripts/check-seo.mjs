// node --experimental-strip-types --import ./scripts/register-ts-hooks.mjs scripts/check-seo.mjs
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { isoIst } from "../lib/format.ts";
import { documentTitle, fitDescription, googleSiteVerificationToken } from "../lib/meta-text.ts";
import { indexTopics, pickRelated, storiesForTopic, tagKey } from "../lib/topics.ts";

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

function load(lang) {
  const root = path.join(process.cwd(), "content", "news");
  const articles = [];
  for (const year of fs.readdirSync(root)) {
    const yearDir = path.join(root, year);
    if (!fs.statSync(yearDir).isDirectory()) continue;
    for (const month of fs.readdirSync(yearDir)) {
      const monthDir = path.join(yearDir, month);
      if (!fs.statSync(monthDir).isDirectory()) continue;
      for (const file of fs.readdirSync(monthDir)) {
        if (!file.endsWith(".json")) continue;
        const shared = JSON.parse(fs.readFileSync(path.join(monthDir, file), "utf8"));
        const slug = shared.slug || file.replace(/\.json$/, "");
        const status = lang === "hi" ? shared.status_hi || shared.status || "draft" : shared.status || "draft";
        const mdPath = path.join(monthDir, `${slug}.${lang}.md`);
        if (!fs.existsSync(mdPath)) continue;
        const parsed = matter(fs.readFileSync(mdPath, "utf8"));
        articles.push({
          lang,
          slug,
          year,
          month,
          status: status === "published" ? "published" : "draft",
          title: String(parsed.data.title || slug),
          standfirst: String(parsed.data.standfirst || ""),
          category: shared.category,
          tags: shared.tags || [],
          publishedAt: shared.published_at,
          updatedAt: shared.updated_at || null,
          sources: [],
          factcheck: null,
        });
      }
    }
  }
  return articles;
}

const enAll = load("en");
const hiAll = load("hi");
const en = enAll.filter((article) => article.status === "published");
const hi = hiAll.filter((article) => article.status === "published");
const topics = indexTopics(en);
const drafts = ["sc-ahmedabad-blasts-death-stay", "nia-sonu-barnala-deportation", "delhi-judge-letter-pocso-survivor"];

if (!topics.some((topic) => topic.tag === "SIR" && topic.slugs.length >= 2)) fail("SIR is not a topic");
if (!topics.some((topic) => topic.tag === "AsianGames2026" && topic.slugs.length >= 2)) fail("AsianGames2026 is not a topic");
for (const topic of topics) {
  if (topic.slugs.length < 2) fail(`topic ${topic.tag} has fewer than 2 stories`);
  for (const slug of drafts) {
    if (topic.slugs.includes(slug)) fail(`draft ${slug} listed on ${topic.tag}`);
  }
}
for (const slug of drafts) {
  if (!enAll.some((article) => article.slug === slug && article.status === "draft")) fail(`missing draft ${slug}`);
  if (en.some((article) => article.slug === slug)) fail(`draft published ${slug}`);
}

const seoSource = fs.readFileSync(path.join(process.cwd(), "lib", "seo.ts"), "utf8");
if (!seoSource.includes('name: "Neutral Politics"')) fail("author is not Neutral Politics");
if (seoSource.includes("Neutral Politics Desk")) fail("JSON-LD still names the desk");
if (seoSource.includes("google-site-verification")) fail("verification token hardcoded in seo.ts");
const layout = fs.readFileSync(path.join(process.cwd(), "app", "(en)", "layout.tsx"), "utf8");
if (!layout.includes("NEXT_PUBLIC_GSC_VERIFICATION") && !layout.includes("searchConsoleVerification")) {
  fail("english layout missing verification slot");
}
if (layout.includes("google-site-verification")) fail("verification meta hardcoded in layout");

for (const article of [...en, ...hi]) {
  const title = documentTitle(article.title).absolute;
  const description = fitDescription(article.standfirst);
  if (title.length > 60) fail(`title ${title.length}: ${title}`);
  if (description.length > 155) fail(`description ${description.length}: ${article.slug}`);
  if (!title.endsWith("Neutral Politics")) fail(`title missing site name: ${title}`);
  const related = pickRelated(article, article.lang === "hi" ? hi : en);
  if (related.length < 3 || related.length > 4) fail(`related count ${related.length} for ${article.slug}`);
  if (related.some((item) => item.slug === article.slug || item.status !== "published")) {
    fail(`related includes self or draft for ${article.slug}`);
  }
  const published = isoIst(article.publishedAt);
  const modified = isoIst(article.updatedAt || article.publishedAt);
  if (!published.endsWith("+05:30") || !modified.endsWith("+05:30")) fail(`IST offset ${article.slug}`);
}

const goa = en.find((article) => article.slug === "bombay-hc-goa-sir-form8-hearing");
const relatedGoa = pickRelated(goa, en);
const goaKeys = new Set(goa.tags.map((tag) => tagKey(tag)));
const umbrella = new Set(["india", "teamindia", "neutralpolitics", "npnow"]);
function rank(item) {
  const shared = item.tags.some((tag) => goaKeys.has(tagKey(tag)) && !umbrella.has(tagKey(tag)));
  return (item.category === goa.category ? 2 : 0) + (shared ? 2 : 0);
}
if (rank(relatedGoa[0]) < 1) fail(`lead related is not a category/tag match: ${relatedGoa[0].slug}`);
for (let i = 1; i < relatedGoa.length; i += 1) {
  const prev = rank(relatedGoa[i - 1]);
  const next = rank(relatedGoa[i]);
  if (next > prev) fail("related rank is not descending");
  if (next === prev && Date.parse(relatedGoa[i].publishedAt) > Date.parse(relatedGoa[i - 1].publishedAt)) {
    fail("related date is not newest-first within rank");
  }
}

const sir = storiesForTopic(en, "SIR");
if (sir.length < 2) fail("SIR listing is short");
for (let i = 1; i < sir.length; i += 1) {
  if (Date.parse(sir[i].publishedAt) > Date.parse(sir[i - 1].publishedAt)) fail("SIR topic is not newest first");
}
if (sir.some((article) => drafts.includes(article.slug))) fail("SIR topic includes a draft");
if (relatedGoa[0].slug !== "karnataka-form7-bulk-fir-eci-action") {
  fail(`Goa related lead ${relatedGoa[0].slug}`);
}
const hockey = en.find((article) => article.slug === "asian-games-women-hockey-gold-china");
const relatedHockey = pickRelated(hockey, en);
const hockeySlugs = relatedHockey.map((item) => item.slug);
if (hockeySlugs.some((slug) => ["us-h1b-100k-fee-second-judge-block", "hdfc-bank-anup-bagchi-md-ceo", "putin-valdai-modi-ukraine-ideas"].includes(slug))) {
  fail(`hockey related drifted to other sections: ${hockeySlugs.join(",")}`);
}
if (relatedHockey[0].slug !== "asian-games-panghal-kalkal-golds") fail(`hockey related lead ${relatedHockey[0].slug}`);

const asian = storiesForTopic(en, "AsianGames2026");
if (asian.length < 2) fail("AsianGames2026 listing is short");
if (asian[0].publishedAt < asian[asian.length - 1].publishedAt) fail("Asian Games topic is not newest first");

if (isoIst("2026-10-03T08:25:00+05:30") !== "2026-10-03T08:25:00+05:30") fail("isoIst kept offset wrong");
if (isoIst("2026-10-02T04:20:00Z") !== "2026-10-02T09:50:00+05:30") fail(`isoIst zulu ${isoIst("2026-10-02T04:20:00Z")}`);
if (documentTitle("Short").absolute !== "Short | Neutral Politics") fail("short title");
if (documentTitle("x".repeat(80)).absolute.length > 60) fail("long title cap");
if (fitDescription("y".repeat(200)).length > 155) fail("long description cap");

if (process.env.NEXT_PUBLIC_GSC_VERIFICATION) fail("check ran with a GSC token set");
if (googleSiteVerificationToken() !== undefined) fail("verification token present when unset");
process.env.NEXT_PUBLIC_GSC_VERIFICATION = "  test-token  ";
if (googleSiteVerificationToken() !== "test-token") fail("verification token was not read from the env");
delete process.env.NEXT_PUBLIC_GSC_VERIFICATION;
if (googleSiteVerificationToken() !== undefined) fail("verification token stuck after unset");

if (process.exitCode) console.error("seo check failed");
else {
  console.log(
    `seo ok: ${en.length} stories, ${topics.length} topics, SIR ${topics.find((topic) => topic.tag === "SIR").slugs.length}, AsianGames2026 ${topics.find((topic) => topic.tag === "AsianGames2026").slugs.length}`,
  );
}
