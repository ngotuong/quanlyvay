# C18 — Redact secret trong audit và export

## 1. Trạng thái

| ID | Bước | Trạng thái |
|---|---|---|
| K06 | Redact secret trong audit và export | `AWAITING_APPROVAL` |

Chính sách mật khẩu tối thiểu 6 ký tự ASCII chữ hoặc số tiếp tục giữ nguyên. Chưa triển khai code,
migration hoặc thao tác remote khi K06 chưa được OWNER phê duyệt.

## 2. Phạm vi K06

1. Audit schema và luồng ghi/đọc hiện tại để xác định mọi đường có thể lộ Web Push `p256dh`,
   `auth_secret` và endpoint định danh subscription.
2. Thêm migration để audit mới chỉ lưu giá trị đã redact/fingerprint, vẫn giữ ID, actor, action,
   timestamp và ngữ cảnh cần cho đối chiếu.
3. Tạo projection/RPC sanitized làm nguồn duy nhất cho giao diện audit và Google Sync export; thu
   hồi quyền `authenticated` đọc raw audit trực tiếp.
4. Giữ raw lịch sử append-only nhưng không còn lộ qua UI/API/Sheet. Scrub raw lịch sử, xóa snapshot
   Drive cũ hoặc rotate subscription là quyết định riêng vì ảnh hưởng tính bất biến và có thể buộc
   thiết bị đăng ký Push lại.
5. Cập nhật contract export, tài liệu và regression cho RLS, UI, phân trang cùng Apps Script schema.

## 3. Acceptance và gate

- `p256dh` và `auth_secret` không xuất hiện trong audit mới, UI, API export hoặc Sheet; endpoint nếu
  cần đối chiếu chỉ hiện fingerprint an toàn.
- Audit sanitized vẫn đủ actor/action/record ID/timestamp và ngữ cảnh nghiệp vụ.
- `authenticated` không thể đọc raw secret; service role chỉ dùng ở đường vận hành cần thiết.
- Database lint, pgTAP, Auth/E2E, export tests, lint, typecheck, unit và build đều đạt.
- Migration remote, deploy Preview/Production, Apps Script push/full sync, scrub lịch sử hoặc rotate
  Push đều cần xác nhận riêng trước từng nhóm thao tác.
