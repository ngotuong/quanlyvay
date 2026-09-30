# C64 — Thiết kế lại shell, dashboard, danh sách và chi tiết

Ngày hoàn tất local: 30/09/2026. Nguồn thiết kế: audit C62, mockup
`docs/audit-c62/proposal.html` và `docs/DESIGN_SYSTEM.md`.

## Kết quả

- Dashboard đổi từ nhãn lịch chung sang **Việc cần xử lý**, đưa hành động thu/trả lãi tới thẳng
  drawer phù hợp và dùng empty state thay cho biểu đồ dòng tiền toàn số 0. Phần phân tích chi tiết
  vẫn được thu gọn, số liệu tiếp tục lấy từ bundle/RPC authoritative hiện hữu.
- Bộ lọc khoản vay bỏ một hàng tiêu đề trang trí, giữ search/hướng/trạng thái trong toolbar compact,
  gom Nâng cao và Xóa lọc cạnh số kết quả. Query vẫn là nguồn sự thật của deep link; reload và
  Back/Forward giữa các URL lọc giữ đúng trạng thái. Card tách tên khoản vay khỏi gốc ban đầu để
  hierarchy dễ quét hơn, không thay số tiền hiển thị.
- Trang chi tiết giữ trạng thái, dư gốc, lãi và ba hành động chính trong vùng đầu trang; E2E C63
  xác minh lại drawer, stale guard, idempotency, focus và success lifecycle ở 375/390/1440 px.
- Đối tác chuyển sang list-first: search theo tên/ghi chú, CTA mở bottom sheet khi cần thêm, sửa
  thành công tự thu gọn. Thêm/sửa giữ URL tìm kiếm; lỗi và cancel giữ draft; đóng draft hỏi xác nhận.
- Nút tải lại bảng tất toán và thử tính lại giảm gốc chỉ xuất hiện khi preview lỗi hoặc server báo
  stale. Happy path tải preview tự động và vẫn yêu cầu checkbox xác nhận số tiền.
- Control thường dùng trong các luồng kiểm tra đạt tối thiểu 44 px; không phát hiện tràn ngang ở
  viewport kiểm tra hoặc khi tăng root font lên 200% trong harness.

Không có thay đổi schema, migration, RPC, công thức lãi, quy tắc làm tròn, idempotency hay dữ liệu
Production/Preview. Checkpoint không deploy và không push GitHub.

## Bằng chứng hình ảnh

| Màn hình | Chế độ | Kích thước | Tệp |
|---|---|---:|---|
| Dashboard | mobile light | 390×1637 | `docs/audit-c64/dashboard-mobile-light.png` |
| Khoản vay và filter | mobile light | 390×852 | `docs/audit-c64/loans-filter-mobile-light.png` |
| Đối tác list-first | mobile light | 390×844 | `docs/audit-c64/counterparties-mobile-light.png` |
| Chi tiết khoản vay | desktop dark, reduced motion | 1440×960 | `docs/audit-c64/loan-detail-desktop-dark.png` |

Ảnh được tạo từ database Playwright cô lập với dữ liệu giả. Privacy mode, light/dark và
reduced-motion cũng được kiểm lại trong full E2E; ảnh không phải bằng chứng dữ liệu Production.

## Kiểm thử

- `git diff --check`: PASS.
- `pnpm lint`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: 80/80 PASS.
- `pnpm build`: PASS, Next.js production build tạo đủ 19 route.
- `C64_EVIDENCE=true pnpm test:e2e`: 35 bài chạy PASS; 1 skip đúng chủ đích là harness C62 chỉ
  chạy khi có `C62_AUDIT=true`. Playwright dùng production build/start và reset database test local.
- Regression C64 kiểm mobile 390 px, desktop 1440 px, search/reload/Back/Forward, create/edit/cancel
  đối tác, 200% text, dark/reduced-motion và happy-path preview không có retry.

## Giới hạn bằng chứng

- Chưa kiểm VoiceOver, TalkBack hoặc screen reader khác trên thiết bị thật; không tuyên bố toàn bộ
  ứng dụng đạt WCAG.
- Viewport Playwright mô phỏng kích thước và prefers-color-scheme/reduced-motion; chưa thay thế kiểm
  bàn phím mềm, safe-area và hiệu năng GPU trên iOS/Android thật.
- Browser zoom thật và mạng di động ngoài môi trường local chưa được đo. Harness tăng root font
  200% chỉ là bằng chứng chống mất chức năng trong phạm vi đã kiểm.
