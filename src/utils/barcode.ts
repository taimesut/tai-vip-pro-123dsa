import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

const SUPPORTED_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.ITF,
];

const QR_FIRST_FORMATS = [BarcodeFormat.QR_CODE, BarcodeFormat.DATA_MATRIX];

const NATIVE_FORMATS = [
  "qr_code",
  "code_128",
  "code_39",
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "data_matrix",
  "itf",
];

const MAX_CANVAS_EDGE = 2200;
const TILE_EDGE = 1600;
const TILE_FRACTION = 0.62;

type NativeBarcode = { rawValue?: string };

interface NativeBarcodeDetector {
  detect(source: CanvasImageSource): Promise<NativeBarcode[]>;
}

interface NativeBarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): NativeBarcodeDetector;
  getSupportedFormats?: () => Promise<string[]>;
}

type BarcodeDetectorGlobal = typeof globalThis & {
  BarcodeDetector?: NativeBarcodeDetectorConstructor;
};

const createReader = (formats: BarcodeFormat[]) => {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints);
};

const qrReader = createReader(QR_FIRST_FORMATS);
const multiReader = createReader(SUPPORTED_FORMATS);

const normalizeDecodedValue = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const tryZxingUrl = async (
  reader: BrowserMultiFormatReader,
  imageUrl: string,
): Promise<string | null> => {
  try {
    return normalizeDecodedValue((await reader.decodeFromImageUrl(imageUrl)).getText());
  } catch {
    return null;
  }
};

const loadImage = (file: File): Promise<{ image: HTMLImageElement; url: string }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve({ image, url });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể mở ảnh đã chọn."));
    };
    image.src = url;
  });

const createCanvas = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const renderCrop = (
  image: HTMLImageElement,
  crop: CropRect,
  maxEdge: number,
  paddingRatio = 0.04,
): HTMLCanvasElement => {
  const sourceMax = Math.max(crop.width, crop.height);
  const preferredScale =
    sourceMax < 1200 ? Math.min(2.5, 1200 / Math.max(1, sourceMax)) : 1;
  const scale = Math.min(preferredScale, maxEdge / Math.max(1, sourceMax));
  const contentWidth = Math.max(1, Math.round(crop.width * scale));
  const contentHeight = Math.max(1, Math.round(crop.height * scale));
  const padding = Math.max(10, Math.round(Math.min(contentWidth, contentHeight) * paddingRatio));
  const canvas = createCanvas(contentWidth + padding * 2, contentHeight + padding * 2);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");

  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    padding,
    padding,
    contentWidth,
    contentHeight,
  );
  return canvas;
};

const cloneCanvas = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = createCanvas(source.width, source.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh.");
  context.drawImage(source, 0, 0);
  return canvas;
};

const autoContrastGrayscale = (source: HTMLCanvasElement): HTMLCanvasElement => {
  const canvas = cloneCanvas(source);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const histogram = new Uint32Array(256);
  const luminance = new Uint8Array(canvas.width * canvas.height);

  for (let pixel = 0, offset = 0; offset < data.length; pixel += 1, offset += 4) {
    const value = Math.max(
      0,
      Math.min(
        255,
        Math.round(data[offset] * 0.299 + data[offset + 1] * 0.587 + data[offset + 2] * 0.114),
      ),
    );
    luminance[pixel] = value;
    histogram[value] += 1;
  }

  const total = luminance.length;
  const clipCount = Math.max(1, Math.floor(total * 0.01));
  let low = 0;
  let high = 255;
  let accumulated = 0;

  for (let value = 0; value < 256; value += 1) {
    accumulated += histogram[value];
    if (accumulated >= clipCount) {
      low = value;
      break;
    }
  }

  accumulated = 0;
  for (let value = 255; value >= 0; value -= 1) {
    accumulated += histogram[value];
    if (accumulated >= clipCount) {
      high = value;
      break;
    }
  }

  const range = Math.max(1, high - low);
  for (let pixel = 0, offset = 0; offset < data.length; pixel += 1, offset += 4) {
    const value = Math.max(
      0,
      Math.min(255, Math.round(((luminance[pixel] - low) * 255) / range)),
    );
    data[offset] = value;
    data[offset + 1] = value;
    data[offset + 2] = value;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
};

const calculateOtsuThreshold = (source: HTMLCanvasElement): number => {
  const context = source.getContext("2d", { willReadFrequently: true });
  if (!context) return 128;
  const { data } = context.getImageData(0, 0, source.width, source.height);
  const histogram = new Uint32Array(256);

  for (let offset = 0; offset < data.length; offset += 4) {
    histogram[data[offset]] += 1;
  }

  const total = source.width * source.height;
  let sum = 0;
  for (let value = 0; value < 256; value += 1) sum += value * histogram[value];

  let backgroundWeight = 0;
  let backgroundSum = 0;
  let bestVariance = -1;
  let threshold = 128;

  for (let value = 0; value < 256; value += 1) {
    backgroundWeight += histogram[value];
    if (backgroundWeight === 0) continue;
    const foregroundWeight = total - backgroundWeight;
    if (foregroundWeight === 0) break;

    backgroundSum += value * histogram[value];
    const backgroundMean = backgroundSum / backgroundWeight;
    const foregroundMean = (sum - backgroundSum) / foregroundWeight;
    const variance =
      backgroundWeight *
      foregroundWeight *
      (backgroundMean - foregroundMean) *
      (backgroundMean - foregroundMean);

    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = value;
    }
  }

  return threshold;
};

const thresholdCanvas = (
  source: HTMLCanvasElement,
  invert = false,
): HTMLCanvasElement => {
  const canvas = cloneCanvas(source);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return canvas;
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const threshold = calculateOtsuThreshold(source);

  for (let offset = 0; offset < imageData.data.length; offset += 4) {
    const isLight = imageData.data[offset] > threshold;
    const value = (invert ? !isLight : isLight) ? 255 : 0;
    imageData.data[offset] = value;
    imageData.data[offset + 1] = value;
    imageData.data[offset + 2] = value;
  }

  context.putImageData(imageData, 0, 0);
  return canvas;
};

const buildCropRects = (width: number, height: number): CropRect[] => {
  const full: CropRect = { x: 0, y: 0, width, height };
  const tileWidth = Math.max(1, Math.round(width * TILE_FRACTION));
  const tileHeight = Math.max(1, Math.round(height * TILE_FRACTION));
  const maxX = Math.max(0, width - tileWidth);
  const maxY = Math.max(0, height - tileHeight);
  const tiles = [
    { x: 0, y: 0, width: tileWidth, height: tileHeight },
    { x: maxX, y: 0, width: tileWidth, height: tileHeight },
    { x: 0, y: maxY, width: tileWidth, height: tileHeight },
    { x: maxX, y: maxY, width: tileWidth, height: tileHeight },
  ];

  return [
    full,
    {
      x: Math.round(width * 0.1),
      y: Math.round(height * 0.1),
      width: Math.round(width * 0.8),
      height: Math.round(height * 0.8),
    },
    ...tiles,
  ];
};

const canvasToUrl = (canvas: HTMLCanvasElement): string =>
  canvas.toDataURL("image/png");

const tryNativeDetector = async (
  source: CanvasImageSource,
): Promise<string | null> => {
  const Detector = (globalThis as BarcodeDetectorGlobal).BarcodeDetector;
  if (!Detector) return null;

  try {
    let formats = NATIVE_FORMATS;
    if (Detector.getSupportedFormats) {
      const supported = await Detector.getSupportedFormats();
      formats = NATIVE_FORMATS.filter((format) => supported.includes(format));
    }
    if (formats.length === 0) return null;

    const detector = new Detector({ formats });
    const detected = await detector.detect(source);
    for (const barcode of detected) {
      const value = normalizeDecodedValue(barcode.rawValue);
      if (value) return value;
    }
  } catch {
    // Native BarcodeDetector is an optimization only; ZXing remains the fallback.
  }

  return null;
};

const decodeCanvasVariants = async (
  source: HTMLCanvasElement,
  includeInverted: boolean,
): Promise<string | null> => {
  const native = await tryNativeDetector(source);
  if (native) return native;

  const grayscale = autoContrastGrayscale(source);
  const binary = thresholdCanvas(grayscale);
  const variants = includeInverted
    ? [source, grayscale, binary, thresholdCanvas(grayscale, true)]
    : [source, grayscale, binary];

  const urls = variants.map(canvasToUrl);

  for (const url of urls) {
    const qrValue = await tryZxingUrl(qrReader, url);
    if (qrValue) return qrValue;
  }

  for (const url of urls) {
    const value = await tryZxingUrl(multiReader, url);
    if (value) return value;
  }

  return null;
};

export async function decodeBarcodeImage(file: File): Promise<string> {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Tệp đã chọn không phải là ảnh.");
  }

  const { image, url } = await loadImage(file);
  try {
    const nativeOriginal = await tryNativeDetector(image);
    if (nativeOriginal) return nativeOriginal;

    const directQr = await tryZxingUrl(qrReader, url);
    if (directQr) return directQr;

    const directAny = await tryZxingUrl(multiReader, url);
    if (directAny) return directAny;

    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) {
      throw new Error("Ảnh không có kích thước hợp lệ.");
    }

    const crops = buildCropRects(width, height);
    for (let index = 0; index < crops.length; index += 1) {
      const crop = crops[index];
      const canvas = renderCrop(
        image,
        crop,
        index <= 1 ? MAX_CANVAS_EDGE : TILE_EDGE,
        index === 0 ? 0.03 : 0.06,
      );
      const value = await decodeCanvasVariants(canvas, index <= 1);
      if (value) return value;
    }

    throw new Error("Không đọc được mã QR/Barcode trong ảnh này.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
