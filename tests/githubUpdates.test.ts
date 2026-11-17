import assert from "node:assert/strict";
import test from "node:test";
import {
  GITHUB_INSTALL_URL,
  GITHUB_RELEASES_URL,
  isGitHubVersionNewer,
  normalizeGitHubRelease,
} from "../src/utils/githubUpdates.ts";

test("compares GitHub release versions numerically", () => {
  assert.equal(isGitHubVersionNewer("0.4.10", "0.4.9"), true);
  assert.equal(isGitHubVersionNewer("v0.5.0", "0.4.99"), true);
  assert.equal(isGitHubVersionNewer("0.4.8", "0.4.9"), false);
  assert.equal(isGitHubVersionNewer("0.4.9", "0.4.9"), false);
  assert.equal(isGitHubVersionNewer("latest", "0.4.9"), false);
  assert.equal(isGitHubVersionNewer("0.4.9", "dev"), false);
});

test("normalizes a real GitHub Release and rejects malformed tags", () => {
  const result = normalizeGitHubRelease({
    tag_name: "v0.4.10",
    body: " Thêm chức năng cập nhật ",
    html_url: "https://github.com/taimesut/tai-vip-pro-123dsa/releases/tag/v0.4.10",
  });
  assert.deepEqual(result, {
    version: "0.4.10",
    notes: "Thêm chức năng cập nhật",
    releaseUrl: "https://github.com/taimesut/tai-vip-pro-123dsa/releases/tag/v0.4.10",
  });
  assert.throws(() => normalizeGitHubRelease({ tag_name: "latest" }), /không hợp lệ/);
  assert.throws(() => normalizeGitHubRelease(null), /không hợp lệ/);
  assert.equal(
    normalizeGitHubRelease({
      tag_name: "v0.4.11",
      html_url: "https://example.invalid/unsafe",
    }).releaseUrl,
    GITHUB_RELEASES_URL,
  );
});

test("install link points to a GitHub Release userscript rather than an expiring artifact", () => {
  assert.equal(
    GITHUB_INSTALL_URL,
    "https://github.com/taimesut/tai-vip-pro-123dsa/releases/latest/download/ops-fte.user.js",
  );
});
