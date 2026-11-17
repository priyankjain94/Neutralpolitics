import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const hold = path.join(root, ".static-hold");
const moves = [
  [path.join(root, "app", "api"), path.join(hold, "api")],
  [path.join(root, "app", "(admin)"), path.join(hold, "admin")],
];

function restore() {
  for (const [src, parked] of moves) {
    if (fs.existsSync(parked) && !fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(src), { recursive: true });
      fs.renameSync(parked, src);
    }
  }
}

function park() {
  fs.mkdirSync(hold, { recursive: true });
  restore();
  for (const [src, parked] of moves) {
    if (!fs.existsSync(src)) throw new Error(`Missing ${path.relative(root, src)}`);
    if (fs.existsSync(parked)) throw new Error(`Static hold already contains ${path.relative(root, parked)}`);
    fs.renameSync(src, parked);
  }
}

function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, NP_STATIC: "1" },
  });
  return result.status ?? 1;
}

let code = 1;
const stop = () => {
  restore();
  process.exit(1);
};
process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  park();
  code = run([path.join(root, "node_modules", "next", "dist", "bin", "next"), "build"]);
  if (code === 0) code = run([path.join(root, "scripts", "copy-layout-css.mjs")]);
  if (code === 0) code = run([path.join(root, "scripts", "write-cloudflare-output.mjs")]);
  if (code === 0) code = run([path.join(root, "scripts", "write-hostinger-output.mjs")]);
  if (code === 0) code = run(["--experimental-strip-types", "--import", "./scripts/register-ts-hooks.mjs", path.join(root, "scripts", "check-host-gate.mjs")]);
  if (code === 0 && process.env.INDEXNOW_PING === "1") {
    const ping = run([path.join(root, "scripts", "ping-indexnow-build.mjs")]);
    if (ping !== 0) console.warn("IndexNow ping did not complete. The static files are still built.");
  }
} finally {
  restore();
}

process.exit(code);
