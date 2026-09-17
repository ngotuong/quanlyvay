# C44 — Rollout C41/C43 lên Supabase dùng chung, Preview và Production

Trạng thái: `COMPLETED` ngày 2026-09-17. Người dùng yêu cầu deploy Production trực tiếp ngày 2026-09-17; phạm vi
được mở rộng rõ ràng từ kế hoạch Preview ban đầu, không suy ra từ checkpoint cũ.

## Mục tiêu

Đưa quy tắc nhắc lãi theo ngày thu/đóng thực tế từ C43 lên Supabase dùng chung, kiểm chứng trên
stable Preview rồi rollout source C41/C43 lên Production. Supabase dùng chung phục vụ cả hai môi
trường; migration sẽ tác động nghiệp vụ thông báo Production trước khi web được promote.

## Phạm vi và acceptance criteria

1. Chụp baseline read-only cho migration, hai khoản 700/400, notification, Push delivery, scheduler
   và alias Preview; xác minh rollback target. Không công khai dữ liệu tài chính cá nhân.
2. Chạy lại toàn bộ local gate và DB lint/pgTAP trên database test cô lập.
3. Áp migration C43 qua quy trình migration, không sửa database bằng SQL ad hoc; hậu kiểm version,
   quyền `service_role`, số khoản/giao dịch, notification thread và idempotency.
4. Từ repository root dùng `pnpm deploy:preview`; candidate đúng project, target Preview,
   `READY`, Functions `sin1`, public/authenticated smoke đạt, rồi mới chuyển stable alias.
5. Hậu kiểm stable: cả khoản chưa thu đến ngày vận hành được làm mới trong chu kỳ scheduler kế tiếp,
   mỗi khoản một card, đúng số ngày quá hạn và Push revision; phân biệt rõ việc chưa có subscription,
   không đến giờ gửi, delivery lỗi hoặc đã gửi. Không gọi worker thủ công ngoài giờ đã chọn.
6. Nếu hậu kiểm alias thất bại, trả alias về deployment tốt trước đó; báo rõ migration database
   dùng chung không thể rollback bằng alias web.
7. Xác minh Production rollback target, tạo candidate bằng `vercel deploy --prod --skip-domain` từ
   repository root; kiểm tra đúng project, target Production, `READY`, Functions `sin1` và smoke
   immutable URL. Chỉ promote `https://tindung.vercel.app` sau authenticated smoke và runtime log
   sạch; smoke lại stable và trả alias về rollback target nếu hậu kiểm thất bại.
8. Hậu kiểm notification ngày vận hành và Push theo đúng giờ cấu hình; không tạo giao dịch tài chính
   hoặc gửi Push thủ công ngoài giờ.

## Ngoài phạm vi

Không đổi scheduler/giờ gửi/secret, không tạo giao dịch tài chính, không thao tác Google resources
hoặc Git push. C38 vẫn tạm dừng.

## Tiến độ 2026-09-17

- Local gate đạt `git diff --check`, lint, typecheck, 74 unit/script tests, build, Auth 6/6,
  E2E 21/21; DB lint sạch và pgTAP 477/477 trên database test cô lập.
- Supabase dùng chung đã áp migration `20260917100000` trong transaction; fingerprint hàm
  `094c46de0225d53c838b5dd4119504b6` khớp database test. Dữ liệu tài chính giữ nguyên
  38 khoản vay và 381 giao dịch; notification 36 và Push delivery 36 không đổi. Quyền chỉ
  `service_role` được execute; 0 card trùng `thread_key`.
- Preview candidate `dpl_AjvS8ir8eeq8t4V4YmKc12ymedWu`, immutable
  `https://quan-ly-vay-ca-nhan-30egqfx0x-ngotuong2105.vercel.app`, target Preview, Ready,
  Functions tại `sin1`, public smoke đạt, log chưa có lỗi. Rollback target trước promote là
  `dpl_Eo2gQT4WVwWBFEaorQD8i9rAkyA9`.
- Authenticated smoke dùng tài khoản C36 theo xác nhận của người dùng, không tạo giao dịch. Sau
  rollout tài khoản đã trở lại inactive/banned, 0 session và 0 refresh token; chỉ còn 1 OWNER hoạt
  động.

## Kết quả hoàn tất

### Preview

- Stable Preview đã chuyển sang candidate `dpl_AjvS8ir8eeq8t4V4YmKc12ymedWu`, immutable
  `https://quan-ly-vay-ca-nhan-30egqfx0x-ngotuong2105.vercel.app`, target Preview, `READY`, đúng
  project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, Functions `sin1`.
- Public smoke đạt; authenticated smoke trên immutable và `https://tindung-preview.vercel.app` đạt
  `/dashboard`, `/notifications`, `/loans`, `/loans/new` ở 390 px, không tràn ngang và console sạch.
  Runtime error log trống; rollback target `dpl_Eo2gQT4WVwWBFEaorQD8i9rAkyA9` không phải kích hoạt.

### Production

- Rollback target được xác minh trước promote: `dpl_DePegwVo77qL5WFUiYp7vMtxKKK1`, immutable
  `https://quan-ly-vay-ca-nhan-5px8csi7w-ngotuong2105.vercel.app`, target Production, `READY`.
- Candidate Production `dpl_9KogDrgcDVQnpqhr7TPobpNwTmAi`, immutable
  `https://quan-ly-vay-ca-nhan-qs4nhif6u-ngotuong2105.vercel.app`, target Production, `READY`, đúng
  project và Functions `sin1`. Public/authenticated smoke immutable đạt trước promote.
- `https://tindung.vercel.app` đã trỏ đúng candidate. Public smoke trả `/login` và manifest 200,
  hai endpoint bảo vệ 401; authenticated smoke bốn route đạt, mobile không tràn ngang, console và
  runtime error log sạch. Rollback không phải kích hoạt.

### Hậu kiểm dữ liệu và lịch nhắc

- Remote giữ nguyên 38 khoản vay, 381 giao dịch và 36 notification; 0 thread hiện hành trùng khóa.
  Ngày 2026-09-17 có 4 card hiện hành và cả 4 có dòng `Quá hạn : N ngày`.
- Supabase Cron `qlv-notification-runner-hourly` vẫn active theo `0 * * * *`; lần đọc gần nhất lúc
  09:00 UTC thành công. Rollout diễn ra sau giờ nhận 12:00 Việt Nam nên 10 delivery revision mới
  đang `PENDING` và sẽ chỉ đủ điều kiện ở lần 12:00 kế tiếp. Không gọi worker thủ công ngoài giờ.
  Đây là điểm quan sát kế tiếp của C38, không phải lỗi deploy web.
- Tổng Push delivery tăng từ 36 lên 46 do revision notification tự động; không có giao dịch tài
  chính, thay secret/scheduler, thao tác Google hoặc Git push.
