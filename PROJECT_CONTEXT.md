---
project: QuanLyVayCaNhan
roadmap_version: 1.0.180
last_updated: 2026-09-15 11:30:58 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C38
current_status: APPROVED
last_completed_checkpoint: C39
next_checkpoint: C38
---

# Project Context

Tệp này chỉ chứa trạng thái hiện hành để handoff. Nhật ký chi tiết, kế hoạch đã hoàn tất và các cổng
phê duyệt cũ nằm trong Git history, không phải chỉ dẫn cho phiên làm việc mới.

## 1. Trạng thái hiện tại

- C36 `COMPLETED` ngày 2026-09-14 theo `docs/C36_C35_PREVIEW_ROLLOUT.md`: migration C35 đã active
  trên Supabase dùng chung và source C33/C35 đã lên stable Preview. Candidate/stable đạt toàn bộ
  gate, public/authenticated smoke, console và runtime hậu kiểm; tài khoản EDITOR tạm đã
  inactive/banned và không tạo dữ liệu tài chính.
- C37 `COMPLETED` ngày 2026-09-14 theo `docs/C37_C35_PRODUCTION_ROLLOUT.md`: source C33/C35 đã lên
  Vercel Production; immutable/stable đạt toàn bộ gate, public/authenticated smoke, console và
  runtime hậu kiểm. Migration C35 không chạy lại; tài khoản EDITOR tạm đã inactive/banned.
- C39 `COMPLETED` local ngày 2026-09-15: **Tất toán** là nút danger cạnh **Ghi giao dịch** ở Tổng
  quan và mở BottomSheet riêng; tab Thiết lập được chia theo điều khoản, điều chỉnh, dữ liệu cũ/sửa
  sai và vùng danger; quản trị người dùng ưu tiên tài khoản hoạt động, gom tài khoản vô hiệu hóa vào
  nhóm thu gọn. Không đổi RPC, dữ liệu, schema hoặc quyền. Gate đạt `git diff --check`, lint,
  typecheck, 74/74 unit/script tests, build, Auth 6/6 và E2E 21/21. Bằng chứng tại
  `docs/C39_LOAN_ACTION_SETTINGS_ACCOUNT_UX_PLAN.md`.
- C38 đã được người dùng cho phép tạm hoãn ngày 2026-09-15 và vẫn ở `APPROVED`; baseline read-only
  đã xác nhận notification đúng. Heartbeat C38 vẫn `PAUSED`; chỉ tiếp tục phần Push sau giờ nhận khi
  người dùng yêu cầu tiếp tục, không tự động nối checkpoint.
- Supabase chỉ có 1 tài khoản OWNER đang hoạt động; 30 tài khoản kỹ thuật đã vô hiệu hóa/ban, gồm
  tài khoản smoke C36. Ba tài khoản C21 có tham
  chiếu tài chính `ON DELETE RESTRICT`; 26 tài khoản đã audit ở C35 và tài khoản smoke C36 không có
  tham chiếu tài chính nhưng trigger
  `private.validate_profile_governance()` cấm xóa mọi profile. Lệnh xóa fail-closed đã rollback toàn
  transaction với SQLSTATE `55000`; không tắt trigger hoặc sửa lịch sử. Danh sách và biện pháp thay
  thế được ghi trong kế hoạch C35.
- C33 được người dùng phê duyệt trực tiếp và `COMPLETED` local ngày 2026-09-14 theo
  `docs/C33_FILTER_CHART_INTERACTION_PLAN.md`: hai trường ngày `Từ`/`Đến` cùng hàng, bằng nhau ở
  mobile; cột dòng tiền hỗ trợ tap/click/keyboard với tooltip nằm trọn trong biểu đồ. Gate đạt
  `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6 và E2E 21/21.
- C34 `COMPLETED` ngày 2026-09-14: đúng commit C33 `697bd25` đã lên stable Preview qua candidate
  `dpl_5CcFRo14rfrr1JoSJmd3Vizi5N8M`; C35 và migration C35 không nằm trong rollout này.
- C35 `COMPLETED` và đã rollout đầy đủ: Preview qua C36, Production qua C37.
- C32 được người dùng phê duyệt trực tiếp và `COMPLETED` ngày 2026-09-14 theo
  `docs/C32_C30_PRODUCTION_ROLLOUT.md`: source C30 đã được rollout từ stable Preview lên Vercel
  Production; immutable/stable authenticated smoke và runtime hậu kiểm đều đạt. Không chạy lại
  migration.
- C31 được người dùng phê duyệt trực tiếp và `COMPLETED` ngày 2026-09-13 theo
  `docs/C31_C30_PREVIEW_ROLLOUT.md`: migration notification C30 đã hoạt động trên Supabase dùng
  chung; candidate đã đạt toàn bộ gate, authenticated smoke và hậu kiểm stable Preview. Không deploy
  Vercel Production.
- C30 được người dùng phê duyệt trực tiếp và `COMPLETED` local ngày 2026-09-13 theo
  `docs/C30_NOTIFICATION_FILTER_UX_PLAN.md`: Push/Notification Center dùng copy nhiều dòng có số ngày
  quá hạn; card chưa đọc rõ hơn; control lọc/tìm kiếm đồng bộ 44px; dialog form căn giữa và date
  filter không chồng lấn ở 320/375px cùng landscape. C31/C32 đã rollout Preview và Production.
- C29 rollout C27/C27A từ stable Preview đã kiểm chứng lên Vercel Production được người dùng phê
  duyệt trực tiếp và `COMPLETED` ngày 2026-09-13 theo `docs/C29_C27_PRODUCTION_ROLLOUT.md`.
  Production stable đã qua public/authenticated smoke và hậu kiểm runtime; không migration, thay dữ
  liệu tài chính, remote secret, Google resources hoặc Git push.
- C28 rollout C27 lên Vercel Preview đã `COMPLETED` ngày 2026-09-13 theo
  `docs/C28_C27_PREVIEW_ROLLOUT.md`. Phạm vi không gồm Production, migration, dữ liệu tài chính,
  thay đổi secret, Google resources hoặc Git push.
- C27A thay toàn bộ brand logo/app icon bằng mẫu `Ngô Tường Financial Workspace` được người dùng
  cung cấp và phê duyệt trực tiếp ngày 2026-09-12; đã `COMPLETED` local, chỉ thay tài sản/metadata
  giao diện và không đổi logic, API, dữ liệu, routing hay chức năng.
- C27: Chuẩn hóa Design System và Tối ưu UI/UX Frontend đã `COMPLETED` local ngày 2026-09-12
  theo `docs/C27_DESIGN_SYSTEM_UIUX_PLAN.md`; C28/C29 đã rollout Preview và Production.
- C0–C26 đã `COMPLETED`; C26 rollout C25 lên Preview/Production hoàn tất ngày 2026-09-12.
- C23 sửa kỳ so sánh dashboard, cách ly dữ liệu QA C21 khỏi số liệu vận hành/Google Sync nhưng giữ
  audit append-only; rollout chỉ áp dụng Preview.
- C22 đã tất toán có audit 6 khoản `C21 TEST ONLY` trên Preview, không xóa vật lý; dashboard stable
  đã trở về số liệu thật và tài khoản kỹ thuật tạm đã bị vô hiệu hóa.
- C21 hoàn tất sau khi người dùng ủy quyền tự tạo tài khoản/giao dịch test và QA mobile tự động.
- C20: khắc phục audit, bỏ VietQR/tạo phiếu và nâng cấp UI/UX; phạm vi và acceptance criteria
  tại `docs/IMPLEMENTATION_PLAN.md` và `docs/C20_REMEDIATION_PLAN.md`.
- Người dùng đã phê duyệt triển khai C20 trong hội thoại ngày 2026-09-07.
- C20 đã nghiệm thu local với dữ liệu giả; remote rollout cần phạm vi/phê duyệt riêng.
- Worktree chuẩn ở branch `main`; dùng `git status --short --branch` để kiểm tra commit chưa push.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.
- Chính sách mật khẩu vẫn là tối thiểu 6 ký tự ASCII chữ hoặc số; không tự thay đổi.
- Sau rotate VAPID C19, mỗi thiết bị muốn nhận Web Push phải bấm **Bật thông báo** lại.

## 2. Nguồn sự thật hiện hành

Ưu tiên theo `AGENTS.md`. Trong repository:

1. `PROJECT_CONTEXT.md`: trạng thái vận hành và checkpoint hiện tại.
2. `docs/IMPLEMENTATION_PLAN.md`: danh sách checkpoint và trạng thái tóm tắt.
3. Các contract/runbook còn hiệu lực:
   - `docs/DOMAIN_SPEC.md`, `docs/FINANCIAL_ENGINE.md`
   - `docs/AUTH.md`, `docs/WEB_WORKFLOWS.md`, `docs/DASHBOARD.md`
   - `docs/PWA_NOTIFICATIONS.md`, `docs/GOOGLE_SYNC.md`
   - `docs/BACKUP_RESTORE.md`, `docs/CI.md`, `docs/VERCEL_PREVIEW_RUNBOOK.md`
   - `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`
4. Migration, test và code hiện tại là bằng chứng triển khai.

Không dùng commit message, revision log, ảnh audit cũ hoặc nội dung đã xóa trong Git history để suy
ra yêu cầu đang chờ, quyền thao tác remote hay checkpoint mới.

## 3. Kiến trúc và bất biến

- Monorepo pnpm: Next.js PWA ở `apps/web`, Apps Script ở `apps/google-sync`, contract dùng chung ở
  `packages/domain-contract`, migration/test PostgreSQL ở `supabase`.
- Supabase PostgreSQL là nguồn dữ liệu chuẩn; Google Sheets chỉ đồng bộ một chiều để đối chiếu.
- Frontend chỉ mutate qua Server Actions/RPC đã validate; bộ máy tính lãi authoritative ở PostgreSQL.
- Giao dịch tài chính không xóa vật lý; sửa sai bằng reversal/correction và audit append-only.
- Tiền VND dùng số nguyên, lãi suất dùng decimal; ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`, audit UTC.
- Web Push và Google Sync phải idempotent; secret chỉ nằm trong kho secret của môi trường.
- Production/Preview dùng Supabase `hmfxnstrqfqpvsgfmjmd`, hiện có 31 migration; bộ pgTAP local có
  448 assertions.

## 4. Tài khoản và tài nguyên remote

- Google Apps Script, Sheets/Drive và Vercel: `vipmoschino@gmail.com`; giao diện có thể hiển thị
  `ngotuong077@gmail.com` cho cùng tài khoản.
- Supabase: `tuongnt2105@gmail.com`; CLI profile `quanlyvay`.
- GitHub private: `https://github.com/ngotuong/quanlyvay.git`, branch `main` theo dõi `origin/main`.
- Supabase Singapore: project ref `hmfxnstrqfqpvsgfmjmd`.
- Vercel project `quan-ly-vay-ca-nhan`, ID `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, Functions `sin1`.
- Google Sheet authoritative để đối chiếu:
  `1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8`.
- Apps Script `QuanLyVayCaNhanSync`:
  `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`.
- Drive backup folder: `1loMcJEzDvy5r38K2nz7nCqQHg9KFfz_P`.

Không lưu secret trong repository. Database password, API keys, VAPID và các secret vận hành nằm
trong macOS Keychain/Vercel/Supabase Vault tương ứng.

## 5. Baseline Production sau C19

- Supabase: migration 24/24, DB lint sạch, trigger sanitize audit active.
- Dữ liệu kiểm chứng: 16 đối tác, 31 khoản vay, 338 giao dịch, 526 kỳ lãi, 15 lifecycle,
  9 correction và 489 audit.
- Không còn raw `endpoint`, `p256dh`, `auth_secret` trong Push audit; subscription và delivery cũ
  đều bằng 0 sau rotate VAPID.
- Preview C19: `dpl_2q4dg4wWqW7YQoLaQv9m6Wvc329u`, immutable
  `https://quan-ly-vay-ca-nhan-7syj4kwwp-ngotuong2105.vercel.app`, Ready/`sin1`.
- Production C19: `dpl_4o6JerspEoJUbgu3qXr27twuZZSd`, immutable
  `https://quan-ly-vay-ca-nhan-kdq1gu7kh-ngotuong2105.vercel.app`, Ready/`sin1`.
- Public/authenticated smoke và runtime log của hai deployment đều đạt.
- Google Sheet full sync có 489 audit và không chứa ba Push secret.
- Snapshot sạch `QLV_Snapshot_2026-08-31-C19-clean`, ID
  `1Hebj6010rovOPIWKr2a8JieSnajYg7a8PzqiOL0Ec2g`.
- Backup sạch `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260831T160647Z-c19-clean` đạt SHA-256,
  AES-256-GCM, SQL gate và restore rehearsal cô lập. Thư mục Drive chỉ còn snapshot sạch cùng ba
  tệp backup sạch.

## 6. Gate và thay đổi gần nhất

- C37 hoàn tất rollout source C33/C35 lên Production. Rollback target C32
  `dpl_3zLcZo3vQgGiAAjgzpgNTz3p8bzX` đã được xác minh. Candidate
  `dpl_E5yFNn2qmsquDW4wXDf2Pddz3Nt6`, immutable
  `https://quan-ly-vay-ca-nhan-j85cgaavq-ngotuong2105.vercel.app`, target Production, `READY`,
  đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 43 Function ứng dụng ở `sin1`, middleware
  toàn cầu đúng cấu hình. `https://tindung.vercel.app` trỏ đúng candidate; không rollback.
- Gate C37 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6 và E2E
  21/21. Public smoke immutable/stable đạt 200 cho login/manifest, 401 cho API bảo vệ. Authenticated
  smoke cả hai URL đạt Dashboard/biểu đồ, Notification Center, Cài đặt/redirect `/account`, khoản
  vay/filter C33/C35 và phân quyền EDITOR; console sạch, runtime 0 error/0 fatal.
- Tài khoản EDITOR C36 được mở lại sau xác nhận trực tiếp, không tạo dữ liệu tài chính hoặc đổi Push,
  rồi đã inactive/banned; phiên bị thu hồi và đăng nhập lại bị từ chối. Không chạy lại migration,
  đổi secret/scheduler, Google resources, Git remote hoặc Git push.

- C36 hoàn tất rollout source C33/C35 lên stable Preview. Candidate
  `dpl_m5ubMxZxidzgnjawrxyLEVUL5CvA`, immutable
  `https://quan-ly-vay-ca-nhan-ohjwewlit-ngotuong2105.vercel.app`, target Preview, `READY`, đúng
  project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 44/44 output Function ở `sin1`. Stable alias trỏ
  đúng candidate; rollback target C34 `dpl_5CcFRo14rfrr1JoSJmd3Vizi5N8M` không phải kích hoạt.
- Supabase dùng chung đã có đủ 31 migration, mới nhất `20260914150000`; checksum hàm notification
  là `12cb12366774794dd85856b8bd510a79`, chỉ `service_role` execute. Scheduler hourly vẫn active;
  số lượng loan/transaction/notification/push delivery giữ nguyên `37/378/27/6` sau migration.
- Gate C36 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6, E2E
  21/21, DB lint sạch và pgTAP 448/448. Một lượt continuation dừng trước alias vì hai assertion E2E
  không ổn định; lượt chạy sạch kế tiếp đạt 21/21 rồi mới promote. Authenticated smoke immutable và
  stable đạt Notification Center/Cài đặt/redirect `/account`, khoản vay, filter C33 và biểu đồ có
  tooltip; browser console và runtime 0 error/0 fatal. Tài khoản smoke đã inactive/banned, đăng nhập
  lại bị từ chối; không có mutation tài chính, Production deploy, secret/scheduler/Google/Git push.

- C34 hoàn tất rollout đúng source C33 lên stable Preview. Candidate
  `dpl_5CcFRo14rfrr1JoSJmd3Vizi5N8M`, immutable
  `https://quan-ly-vay-ca-nhan-55rb62mxf-ngotuong2105.vercel.app`, target Preview, `READY`, đúng
  project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 44/44 Functions ở `sin1`. Rollback target C31
  `dpl_8cuYqL5y4ALYYpGskEbq5X8yPwwo` đã được xác minh và không phải kích hoạt.
- Authenticated smoke immutable đạt desktop/mobile: hai input `Từ`/`Đến` cùng hàng, rộng bằng nhau
  152,5px, cao 44px tại 375×812; không tràn ngang. Biểu đồ nhận click/tap/phím Space và tooltip
  `431.050.000 ₫` nằm trong viewport. Console sạch. `https://tindung-preview.vercel.app` trỏ đúng
  candidate; hậu kiểm `/login`/manifest 200, API bảo vệ 401 và runtime 0 error/0 fatal.
- Gate C34 được `pnpm deploy:preview` chạy hai lượt đều đạt `git diff --check`, lint, typecheck,
  74/74 unit/script tests, build và E2E 21/21. Tài khoản `c34_smoke_mu102krb` không tạo dữ liệu tài
  chính, đã inactive/banned và đăng nhập lại bị từ chối. Không migration, đổi secret, Production,
  Google resources hoặc Git push.
- C35 hoàn tất local: migration thứ 31 tạo lại nhắc lãi mỗi ngày khi nghĩa vụ đến hạn còn dư và
  dừng khi đã thanh toán/BAD_DEBT/SETTLED; card Push dùng switch viên thuốc, giờ nằm cùng hàng và tự
  lưu; `/account` chuyển hướng `/settings`, mọi vai trò tự quản lý tài khoản còn OWNER mới thấy quản
  trị người dùng. Gate đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth
  6/6, E2E 21/21, DB lint sạch và pgTAP 448/448.
- Audit tài khoản remote C35 xác nhận 29 tài khoản kỹ thuật đều inactive/banned. Ba tài khoản C21
  có 36 tham chiếu trực tiếp tới đối tác/khoản vay/giao dịch; 26 tài khoản còn lại có 0 tham chiếu
  trong bảy bảng audit tài chính. Lệnh xóa chính xác 26 tài khoản đã bị profile-governance trigger
  chặn và rollback toàn bộ; hậu kiểm vẫn có đủ 29 profile inactive. Không có dữ liệu bị xóa một
  phần, không đổi tài chính, không deploy, không migration remote, không đổi secret hay Git remote.
- C32 hoàn tất rollout C30 lên Production. Rollback C29
  `dpl_3kKvGQd5Ym6GjjJRdZm6d2YMwQFx` đã được xác minh trước promote. Candidate
  `dpl_3zLcZo3vQgGiAAjgzpgNTz3p8bzX`, immutable
  `https://quan-ly-vay-ca-nhan-l9vb87op2-ngotuong2105.vercel.app`, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, `Ready`; 44/44 output Function ở `sin1`.
  `https://tindung.vercel.app` đã promote đúng candidate; rollback không phải kích hoạt.
- Gate C32 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6 và E2E
  21/21. Public/authenticated smoke trên immutable và stable đạt cho notification nhiều dòng, nền
  đọc/chưa đọc, modal bộ lọc/date mobile và chống tràn ngang; console sạch. Runtime log candidate và
  hậu kiểm stable có 0 error/0 fatal. Hai tài khoản EDITOR kỹ thuật đã deactivate/ban; hai
  notification giả phi tài chính đã xóa, không tạo khoản vay/giao dịch. Không chạy lại migration,
  đổi remote secret, Google resources hoặc Git push.
- C31 hoàn tất rollout C30 lên stable Preview. Supabase dùng chung đã có đủ 30 migration, phiên bản
  mới nhất `20260913165000`; hàm notification C30 active, chỉ `service_role` có quyền execute và
  notification chưa đọc được làm mới đúng copy nhiều dòng. Candidate
  `dpl_8cuYqL5y4ALYYpGskEbq5X8yPwwo`, immutable
  `https://quan-ly-vay-ca-nhan-ggwaigsrx-ngotuong2105.vercel.app`, target Preview, `Ready`, đúng
  project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 44/44 output Function ở `sin1`.
  `https://tindung-preview.vercel.app` đã trỏ đúng candidate; rollback target C28
  `dpl_5M1XWMy69HrkAPVdPCmZtk9EzqF1` đã được xác minh và không phải kích hoạt.
- Gate C31 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6,
  E2E 21/21, DB lint sạch và pgTAP 444/444. Public smoke đạt; authenticated smoke trên immutable và
  stable xác nhận notification nhiều dòng, nền đọc/chưa đọc khác nhau, modal bộ lọc căn giữa, hai ô
  ngày không chồng lấn, không còn nút `Đóng` thừa và mobile không tràn ngang. Console sạch; runtime
  hậu kiểm có 0 error/0 fatal. Hai tài khoản EDITOR kỹ thuật đã bị deactivate/ban; hai notification
  giả phi tài chính đã xóa, không tạo khoản vay/giao dịch. Không deploy Production, Git push, đổi
  remote secret hoặc Google resources.
- C30 hoàn tất local: migration thứ 30 tạo nội dung nhắc lãi ba dòng và quá hạn bốn dòng bằng số
  tiền authoritative, đồng thời làm mới notification chưa đọc; Notification Center bỏ tên khoản
  vay lặp và tăng nền/viền/nhãn cho trạng thái chưa đọc. Control lọc, tìm kiếm và giờ thông báo dùng
  chiều cao 44px/font 16px; form dialog căn giữa trên mobile/desktop, còn menu `Thêm` mobile giữ
  bottom sheet. Bộ lọc nâng cao dùng một cột trên mobile, bỏ nút chữ `Đóng` phía dưới nhưng vẫn có
  nút ×, Escape và backdrop.
- Gate C30 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, production build,
  Auth 6/6, E2E 21/21, DB lint sạch và pgTAP 444/444 trên database test cô lập với 30 migration.
  E2E kiểm tra copy Push/Notification Center, nền đọc/chưa đọc, control 44px, dialog/date input ở
  320px, 375px và landscape; ảnh QA light/dark của `/notifications` không tràn ngang. Không deploy,
  migration remote, thay dữ liệu thật, secret, Google resources hoặc Git push.
- C29 hoàn tất rollout C27/C27A lên Production. Candidate `dpl_3kKvGQd5Ym6GjjJRdZm6d2YMwQFx`,
  immutable `https://quan-ly-vay-ca-nhan-ifzext0p6-ngotuong2105.vercel.app`, target `production`,
  `Ready`, đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 43 Function ứng dụng ở `sin1` và
  middleware toàn cầu có `sin1`. `https://tindung.vercel.app` đã promote đúng candidate; rollback
  target C26 `dpl_66uiiExUfXXNnS3KCajLhNmgkqyw` không phải kích hoạt.
- Gate C29 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build, Auth 6/6 và
  E2E 21/21. Public smoke immutable/stable đạt 200 cho login/manifest và 401 cho hai API được bảo
  vệ. Authenticated smoke trên cả hai URL đạt cho 6 route chính, Quick Action/BottomSheet, menu
  mobile, chống tràn ngang và bộ brand/favicon/Apple/PWA icon; browser console sạch. Runtime log
  candidate/hậu kiểm có 0 error và 0 fatal. Hai tài khoản EDITOR smoke đã deactivate/ban, không tạo
  giao dịch hoặc dữ liệu tài chính; credential và bằng chứng có dữ liệu thật đã được xóa khỏi cache.
  Không chạy DB gate/migration vì C29 không đổi database; Auth/E2E đã reset đủ 29 migration local.
- C28 hoàn tất rollout C27 lên stable Preview. Candidate `dpl_5M1XWMy69HrkAPVdPCmZtk9EzqF1`,
  immutable `https://quan-ly-vay-ca-nhan-b2fdfk4z9-ngotuong2105.vercel.app`, target Preview,
  `Ready`, đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; 44/44 Lambda ở `sin1`.
  `https://tindung-preview.vercel.app` đã trỏ đúng candidate; rollback target C26
  `dpl_8RwYQmGmqUD67wJeDMDzqveh1gz7` không phải kích hoạt.
- Gate rollout C28 đạt `git diff --check`, lint, typecheck, 74/74 unit/script tests, build và
  E2E 21/21. Public smoke trên immutable/stable đạt; authenticated smoke trên cả hai URL đạt cho
  Dashboard, khoản vay, đối tác, chi phí, thông báo, tài khoản, Quick Action/BottomSheet, menu mobile,
  brand/PWA icons và chống tràn ngang; browser console sạch. Runtime log hậu kiểm có 0 error và
  0 fatal. Bốn tài khoản `C28 Preview Smoke` phục vụ các lần chẩn đoán/smoke đều đã bị vô hiệu hóa
  và ban; không tạo giao dịch hoặc dữ liệu tài chính. Không migration, đổi remote secret, deploy
  Production, thao tác Google hay Git push.
- C27 hoàn tất local: thêm UI primitives dùng chung (Button, Input/Select/Textarea, VndInput,
  Badge, Card, Tabs, Toast và BottomSheet), chuyển palette sang trust-blue/cobalt, chuẩn hóa elevation,
  motion và z-index; Dashboard cùng các trang khoản vay/đối tác/chi phí/cài đặt đã dùng primitives.
  Danh sách khoản vay có Quick Action ghi giao dịch, chi tiết khoản vay tự mở sheet qua deep link;
  menu mobile và bộ lọc nâng cao dùng BottomSheet có Escape/chạm ngoài/vuốt đóng. Toast phản hồi
  Server Action tự ẩn và vẫn có live-region. `globals.css` giảm từ khoảng 99,8 KB xuống 74,6 KB,
  CSS primitives/playground được tách riêng. Không đổi logic nghiệp vụ, API, routing, dữ liệu,
  migration hoặc Privacy SSR.
- Gate C27 ngày 2026-09-12 đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests,
  production build, Auth 6/6 và E2E 21/21. E2E bao phủ 375/768/1024/1440, light/dark,
  Quick Action, Toast tự ẩn, BottomSheet đóng bằng nút/Escape/chạm ngoài/vuốt và không tràn ngang.
  DB lint/pgTAP không chạy lại vì C27 không có thay đổi database; E2E/Auth đã reset đủ 29 migration
  trên local. Không deploy, Git push, đổi secret hoặc tài nguyên remote.
- C27A hoàn tất local: sidebar, đăng nhập và đổi mật khẩu dùng biểu tượng vô cực mới với kích thước
  hiển thị cố định; favicon 16/32 dùng bản không chữ; Apple Touch Icon 180 và PWA 192/512/maskable
  dùng bộ nhận diện mới. Metadata, manifest, Web Push icon/badge và service worker đã chuyển reference;
  asset cũ chỉ được xóa sau khi quét source không còn reference. Gate đạt `git diff --check`, lint,
  typecheck, toàn bộ unit/script tests, build và E2E 21/21. Không deploy, migration, thay dữ liệu,
  remote secret, Google resources hay Git remote.
- C26 đã rollout C25 lên Preview và Production. Preview candidate
  `dpl_8RwYQmGmqUD67wJeDMDzqveh1gz7`, immutable
  `https://quan-ly-vay-ca-nhan-o98f4jlj4-ngotuong2105.vercel.app`; stable
  `https://tindung-preview.vercel.app` đã trỏ đúng candidate. Production candidate
  `dpl_66uiiExUfXXNnS3KCajLhNmgkqyw`, immutable
  `https://quan-ly-vay-ca-nhan-nxf62gt51-ngotuong2105.vercel.app`; stable
  `https://tindung.vercel.app` đã promote thành công. Rollback Production là
  `dpl_GPWF8qZJPFdRbtBpp9awZAZtuGtC` và không phải kích hoạt.
- Hai candidate đều `Ready`, đúng target và toàn bộ Function ứng dụng ở `sin1`; public cùng
  authenticated smoke trên immutable/stable đều đạt. Hậu kiểm xác nhận 4 KPI dùng nội dung rút gọn,
  `/loans` mặc định `ACTIVE`, `status=ALL` hoạt động và 11 thẻ `SETTLED` có ngày tất toán;
  console/runtime error log sạch. Gate rollout chạy lại đạt lint, typecheck, 73/73 unit/script,
  build và E2E 21/21. Không migration, không giao dịch tài chính, không đổi Google/secret/Git remote.
- C25 hoàn tất local: thẻ `SETTLED` hiển thị `Ngày tất toán`; `/loans` mặc định
  `ACTIVE` và `status=ALL` thật sự bỏ lọc; KPI chỉ hiện icon hướng cùng số chênh lệch,
  trong khi screen reader/tooltip vẫn có nhãn đầy đủ. Gate đạt: `git diff --check`, lint,
  typecheck, 73/73 unit/script tests, build và E2E 21/21 trên 5 viewport/light-dark.
- C24 hoàn tất rollout C20–C23 lên Production. Candidate
  `dpl_GPWF8qZJPFdRbtBpp9awZAZtuGtC`, immutable
  `https://quan-ly-vay-ca-nhan-l6dmwcbvz-ngotuong2105.vercel.app`, target `production`, `Ready`;
  toàn bộ Functions có `sin1`. Rollback target là C19 `dpl_4o6JerspEoJUbgu3qXr27twuZZSd`.
- `https://tindung.vercel.app` đã trỏ đúng C24. Public smoke (`/login` 200, manifest 200,
  export không secret 401), authenticated smoke trên immutable/stable, console và runtime error log đều đạt.
  Số liệu 01–11/09: cho vay hoạt động `3.850.000.000 ₫`, lãi ròng `7.030.000 ₫`,
  tiền vào `107.800.000 ₫`, tiền ra `100.770.000 ₫`; QA không xuất hiện trong list/Sync.
- Gate C24 ngày 2026-09-11 đạt: `git diff --check`, lint, typecheck, 73/73 unit/script tests,
  build, Auth 6/6, E2E 21/21, remote DB lint sạch và pgTAP 443/443.
- Production và Preview dùng cùng Supabase `hmfxnstrqfqpvsgfmjmd`; remote đã có đủ 29/29
  migration trước C24 nên không chạy migration lần hai và không phát sinh DB mutation/backup.
  C24 không Git push, không thay Google resources hay remote secret.
- C23 local đã triển khai: KPI dòng tiền/lãi dùng cùng kỳ lịch, KPI số dư dùng mốc trước đầu kỳ;
  card hiển thị rõ ngày so sánh. Migration thêm phân loại `is_test_data`, cách ly QA khỏi dashboard,
  danh sách khoản vay/đối tác và Google Sync nhưng giữ nguyên bản ghi/audit; đồng thời sửa list facts
  để chỉ tính reversal đã có hiệu lực tại ngày chốt.
- Gate C23 ngày 2026-09-10 đạt: `git diff --check`, lint, typecheck, 73/73 unit/script tests, build,
  Auth 6/6, E2E 21/21, DB lint sạch và pgTAP 443/443 trên database reset sạch với 29 migration.
- Preview candidate C23 `dpl_7FLxGSQi3xCxRKRbKobAas9YLFve`, immutable
  `https://quan-ly-vay-ca-nhan-o87p3rtgr-ngotuong2105.vercel.app`, Preview/Ready/Functions `sin1`.
  Preview Supabase đã áp đủ 29 migration và DB lint sạch. Immutable URL cùng stable alias
  `https://tindung-preview.vercel.app` đều đạt authenticated smoke; alias trỏ đúng candidate,
  dashboard/cash-flow/danh sách/Google Sync đúng kỳ vọng, console sạch và error log bằng 0.
- Hậu kiểm stable C23 xác nhận cho vay hoạt động `3.850.000.000 ₫`, nợ xấu
  `510.000.000 ₫`, tổng vốn chưa thu hồi `4.360.000.000 ₫`, dư nợ đi vay
  `1.100.000.000 ₫`; lãi ròng 01–10/09 là `7.030.000 ₫` so với 01–10/08 là
  `3.035.000 ₫`. Dòng tiền tháng 9 là vào `107.800.000 ₫`, ra `100.770.000 ₫`,
  ròng `7.030.000 ₫`; 6 khoản QA không còn xuất hiện trong list/Google Sync.
- Audit authenticated Preview ngày 2026-09-10 xác nhận `Lãi ròng thực thu` 01–10/09 là
  `7.030.000` VND nhưng đang so với 22–31/08 là `51.450.000` VND, gây nhãn giảm `44.420.000`;
  cùng kỳ 01–10/08 chỉ là `3.035.000` VND. Sáu khoản QA còn làm tiền vào/ra tháng 9 phình lên
  khoảng `54.043` nghìn tỷ dù dòng tiền ròng vẫn đúng; C23 xử lý hai nguyên nhân này.
- C22: xác nhận 6 khoản QA × `9.007.199.254.740.993 ₫` (1 ACTIVE, 5 BAD_DEBT), tất toán bằng
  `settle_loan` với idempotency key riêng; cả 6 `SETTLED`, dư gốc 0. Dashboard 2026-09-01–09-09:
  active lending từ `9.007.203.104.740.993` về `3.850.000.000`, bad debt từ
  `45.035.996.783.704.965` về `510.000.000`, total exposure về `4.360.000.000` VND.
- Browser authenticated trên stable Preview xác nhận card “Cho vay đang hoạt động” là
  `3.850.000.000 ₫`; tài khoản cleanup đã deactivate/ban và đăng nhập lại bị từ chối HTTP 400.
- C22 không đổi code ứng dụng, không deploy, không migrate và không xóa audit/financial history.
- C21 local đã đạt: list RPC chỉ tính lãi cho page đã chọn; benchmark 1.000 khoản + 13.000 giao dịch
  có median 102,456 ms, worst 104,726 ms, payload 24.060 bytes/25 cards. DB lint sạch, pgTAP
  431/431 (28 migration local), lint/typecheck, 70 unit/script, build, Auth 6/6 và E2E 21/21 đạt.
- C21 thêm phản hồi điều hướng khoản vay sau ngưỡng 300 ms, có `aria-live`, safe-area và
  reduced-motion; test chậm 500 ms xác nhận trạng thái chờ xuất hiện.
- Stable Preview C21 `dpl_C75aW28nYqMhM8x4owLtJFtAUEyw`, immutable
  `https://quan-ly-vay-ca-nhan-8kd5p2f6z-ngotuong2105.vercel.app`, Preview/Ready/Functions `sin1`.
  Public/authenticated smoke trên immutable URL và stable alias đạt; console sạch, error log bằng 0.
- QA remote dùng tài khoản EDITOR tạm và dữ liệu `C21 TEST ONLY`; payment đã đảo, audit history được
  giữ, tài khoản đã deactivate/ban và đăng nhập lại bị từ chối. Hai profile mobile đạt 11 route,
  touch target 44px, zoom 200%, dark/light, landscape, offline và PWA; stable list→detail 871/837 ms.
- Supabase dùng chung cho Preview/Production có 30 migration sau C31; tính tiền authoritative
  trong DB và VND dùng bigint.
- Bằng chứng chi tiết: `docs/C21_VALIDATION.md`.
- C20 đã hoàn tất local: gỡ VietQR/phiếu; thêm privacy SSR, account mobile, form recovery,
  preview tất toán có xác nhận, phân trang/aggregate, snapshot export nhất quán và Push worker hữu hạn.
- Test riêng: `QuanLyVayCaNhan-C20-test`, config `.cache/c20-test`, API `127.0.0.1:55321`.
  Không reset instance local gốc và không thay đổi remote.
- Gate cuối đạt ngày 2026-09-08: lint, typecheck, unit/script 66 tests, build; Auth 6/6;
  E2E production build local 20/20; DB lint sạch và pgTAP 414/414 (27 migration local);
  `git diff --check` sạch.
- Đã thêm revision acknowledgement và fallback GET-only nếu UI không commit sau action thành
  công; không gửi lại giao dịch. Full E2E sau fallback đạt 20/20.
- QA ảnh từng phát hiện tiền lớn bị cắt trong dashboard card dù trang không tràn; đã sửa
  wrap/min-width, xem lại ảnh desktop/mobile và regression chống cắt đã đạt.
- Hồ sơ đóng phát hiện, benchmark, giới hạn thiết bị và rollout đề xuất: `docs/C20_VALIDATION.md`.
- Benchmark fake: 1.000 khoản từ 2025-01-01, 12.000 giao dịch trả lãi; SQL list cũ 15.003 ms /
  10.393.114 bytes, list phân trang 7.240 ms / 24.060 bytes (25 cards, tổng 1.000).

- 2026-09-07: tạo kế hoạch C20, đồng bộ context/roadmap; chỉ thay đổi tài liệu.
- Audit 2026-09-06 tại local HEAD `6054610`: lint, typecheck, 54/54 unit/script tests và build
  đạt; login Production được xem ở desktop/mobile. Chưa kiểm chứng runtime sau đăng nhập.
- Phiên tạo kế hoạch C20: `git diff --check` đạt; chưa chạy gate triển khai C20.
- Báo cáo `docs/AUDIT_2026-09-06.md` là bằng chứng đầu vào; đề xuất sửa VietQR trong báo cáo
  được thay bằng yêu cầu mới của người dùng: gỡ toàn bộ VietQR và phiếu văn bản.

C19 đạt toàn bộ gate ngày `2026-09-01`:

- `git diff --check`
- lint, typecheck, 54/54 unit/script tests và production build
- Auth 6/6, Playwright E2E 10/10
- Supabase DB lint và pgTAP 385/385
- Production migration list 24/24 và truy vấn hậu kiểm dữ liệu/secret

Commit C19: `eed24e4` — `C19: scrub lịch sử và rotate Web Push`. Các commit local sau `origin/main`
chưa được push; trạng thái chính xác luôn lấy từ `git status --short --branch`.

## 7. Blocker và việc chờ

- C39 không còn blocker và đã hoàn tất local; chưa deploy Preview/Production.
- C38 vẫn tạm dừng theo yêu cầu người dùng; không có blocker kỹ thuật. Heartbeat C38 đang `PAUSED`.
- C37 không còn blocker; Production stable đã trỏ đúng candidate C37 và hậu kiểm đạt.
- C36 không còn blocker; migration C35 và Vercel Preview rollout đã hoàn tất.
- C35 không còn blocker triển khai local và đã hoàn tất theo ngoại lệ acceptance. Việc giảm 30
  profile kỹ thuật xuống một tài khoản QA không thể thực hiện mà không thay đổi bất biến kiến trúc
  “profile không xóa vật lý”; nếu vẫn cần xóa thật phải mở checkpoint migration có kiểm soát riêng.
- C34 không còn blocker; stable Preview đã trỏ đúng candidate C34.
- C33 không còn blocker; đã rollout Preview qua C34 nhưng chưa rollout Production.
- C32 không còn blocker và chưa có checkpoint kế tiếp. C30 đã rollout đầy đủ lên Preview/Production.
- C31 không còn blocker và chưa có checkpoint kế tiếp. C30 đã lên stable Preview; Vercel Production
  vẫn ở C29 và chỉ được rollout trong checkpoint/phê duyệt riêng.
- C30 không còn blocker; migration remote và rollout Preview đã hoàn tất qua C31.
- C29 không còn blocker; Production stable đã trỏ đúng candidate C29 và rollback target C26 không
  phải kích hoạt. Chưa có checkpoint kế tiếp.
- C28 không còn blocker; rollout Preview và hậu kiểm đã hoàn tất. Chưa có checkpoint kế tiếp.
- Không có blocker và chưa có checkpoint kế tiếp. C27/C27A đã được rollout đầy đủ lên Preview và
  Production qua C28/C29.
- C26 không còn blocker. Token CLI Supabase tạm
  `cli_ngotuong@Mac-mini.local_1789127470` đã được thu hồi sau xác nhận của người dùng và credential
  cục bộ đã xóa; tài khoản smoke đã deactivate/ban. Chưa có checkpoint tiếp theo.
- Không còn blocker cho C25.
- Không còn blocker cho C24; chưa có checkpoint tiếp theo chờ phê duyệt.
- Không còn blocker cho C23.
- Không còn blocker cho C22.
- Không còn blocker cho C21. Không có kiểm chứng phần cứng thật; theo ủy quyền mới của người dùng,
  checkpoint dùng Chromium mobile profiles và ghi rõ không thay thế Safari WebKit/phần cứng thật.
- Supabase CLI profile toàn cục hiện lỗi `Unsupported Config Type`; DB lint đã sạch trước lỗi này và
  pgTAP cuối được chạy trực tiếp trong container local sau khi áp đủ migration, không có `not ok`.
- C21 không cho phép Production rollout, Apps Script push hoặc git push.
- Việc đăng ký lại Web Push là thao tác theo từng thiết bị, không chặn chức năng khác.

## 8. Lệnh kiểm tra chuẩn

```bash
git status --short --branch
git diff --check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:auth
pnpm test:e2e
supabase db lint --level warning
supabase test db
```

Các lệnh Supabase/Vercel/Google/GitHub remote vẫn tuân theo cổng phê duyệt trong `AGENTS.md`.
