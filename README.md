# OPS FTE

Bộ công cụ hỗ trợ vận hành SPX/SOC. Bản phân phối chính là userscript cài bằng Violentmonkey và chạy trực tiếp trên SPX bằng phiên đăng nhập hiện tại.

## Chức năng chính

- Kiểm tra sót nội tỉnh và ngoại tỉnh, hỗ trợ mốc COT.
- Tra cứu TO, tạo/hiển thị QR.
- Đọc QR/Barcode bằng cách chọn ảnh hoặc chụp ảnh; không quét camera realtime.
- Tạo biên bản sự vụ và ghi log qua Apps Script.

## License Center

Bản Violentmonkey dùng License Center chung:

```text
Product code: OPSFTE
License prefix: OPS
Endpoint: https://license.nguyenthanhtaiabcxyz.workers.dev/api/v1/verify
```

Khi mở OPS FTE lần đầu, nhập key dạng:

```text
OPS-XXXX-XXXX-XXXX
```

License được gắn với một `device_id` lưu trong `localStorage` của SPX trên trình duyệt hiện tại.

OPS FTE kiểm tra lại License Center tối đa mỗi 5 phút và hỗ trợ các trạng thái vận hành:

- `NOTICE`: hiện thông báo nhưng vẫn dùng được.
- `DEGRADED`: hiện cảnh báo hệ thống đang hạn chế.
- `MAINTENANCE`: hiển thị bảo trì; có thể khóa toàn bộ ứng dụng bằng `block_usage`.
- `INCIDENT`: hiển thị sự cố; có thể khóa toàn bộ ứng dụng.
- `DISABLED`: khóa sử dụng.
- `NORMAL`: hoạt động bình thường.

Thứ tự ưu tiên của License Center là `LICENSE > PRODUCT > GLOBAL`.

Violentmonkey metadata có `@connect license.nguyenthanhtaiabcxyz.workers.dev` và client ưu tiên `GM_xmlhttpRequest` để việc kiểm tra license không phụ thuộc CSP của trang SPX.

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
