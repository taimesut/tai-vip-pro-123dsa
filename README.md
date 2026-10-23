# OPS FTE

Bộ công cụ hỗ trợ vận hành SPX/SOC, dùng chung một codebase React + TypeScript cho web, userscript và Firefox extension.

## Chức năng chính

- Kiểm tra sót nội tỉnh và ngoại tỉnh, hỗ trợ mốc COT.
- Kiểm tra xe/FMS, ETA và hành trình SOC.
- Tra cứu TO, tạo/hiển thị QR.
- Theo dõi volume/tổng quan Hub nội bộ.
- Tạo biên bản sự vụ và ghi log qua Apps Script.
- Cấu hình SOC và các tham số vận hành dùng chung.

## Công nghệ

- React 19 + TypeScript + Vite
- Tailwind CSS / DaisyUI
- Google Apps Script
- Userscript chạy trực tiếp trên SPX
- Firefox WebExtension

## Bắt đầu

```bash
npm ci
npm run dev
```

Kiểm tra toàn bộ phần source trước khi merge/release:

```bash
npm run check
```

Dọn toàn bộ artifact sinh ra khi build:

```bash
npm run clean
```

## Build

| Mục tiêu | Lệnh | Output |
| --- | --- | --- |
| Web/PWA | `npm run build` | `dist/` |
| Userscript | `npm run build:userscript` | `userscript-dist/` |
| Firefox | `npm run build:firefox` | `firefox-dist/` |
| Launcher | `npm run build:launcher` | `launcher-dist/` |
| Scanner | `npm run build:scanner` | `dist/scanner/` |
| GAS bundle | `npm run bundle:gas` | `gas-dist/code.gs` |

Firefox có hướng dẫn riêng tại [FIREFOX_EXTENSION.md](./FIREFOX_EXTENSION.md).

## Cấu trúc repo

```text
src/
  components/       UI dùng chung
  pages/            các màn hình nghiệp vụ
  utils/            API, parser và logic nghiệp vụ
firefox/            file nền và version cho Firefox extension
gas/                source Google Apps Script
public/             icon/manifest tĩnh
tests/              test Node cho logic và integration wiring
.github/workflows/  build/release userscript và Firefox
```

## Quy ước repository

Các thư mục build như `dist/`, `firefox-dist/`, `userscript-dist/`, `launcher-dist/`, `scanner-dist/` và `gas-dist/` không được commit. Artifact release được tạo lại từ source bằng npm/GitHub Actions.

Các thư mục/tooling AI cục bộ như `.agents/`, `skills-lock.json` và tài liệu sinh tự động trong `docs/superpowers/` cũng không thuộc source runtime.
