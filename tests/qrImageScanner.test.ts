import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("embedded QR reader uses image upload only", async () => {
  const source = await readFile(
    new URL("../src/components/EmbeddedQRScanner.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /decodeBarcodeImage/);
  assert.match(source, /accept="image\/\*"/);
  assert.match(source, /không mở camera và không quét realtime/);
  assert.doesNotMatch(source, /getUserMedia|requestCameraStream|decodeFromStream/);
  assert.doesNotMatch(source, /<QRScanner/);
});

test("standalone scanner reads selected images without a live camera", async () => {
  const [script, html] = await Promise.all([
    readFile(new URL("../src/scanner.ts", import.meta.url), "utf8"),
    readFile(new URL("../scanner.html", import.meta.url), "utf8"),
  ]);

  assert.match(script, /decodeBarcodeImage/);
  assert.doesNotMatch(script, /getUserMedia|decodeFromStream|MediaStream/);
  assert.match(html, /type="file"/);
  assert.match(html, /accept="image\/\*"/);
  assert.doesNotMatch(html, /<video|id="camera"|Đổi camera|zoom|torch/i);
});
