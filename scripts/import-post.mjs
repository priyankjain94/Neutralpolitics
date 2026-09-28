import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");

const CATEGORIES = [
  "politics",
  "courts",
  "economy",
  "world",
  "sports",
  "defence-security",
  "disasters-weather",
  "law-order",
  "explainers",
  "np-facts",
  "fact-check",
];

const args = process.argv.slice(2);
const inputPath = args.find((arg) => !arg.startsWith("--"));
const outIndex = args.indexOf("--out");
const outRoot = path.resolve(outIndex >= 0 ? args[outIndex + 1] : path.join(process.cwd(), "content", "news"));

if (!inputPath) {
  console.error("Usage: node scripts/import-post.mjs <post.json> [--out content/news]");
  process.exit(1);
}

const postPath = path.resolve(inputPath);
const post = JSON.parse(fs.readFileSync(postPath, "utf8"));
const warnings = [];

if (post.claimed === true || String(post.web_headline || "").startsWith("CLAIMED")) {
  console.log("Skipped. CLAIMED rows do not become articles.");
  process.exit(0);
}
if (!post.ig_shortcode) {
  console.error("Refusing to import without ig_shortcode.");
  process.exit(1);
}

function readCaption() {
  if (post.caption) return String(post.caption);
  if (!post.caption_file) return "";
  const file = path.resolve(path.dirname(postPath), post.caption_file);
  if (!fs.existsSync(file)) {
    warnings.push(`Missing caption file ${post.caption_file}`);
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function captionStory(caption) {
  const kept = [];
  for (const raw of caption.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (/^sources:/i.test(line)) break;
    if (/^photo:/i.test(line)) continue;
    if (/^#[^\s#]/.test(line)) continue;
    kept.push(line);
  }
  return kept.join("\n\n");
}

function normaliseCategory(value) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  const aliases = {
    "defence-and-security": "defence-security",
    defence: "defence-security",
    disasters: "disasters-weather",
    weather: "disasters-weather",
    "law-and-order": "law-order",
    "factcheck": "fact-check",
    facts: "np-facts",
  };
  return aliases[slug] || slug;
}

function resolveCategory() {
  const direct = normaliseCategory(post.category);
  if (CATEGORIES.includes(direct)) return direct;
  const pillar = String(post.pillar || "").toLowerCase();
  const pillarMap = { courts: "courts", world: "world", "economy-civic": "economy", politics: "politics", civic: "explainers", explainer: "explainers" };
  if (pillarMap[pillar]) return pillarMap[pillar];
  const text = `${post.web_headline || ""} ${(post.tags || []).join(" ")} ${post.summary || ""}`.toLowerCase();
  const pkg = String(post.package_category || "");
  if (pkg === "civic-explainer") return "explainers";
  if (pkg === "politics-world") return /trump|china|russia|unsc|unga|pakistan/.test(text) ? "world" : "politics";
  if (/medal|cricket|kohli|football|olympic|asian games/.test(text)) return "sports";
  if (/flood|rain|cyclone|earthquake/.test(text)) return "disasters-weather";
  if (/police|killed|arrested/.test(text)) return "law-order";
  if (/army|iaf|rajnath|missile|border/.test(text)) return "defence-security";
  warnings.push("Category could not be resolved.");
  return null;
}

function sourceGroups(sources) {
  const groups = new Set();
  for (const source of sources) {
    if (!source?.url) continue;
    groups.add(String(source.group || source.outlet || source.url).toLowerCase());
  }
  return groups;
}

function walkExisting() {
  const rows = [];
  if (!fs.existsSync(outRoot)) return rows;
  for (const year of fs.readdirSync(outRoot)) {
    const yearDir = path.join(outRoot, year);
    if (!fs.statSync(yearDir).isDirectory()) continue;
    for (const month of fs.readdirSync(yearDir)) {
      const monthDir = path.join(yearDir, month);
      if (!fs.statSync(monthDir).isDirectory()) continue;
      for (const file of fs.readdirSync(monthDir)) {
        if (!file.endsWith(".json")) continue;
        const full = path.join(monthDir, file);
        rows.push({ file: full, dir: monthDir, year, month, data: JSON.parse(fs.readFileSync(full, "utf8")) });
      }
    }
  }
  return rows;
}

function numbers(text) {
  return new Set([...String(text).matchAll(/₹?\d[\d,]*(?:\.\d+)?%?/g)].map((match) => match[0].replace(/[₹,%]/g, "").replace(/,/g, "")));
}

function checks(english, hindi) {
  const problems = [];
  const enNums = numbers(english);
  const hiNums = numbers(hindi);
  for (const value of enNums) if (!hiNums.has(value)) problems.push(`Missing number ${value}`);
  const glossary = JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "glossary.json"), "utf8"));
  const enLower = english.toLowerCase();
  for (const entry of glossary.entries) {
    if (enLower.includes(entry.en.toLowerCase()) && !hindi.includes(entry.hi)) problems.push(`Glossary miss: ${entry.en}`);
  }
  const ratio = hindi.length / Math.max(english.length, 1);
  if (ratio < 0.8 || ratio > 1.6) problems.push(`Length ratio ${ratio.toFixed(2)}`);
  return problems;
}

const posted = new Date(post.posted_at || Date.now());
const year = String(posted.getFullYear());
const month = String(posted.getMonth() + 1).padStart(2, "0");
const sources = Array.isArray(post.sources) ? post.sources.filter((source) => source?.url && source?.outlet) : [];
const groups = sourceGroups(sources);
const category = resolveCategory();
const headline = String(post.web_headline || "").trim();
const caption = readCaption();
const summary = String(post.summary || captionStory(caption) || "").trim();
if (!headline) warnings.push("Missing headline.");
if (headline.length > 110) warnings.push("Headline is longer than 110 characters.");
if (!summary) warnings.push("Missing story text.");
if (groups.size < 2) warnings.push("Fewer than two independent source groups.");

const existing = walkExisting();
const byShortcode = existing.find((row) => row.data.ig_shortcode === post.ig_shortcode);
const byEvent = post.event_id ? existing.find((row) => row.data.event_id === post.event_id) : undefined;
const prior = byShortcode || byEvent;
if (byShortcode && byEvent && byShortcode.file !== byEvent.file) warnings.push("Shortcode and event_id point at different articles. Shortcode wins.");

let slug = prior?.data.slug || String(post.slug || "story").toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
let destYear = prior?.year || year;
let destMonth = prior?.month || month;
if (!prior) {
  let n = 2;
  while (existing.some((row) => row.year === destYear && row.month === destMonth && row.data.slug === slug)) {
    slug = `${String(post.slug || "story").replace(/-\d+$/, "")}-${n}`;
    n += 1;
  }
}

const providerName = process.env.TRANSLATION_PROVIDER || "none";
const translator = await import(providerName === "http" ? "./translators/http.mjs" : "./translators/none.mjs");
const fields = {
  title: headline || slug,
  standfirst: String(post.standfirst || summary.split("\n")[0] || ""),
  body: summary,
  key_facts: post.key_facts || [],
  sides: post.sides || [],
  not_confirmed: post.not_confirmed || [],
  factcheck_claim: post.factcheck?.claim || "",
  factcheck_evidence: post.factcheck?.evidence || [],
};
const translated = await translator.translate(fields);
const englishBlob = JSON.stringify(fields);
const hindiBlob = JSON.stringify(translated.fields);
const checkProblems = providerName === "none" ? ["Translator is none, so Hindi is still English."] : checks(englishBlob, hindiBlob);
const alwaysDraft = process.env.IMPORT_ALWAYS_DRAFT !== "false";
const forceDraft =
  alwaysDraft ||
  post.publish === "draft" ||
  post.sensitive === true ||
  category === "np-facts" ||
  category === null ||
  groups.size < 2 ||
  !headline ||
  headline.length > 110 ||
  (Array.isArray(post.corrections) && post.corrections.length > 0);
const hindiDraft = forceDraft || checkProblems.length > 0;
const status = forceDraft ? "draft" : "published";
const statusHi = hindiDraft ? "draft" : "published";

const destDir = path.join(outRoot, destYear, destMonth);
fs.mkdirSync(destDir, { recursive: true });
let poster = prior?.data.poster || "/media/sample-poster.svg";
if (post.poster) {
  const sourcePoster = path.resolve(path.dirname(postPath), post.poster);
  if (fs.existsSync(sourcePoster) && fs.statSync(sourcePoster).isFile()) {
    const ext = path.extname(sourcePoster) || ".png";
    const publicDir = path.join(process.cwd(), "public", "media", destYear, destMonth, slug);
    fs.mkdirSync(publicDir, { recursive: true });
    fs.copyFileSync(sourcePoster, path.join(publicDir, `poster${ext}`));
    poster = `/media/${destYear}/${destMonth}/${slug}/poster${ext}`;
  }
}

const importHash = createHash("sha256")
  .update(JSON.stringify({ fields, hindi: translated.fields, sources, category, status, statusHi, warnings, checkProblems }))
  .digest("hex");
if (prior?.data.import_hash === importHash) {
  console.log(`Unchanged ${prior.data.slug} (${post.ig_shortcode}).`);
  process.exit(0);
}

const shared = {
  slug,
  status,
  status_hi: statusHi,
  published_at: prior?.data.published_at || post.posted_at,
  updated_at: prior ? new Date().toISOString() : null,
  category: category || "unresolved",
  secondary: post.secondary || [],
  breaking: Boolean(post.breaking),
  tags: post.tags || [],
  ig_shortcode: post.ig_shortcode,
  ig_url: post.ig_url,
  ig_media_id: post.ig_media_id || null,
  ig_type: post.ig_type || "reel",
  event_id: post.event_id || null,
  follow_up_of: post.follow_up_of || null,
  sources,
  photo_credits: post.photo_credits || [],
  byline: "Neutral Politics Desk",
  corrections: post.corrections || [],
  factcheck: post.factcheck
    ? { verdict: post.factcheck.verdict, claimant: post.factcheck.claimant, claim_date: post.factcheck.claim_date }
    : null,
  sample: Boolean(post.sample),
  poster,
  import_hash: importHash,
  import_warnings: [...warnings, ...checkProblems],
};
if (!prior) shared.updated_at = null;

function articleMd(langFields, extra = {}) {
  const data = {
    title: langFields.title,
    standfirst: langFields.standfirst,
    key_facts: langFields.key_facts || [],
    sides: langFields.sides || [],
    not_confirmed: langFields.not_confirmed || [],
    ...extra,
  };
  if (langFields.factcheck_claim) {
    data.factcheck_claim = langFields.factcheck_claim;
    data.factcheck_evidence = langFields.factcheck_evidence || [];
  }
  return matter.stringify(String(langFields.body || "").trim() + "\n", data);
}

const enMd = articleMd(fields);
const hiMd = articleMd(translated.fields, {
  translation: {
    engine: translated.engine,
    model: translated.model,
    at: new Date().toISOString(),
    glossary_version: "2026-09-28",
    reviewed_by: null,
    reviewed_at: null,
    status: "machine",
    note: translated.note || "",
  },
});
const jsonText = JSON.stringify(shared, null, 2) + "\n";
const enPath = path.join(destDir, `${slug}.en.md`);
const hiPath = path.join(destDir, `${slug}.hi.md`);
const jsonPath = path.join(destDir, `${slug}.json`);
fs.writeFileSync(jsonPath, jsonText);
fs.writeFileSync(enPath, enMd);
fs.writeFileSync(hiPath, hiMd);
console.log(`${prior ? "Updated" : "Wrote"} ${path.relative(process.cwd(), jsonPath)} status=${status} hindi=${statusHi}`);
if (shared.import_warnings.length) console.log(shared.import_warnings.map((item) => `- ${item}`).join("\n"));
