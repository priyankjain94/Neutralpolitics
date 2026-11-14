import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const keyFile = fs.readdirSync(path.join(root, "public")).find((name) => /^[a-f0-9]{32}\.txt$/.test(name));
if (!keyFile) {
  console.error("IndexNow key file is missing from public/.");
  process.exit(1);
}
const key = fs.readFileSync(path.join(root, "public", keyFile), "utf8").trim();
const published = JSON.parse(fs.readFileSync(path.join(root, "data", "published.json"), "utf8"));
const host = "www.neutralpolitics.in";
const urls = [
  ...published.en.map((item) => `https://${host}/news/${item}`),
  ...published.hi.map((item) => `https://${host}/hi/news/${item}`),
];
const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host,
    key,
    keyLocation: `https://${host}/${keyFile}`,
    urlList: urls.slice(0, 10000),
  }),
});
console.log(`IndexNow ${response.status} for ${Math.min(urls.length, 10000)} URLs`);
if (!response.ok && response.status !== 202) process.exit(1);
