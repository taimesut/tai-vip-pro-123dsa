import { rmSync } from "node:fs";
import { resolve } from "node:path";

const generatedPaths = [
  "dist",
  "dist-ssr",
  "gas-dist",
  "launcher-dist",
  "scanner-dist",
  "firefox-dist",
  "userscript-dist",
  "ops-fte-firefox.zip",
  "ops-fte-firefox.xpi",
];

for (const path of generatedPaths) {
  rmSync(resolve(path), { recursive: true, force: true });
}

console.log("Cleaned generated OPS-FTE artifacts.");
