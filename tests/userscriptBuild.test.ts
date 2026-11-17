import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path: string) =>
  readFile(new URL(path, import.meta.url), "utf8");

test("userscript metadata is self-contained for manual Violentmonkey install", async () => {
  const source = await readSource("../vite.userscript.config.ts");
  assert.match(source, /OPS_FTE_USERSCRIPT_VERSION/);
  assert.match(source, /fileName:\s*\(\) => "ops-fte\.user\.js"/);
  assert.match(source, /@grant\s+GM_xmlhttpRequest/);
  assert.match(source, /@updateURL\s+\$\{releaseBaseUrl\}\/ops-fte\.meta\.js/);
  assert.match(source, /@downloadURL\s+\$\{releaseBaseUrl\}\/ops-fte\.user\.js/);
  assert.match(source, /tai-vip-pro-123dsa\/releases\/latest\/download/);
  assert.match(source, /@namespace\s+https:\/\/github\.com\/taimesut\/OPS-FTE/);
});

test("userscript opens without License Center or a license key", async () => {
  const [metadata, appSource, userscriptSource, cssSource] = await Promise.all([
    readSource("../vite.userscript.config.ts"),
    readSource("../src/UserscriptApp.tsx"),
    readSource("../src/userscript.tsx"),
    readSource("../src/global.css"),
  ]);

  assert.doesNotMatch(metadata, /license\.nguyenthanhtaiabcxyz\.workers\.dev/);
  assert.doesNotMatch(appSource, /LicenseGate|verifyLicense|activateLicense/);
  assert.match(appSource, /<MobileLayout onRequestClose=\{onRequestClose\}>/);
  assert.doesNotMatch(cssSource, /ops-license-/);

  // The migration removes only stale OPS FTE-specific credentials.
  assert.match(userscriptSource, /clearLegacyLicenseStorage\(\)/);
  for (const key of ["opsFteLicenseKey", "opsFteLicenseDeviceId", "opsFteLicenseCache"]) {
    assert.ok(userscriptSource.includes(key));
  }
  assert.match(userscriptSource, /localStorage\.removeItem\(key\)/);
  assert.doesNotMatch(userscriptSource, /localStorage\.clear\(\)/);
});

test("userscript can call and confirm the Google Apps Script incident webhook", async () => {
  const metadata = await readSource("../vite.userscript.config.ts");
  const submitSource = await readSource("../src/features/incident-report/incidentReportSubmit.ts");
  assert.match(metadata, /@grant\s+GM_xmlhttpRequest/);
  assert.match(metadata, /@connect\s+script\.google\.com/);
  assert.match(metadata, /@connect\s+script\.googleusercontent\.com/);
  assert.match(submitSource, /GM_xmlhttpRequest/);
  assert.match(submitSource, /parseSubmitResult/);
  assert.match(submitSource, /response\.responseText/);
  assert.doesNotMatch(submitSource, /Firefox|browser\.runtime|ops-fte:webhook-post/);
});

test("userscript exposes QR generator and keeps header controls unobstructed", async () => {
  const [userscriptSource, appSource, layoutSource, qrPageSource] = await Promise.all([
    readSource("../src/userscript.tsx"),
    readSource("../src/UserscriptApp.tsx"),
    readSource("../src/layouts/MobileLayout.tsx"),
    readSource("../src/pages/TaoMaQRPage.tsx"),
  ]);
  assert.doesNotMatch(userscriptSource, /const closeButton = document\.createElement/);
  assert.match(userscriptSource, /<UserscriptApp onRequestClose=\{close\}/);
  assert.match(appSource, /path="\/tao-ma-qr"/);
  assert.match(layoutSource, /label: "Tạo mã QR"/);
  assert.match(layoutSource, /<ToggleTheme \/>/);
  assert.match(layoutSource, /aria-label="Đóng OPS FTE"/);
  assert.match(qrPageSource, /react-qr-code/);
  assert.match(qrPageSource, /Tạo mã QR/);
});

test("QR reader offers choose-image and take-photo without realtime scanning", async () => {
  const scannerSource = await readSource("../src/components/EmbeddedQRScanner.tsx");
  assert.match(scannerSource, /Chọn ảnh/);
  assert.match(scannerSource, /Chụp ảnh/);
  assert.match(scannerSource, /capture="environment"/);
  assert.match(scannerSource, /decodeBarcodeImage/);
  assert.doesNotMatch(scannerSource, /getUserMedia|requestCameraStream|decodeFromStream|visibilitychange/);
});

test("GitHub Action is manual-only and uploads one Violentmonkey userscript artifact", async () => {
  const workflow = await readSource("../.github/workflows/build-userscript.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /\bpush:/);
  assert.match(workflow, /node-version:\s*24/);
  assert.match(workflow, /npm run test:userscript/);
  assert.match(workflow, /npm run build:userscript/);
  assert.match(workflow, /userscript-dist\/ops-fte\.user\.js/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.doesNotMatch(workflow, /configure-pages|deploy-pages|firefox/i);
});

test("GitHub workflow publishes a versioned release and metadata without auto-build on push", async () => {
  const workflow = await readSource("../.github/workflows/build-userscript.yml");
  assert.match(workflow, /permissions:\n  contents: write/);
  assert.match(workflow, /concurrency:/);
  assert.match(workflow, /gh release view/);
  assert.match(workflow, /gh release create/);
  assert.match(workflow, /ops-fte\.meta\.js/);
  assert.match(workflow, /--latest/);
  assert.doesNotMatch(workflow, /\bpush:/);
});
