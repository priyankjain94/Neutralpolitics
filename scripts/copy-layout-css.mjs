import fs from "fs";
import path from "path";

function patch(root) {
  if (!fs.existsSync(root)) return;
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
    console.warn("copy-layout-css: no layout.css was emitted in", root);
    return;
  }
  for (const group of groups) {
    const dest = path.join(root, group, "layout.css");
    if (!fs.existsSync(dest) || fs.statSync(dest).size === 0) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(source, dest);
      console.log("copy-layout-css: wrote", dest);
    }
  }
}

patch(path.join(".next", "static", "css", "app"));
patch(path.join("out", "_next", "static", "css", "app"));
