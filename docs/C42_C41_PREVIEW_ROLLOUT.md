# C42 — Rollout C41 lên Supabase dùng chung và Vercel Preview

Phê duyệt: người dùng phê duyệt trực tiếp ngày 2026-09-16. Trạng thái: `COMPLETED` ngày
2026-09-17.

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

## Kết quả hoàn tất

### Supabase dùng chung

- Đã áp migration `20260916120000_c41_notification_threads.sql`; remote có đủ 32 migration và
  migration mới nhất là `20260916120000`.
- DB lint sạch; reset database cô lập chạy đủ 32 migration và pgTAP đạt 20 file/455 assertion.
- Hậu kiểm quyền/hàm đạt fingerprint `f|t|t|f|2cffed3e3412fc0cd5ccb51dbc614978`;
  không mở quyền thực thi ngoài contract.
- Baseline tài chính không đổi trong rollout: 38 khoản vay và 381 giao dịch. Push delivery giữ
  nguyên 31; không còn luồng notification hiện hành trùng nghĩa vụ.
- Notification smoke tạm và session tạm đã xóa sau khi người dùng xác nhận. Hậu kiểm có 0 bản ghi
  `c42-smoke:notification`, 0 session smoke, 1 OWNER hoạt động và tài khoản smoke C36 duy nhất được
  đưa lại về inactive/banned. Tổng notification còn 36 bản ghi không mang khóa smoke; toàn bộ được
  giữ lại để tránh xóa nhầm dữ liệu vận hành.

### Vercel Preview

- Candidate `dpl_Eo2gQT4WVwWBFEaorQD8i9rAkyA9`, immutable
  `https://quan-ly-vay-ca-nhan-8oo3r6ycr-ngotuong2105.vercel.app`, target Preview, trạng thái
  `READY`, đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 44 output Function ở `sin1`.
- Rollback target đã xác minh: `dpl_m5ubMxZxidzgnjawrxyLEVUL5CvA`, immutable
  `https://quan-ly-vay-ca-nhan-ohjwewlit-ngotuong2105.vercel.app`.
- Candidate đạt public/authenticated smoke. Notification lãi mở đúng BottomSheet
  `INTEREST_PAYMENT` với số tiền authoritative 600.000 VND và không tự submit; trang Khoản vay có
  đúng một CTA desktop/mobile, không tràn ngang; form tạo khoản vay chỉ có một combobox **Đối tác**
  và chọn được bằng Enter. Browser console sạch.
- Stable alias `https://tindung-preview.vercel.app` chỉ được chuyển sau khi candidate đạt gate;
  authenticated smoke lặp lại đạt cùng kết quả. Runtime log candidate/stable có 0 error và 0 HTTP
  500; alias trỏ đúng candidate nên không kích hoạt rollback.

### Gate và ngoại lệ quan sát

- Lượt candidate sạch cuối đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build,
  Auth 6/6 và E2E 21/21; promotion bằng `pnpm deploy:preview` chạy lại cùng bộ gate và tiếp tục đạt
  E2E 21/21.
- Một lượt gate ban đầu chỉ đạt E2E 19/21 do toast biến mất trước assertion và retry expense chậm;
  alias không bị thay đổi ở lượt đó. Lượt chạy sạch kế tiếp đạt 21/21 trước khi tạo/promote
  candidate.
- Thêm `apps/web/scripts/c42-preview-smoke.mjs` để kiểm chứng authenticated smoke có thể lặp lại mà
  không ghi secret vào repository hoặc tạo giao dịch tài chính.
- Không deploy Production, không đổi scheduler/VAPID/secret, không thao tác Google resources và
  không Git push.
