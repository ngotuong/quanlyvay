# C36 — Rollout C35 lên Vercel Preview và áp migration nhắc lãi

Trạng thái: `IN_PROGRESS`

## Mục tiêu

Đưa C35 đã nghiệm thu local lên stable Preview và áp migration nhắc lãi lặp hằng ngày trên Supabase
dùng chung, với kiểm tra fail-closed trước/sau migration và rollback web theo runbook.

## Phạm vi dự kiến

- Chạy toàn bộ gate local C35, DB lint và pgTAP 448/448.
- Đối chiếu migration remote, sao lưu/bằng chứng cần thiết rồi áp duy nhất migration
  `20260914150000_c35_repeat_interest_notifications.sql` lên Supabase dùng chung. Vì Preview và
  Production dùng chung database, logic tạo nhắc lãi lặp sẽ có hiệu lực cho worker Production ngay
  sau migration; không đổi dữ liệu tài chính, secret hoặc scheduler.
- Deploy candidate từ source C35 bằng `pnpm deploy:preview`; kiểm tra đúng project, target Preview,
  `READY`, 44 Functions `sin1` và public smoke.
- Authenticated smoke immutable/stable cho Notification Center, switch Push, giờ tự lưu, Cài đặt
  hợp nhất, redirect `/account`, phân quyền EDITOR/OWNER và regression C33.
- Chỉ chuyển stable alias sau khi candidate và runtime log đạt; rollback web về C34 nếu hậu kiểm
  thất bại. Migration additive/idempotent không tự rollback khi rollback web.

## Ngoài phạm vi

- Vercel Production rollout, Git push, thay remote secret/scheduler, Google resources, sửa hoặc xóa
  dữ liệu tài chính và thay đổi kiến trúc xóa profile.
