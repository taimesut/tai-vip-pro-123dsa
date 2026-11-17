import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const defaultUserscriptVersion = "0.4.2";
const userscriptVersion =
  process.env.OPS_FTE_USERSCRIPT_VERSION?.trim() || defaultUserscriptVersion;

const releaseBaseUrl = "https://github.com/taimesut/tai-vip-pro-123dsa/releases/latest/download";

const metadata = `// ==UserScript==
// @name         OPS FTE
// @namespace    https://github.com/taimesut/OPS-FTE
// @version      ${userscriptVersion}
// @updateURL    ${releaseBaseUrl}/ops-fte.meta.js
// @downloadURL  ${releaseBaseUrl}/ops-fte.user.js
// @description  OPS FTE chạy trực tiếp trong SPX bằng phiên đăng nhập hiện tại
// @match        https://spx.shopee.vn/*
// @match        https://*.spx.shopee.vn/*
// @run-at       document-idle
// @inject-into  page
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// @connect      docs.google.com
// @connect      accounts.google.com
// @connect      license.nguyenthanhtaiabcxyz.workers.dev
// @connect      api.github.com
// ==/UserScript==`;

const runtimeShim =
  `var process = globalThis.process || { env: { NODE_ENV: "production" } };`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "__OPS_FTE_APP_VERSION__": JSON.stringify(userscriptVersion),
  },
  build: {
    outDir: "userscript-dist",
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: "src/userscript.tsx",
      name: "OpsFteUserscript",
      formats: ["iife"],
      fileName: () => "ops-fte.user.js",
    },
    rollupOptions: {
      output: {
        banner: `${metadata}\n${runtimeShim}`,
        inlineDynamicImports: true,
      },
    },
  },
});
