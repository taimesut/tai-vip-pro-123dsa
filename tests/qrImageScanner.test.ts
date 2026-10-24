import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("embedded QR reader supports choosing or taking one image", async () => {
  const source = await readFile(
    new URL("../src/components/EmbeddedQRScanner.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /decodeBarcodeImage/);
  assert.match(source, /Chọn ảnh/);
  assert.match(source, /Chụp ảnh/);
  assert.match(source, /capture="environment"/);
  assert.match(source, /accept="image\/\*"/);
  assert.doesNotMatch(source, /getUserMedia|requestCameraStream|decodeFromStream/);
  assert.doesNotMatch(source, /<QRScanner/);
});

test("standalone scanner supports image picker and camera capture without live stream", async () => {
  const [script, html] = await Promise.all([
    readFile(new URL("../src/scanner.ts", import.meta.url), "utf8"),
    readFile(new URL("../scanner.html", import.meta.url), "utf8"),
  ]);
  assert.match(script, /decodeBarcodeImage/);
  assert.doesNotMatch(script, /getUserMedia|decodeFromStream|MediaStream/);
  assert.match(html, /id="image-input"/);
  assert.match(html, /id="camera-input"/);
  assert.match(html, /capture="environment"/);
  assert.match(html, /Chọn ảnh/);
  assert.match(html, /Chụp ảnh/);
  assert.doesNotMatch(html, /<video|id="camera"|Đổi camera|zoom|torch/i);
});

test("image decoder uses native detection plus multi-pass preprocessing and crops", async () => {
  const source = await readFile(
    new URL("../src/utils/barcode.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /BarcodeDetector/);
  assert.match(source, /TRY_HARDER/);
  assert.match(source, /QR_FIRST_FORMATS/);
  assert.match(source, /autoContrastGrayscale/);
  assert.match(source, /calculateOtsuThreshold/);
  assert.match(source, /thresholdCanvas/);
  assert.match(source, /buildCropRects/);
  assert.match(source, /TILE_FRACTION/);
  assert.match(source, /decodeCanvasVariants/);
  assert.match(source, /thresholdCanvas\(grayscale, true\)/);
  assert.doesNotMatch(source, /getUserMedia|decodeFromStream|MediaStream/);
});
