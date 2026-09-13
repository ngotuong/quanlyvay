# C28 — Rollout C27 lên Vercel Preview

Ngày phê duyệt: 2026-09-12. Hoàn tất: 2026-09-13. Trạng thái: `COMPLETED`.

## Phạm vi và acceptance criteria

1. Chạy lại `git diff --check`, lint, typecheck, unit tests, build và E2E.
2. Tạo candidate duy nhất từ repository root bằng `pnpm deploy:preview`.
3. Xác minh candidate đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview,
   trạng thái `Ready`, toàn bộ Function ứng dụng ở `sin1` và public smoke trên immutable URL đạt.
4. Authenticated browser smoke các route/UI đổi trong C27 trên immutable URL; kiểm tra logo/icon,
   Dashboard, danh sách và chi tiết khoản vay, Quick Action/BottomSheet, mobile, console và runtime log.
5. Chỉ sau khi đạt smoke mới chuyển `https://tindung-preview.vercel.app`, rồi smoke/inspect/log lại;
   nếu hậu kiểm lỗi phải rollback alias về deployment tốt đã xác minh.
6. Ghi deployment ID, immutable URL, alias, target, region và kết quả smoke vào `PROJECT_CONTEXT.md`.

Không rollout Production, không migration hoặc thay đổi dữ liệu, không đổi secret, không thao tác
Google resources và không Git push.

Authenticated smoke được phép dùng một tài khoản kỹ thuật `EDITOR` tạm thời, không tạo giao dịch
hay dữ liệu tài chính; tài khoản phải bị vô hiệu hóa và ban sau smoke, credential không được ghi log
hoặc lưu trong repository/evidence.

## Kết quả rollout

- Candidate: `dpl_5M1XWMy69HrkAPVdPCmZtk9EzqF1`, immutable
  `https://quan-ly-vay-ca-nhan-b2fdfk4z9-ngotuong2105.vercel.app`.
- Candidate đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview, trạng thái `Ready`;
  44/44 Lambda ở `sin1`.
- Stable alias `https://tindung-preview.vercel.app` đã trỏ đúng candidate. Rollback target C26
  `dpl_8RwYQmGmqUD67wJeDMDzqveh1gz7` đã được xác minh nhưng không cần kích hoạt.
- Gate đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests, build và E2E 21/21.
- Public smoke trên immutable và stable đạt. Authenticated smoke trên cả hai URL đạt cho Dashboard,
  khoản vay, đối tác, chi phí, thông báo, tài khoản, Quick Action/BottomSheet, menu mobile, bộ icon
  mới và chống tràn ngang; console sạch. Hậu kiểm runtime có 0 error và 0 fatal.
- Bốn tài khoản kỹ thuật dùng cho các lần chẩn đoán/smoke đều đã bị vô hiệu hóa và ban; không tạo
  giao dịch hoặc dữ liệu tài chính. Service-role key chỉ tồn tại trong file tạm quyền `0600`, đã xóa
  sau từng lần dùng và không xuất hiện trong log/Git.
- Không rollout Production, không migration, thay đổi remote secret, Google resources hoặc Git push.
