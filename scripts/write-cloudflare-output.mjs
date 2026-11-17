import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "out");
if (!fs.existsSync(out)) {
  console.error("Missing out/. Run the static build first.");
  process.exit(1);
}

const routes = {
  version: 1,
  include: ["/*"],
  exclude: [
    "/_next/static/*",
    "/media/*",
    "/brand/*",
    "/pagefind/*",
    "/favicon.ico",
    "/favicon.svg",
    "/robots.txt",
    "/rss.xml",
    "/hi/rss.xml",
    "/sitemap.xml",
    "/sitemap-pages.xml",
    "/news-sitemap.xml",
    "/category/*/rss.xml",
    "/hi/category/*/rss.xml",
  ],
};
routes.exclude.push(
  "/opengraph-image",
  "/hi/opengraph-image",
  "/news/*/*/*/opengraph-image",
  "/hi/news/*/*/*/opengraph-image",
);
fs.writeFileSync(path.join(out, "_routes.json"), JSON.stringify(routes, null, 2) + "\n");

function renameOg(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) {
      renameOg(file);
      continue;
    }
    if (!name.startsWith("opengraph-image-")) continue;
    const dest = path.join(dir, "opengraph-image");
    fs.renameSync(file, dest);
  }
}
renameOg(out);

const headers = `/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/media/*
  Cache-Control: public, max-age=86400

/pagefind/*
  Cache-Control: public, max-age=3600

/opengraph-image
  Content-Type: image/png
/hi/opengraph-image
  Content-Type: image/png
/news/*/*/*/opengraph-image
  Content-Type: image/png
/hi/news/*/*/*/opengraph-image
  Content-Type: image/png
`;
fs.writeFileSync(path.join(out, "_headers"), headers);

const secretNames = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_SESSION_SECRET",
  "R2_SECRET_ACCESS_KEY",
  "TURNSTILE_SECRET_KEY",
];
const banned = secretNames.map((name) => process.env[name] || "").filter((value) => value.length >= 8);
const skip = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".woff", ".woff2", ".ttf"]);
let html = 0;
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    const stat = fs.statSync(file);
    if (stat.isDirectory()) {
      walk(file);
      continue;
    }
    if (name.endsWith(".html")) html += 1;
    if (skip.has(path.extname(name).toLowerCase()) || !banned.length) continue;
    const text = fs.readFileSync(file);
    for (const secret of banned) {
      if (text.includes(Buffer.from(secret))) {
        console.error(`Refusing to leave a secret in ${path.relative(root, file)}`);
        process.exit(1);
      }
    }
  }
}
walk(out);
console.log(`Cloudflare output: ${html} HTML files in out/`);
