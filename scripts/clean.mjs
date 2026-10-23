import { rmSync } from "node:fs";
import { resolve } from "node:path";

const generatedPaths = [
  "dist",
  "dist-ssr",
  "gas-dist",
  "launcher-dist",
  "scanner-dist",
  "userscript-dist",
];

for (const path of generatedPaths) {
  rmSync(resolve(path), { recursive: true, force: true });
}

console.log("Cleaned generated OPS-FTE artifacts.");
