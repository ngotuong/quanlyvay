# C27A — Bộ nhận diện logo và app icon

Ngày phê duyệt: 2026-09-12. Trạng thái: `COMPLETED`.

## Phạm vi

1. Dùng ảnh logo `Ngô Tường Financial Workspace` do người dùng cung cấp làm nguồn nhận diện mới.
2. Thay logo trên sidebar, đăng nhập và đổi mật khẩu nhưng giữ nguyên kích thước/bố cục hiện tại.
3. Tạo favicon 16×16 và 32×32 từ bản chỉ có biểu tượng vô cực trên nền trắng bo góc.
4. Tạo Apple Touch Icon 180×180, PWA icon 192×192, 512×512 và maskable 512×512.
5. Chuyển toàn bộ reference sang asset mới rồi mới loại bỏ asset cũ; quét toàn project để bảo đảm
   không còn reference hoặc hình ảnh nhận diện cũ.
6. Chạy `git diff --check`, lint, typecheck, unit tests, build và E2E phù hợp.

## Bất biến và ngoài phạm vi

- Không đổi logic nghiệp vụ, API, dữ liệu, routing hoặc chức năng.
- Không migration, deploy, Git push, thay Google resources hay remote secret.
- C27 tổng thể vẫn `AWAITING_APPROVAL`; C27A không cấp quyền cho các giai đoạn khác của C27.

## Acceptance criteria

- Các điểm hiển thị logo và metadata dùng đúng asset mới, không gây layout shift và có kích thước cố định.
- Favicon nhỏ dùng bản vô cực không chữ; Apple/PWA icon đúng kích thước và manifest hợp lệ.
- Không còn reference hoặc nội dung của bộ nhận diện cũ trong source đang sử dụng.
- Các gate local áp dụng đều đạt.

## Kết quả nghiệm thu

- Logo trong sidebar, đăng nhập và đổi mật khẩu dùng bản biểu tượng vô cực mới; container và kích
  thước hiển thị cũ được giữ nguyên để tránh layout shift.
- Favicon ICO chứa hai frame RGBA 16×16 và 32×32, đồng thời có PNG tương ứng; cả hai là bản chỉ có
  biểu tượng vô cực trên nền trắng bo góc, không có chữ.
- Apple Touch Icon 180×180; PWA icon 192×192, 512×512 và maskable 512×512 dùng bộ nhận diện mới.
- Metadata, manifest, Web Push và service worker đã chuyển toàn bộ reference; quét repository không
  còn đường dẫn tới các asset `app-icon*` cũ. Các chuỗi `app-icon` còn lại nếu có chỉ là thuật ngữ
  mô tả app-icon badging trong migration, không phải đường dẫn asset.
- Gate đạt: `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` và
  `pnpm test:e2e` 21/21.
- Không có thay đổi logic nghiệp vụ, API, dữ liệu, routing, migration hoặc remote rollout.
