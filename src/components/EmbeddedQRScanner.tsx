import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUp, LoaderCircle, X } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handledScanRef = useRef(false);
  const [decodingImage, setDecodingImage] = useState(false);

  useEffect(() => {
    if (!open) return;
    handledScanRef.current = false;
    setDecodingImage(false);
  }, [mode, open]);

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
        "Không tìm thấy mã QR/Barcode trong ảnh. Hãy chọn ảnh rõ hơn và thử lại.",
        "warning",
      );
    } finally {
      setDecodingImage(false);
    }
  };

  const openImagePicker = () => {
    if (decodingImage) return;
    fileInputRef.current?.click();
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
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
            Chọn ảnh đã chụp hoặc ảnh QR/Barcode trong thiết bị. OPS FTE chỉ đọc
            ảnh một lần, không mở camera và không quét realtime.
          </p>
        </div>

        <button
          type="button"
          disabled={decodingImage}
          onClick={openImagePicker}
          className="btn btn-primary mt-6 min-h-12 w-full gap-2 rounded-xl font-bold"
        >
          {decodingImage ? (
            <LoaderCircle className="h-5 w-5 animate-spin" />
          ) : (
            <ImageUp className="h-5 w-5" />
          )}
          {decodingImage ? "Đang đọc mã..." : "Chọn ảnh để đọc mã"}
        </button>

        <p className="mt-3 text-center text-xs text-base-content/50">
          Hỗ trợ QR Code, Code 128/39, EAN, UPC, Data Matrix và ITF.
        </p>
      </section>
    </div>
  );
}
