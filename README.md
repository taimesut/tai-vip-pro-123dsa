# OPS FTE

Bộ công cụ hỗ trợ vận hành SPX/SOC. Bản phân phối chính là userscript cài bằng Violentmonkey và chạy trực tiếp trên SPX bằng phiên đăng nhập hiện tại.

## Chức năng chính

- Kiểm tra sót nội tỉnh và ngoại tỉnh, hỗ trợ mốc COT.
- Kiểm tra xe/FMS, ETA và hành trình SOC.
- Tra cứu TO, tạo/hiển thị QR.
- Đọc QR/Barcode bằng cách chọn ảnh hoặc chụp ảnh; không quét camera realtime.
- Theo dõi volume/tổng quan Hub nội bộ.
- Tạo biên bản sự vụ và ghi log qua Apps Script.

## Build local

```bash
npm ci
npm run build:userscript
```

File kết quả:

```text
userscript-dist/ops-fte.user.js
```

## Build thủ công trên GitHub Actions

Workflow không tự chạy khi push.

1. Vào **Actions**.
2. Chọn **Build Violentmonkey Userscript**.
3. Nhấn **Run workflow**.
4. Có thể nhập version hoặc để trống.
5. Tải artifact `ops-fte-violentmonkey-...`.
6. Giải nén và cài `ops-fte.user.js` bằng Violentmonkey.

## Cấu trúc chính

```text
src/                  UI và logic nghiệp vụ
gas/                  Google Apps Script
public/               tài nguyên tĩnh
tests/                test logic/userscript
.github/workflows/    workflow build userscript thủ công
```
