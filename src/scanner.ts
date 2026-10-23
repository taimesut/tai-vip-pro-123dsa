import "./scanner.css";
import { decodeBarcodeImage } from "./utils/barcode";

const statusText = document.querySelector<HTMLElement>("#status")!;
const closeButton = document.querySelector<HTMLButtonElement>("#close")!;
const selectImageButton = document.querySelector<HTMLButtonElement>("#select-image")!;
const takePhotoButton = document.querySelector<HTMLButtonElement>("#take-photo")!;
const imageInput = document.querySelector<HTMLInputElement>("#image-input")!;
const cameraInput = document.querySelector<HTMLInputElement>("#camera-input")!;

const params = new URLSearchParams(location.search);
const embeddedMode = params.get("embedded") === "1";

interface ScannerSession {
  requestId: string;
  targetOrigin: string;
}

interface StartMessage {
  type?: string;
  requestId?: string;
  targetOrigin?: string;
}

let session: ScannerSession | null = null;
let active = false;
let decoding = false;

function normalizeOrigin(value: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : "";
  } catch {
    return "";
  }
}

function getMessageTarget() {
  if (embeddedMode) return window.parent;
  return window.opener;
}

function postMessage(type: string, extra: Record<string, unknown> = {}) {
  const target = getMessageTarget();
  if (!target || !session) return;
  target.postMessage(
    { type, requestId: session.requestId, ...extra },
    session.targetOrigin,
  );
}

function closeWindowIfPopup() {
  if (!embeddedMode) window.close();
}

function setInputsDisabled(disabled: boolean) {
  selectImageButton.disabled = disabled;
  takePhotoButton.disabled = disabled;
}

function setReadyState() {
  decoding = false;
  setInputsDisabled(false);
  statusText.textContent = "Chọn ảnh có sẵn hoặc chụp ảnh mới để đọc mã.";
}

function stopActiveSession() {
  active = false;
  decoding = false;
  setInputsDisabled(true);
  imageInput.value = "";
  cameraInput.value = "";
}

function cancelSession() {
  if (!session) {
    closeWindowIfPopup();
    return;
  }
  stopActiveSession();
  postMessage("LH_TRIP_SCANNER_CANCEL");
  closeWindowIfPopup();
}

function finish(value?: string) {
  if (!active || !session) return;
  const normalizedValue = value?.trim();
  if (!normalizedValue) return;

  stopActiveSession();
  try {
    navigator.vibrate?.(100);
  } catch {
    // Vibration is optional.
  }
  postMessage("LH_TRIP_SCAN_RESULT", { value: normalizedValue });
  closeWindowIfPopup();
}

async function handleSelectedImage(file: File) {
  if (!active || decoding) return;

  decoding = true;
  setInputsDisabled(true);
  statusText.textContent = "Đang đọc mã từ ảnh...";

  try {
    const value = await decodeBarcodeImage(file);
    finish(value);
  } catch {
    if (!active) return;
    setReadyState();
    statusText.textContent =
      "Không tìm thấy mã QR/Barcode. Hãy chọn hoặc chụp ảnh rõ hơn rồi thử lại.";
  }
}

function bindInput(button: HTMLButtonElement, input: HTMLInputElement) {
  button.addEventListener("click", () => {
    if (!active || decoding) return;
    input.click();
  });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    input.value = "";
    if (file) void handleSelectedImage(file);
  });
}

function activateSession() {
  active = true;
  setReadyState();
  postMessage("LH_TRIP_SCANNER_READY");
}

function startSession(data: StartMessage, eventOrigin: string) {
  const targetOrigin = normalizeOrigin(data.targetOrigin ?? null);
  if (!targetOrigin || eventOrigin !== targetOrigin || !data.requestId?.trim()) return;

  session = { requestId: data.requestId, targetOrigin };
  activateSession();
}

function handleParentMessage(event: MessageEvent<unknown>) {
  const expectedSource = getMessageTarget();
  if (!expectedSource || event.source !== expectedSource) return;
  if (!event.data || typeof event.data !== "object") return;

  const data = event.data as StartMessage;
  if (embeddedMode && data.type === "LH_TRIP_SCANNER_START") {
    startSession(data, event.origin);
    return;
  }

  if (!session || event.origin !== session.targetOrigin || data.requestId !== session.requestId) {
    return;
  }

  if (data.type === "LH_TRIP_SCANNER_STOP") {
    stopActiveSession();
    statusText.textContent = "Đang chờ kết nối với ứng dụng...";
  }
}

bindInput(selectImageButton, imageInput);
bindInput(takePhotoButton, cameraInput);
closeButton.addEventListener("click", cancelSession);
window.addEventListener("message", handleParentMessage);

const initialRequestId = params.get("requestId") || "";
const initialTargetOrigin = normalizeOrigin(params.get("targetOrigin"));
if (!embeddedMode && initialRequestId && initialTargetOrigin) {
  session = { requestId: initialRequestId, targetOrigin: initialTargetOrigin };
  activateSession();
} else {
  setInputsDisabled(true);
  statusText.textContent = "Đang chờ kết nối với ứng dụng...";
}
