import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const matter = require("gray-matter");
const root = process.cwd();
const newsDir = path.join(root, "content", "news");
const outDir = path.join(root, "search-out");
const categories = new Set([
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
]);

function walk() {
  const found = [];
  for (const year of fs.readdirSync(newsDir)) {
    const yearDir = path.join(newsDir, year);
    if (!fs.statSync(yearDir).isDirectory()) continue;
    for (const month of fs.readdirSync(yearDir)) {
      const monthDir = path.join(yearDir, month);
      if (!fs.statSync(monthDir).isDirectory()) continue;
      for (const file of fs.readdirSync(monthDir)) {
        if (!file.endsWith(".json")) continue;
        const slug = file.replace(/\.json$/, "");
        const shared = JSON.parse(fs.readFileSync(path.join(monthDir, file), "utf8"));
        if (!categories.has(shared.category)) continue;
        for (const lang of ["en", "hi"]) {
          const mdPath = path.join(monthDir, `${slug}.${lang}.md`);
          if (!fs.existsSync(mdPath)) continue;
          const parsed = matter(fs.readFileSync(mdPath, "utf8"));
          const status = lang === "hi" ? shared.status_hi || shared.status : shared.status;
          found.push({
            lang,
            year,
            month,
            slug,
            status: status === "published" ? "published" : "draft",
            title: String(parsed.data.title || slug),
            standfirst: String(parsed.data.standfirst || ""),
            body: parsed.content,
            category: shared.category,
          });
        }
      }
    }
  }
  return found;
}

function esc(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const articles = walk();
fs.rmSync(outDir, { recursive: true, force: true });
const published = { en: [], hi: [], draft: [] };
for (const article of articles) {
  const key = `${article.year}/${article.month}/${article.slug}`;
  if (article.status !== "published") {
    if (!published.draft.includes(key)) published.draft.push(key);
    continue;
  }
  published[article.lang].push(key);
  const urlDir =
    article.lang === "hi"
      ? path.join(outDir, "hi", "news", article.year, article.month, article.slug)
      : path.join(outDir, "news", article.year, article.month, article.slug);
  fs.mkdirSync(urlDir, { recursive: true });
  const html = `<!doctype html>
<html lang="${article.lang}">
  <head>
    <title>${esc(article.title)}</title>
    <meta name="description" content="${esc(article.standfirst)}" />
  </head>
  <body>
    <article data-pagefind-body>
      <h1>${esc(article.title)}</h1>
      <div data-pagefind-filter="section">${esc(article.category)}</div>
      <div data-pagefind-filter="month">${esc(`${article.year}-${article.month}`)}</div>
      <p>${esc(article.standfirst)}</p>
      <div>${esc(article.body)}</div>
    </article>
  </body>
</html>`;
  fs.writeFileSync(path.join(urlDir, "index.html"), html);
}

const dataDir = path.join(root, "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "published.json"), JSON.stringify(published, null, 2) + "\n");

const bin = path.join(root, "node_modules", ".bin", "pagefind");
const result = spawnSync(bin, ["--site", outDir, "--output-path", path.join(root, "public", "pagefind")], {
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status || 1);
if (published.en.length < 4 || published.hi.length < 4 || published.draft.length < 1) {
  console.error("Expected published stories in both languages and at least one draft.");
  process.exit(1);
}
console.log(`Indexed ${published.en.length} English and ${published.hi.length} Hindi stories. Drafts excluded: ${published.draft.length}.`);
