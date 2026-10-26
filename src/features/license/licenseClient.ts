const LICENSE_API = "https://license.nguyenthanhtaiabcxyz.workers.dev";
const PRODUCT_CODE = "OPSFTE";
const DEFAULT_CACHE_SECONDS = 300;
const MAX_CACHE_SECONDS = 300;

const STORAGE = {
  licenseKey: "opsFteLicenseKey",
  deviceId: "opsFteLicenseDeviceId",
  cache: "opsFteLicenseCache",
} as const;

declare const __OPS_FTE_APP_VERSION__: string;

interface GmXmlHttpResponse {
  status: number;
  statusText?: string;
  responseText: string;
}

interface GmXmlHttpRequestDetails {
  method: "POST";
  url: string;
  headers: Record<string, string>;
  data: string;
  timeout: number;
  onload: (response: GmXmlHttpResponse) => void;
  onerror: (response: GmXmlHttpResponse) => void;
  ontimeout: () => void;
}

type GmXmlHttpRequest = (details: GmXmlHttpRequestDetails) => unknown;

declare const GM_xmlhttpRequest: GmXmlHttpRequest | undefined;

export interface LicenseSystemControl {
  status: string;
  severity: "info" | "warning" | "critical" | string;
  message: string;
  block_usage: boolean;
  starts_at: string;
  ends_at: string;
  source: string;
  scope_id: string;
}

export interface LicenseVerifyResult {
  valid: boolean;
  reason?: string;
  message?: string;
  cached?: boolean;
  cache_ttl_seconds?: number;
  server_time?: string;
  system_status?: string;
  system_message?: string;
  block_usage?: boolean;
  system?: LicenseSystemControl;
  product?: {
    code?: string;
    name?: string;
  };
  license?: {
    license_key?: string;
    email?: string;
    soc?: string;
    expires_at?: string;
    max_devices?: number;
  };
  expires_at?: string;
  max_devices?: number;
}

interface LicenseCache {
  valid: true;
  product: string;
  apiUrl: string;
  licenseKey: string;
  checkedAt: number;
  validUntil: number;
  payload: LicenseVerifyResult;
}

const readStorage = (key: string): string => {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
};

const writeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // License runtime can still work for the current page even if storage is unavailable.
  }
};

const removeStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage cleanup failures.
  }
};

export const normalizeLicenseKey = (value: string): string =>
  String(value || "").trim().toUpperCase();

const parseCache = (): LicenseCache | null => {
  const raw = readStorage(STORAGE.cache);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LicenseCache;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const saveCache = (cache: LicenseCache): void => {
  writeStorage(STORAGE.cache, JSON.stringify(cache));
};

const clearCache = (): void => {
  removeStorage(STORAGE.cache);
};

const createDeviceId = (): string => {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();

  const randomPart = Math.random().toString(36).slice(2);
  return `opsfte-${Date.now().toString(36)}-${randomPart}`;
};

const getDeviceId = (): string => {
  const current = readStorage(STORAGE.deviceId).trim();
  if (current) return current;

  const next = createDeviceId();
  writeStorage(STORAGE.deviceId, next);
  return next;
};

export const getStoredLicenseKey = (): string =>
  normalizeLicenseKey(readStorage(STORAGE.licenseKey));

const cacheMatches = (cache: LicenseCache | null, licenseKey: string): boolean =>
  Boolean(
    cache &&
      cache.valid === true &&
      cache.product === PRODUCT_CODE &&
      cache.apiUrl === LICENSE_API &&
      cache.licenseKey === licenseKey &&
      cache.validUntil > Date.now(),
  );

const parsePayload = (raw: string): LicenseVerifyResult => {
  try {
    const payload = JSON.parse(raw) as LicenseVerifyResult;
    if (!payload || typeof payload !== "object") {
      throw new Error("License Center trả về dữ liệu không hợp lệ.");
    }
    return payload;
  } catch (error) {
    if (error instanceof Error && error.message.includes("License Center")) {
      throw error;
    }
    throw new Error("License Center trả về JSON không hợp lệ.");
  }
};

const requestWithUserscript = (
  request: GmXmlHttpRequest,
  body: Record<string, string>,
): Promise<LicenseVerifyResult> =>
  new Promise((resolve, reject) => {
    request({
      method: "POST",
      url: `${LICENSE_API}/api/v1/verify`,
      headers: {
        "Content-Type": "application/json",
      },
      data: JSON.stringify(body),
      timeout: 15000,
      onload: (response) => {
        let payload: LicenseVerifyResult;
        try {
          payload = parsePayload(response.responseText);
        } catch (error) {
          reject(error);
          return;
        }

        if (
          (response.status < 200 || response.status >= 300) &&
          payload.valid !== false
        ) {
          reject(
            new Error(
              payload.message ||
                `License Center phản hồi HTTP ${response.status}${
                  response.statusText ? ` ${response.statusText}` : ""
                }.`,
            ),
          );
          return;
        }

        resolve(payload);
      },
      onerror: (response) => {
        reject(
          new Error(
            response.status
              ? `Không kết nối được License Center (HTTP ${response.status}).`
              : "Không kết nối được License Center.",
          ),
        );
      },
      ontimeout: () => {
        reject(new Error("License Center phản hồi quá lâu. Vui lòng thử lại."));
      },
    });
  });

const requestWithFetch = async (
  body: Record<string, string>,
): Promise<LicenseVerifyResult> => {
  const response = await fetch(`${LICENSE_API}/api/v1/verify`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();
  const payload = parsePayload(raw);

  if (!response.ok && payload.valid !== false) {
    throw new Error(
      payload.message || `License Center phản hồi HTTP ${response.status}.`,
    );
  }

  return payload;
};

const remoteVerify = async (licenseKey: string): Promise<LicenseVerifyResult> => {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  if (!normalizedKey) {
    clearCache();
    return {
      valid: false,
      reason: "LICENSE_REQUIRED",
    };
  }

  const body = {
    product: PRODUCT_CODE,
    license_key: normalizedKey,
    device_id: getDeviceId(),
    extension_version:
      typeof __OPS_FTE_APP_VERSION__ === "string"
        ? __OPS_FTE_APP_VERSION__
        : "",
  };

  const request =
    typeof GM_xmlhttpRequest === "function" ? GM_xmlhttpRequest : null;

  const payload = request
    ? await requestWithUserscript(request, body)
    : await requestWithFetch(body);

  if (!payload.valid) {
    clearCache();
    return {
      ...payload,
      valid: false,
      reason: payload.reason || "LICENSE_INVALID",
    };
  }

  const ttlSeconds = Math.max(
    60,
    Math.min(
      MAX_CACHE_SECONDS,
      Number(payload.cache_ttl_seconds || DEFAULT_CACHE_SECONDS),
    ),
  );

  const cache: LicenseCache = {
    valid: true,
    product: PRODUCT_CODE,
    apiUrl: LICENSE_API,
    licenseKey: normalizedKey,
    checkedAt: Date.now(),
    validUntil: Date.now() + ttlSeconds * 1000,
    payload,
  };

  writeStorage(STORAGE.licenseKey, normalizedKey);
  saveCache(cache);

  return payload;
};

export const verifyLicense = async (
  options: { force?: boolean } = {},
): Promise<LicenseVerifyResult> => {
  const licenseKey = getStoredLicenseKey();

  if (!licenseKey) {
    return {
      valid: false,
      reason: "NOT_CONFIGURED",
    };
  }

  const cache = parseCache();
  if (!options.force && cacheMatches(cache, licenseKey)) {
    return {
      ...cache!.payload,
      valid: true,
      cached: true,
    };
  }

  return remoteVerify(licenseKey);
};

export const activateLicense = async (
  licenseKey: string,
): Promise<LicenseVerifyResult> => {
  const normalizedKey = normalizeLicenseKey(licenseKey);
  writeStorage(STORAGE.licenseKey, normalizedKey);
  clearCache();
  return remoteVerify(normalizedKey);
};

export const clearLicense = (): void => {
  removeStorage(STORAGE.licenseKey);
  clearCache();
};

export const maskLicenseKey = (value: string): string => {
  const key = normalizeLicenseKey(value);
  if (!key) return "";
  if (key.length <= 9) return key;
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
};

export const licenseRuntime = {
  apiUrl: LICENSE_API,
  productCode: PRODUCT_CODE,
};
