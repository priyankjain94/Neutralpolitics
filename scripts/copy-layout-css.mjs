import fs from "fs";
import path from "path";

const root = ".next/static/css/app";
if (!fs.existsSync(root)) process.exit(0);

const groups = fs.readdirSync(root);
let source = "";
for (const group of groups) {
  const file = path.join(root, group, "layout.css");
  if (fs.existsSync(file) && fs.statSync(file).size > 0) {
    source = file;
    break;
  }
}
if (!source) {
  console.warn("copy-layout-css: no layout.css was emitted");
  process.exit(0);
}

for (const group of groups) {
  const dest = path.join(root, group, "layout.css");
  if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
    fs.copyFileSync(source, dest);
    console.log("copy-layout-css: wrote", dest);
  }
}
