# OPS FTE

Bộ công cụ hỗ trợ vận hành SPX/SOC. Bản phân phối chính là userscript cài bằng Violentmonkey và chạy trực tiếp trên SPX bằng phiên đăng nhập hiện tại.

## Chức năng chính

- Kiểm tra sót nội tỉnh và ngoại tỉnh, hỗ trợ mốc COT.
- Tra cứu TO, tạo/hiển thị QR.
- Đọc QR/Barcode bằng cách chọn ảnh hoặc chụp ảnh; không quét camera realtime.
- Tạo biên bản sự vụ và ghi log qua Apps Script.

OPS FTE không yêu cầu License Key hoặc xác thực License Center. Bản userscript mới tự dọn dữ liệu license cũ trong trình duyệt mà không ảnh hưởng cấu hình SOC.

## Cài đặt và cập nhật qua GitHub

**Link cài đặt/cập nhật cố định:** [Cài OPS FTE (.user.js)](https://github.com/taimesut/tai-vip-pro-123dsa/releases/latest/download/ops-fte.user.js)

**Xem lịch sử phiên bản:** [GitHub Releases](https://github.com/taimesut/tai-vip-pro-123dsa/releases)

1. Mở link cài đặt bằng trình duyệt có Violentmonkey.
2. Xác nhận cài đặt userscript. Cấu hình SOC lưu tại trình duyệt được giữ nguyên khi cập nhật cùng script. License Key cũ, thiết bị đã kích hoạt và bộ nhớ đệm license sẽ được xóa.
3. Các lần sau Violentmonkey có thể tự kiểm tra bản mới dựa trên `@updateURL` và tải bằng `@downloadURL` (tùy thiết lập chu kỳ cập nhật của Violentmonkey).
4. Ngay trong **Trang chủ → Kiểm tra cập nhật** cũng có thể so sánh phiên bản hiện tại với GitHub Release và mở link cài bản mới.

**Lưu ý:** Các bản cũ chưa có `@updateURL` / `@downloadURL` cần cài lại **một lần** qua link cố định sau khi phát hành bản GitHub đầu tiên. Metadata giữ nguyên `@name` và `@namespace` cũ để Violentmonkey cập nhật script hiện tại, tránh cài thành bản khác.

## Phát hành bản mới qua GitHub Actions

Workflow chỉ chạy thủ công và chỉ phát hành khi build/test thành công:

1. Vào [Actions → Build and Publish Violentmonkey Userscript](https://github.com/taimesut/tai-vip-pro-123dsa/actions/workflows/build-userscript.yml).
2. Nhấn **Run workflow**, chọn nhánh `main`.
3. Để trống `version` để tự tăng patch (ví dụ `0.4.2` → `0.4.3`) hoặc nhập `x.y.z` cao hơn bản Release mới nhất.
4. Có thể nhập `release_notes` để ghi nội dung cập nhật.
5. Sau khi chạy thành công, Action tạo một GitHub Release chứa trực tiếp `ops-fte.user.js` và `ops-fte.meta.js`. Link **latest/download** không đổi giữa các lần phát hành.

Artifact ZIP trong Actions vẫn được lưu 30 ngày để dự phòng, **không phải** nguồn cập nhật. GitHub Release mới là nguồn phân phối lâu dài. Nếu chưa chạy workflow lần đầu thì link cài bản mới nhất chưa tồn tại.

## Build local

```bash
npm ci
npm run test:userscript
npm run build:userscript
```

Kết quả: `userscript-dist/ops-fte.user.js`. Build local để thử nghiệm, không tự tạo GitHub Release.

## Cấu trúc chính

```text
src/                  UI và logic nghiệp vụ
gas/                  Google Apps Script
public/               tài nguyên tĩnh
tests/                test logic/userscript
.github/workflows/    workflow build userscript thủ công
```
