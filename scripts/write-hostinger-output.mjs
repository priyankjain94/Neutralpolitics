import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "out");
const src = path.join(root, "hostinger");

if (!fs.existsSync(out)) {
  console.error("Missing out/. Run the static build first.");
  process.exit(1);
}

function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    const srcPath = path.join(from, name);
    const destPath = path.join(to, name);
    if (fs.statSync(srcPath).isDirectory()) copyDir(srcPath, destPath);
    else copyFile(srcPath, destPath);
  }
}

copyFile(path.join(src, ".htaccess"), path.join(out, ".htaccess"));
copyFile(path.join(src, "robots-preview.txt"), path.join(out, "robots-preview.txt"));
copyDir(path.join(src, "api"), path.join(out, "api"));
copyDir(path.join(src, "admin"), path.join(out, "admin"));

const publishedSrc = path.join(root, "data", "published.json");
if (fs.existsSync(publishedSrc)) {
  copyFile(publishedSrc, path.join(out, "admin", "_data", "published.json"));
}

function renameOg(dir) {
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name);
    if (fs.statSync(file).isDirectory()) {
      renameOg(file);
      continue;
    }
    if (!name.startsWith("opengraph-image-")) continue;
    fs.renameSync(file, path.join(dir, "opengraph-image"));
  }
}
renameOg(out);

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

const required = [".htaccess", "api/error-reports.php", "api/_lib.php", "admin/index.php", "robots-preview.txt"];
for (const rel of required) {
  if (!fs.existsSync(path.join(out, rel))) {
    console.error(`Hostinger output is missing ${rel}`);
    process.exit(1);
  }
}

console.log(`Hostinger output: ${html} HTML files in out/, plus .htaccess and PHP endpoints`);
