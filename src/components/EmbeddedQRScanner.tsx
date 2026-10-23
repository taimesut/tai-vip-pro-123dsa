import { useCallback, useRef, useState } from "react";
import { Camera, ImageUp, LoaderCircle, X } from "lucide-react";
import { showToast } from "./Toast";
import { decodeBarcodeImage } from "../utils/barcode";

export type ScanMode = "lhtrip" | "item";

interface EmbeddedQRScannerProps {
  open: boolean;
  mode: ScanMode | null;
  onScan: (value: string, mode: ScanMode) => void;
  onClose: () => void;
}

export default function EmbeddedQRScanner({
  open,
  mode,
  onScan,
  onClose,
}: EmbeddedQRScannerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const handledScanRef = useRef(false);
  const [decodingImage, setDecodingImage] = useState(false);

  const finishScan = useCallback(
    (rawValue: string) => {
      if (!open || !mode || handledScanRef.current) return;
      const value = rawValue.trim();
      if (!value) return;

      handledScanRef.current = true;
      try {
        navigator.vibrate?.(100);
      } catch {
        // Vibration is optional.
      }

      onScan(value, mode);
      onClose();
    },
    [mode, onClose, onScan, open],
  );

  const handleImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || decodingImage || !mode) return;

    setDecodingImage(true);
    try {
      const value = await decodeBarcodeImage(file);
      finishScan(value);
      showToast("Đã đọc mã từ ảnh.", "success");
    } catch {
      showToast(
        "Không tìm thấy mã QR/Barcode trong ảnh. Hãy chọn hoặc chụp ảnh rõ hơn rồi thử lại.",
        "warning",
      );
    } finally {
      setDecodingImage(false);
    }
  };

  const openInput = (input: HTMLInputElement | null) => {
    if (decodingImage || !input) return;
    handledScanRef.current = false;
    input.click();
  };

  if (!open || !mode) return null;

  const title =
    mode === "lhtrip" ? "Đọc LH Trip / biển số từ ảnh" : "Đọc mã SPX / TO từ ảnh";

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Đọc mã QR hoặc Barcode từ ảnh"
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleImage(event)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handleImage(event)}
      />

      <section className="relative w-full max-w-sm rounded-3xl border border-base-200 bg-base-100 p-5 text-base-content shadow-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-circle btn-ghost absolute right-3 top-3 min-h-11 min-w-11"
          aria-label="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-12">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ImageUp className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-lg font-black">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-base-content/60">
            Chọn ảnh có sẵn hoặc chụp một ảnh mới. OPS FTE chỉ đọc ảnh sau khi
            bạn chọn/chụp xong, không mở camera realtime và không quét liên tục.
          </p>
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={decodingImage}
            onClick={() => openInput(imageInputRef.current)}
            className="btn btn-primary min-h-12 w-full gap-2 rounded-xl font-bold"
          >
            {decodingImage ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <ImageUp className="h-5 w-5" />
            )}
            Chọn ảnh
          </button>

          <button
            type="button"
            disabled={decodingImage}
            onClick={() => openInput(cameraInputRef.current)}
            className="btn btn-outline min-h-12 w-full gap-2 rounded-xl font-bold"
          >
            <Camera className="h-5 w-5" />
            Chụp ảnh
          </button>
        </div>

        {decodingImage ? (
          <p className="mt-3 text-center text-xs font-semibold text-primary">
            Đang đọc mã từ ảnh...
          </p>
        ) : (
          <p className="mt-3 text-center text-xs text-base-content/50">
            Hỗ trợ QR Code, Code 128/39, EAN, UPC, Data Matrix và ITF.
          </p>
        )}
      </section>
    </div>
  );
}
