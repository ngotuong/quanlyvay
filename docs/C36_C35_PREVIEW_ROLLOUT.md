# C36 — Rollout C35 lên Vercel Preview và áp migration nhắc lãi

Ngày phê duyệt: 2026-09-14. Hoàn tất: 2026-09-14. Trạng thái: `COMPLETED`.

## Kết quả rollout

- Supabase dùng chung đã áp migration thứ 31
  `20260914150000_c35_repeat_interest_notifications.sql`; checksum hàm notification đổi từ
  `b0a24133ef1185ca2c3a462c309580af` sang `12cb12366774794dd85856b8bd510a79`.
  Helper/comment mới hiện diện, chỉ `service_role` có quyền execute; scheduler
  `qlv-notification-runner-hourly` vẫn active với lịch `0 * * * *`. Số lượng loan/transaction/
  notification/push delivery trước và sau migration không đổi (`37/378/27/6`).
- Candidate `dpl_m5ubMxZxidzgnjawrxyLEVUL5CvA`, immutable
  `https://quan-ly-vay-ca-nhan-ohjwewlit-ngotuong2105.vercel.app`, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview, `READY`; 44/44 output Function ở `sin1`.
- `https://tindung-preview.vercel.app` đã trỏ đúng candidate. Rollback target C34
  `dpl_5CcFRo14rfrr1JoSJmd3Vizi5N8M` đã được xác minh và không phải kích hoạt.
- Gate đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6, E2E
  21/21, DB lint sạch và pgTAP 448/448. Một lượt continuation đầu tiên dừng trước alias do hai
  assertion E2E không ổn định (toast biến mất sớm và empty-state chi phí); lượt chạy sạch tiếp theo
  đạt 21/21 rồi mới chuyển alias.
- Public/authenticated smoke immutable và stable đạt cho Notification Center, switch Push không bị
  thay đổi trạng thái, giờ nhận thông báo tự lưu/khôi phục 07:00, Cài đặt hợp nhất, redirect
  `/account`, khoản vay mặc định `ACTIVE`, bộ lọc nâng cao, regression C33 và biểu đồ click/tap/
  keyboard có tooltip. Browser console, runtime error và fatal log đều sạch.
- Tài khoản `EDITOR` tạm chỉ dùng cho smoke, không tạo dữ liệu tài chính; sau kiểm thử đã
  `inactive`/`banned` và đăng nhập lại bị từ chối. Không đổi remote secret/scheduler, Google
  resources, Vercel Production hoặc Git remote; không Git push.

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
