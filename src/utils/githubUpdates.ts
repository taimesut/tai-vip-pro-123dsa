export const GITHUB_RELEASES_URL =
  "https://github.com/taimesut/tai-vip-pro-123dsa/releases";
export const GITHUB_INSTALL_URL =
  "https://github.com/taimesut/tai-vip-pro-123dsa/releases/latest/download/ops-fte.user.js";
const GITHUB_LATEST_RELEASE_API =
  "https://api.github.com/repos/taimesut/tai-vip-pro-123dsa/releases/latest";

export interface GitHubReleaseInfo {
  version: string;
  notes: string;
  releaseUrl: string;
}

type GmResponse = { status: number; responseText: string };
declare const GM_xmlhttpRequest:
  | ((options: {
      method: "GET";
      url: string;
      headers: Record<string, string>;
      timeout: number;
      onload: (response: GmResponse) => void;
      onerror: () => void;
      ontimeout: () => void;
    }) => unknown)
  | undefined;

const parseParts = (value: string): number[] | null => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  return match ? match.slice(1).map(Number) : null;
};

export const isGitHubVersionNewer = (
  latest: string,
  installed: string,
): boolean => {
  const next = parseParts(latest);
  const current = parseParts(installed);
  if (!next || !current) return false;
  for (let i = 0; i < 3; i += 1) {
    if (next[i] !== current[i]) return next[i] > current[i];
  }
  return false;
};

export const normalizeGitHubRelease = (value: unknown): GitHubReleaseInfo => {
  if (!value || typeof value !== "object") {
    throw new Error("Dữ liệu GitHub Release không hợp lệ.");
  }

  const record = value as Record<string, unknown>;
  const tag = typeof record.tag_name === "string" ? record.tag_name : "";
  const parts = parseParts(tag);
  if (!parts) throw new Error("Phiên bản trên GitHub không hợp lệ.");

  const releaseUrl =
    typeof record.html_url === "string" &&
    /^https:\/\/github\.com\/taimesut\/tai-vip-pro-123dsa\/releases\/tag\/[^/?#]+$/.test(record.html_url)
      ? record.html_url
      : GITHUB_RELEASES_URL;

  return {
    version: parts.join("."),
    notes: typeof record.body === "string" ? record.body.trim() : "",
    releaseUrl,
  };
};

const loadReleaseJson = async (): Promise<unknown> => {
  const options = {
    method: "GET" as const,
    url: GITHUB_LATEST_RELEASE_API,
    headers: { Accept: "application/vnd.github+json" },
    timeout: 12000,
  };

  if (typeof GM_xmlhttpRequest === "function") {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        ...options,
        onload(response) {
          if (response.status === 404) {
            reject(new Error("Chưa có bản phát hành trên GitHub."));
            return;
          }
          if (response.status < 200 || response.status >= 300) {
            reject(new Error("Không lấy được phiên bản mới nhất từ GitHub."));
            return;
          }
          try {
            resolve(JSON.parse(response.responseText));
          } catch {
            reject(new Error("GitHub trả về dữ liệu không hợp lệ."));
          }
        },
        onerror() {
          reject(new Error("Không thể kết nối GitHub. Hãy thử lại."));
        },
        ontimeout() {
          reject(new Error("GitHub phản hồi quá lâu. Hãy thử lại."));
        },
      });
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout);
  try {
    const response = await fetch(options.url, {
      headers: options.headers,
      signal: controller.signal,
    });
    if (response.status === 404) {
      throw new Error("Chưa có bản phát hành trên GitHub.");
    }
    if (!response.ok) {
      throw new Error("Không lấy được phiên bản mới nhất từ GitHub.");
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const loadLatestGitHubRelease = async (): Promise<GitHubReleaseInfo> =>
  normalizeGitHubRelease(await loadReleaseJson());
