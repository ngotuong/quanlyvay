# C42 — Rollout C41 lên Supabase dùng chung và Vercel Preview

Trạng thái: `AWAITING_APPROVAL`.

## Mục tiêu

Áp migration C41 theo thứ tự fail-closed lên Supabase dùng chung và đưa đúng source C41 lên stable
Preview để kiểm chứng card notification hợp nhất, deep link thanh toán lãi và CTA Khoản vay trên
runtime thật trước khi cân nhắc Production.

## Phạm vi dự kiến

1. Chụp baseline read-only cho migration, notification, Push delivery và alias Preview; xác định
   rollback target hiện hành.
2. Chạy lại toàn bộ gate bắt buộc: `git diff --check`, lint, typecheck, unit/script tests, build,
   Auth, E2E, DB lint và pgTAP.
3. Áp migration `20260916120000_c41_notification_threads.sql` lên Supabase dùng chung; hậu kiểm
   version, quyền, index, card hiện hành, lịch sử superseded và delivery không bị mất.
4. Từ repository root chạy duy nhất `pnpm deploy:preview`; xác nhận candidate đúng project
   `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Preview, trạng thái Ready và Functions `sin1`.
5. Smoke public và authenticated trên immutable URL: Notification Center chỉ có một card hiện hành
   mỗi nghĩa vụ; notification lãi mở đúng form, loại và số tiền nhưng chưa tạo giao dịch; desktop và
   mobile chỉ có một CTA tạo khoản vay; form khoản vay chỉ có một combobox tìm/chọn đối tác và thao
   tác được bằng tap lẫn bàn phím. Không tạo giao dịch tài chính thật trong smoke.
6. Chỉ chuyển stable alias `https://tindung-preview.vercel.app` sau khi candidate đạt toàn bộ gate;
   smoke lại alias, kiểm tra console/runtime log và rollback alias nếu hậu kiểm thất bại.
7. Ghi deployment ID, immutable URL, alias, target, region, kết quả từng smoke và trạng thái tài
   khoản smoke vào `PROJECT_CONTEXT.md`.

## Ngoài phạm vi

- Không deploy hoặc promote Production.
- Không đổi scheduler, VAPID, secret, dữ liệu tài chính, Google resources hoặc Git remote/push.
- Không tiếp tục C38 và không tự mở checkpoint Production tiếp theo.

## Acceptance criteria

- Supabase dùng chung có đủ 32 migration, DB lint sạch, quyền fail-closed và dữ liệu notification/
  delivery cũ còn truy vết được.
- Candidate cùng stable Preview đạt public/authenticated smoke, console sạch và runtime không có
  error/fatal liên quan.
- Deep link chỉ mở form với số dư authoritative; không tự ghi giao dịch. CTA Khoản vay đúng một nút
  trên desktop/mobile và tuân thủ phân quyền.
- Có rollback target được xác minh; nếu bất kỳ gate nào thất bại thì không đổi alias hoặc trả alias
  về deployment tốt trước đó.
