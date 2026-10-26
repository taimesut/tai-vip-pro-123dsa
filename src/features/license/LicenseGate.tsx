import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  activateLicense,
  clearLicense,
  getStoredLicenseKey,
  maskLicenseKey,
  verifyLicense,
  type LicenseSystemControl,
  type LicenseVerifyResult,
} from "./licenseClient";

interface LicenseGateProps {
  children: ReactNode;
}

type GateState = "checking" | "ready" | "license" | "blocked" | "error";

const RECHECK_MS = 5 * 60 * 1000;

const reasonText = (result: LicenseVerifyResult | null): string => {
  const reason = String(result?.reason || "").toUpperCase();
  const messages: Record<string, string> = {
    NOT_CONFIGURED: "Nhập license để kích hoạt OPS FTE.",
    LICENSE_REQUIRED: "Nhập mã license.",
    LICENSE_NOT_FOUND: "License không tồn tại.",
    LICENSE_DISABLED: "License đã bị khóa.",
    LICENSE_EXPIRED: result?.expires_at
      ? `License đã hết hạn từ ${result.expires_at}.`
      : "License đã hết hạn.",
    DEVICE_LIMIT: result?.max_devices
      ? `License đã đủ ${result.max_devices} thiết bị.`
      : "License đã đủ số thiết bị.",
    WRONG_PRODUCT: "License này không dùng cho OPS FTE.",
    PRODUCT_DISABLED: "OPS FTE đang bị khóa trên License Center.",
    INVALID_REQUEST: "Thông tin kích hoạt không hợp lệ.",
    SYSTEM_BLOCKED:
      result?.system?.message ||
      result?.message ||
      "OPS FTE đang tạm dừng theo điều khiển hệ thống.",
    LICENSE_INVALID: "License không hợp lệ.",
  };

  return messages[reason] || result?.message || "Không xác thực được license.";
};

const systemTitle = (system?: LicenseSystemControl): string => {
  const status = String(system?.status || "NORMAL").toUpperCase();
  const labels: Record<string, string> = {
    NOTICE: "Thông báo hệ thống",
    DEGRADED: "Hệ thống đang hạn chế",
    MAINTENANCE: "OPS FTE đang bảo trì",
    INCIDENT: "OPS FTE đang gặp sự cố",
    DISABLED: "OPS FTE đang tạm khóa",
  };
  return labels[status] || "Thông báo hệ thống";
};

const formatSystemTime = (system?: LicenseSystemControl): string => {
  if (!system) return "";
  const parts: string[] = [];

  if (system.starts_at) {
    const value = new Date(system.starts_at);
    if (!Number.isNaN(value.getTime())) {
      parts.push(`Từ ${value.toLocaleString("vi-VN")}`);
    }
  }

  if (system.ends_at) {
    const value = new Date(system.ends_at);
    if (!Number.isNaN(value.getTime())) {
      parts.push(`đến ${value.toLocaleString("vi-VN")}`);
    }
  }

  return parts.join(" ");
};

const isBlocked = (result: LicenseVerifyResult | null): boolean =>
  Boolean(
    result &&
      (result.reason === "SYSTEM_BLOCKED" ||
        result.block_usage ||
        result.system?.block_usage),
  );

const severityClass = (system?: LicenseSystemControl): string => {
  const severity = String(system?.severity || "info").toLowerCase();
  if (severity === "critical") return "ops-license-system-critical";
  if (severity === "warning") return "ops-license-system-warning";
  return "ops-license-system-info";
};

export const LicenseGate = ({ children }: LicenseGateProps) => {
  const [state, setState] = useState<GateState>("checking");
  const [result, setResult] = useState<LicenseVerifyResult | null>(null);
  const [licenseKey, setLicenseKey] = useState(() => getStoredLicenseKey());
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showLicensePanel, setShowLicensePanel] = useState(false);

  const applyResult = useCallback((next: LicenseVerifyResult) => {
    setResult(next);

    if (next.valid && !isBlocked(next)) {
      setMessage("");
      setState("ready");
      return;
    }

    if (isBlocked(next)) {
      setMessage(reasonText(next));
      setState("blocked");
      return;
    }

    setMessage(reasonText(next));
    setState("license");
  }, []);

  const check = useCallback(
    async (force = false) => {
      try {
        const next = await verifyLicense({ force });
        applyResult(next);
      } catch (error) {
        setMessage(
          error instanceof Error && error.message
            ? error.message
            : "Không kết nối được License Center.",
        );
        setState("error");
      }
    },
    [applyResult],
  );

  useEffect(() => {
    void check(false);
  }, [check]);

  useEffect(() => {
    if (state !== "ready" && state !== "blocked") return;

    const timer = window.setInterval(() => {
      void check(true);
    }, RECHECK_MS);

    return () => window.clearInterval(timer);
  }, [check, state]);

  const handleActivate = async () => {
    const key = licenseKey.trim().toUpperCase();
    if (!key) {
      setMessage("Nhập mã license.");
      return;
    }

    setBusy(true);
    setMessage("Đang kiểm tra license...");

    try {
      const next = await activateLicense(key);
      setLicenseKey(getStoredLicenseKey());
      applyResult(next);
      setShowLicensePanel(false);
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "Kích hoạt license thất bại.",
      );
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const handleChangeLicense = () => {
    clearLicense();
    setResult(null);
    setLicenseKey("");
    setMessage("Nhập license mới.");
    setShowLicensePanel(false);
    setState("license");
  };

  const currentKey = useMemo(
    () => result?.license?.license_key || getStoredLicenseKey(),
    [result],
  );

  if (state === "checking") {
    return (
      <div className="ops-license-page">
        <div className="ops-license-card">
          <div className="ops-license-mark">OPS</div>
          <p className="ops-license-kicker">OPS FTE</p>
          <h1>Đang kiểm tra license</h1>
          <p>Đang xác thực quyền sử dụng với License Center...</p>
          <span className="loading loading-spinner loading-md" aria-label="Đang tải" />
        </div>
      </div>
    );
  }

  if (state === "blocked") {
    const system = result?.system;
    return (
      <div className="ops-license-page">
        <div className="ops-license-card ops-license-card-blocked">
          <div className="ops-license-mark">!</div>
          <p className="ops-license-kicker">OPS FTE</p>
          <h1>{systemTitle(system)}</h1>
          <p className="ops-license-block-message">{message}</p>
          {formatSystemTime(system) ? (
            <p className="ops-license-time">{formatSystemTime(system)}</p>
          ) : null}
          <div className="ops-license-actions">
            <button
              type="button"
              className="btn btn-primary min-h-11 rounded-xl"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void check(true).finally(() => setBusy(false));
              }}
            >
              {busy ? "Đang kiểm tra..." : "Kiểm tra lại"}
            </button>
            <button
              type="button"
              className="btn btn-ghost min-h-11 rounded-xl"
              onClick={handleChangeLicense}
            >
              Đổi license
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === "license" || state === "error") {
    return (
      <div className="ops-license-page">
        <div className="ops-license-card">
          <div className="ops-license-mark">OPS</div>
          <p className="ops-license-kicker">OPS FTE</p>
          <h1>Kích hoạt license</h1>
          <p>Cần license hợp lệ để sử dụng OPS FTE trên thiết bị này.</p>

          <label className="ops-license-field">
            <span>License key</span>
            <input
              type="text"
              value={licenseKey}
              autoComplete="off"
              spellCheck={false}
              placeholder="OPS-XXXX-XXXX-XXXX"
              disabled={busy}
              onChange={(event) => setLicenseKey(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !busy) void handleActivate();
              }}
            />
          </label>

          <button
            type="button"
            className="btn btn-primary min-h-11 w-full rounded-xl"
            disabled={busy}
            onClick={() => void handleActivate()}
          >
            {busy ? "Đang kích hoạt..." : "Kích hoạt"}
          </button>

          {message ? (
            <p className="ops-license-error" role="alert">
              {message}
            </p>
          ) : null}

          {state === "error" ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-1 rounded-xl"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void check(true).finally(() => setBusy(false));
              }}
            >
              Thử kiểm tra lại
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const system = result?.system;
  const showSystemNotice =
    Boolean(system) && String(system?.status || "NORMAL").toUpperCase() !== "NORMAL";

  return (
    <>
      {showSystemNotice ? (
        <div className={`ops-license-system-banner ${severityClass(system)}`}>
          <div>
            <strong>{systemTitle(system)}</strong>
            <p>{system?.message || "Hệ thống có thông báo vận hành mới."}</p>
            {formatSystemTime(system) ? (
              <small>{formatSystemTime(system)}</small>
            ) : null}
          </div>
          <span>{String(system?.status || "NOTICE").toUpperCase()}</span>
        </div>
      ) : null}

      {children}

      <button
        type="button"
        className="ops-license-status-button"
        title="Thông tin license OPS FTE"
        onClick={() => setShowLicensePanel(true)}
      >
        License
      </button>

      {showLicensePanel ? (
        <div
          className="ops-license-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowLicensePanel(false);
          }}
        >
          <div className="ops-license-modal-card" role="dialog" aria-modal="true">
            <div className="ops-license-modal-head">
              <div>
                <p className="ops-license-kicker">OPS FTE</p>
                <h2>License đang sử dụng</h2>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => setShowLicensePanel(false)}
              >
                Đóng
              </button>
            </div>

            <div className="ops-license-info-grid">
              <span>Key</span>
              <strong>{maskLicenseKey(currentKey)}</strong>
              <span>SOC</span>
              <strong>{result?.license?.soc || "—"}</strong>
              <span>Hạn</span>
              <strong>{result?.license?.expires_at || "Không giới hạn"}</strong>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-error mt-4 min-h-11 w-full rounded-xl"
              onClick={handleChangeLicense}
            >
              Đổi license
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
};
