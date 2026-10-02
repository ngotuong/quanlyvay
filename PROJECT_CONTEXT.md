---
project: QuanLyVayCaNhan
roadmap_version: 1.0.243
last_updated: 2026-10-02
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C73
current_status: IN_PROGRESS
last_completed_checkpoint: C72
next_checkpoint: C73
---

# Project Context

Tệp này chỉ chứa trạng thái hiện hành để handoff. Chi tiết checkpoint đã hoàn tất nằm trong Git
history, migration, test và các contract/runbook chuyên biệt.

## 1. Trạng thái hiện tại

- C50 `COMPLETED` ngày 2026-09-22: đã bỏ C38 khỏi roadmap hiện hành và rollout C49 lên
  Production. Candidate `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC`, URL bất biến
  <https://quan-ly-vay-ca-nhan-nqhmlw9kq-ngotuong2105.vercel.app>, target Production,
  `Ready`, Functions `sin1`. Public smoke `/login`, manifest và route khoản vay đạt.
  Authenticated smoke trên khoản vay Ngân ở viewport thực 367 px xác nhận **Giao dịch** và
  **Tất toán** cùng hàng 149×48 px, **Giảm gốc** hàng dưới 305×48 px, không tràn ngang; preview
  400 triệu → trả 300 triệu + lãi chốt 2,8 triệu → kỳ mới 100 triệu cuộn tới nút xác nhận.
  Dialog đã đóng mà không xác nhận hoặc ghi giao dịch; runtime error log sạch.
  `tindung.vercel.app` đã promote và inspect trỏ đúng deployment mới; rollback target là
  `dpl_8Jju8tmv12o8tZ8tQ6ZXWbk6PcFS`, không cần rollback. Không migration, đổi secret hoặc
  push GitHub.
- C49 `COMPLETED` ngày 2026-09-22: nhóm thao tác khoản vay nay có **Giao dịch** và **Tất toán**
  cùng hàng, đồng kích thước; **Giảm gốc** ở hàng riêng bên dưới trên cả mobile và desktop.
  Dialog vẫn dùng tiêu đề đầy đủ **Giảm gốc và mở kỳ mới**, cuộn dọc được sau khi preview dài
  xuất hiện, chặn overscroll ra trang và chừa safe area cuối màn hình. E2E kiểm tra hình học ở
  375/390/1024 px, cuộn thực tới nút xác nhận ở 375/390 px, không tràn ngang và luồng ghi nguyên
  tử vẫn đạt. Không đổi tính lãi, RPC, schema hoặc dữ liệu Production; chưa deploy hay push.
- C48 `COMPLETED` ngày 2026-09-22: rollout C47 lên Supabase/Vercel Production, hậu kiểm không ghi
  dữ liệu tài chính và đồng bộ source/bằng chứng lên GitHub. GitHub CI run `35701912815` lần 2
  đạt Required CI gate.
- C48 đã xác minh bản sao lưu logical Production mã hóa trước migration tại
  `.backups/qlv-prod-20260922T070157Z/` (manifest `qlv-prod-20260922T074535Z`, schema/data
  đủ auth/private/public/supabase_migrations, SHA-256 và GCM đạt). Migration
  `20260922090000_c47_principal_restructure.sql` đã áp vào project `hmfxnstrqfqpvsgfmjmd`;
  remote history và hai bảng/RPC mới đã kiểm tra khớp.
- Candidate Vercel `dpl_8Jju8tmv12o8tZ8tQ6ZXWbk6PcFS`, URL bất biến
  <https://quan-ly-vay-ca-nhan-2h5lh7l3c-ngotuong2105.vercel.app>, target Production,
  `Ready`, Functions `sin1`. `/login`, manifest và auth redirect đạt public smoke. Authenticated
  browser smoke trên khoản vay Ngân đã đạt: nút nghiệp vụ mới hiển thị; preview chỉ đọc 22/9/2026
  cho gốc 400 triệu, trả 300 triệu, lãi chốt đến 21/9 là 2,8 triệu, kỳ mới 100 triệu; không bấm
  xác nhận. Viewport 390 px không tràn ngang; console và runtime error log sạch. Đã promote;
  `tindung.vercel.app` được inspect trỏ đúng deployment này, `/login` và manifest trả 200.
  Rollback target là `dpl_9KogDrgcDVQnpqhr7TPobpNwTmAi`; chưa cần rollback.
- C47 `COMPLETED` ngày 2026-09-22: bổ sung nghiệp vụ nguyên tử **Giảm gốc & mở kỳ mới**. Ngày
  hiệu lực D chốt lãi đến D-1, ghi đúng gốc/lãi thực tế và mở kỳ mới trên dư gốc còn lại từ D;
  không tạo khoản vay/giải ngân giả, không tính trùng ngày. UI có preview authoritative, xác nhận,
  stale-preview guard, bố cục mobile 390 px và lịch sử gộp dễ đối chiếu. Lịch nhắc, dashboard,
  danh sách và Google Sheets dùng/nhận mốc cùng ledger mới. Trạng thái rollout remote ở C48.
- C44 đã rollout source C41/C43 và migration `20260917100000` lên Supabase dùng chung, stable
  Preview và Production. Tại thời điểm C44, Preview trỏ
  `dpl_AjvS8ir8eeq8t4V4YmKc12ymedWu` và Production trỏ `dpl_9KogDrgcDVQnpqhr7TPobpNwTmAi`.
  Public/authenticated smoke, mobile
  390 px, console và runtime error log đều sạch; rollback không kích hoạt.
- C45 đã dọn tài liệu lịch sử khỏi cây làm việc, giữ tài liệu kỹ thuật và checkpoint đang mở;
  xóa cache/test artifact được ignore và xác nhận không có lệnh build/test/deploy bị treo. GitHub
  đã xác thực lại và branch `main` đã nhận đầy đủ chuỗi commit qua `09c0d67`.
- C46 `COMPLETED` ngày 2026-09-18: nâng `next`/`eslint-config-next` từ 16.2.12 lên 16.3.5
  (bản đã vá RCE), cập nhật override `nanoid`, `sharp`, `js-yaml` lên bản đã vá và thêm
  health-check retry có giới hạn trước khi Playwright tạo user E2E. Local audit sạch; toàn bộ gate
  gồm pgTAP 477/477, Auth 6/6 và Playwright 21/21 đạt. Không deploy, migrate remote, thay secret
  hoặc dữ liệu Production. GitHub Actions run `35353744921` cho commit `760d59c` đã đạt cả
  Required CI gate.
- Supabase Cron chạy hằng giờ. 10 Push delivery revision ở trạng thái `PENDING` là hàng đợi vận
  hành hợp lệ sau lần rollout ngoài giờ nhận 12:00, không phải lệnh terminal bị treo và không được
  xóa trong công việc dọn repository.
- Production: <https://tindung.vercel.app>.
- Stable Preview: <https://tindung-preview.vercel.app>.
- C52 audit ngày 2026-09-25: project Supabase `ACTIVE_HEALTHY`; remote migration mới nhất là
  `20260922090000`. Job `qlv-notification-runner-hourly` đang `active`, lịch `0 * * * *`, và 10
  lần chạy gần nhất trong `cron.job_run_details` đều `succeeded` đến 09:00 UTC. Production
  `/login` và manifest trả 200, `/api/notifications/run` không có secret trả 401; Vercel inspect
  cho thấy deployment Production `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC` `READY`, Functions `sin1`,
  alias `tindung.vercel.app` trỏ đúng deployment. Runtime log có POST runner trả 200 lúc
  `2026-09-25T09:00:00.494Z` và GET không secret trả 401 lúc `2026-09-25T09:10:44.053Z`.
- `pnpm ci:validate` đạt; GitHub CI run `35704013587` trên `origin/main` SHA
  `71a7509146db42c7cd754f76d6533c45f66653ea` đạt toàn bộ job và Required CI gate. API branch
  protection trả HTTP 403 vì GitHub Free không hỗ trợ private repository này. OWNER xác nhận không
  nâng gói; kiểm soát bù là chỉ phát hành revision sau khi Required CI gate của đúng SHA đạt.
  Tại thời điểm audit ban đầu, backup full gần nhất là
  `qlv-prod-20260922T074535Z`, tạo `2026-09-22T07:45:35Z`, checksum hợp lệ nhưng tuổi 73,45 giờ,
  vượt RPO 24 giờ và chỉ tới migration `20260917100000`; retention mới chạy dry-run, không xóa.
- C52 `COMPLETED` ngày 2026-09-25: tạo khóa AES-256-GCM trong macOS Keychain với service
  `com.ngotuong.quanlyvay.backup`, tạo backup Production mã hóa trực tiếp tại
  `.backups/qlv-prod-20260925T093801Z/`, không ghi SQL thuần. Manifest
  `qlv-prod-20260925T093801Z` gồm sáu file auth/private/public/supabase_migrations, migration
  `20260922090000`; checksum, GCM, SQL shape và RPO 24 giờ đều đạt. Retention dry-run giữ bản mới,
  không có candidate.
- Restore rehearsal dùng image Supabase PostgreSQL `17.6.1.155` trong container cô lập đã đạt.
  Số dòng của 13 bảng trọng yếu khớp Production (gồm 40 khoản vay, 390 giao dịch, 551 kỳ lãi,
  715 audit log, 32 Auth user và 34 migration); toàn bộ 59 khóa ngoại không có orphan, chín nhóm
  bất biến tài chính/audit đều 0 lỗi. `calculate_loan` chạy được cho 40/40 khoản, không có dư gốc
  hoặc lãi âm; RLS trả 0 khoản vay cho role authenticated không có identity. Database tạm và log
  tạm đã được hủy sau rehearsal; thời gian toàn bộ phiên rehearsal dưới RTO 4 giờ.
- C53 đã áp migration `20260925100000_c51_integrity_remediation.sql` lên đúng Supabase Production
  và đối chiếu remote history/quyền RPC. Candidate Vercel
  `dpl_CBcpZCoGkZ8CwwcsB6heNt7pxE2C`, URL bất biến
  <https://quan-ly-vay-ca-nhan-m27mmv1p1-ngotuong2105.vercel.app>, target Production, `READY`,
  Functions `sin1`. Public smoke đạt; authenticated smoke đạt luồng đổi mật khẩu bắt buộc,
  dashboard 390/1440 px, chọn đối tác bằng bàn phím và preview giảm gốc chỉ đọc, không ghi giao
  dịch. Tài khoản smoke đã thu hồi toàn bộ session và trả về inactive/banned.
- C53 bị chặn trước khi promote: runtime log candidate có `dashboard.read_failed` mã PostgreSQL
  `57014`. Ba probe qua role authenticated đều bị statement timeout sau 8.147–8.391 ms;
  `EXPLAIN ANALYZE` quyền quản trị cho cùng bundle mất khoảng 8.074 ms với 882.665 shared buffer
  hits. Alias `tindung.vercel.app` vẫn trỏ deployment tốt trước đó
  `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC`; candidate chưa được promote, source chưa commit/push.
- C54 đã loại bỏ blocker bằng hai projection authoritative chỉ tính phần so sánh giao diện dùng.
  Migration `20260926001000_c54_dashboard_bundle_performance.sql` đã áp đúng Production; các chỉ số
  cash/accrual profit và số dư đối chiếu khớp implementation cũ. Bundle Production giảm từ khoảng
  8,074 ms xuống 5,093 ms; ba probe authenticated đạt 5,168–5,555 ms, không còn `57014`.
- Backup trước migration C54 là `qlv-prod-20260925T170915Z`, gồm migration C51
  `20260925100000`; sáu ciphertext đạt checksum, GCM, SQL shape và RPO 24 giờ. Candidate mới
  `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6`, URL bất biến
  <https://quan-ly-vay-ca-nhan-jwuqab8e3-ngotuong2105.vercel.app>, đúng project, target Production,
  `READY`, Functions `sin1`. Public và authenticated smoke đạt; dashboard render đủ KPI/dòng tiền/
  lịch dự kiến, browser/runtime error bằng 0, không ghi tài chính. Alias `tindung.vercel.app` đã
  promote và hậu kiểm authenticated đạt; rollback target là
  `dpl_DzRdBx1TLmsPHxDZMhYMXWKqkbUC` nhưng không cần kích hoạt.
- C53 và C54 `COMPLETED` ngày 2026-09-26. Commit triển khai
  `91a16565599a14dc739c5af6880c999e9b8febf6` đã push fast-forward lên `main`; local và remote
  khớp SHA. GitHub Actions run `36221129972` đạt Dependency/secret scan, Quality/build, Workflow
  policy, Supabase/Auth/pgTAP/E2E và `Required CI gate`. Hậu kiểm sau push xác nhận alias
  `tindung.vercel.app` vẫn trỏ đúng `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6` `Ready`, target Production,
  Functions `sin1`.
- C55 `COMPLETED` ngày 2026-09-26: source/dist khớp đã được push lên Apps Script project hiện hữu
  `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`; immutable version 6 là
  `C55 readable Google Sync reconciliation tabs`. HEAD deployment vẫn là
  `AKfycbzgUCt7yolAjpgaoCrj7GtvyA1df29E2975-AxfTuM`; không tạo project, workbook, thư mục Drive
  hoặc trigger mới.
- Workbook hiện hữu `QuanLyVayCaNhanSync` đã full sync một chiều thành công: `Tổng quan` ghi 13
  tab dữ liệu; hai tab C47 đúng contract, lần giảm gốc hiện hữu có đúng một dòng và tab hoàn tác
  không có dòng dữ liệu. Header cố định, có filter và chiều rộng tối thiểu dễ đọc. Log ghi
  `runGoogleSheetFullSync` lúc 13:57:18 hoàn tất trong 68,927 giây; lần `runGoogleSheetSync` kế tiếp
  lúc 13:58:36 hoàn tất trong 4,311 giây, giữ nguyên source version và số dòng, xác nhận retry không
  tạo bản ghi trùng. Không có đường ghi ngược Supabase.
- C58 `COMPLETED` ngày 2026-09-26: hậu kiểm xác nhận Supabase `ACTIVE_HEALTHY`, 36 migration
  local/remote khớp, Vercel Production `READY`, notification runner gần nhất trả 200, Apps Script
  version 6/HEAD còn hiện hữu và GitHub Required CI của đúng SHA đạt. Backup mới nhất tuổi 15,48
  giờ đạt checksum/GCM/SQL shape và RPO 24 giờ. Báo cáo hiện hành nằm tại
  `docs/PRODUCTION_READINESS.md`.
- C58 không còn phát hiện `CRITICAL`/`HIGH`. Hai phát hiện `MEDIUM` còn mở là daily backup chưa
  được tự động hóa/cảnh báo và Production thiếu HTTP security headers. Supabase Auth E2E còn một
  lỗi flaky `LOW`; branch protection GitHub Free/private và biên hiệu năng dashboard được ghi nhận
  là `ACCEPTED_RISK` có kiểm soát bù.
- C59 `COMPLETED` ngày 2026-09-26: Production đã trả CSP có `frame-ancestors 'none'`, header
  chống MIME sniffing, referrer/permissions policy, X-Frame-Options và COOP. Candidate
  `dpl_QQ4ymp6KrfYHngugdMdv4zu5bRrJ`, URL bất biến
  <https://quan-ly-vay-ca-nhan-8ewqm47qv-ngotuong2105.vercel.app>, target Production,
  `READY`, Functions `sin1`; public và authenticated smoke desktop/mobile/PWA đạt, console và
  runtime error/500 sạch. Alias `tindung.vercel.app` đã promote; rollback target là
  `dpl_2EoTbJAzcGYvdieQWiWUphwMnbT6`, chưa cần kích hoạt.
- Backup Production mã hóa `qlv-prod-20260926T115433Z`, migration `20260926001000`, gồm sáu
  ciphertext đã đạt checksum, GCM, SQL shape và RPO. LaunchAgent
  `com.ngotuong.quanlyvay.backup` chạy mỗi giờ trên máy vận hành, ngưỡng tạo 20 giờ, dùng khóa
  Keychain hiện hữu; lần kickstart kết thúc mã 0 với `not-due`. Retention chỉ dry-run, không xóa.
- Run tài liệu `36241927827` đã tái hiện Auth health 502 lâu hơn 60 giây. C59 bỏ reset đầu Auth
  integration bị trùng, giữ reset dọn và tăng readiness deadline/backoff lên 180 giây. Commit sửa
  cuối `0c7dca7e891290f76d8014c09c0640cb952423f1` đã push fast-forward; GitHub Actions run
  `36242767835` đạt attempt 1 toàn bộ job và `Required CI gate`.

## 2. Dữ liệu và tài khoản

- Supabase project ref dùng chung: `hmfxnstrqfqpvsgfmjmd`, region Singapore.
- Baseline sau C44: 33 migration, 38 khoản vay, 381 giao dịch, 36 notification và 0 thread nhắc
  trùng tại thời điểm rollout.
- Chỉ 1 OWNER hoạt động. Các tài khoản kỹ thuật đã inactive/banned; tài khoản smoke giữ lại không có
  session hoặc refresh token hoạt động.
- Một số profile cũ có ràng buộc audit/tài chính và trigger quản trị cấm xóa vật lý. Không tắt
  trigger, không sửa lịch sử và không xóa giao dịch tài chính để dọn tài khoản.
- Production/Preview dùng chung Supabase; không tạo dữ liệu QA trên tài khoản vận hành.

## 3. Nguồn sự thật

Ưu tiên theo `AGENTS.md`:

1. `PROJECT_CONTEXT.md`: trạng thái vận hành và checkpoint hiện tại.
2. `docs/IMPLEMENTATION_PLAN.md`: roadmap và acceptance criteria đang mở.
3. Contract/runbook còn hiệu lực:
   - `docs/DOMAIN_SPEC.md`, `docs/FINANCIAL_ENGINE.md`
   - `docs/AUTH.md`, `docs/WEB_WORKFLOWS.md`, `docs/DASHBOARD.md`
   - `docs/PWA_NOTIFICATIONS.md`, `docs/GOOGLE_SYNC.md`
   - `docs/BACKUP_RESTORE.md`, `docs/CI.md`, `docs/VERCEL_PREVIEW_RUNBOOK.md`
   - `docs/DESIGN_SYSTEM.md`, `docs/USER_GUIDE.md`
4. Migration, test và code hiện tại là bằng chứng triển khai.

Không dùng commit message, tài liệu đã xóa hoặc nội dung lịch sử để suy ra yêu cầu đang chờ hay
quyền thực hiện thao tác remote mới.

## 4. Kiến trúc và bất biến

- Monorepo pnpm: Next.js PWA ở `apps/web`, Apps Script ở `apps/google-sync`, contract dùng chung
  ở `packages/domain-contract`, migration/test PostgreSQL ở `supabase`.
- Supabase PostgreSQL là nguồn dữ liệu chuẩn; Google Sheets chỉ đồng bộ một chiều để đối chiếu.
- Frontend chỉ mutate qua Server Actions/RPC đã validate; bộ máy tính lãi authoritative ở PostgreSQL.
- Giao dịch tài chính không xóa vật lý; sửa sai bằng reversal/correction và audit append-only.
- Tiền VND dùng số nguyên, lãi suất dùng decimal; ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`, audit UTC.
- Web Push và Google Sync phải idempotent; secret chỉ nằm trong kho secret của môi trường.
- Chính sách mật khẩu hiện hành: tối thiểu 6 ký tự ASCII chữ hoặc số.

## 5. Tài nguyên remote

- GitHub private: <https://github.com/ngotuong/quanlyvay.git>, branch `main` theo dõi
  `origin/main`.
- Vercel project ID: `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; Functions region `sin1`.
- Preview bắt buộc chạy từ repository root bằng `pnpm deploy:preview`.
- Google Apps Script/Sheets/Drive, Vercel, Supabase và secret chỉ thao tác khi checkpoint cho phép.
- Google Apps Script project C55: `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`,
  version 6. Workbook smoke:
  <https://docs.google.com/spreadsheets/d/1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8/edit>.
  Rollback: checkout source Google Sync của commit trước C55 (hoặc đối chiếu immutable version 3),
  build để tái tạo `dist`, rồi `clasp push`; version 6 được giữ làm bằng chứng. Không cần rollback.

## 6. Kiểm thử gần nhất

C72 ngày 2026-10-01 (kết quả mới nhất):

- `git diff --check`, lint, typecheck, build: PASS; `pnpm test`80/80 PASS.
- Full E2E45 PASS/3 audit opt-in SKIP, 6 phút; toàn bộ6 C72 và regression hiện hữu đạt.
- 100 route/width/theme/text samples, 20 ảnh synthetic, keyboard focus/target/overflow đạt.
  Hai expense fixture list y436,86; dashboard13 task đầu bottom648,03 px.
- Read-only hậu kiểm DB disposable :55321: profiles/loans/transactions0; secret-pattern scan sạch,
  không SQL/dump/env staged hoặc file mới. Không chứng nhận browser/AT/thiết bị chưa kiểm.
- Chi tiết và giới hạn tại `docs/UI_UX_REMEDIATION_C72.md`; chưa có CI/deployment C72 mới.


C62 ngày 2026-09-30:

- `pnpm lint`, `pnpm typecheck`, `git diff --check`: PASS.
- Audit opt-in `C62_AUDIT=true pnpm test:e2e c62-audit.spec.ts`: 1/1 PASS (1,7 phút).
- `pnpm test:e2e`: 23/23 PASS (2,7 phút), 1 skip đúng chủ đích là harness audit opt-in.
  Hai lần đều build Next production qua Playwright webServer; không sửa code runtime.
- Mockup payment smoke đạt close + toast. 45 route/width samples, 30 ảnh tổng hợp; secret pattern
  scan sạch. Database test 55321/55322 được guard/reset, không dùng DB Production/Preview.
- Không chạy lại unit/pgTAP/Auth standalone vì phạm vi chỉ tài liệu/mockup/harness. Không tuyên bố
  kiểm xong thiết bị thật, screen reader, cold auth/expiry/PWA resume hoặc browser zoom thật.

C63 ngày 2026-09-30:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (80/80) và `pnpm build`: PASS.
- `pnpm test:e2e`: 32/32 bài chạy PASS trong 4,0 phút; 1 skip đúng chủ đích là harness audit
  C62 opt-in. Playwright build/start Next production và chỉ reset database local cô lập
  `QuanLyVayCaNhan-C20-test` trên API 55321/database 55322.
- Ma trận C63 kiểm payment → giảm gốc → tất toán tại 375/390/1440 px; 390×480 dark mô phỏng
  viewport bàn phím thấp, reduced-motion, focus trap/restore, dirty/pending, submit trùng, toast,
  preview stale/read-after-write, navigation 10 giây và Auth 2/10 giây đều đạt.
- Không đổi migration, RPC, schema hoặc công thức tài chính. VoiceOver/TalkBack, bàn phím mềm và
  PWA resume trên thiết bị thật vẫn là giới hạn đã ghi tại `docs/UI_UX_REMEDIATION_C63.md`.

C64 ngày 2026-09-30:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (80/80) và `pnpm build`: PASS.
- `C64_EVIDENCE=true pnpm test:e2e`: 35 bài chạy PASS; 1 skip đúng chủ đích là harness C62 opt-in.
  Playwright dùng production build/start và database local cô lập.
- Dashboard/list/detail/filter/đối tác được kiểm tại 390/1440 px, light/dark, reduced-motion và
  200% text; ảnh tại `docs/audit-c64/`. Drawer C63, stale guard và số liệu tài chính không đổi.
- Chưa kiểm screen reader, bàn phím mềm, safe-area và browser zoom trên thiết bị thật; giới hạn chi
  tiết tại `docs/UI_UX_REMEDIATION_C64.md`.


C44 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 21/21
- GitHub Actions CI: run `35353744921` đạt Required CI gate
- database lint sạch và pgTAP 477/477

C45 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`

Không chạy lại Auth E2E, browser E2E hoặc database test vì C45 không đổi code, schema, dữ liệu hay
runtime; các gate đó gần nhất đã đạt ở C44 như ghi trên.

C46 đã đạt:

- `pnpm audit --audit-level high`: không còn advisory
- `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74
- `pnpm build`
- database lint sạch và pgTAP 477/477
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 21/21

C47 đã đạt:

- migration được tái tạo sạch từ đầu; database lint không lỗi
- pgTAP 504/504, gồm kịch bản 400 triệu → trả 300 triệu + lãi chốt → kỳ mới 100 triệu
- `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:auth`: 6/6
- `pnpm test:e2e`: 22/22, gồm workflow mới trên viewport 390 px
- `git diff --check`

C48 đã đạt:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74, `pnpm build` đạt.
- Backup logical Production mã hóa và kiểm tra integrity đạt; migration Production/history đạt.
- Candidate Production `Ready`, Functions `sin1`; public/authenticated mobile smoke, console và
  runtime log đạt; alias Production đã chuyển và public hậu kiểm đạt.
- Source C47 commit `2ca0c17` đã push `origin/main`; GitHub CI run `35701912815` lần 2 đạt
  tất cả job và Required CI gate, gồm pgTAP/Auth/Playwright E2E. Lần đầu Auth local của runner
  trả HTTP 502 trong 15 giây sau reset (trước khi Playwright chạy); rerun không lặp lại.

C49 đã đạt:

- `git diff --check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`: 74/74
- `pnpm build`
- `pnpm test:e2e`: 22/22, gồm bố cục nút ở 375/390/1024 px và cuộn tới nút xác nhận ở
  375/390 px sau preview
- Không chạy lại Auth E2E hoặc pgTAP vì C49 chỉ đổi nhãn, bố cục, CSS cuộn và E2E UI; không đổi
  Auth, schema, RPC hay nghiệp vụ tài chính.

C50 đã đạt:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`: 74/74, `pnpm build`
- `pnpm test:e2e`: 22/22
- Candidate đúng project `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target Production, `Ready`,
  Functions `sin1`; authenticated smoke không ghi dữ liệu và runtime log đạt.
- Alias Production đã chuyển và public hậu kiểm đạt; không cần rollback.

C51 đã đạt:

- `git diff --check`, lint, typecheck, unit test, build, Auth 6/6, Playwright E2E 22/22
- database lint và toàn bộ pgTAP local đạt

C52 đã đạt:

- `pnpm ci:validate`, GitHub CI run `35704013587`, Production public smoke và notification runner
- backup Production mã hóa: checksum, GCM, SQL shape, manifest/RPO và retention dry-run
- restore rehearsal cô lập: row count, toàn bộ khóa ngoại, invariant tài chính, calculation và RLS
- `git diff --check`; không deploy, migrate remote, push GitHub hoặc thay đổi dữ liệu nghiệp vụ

C53 đã đạt trước khi gặp blocker:

- Backup trước migration `qlv-prod-20260925T093801Z`: checksum, GCM, SQL shape và RPO 24 giờ đạt
- `git diff --check`, `pnpm ci:validate`, lint, typecheck, unit test 74/74 và build đạt
- database reset/lint đạt; pgTAP 514/514, Auth 6/6 và Playwright E2E 22/22 đạt
- Migration C51 đã áp Production; notification Cron tiếp tục `succeeded` sau migration
- Candidate đúng project/target/region và các public/authenticated smoke C51 không ghi tài chính đạt
- Runtime log **không đạt** do dashboard RPC bị `57014`; alias/push/CI vì vậy chưa thực hiện

C54 đã đạt:

- Full local gate: `git diff --check`, CI policy/actionlint, lint, typecheck, unit 74/74, build,
  database reset/lint, pgTAP 527/527, Auth 6/6 và Playwright 22/22
- Regression 40 khoản chạy bundle dưới budget 6 giây; Production giảm khoảng 37% xuống 5,093 ms,
  ba probe authenticated liên tiếp đều đạt và số liệu so sánh khớp implementation cũ
- Backup `qlv-prod-20260925T170915Z` đạt checksum/GCM/SQL shape/RPO; remote history khớp đến
  migration `20260926001000`
- Candidate/alias Production đúng project, target, region; public/authenticated smoke và log đạt;
  notification Cron tiếp tục `succeeded`; tài khoản smoke inactive/banned, 0 session/refresh token
- Commit `91a16565599a14dc739c5af6880c999e9b8febf6` đã push fast-forward; local/remote khớp SHA và
  GitHub run `36221129972` đạt toàn bộ job cùng `Required CI gate`

C55 đã đạt:

- `git diff --check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` và `pnpm build`
- Google Sync typecheck, 18/18 unit test, build và so khớp exact source/dist
- `clasp push` đúng project; immutable Apps Script version 6 và HEAD deployment được xác minh
- Full sync/smoke workbook 13 tab đạt; hai tab C47 đúng contract, header đọc được và retry giữ
  nguyên số dòng/source version
- Không chạy Auth E2E, browser E2E hoặc database test vì C55 chỉ đổi Apps Script/Sheet đối chiếu
  một chiều và tài liệu; không đổi web, Auth, schema, RPC hoặc dữ liệu authoritative

C56 đã đạt:

- Commit C55 `fdd7254d97a58231bf918f110c23aa53257c2ded` đã push fast-forward lên `main`;
  local/remote khớp SHA sau push
- `git diff --check`, `pnpm ci:validate`, Gitleaks toàn bộ 110 commit và `pnpm audit
  --audit-level high` đều đạt; commit không chứa `dist`, `.clasp.json`, secret hoặc dữ liệu
  tài chính
- GitHub Actions run `36226393389` của đúng SHA đạt Workflow policy, Dependency and secret scan,
  Quality and build, Supabase Auth/pgTAP/E2E và `Required CI gate`
- Hậu kiểm chỉ đọc xác nhận Apps Script version 6, HEAD deployment
  `AKfycbzgUCt7yolAjpgaoCrj7GtvyA1df29E2975-AxfTuM` và workbook hiện hữu vẫn mở được
  với các tab đối chiếu C47
- Không deploy Vercel, chạy migration, thay secret, tạo tài nguyên Google hoặc sửa dữ liệu

C57 đã đạt:

- Xác minh release chính thức `supabase/setup-cli` v3.0.1, commit ký hợp lệ
  `45a513f8c64c0bc8e0e3dfe572b5c95be85f6359`, dùng composite action và Node.js 24
- Workflow pin full SHA v3.0.1; policy local chặn revision cũ. Supabase CLI vẫn khóa 2.109.0,
  không đổi permission, secret hoặc các phiên bản toolchain khác
- Gate local đạt: `git diff --check`, `pnpm ci:validate`, `pnpm test` (75 test workspace/script),
  dependency audit và Gitleaks trên diff không phát hiện secret
- Commit `a24bcafdfa90c975ff465ed78422094f587d42ad` đã push fast-forward; GitHub Actions run
  `36228136823` đạt tất cả job và `Required CI gate`
- Integration log không cò cảnh báo Node.js 20 deprecated; API annotations của job rỗng
- Không deploy Vercel/Apps Script, migration, thay secret, tạo tài nguyên remote hoặc sửa dữ liệu

C58 đã đạt:

- `git diff --check`, `pnpm ci:validate`, dependency audit mức high và Gitleaks toàn bộ 113 commit
- GitHub run `36228844410` attempt 2 trên đúng SHA `fe32304a` đạt toàn bộ job và Required CI gate
- Supabase/Vercel/notification/Apps Script được hậu kiểm chỉ đọc; backup checksum, GCM, SQL shape,
  RPO và retention dry-run đạt
- Không chạy lại full local test vì source runtime không đổi và CI của đúng SHA đã đạt full gate;
  C58 chỉ thêm tài liệu audit

C59 đã đạt:

- `git diff --check`, `pnpm ci:validate`, `pnpm audit --audit-level high`, lint, typecheck, unit
  test 79/79 và build; Gitleaks trên diff và toàn bộ history trong CI không phát hiện secret
- database reset/lint đạt; pgTAP 527/527, Auth 6/6 và Playwright E2E 23/23
- Backup `qlv-prod-20260926T115433Z` đạt checksum/GCM/SQL shape/RPO; LaunchAgent chạy thử mã 0,
  lịch mỗi giờ và ngưỡng 20 giờ đã được nạp
- Candidate/alias Production đúng project, target, region; public/authenticated smoke, PWA,
  security headers, console và runtime log đạt; rollback không cần kích hoạt
- Commit `66e2e8d88d6bb92d2b8b4fdc8c0ccc7e7c8ff7a5` đã push fast-forward; GitHub run
  `36241173845` attempt 1 đạt toàn bộ job cùng `Required CI gate`
- Run `36241927827` tái hiện 502 sau reset dọn; remediation bỏ reset đầu Auth bị trùng và tăng
  deadline lên 180 giây. Local chuỗi Auth 6/6 → E2E 23/23 đạt; commit `0c7dca7` và run
  `36242767835` đạt ngay attempt 1 toàn bộ job cùng `Required CI gate`

## 7. Việc chờ

- C62 `COMPLETED` ngày 2026-09-30: audit UI/UX local và mockup hoàn tất; báo cáo
  `docs/UI_UX_AUDIT_C62.md`, bằng chứng `docs/audit-c62/`, harness opt-in
  `apps/web/test/e2e/c62-audit.spec.ts`. Có 12 phát hiện: 2 HIGH (một runtime, một nguy cơ cold auth),
  9 MEDIUM, 1 LOW. Đã tái hiện payment success vẫn mở drawer, đóng draft giảm gốc không confirm,
  progress sai khi cancel/chờ hơn 8s. Không kết luận mất draft hoặc sai tiền từ các hiện tượng này.
  45 route/viewport không tràn ngang không có nghĩa UI đạt; report tách lỗi, nguy cơ source và
  NOT_TESTED. Cold auth, thiết bị thật, screen reader, zoom browser thật còn cần bằng chứng.
  Thay đổi chỉ gồm tài liệu, fixture evidence/mockup và harness; không sửa code sản phẩm, không
  ghi dữ liệu remote/deploy/push. Sáu commit C60 chưa đồng bộ giữ nguyên; C62 chưa local commit.
- C63 `COMPLETED` ngày 2026-09-30: payment/tất toán/giảm gốc đóng và reset sau server commit,
  giữ draft khi lỗi, chặn submit trùng, toast sau dialog, focus hợp lý và preview mới khi mở lại.
  Progress bám transition thật; fallback Auth không chứa dữ liệu riêng tư. Regression phát hiện
  preview tất toán được tải khi drawer ẩn và đã sửa bằng lifecycle mount theo lần mở. Toàn bộ gate
  local đạt; không deploy, push, migration hoặc ghi dữ liệu remote.
- C64 `COMPLETED` ngày 2026-09-30: dashboard ưu tiên việc đến hạn, filter/card khoản vay gọn, detail
  giữ hierarchy số dư/action, đối tác list-first có search và drawer thêm/sửa, retry preview chỉ hiện
  khi lỗi/stale. Full local gate và ảnh evidence đạt; không đổi schema/RPC/công thức, không deploy,
  push hoặc ghi dữ liệu remote.
- C65 `COMPLETED` ngày 2026-09-30: giữ nguyên sáu commit C60, gom C62–C64 cùng dependency override
  vá `brace-expansion` vào commit `9a1497b54a62b42ca93e79a518a7dcfc178fc155` và push
  fast-forward; C65 hoàn tất luôn mục tiêu C61. Full-history gitleaks và `pnpm audit --audit-level
  high` sạch. GitHub Actions run `36697102128` attempt 1 dừng fail-closed khi Supabase Auth local
  trả 502; rerun attempt 2 trên đúng SHA đạt Integration, security, policy, quality/build và
  `Required CI gate`.
- Stable Preview hiện trỏ deployment `dpl_6JfpS3eqM89Jtjr2b8JVzvZHLaZw`, immutable URL
  <https://quan-ly-vay-ca-nhan-rj9pn2zao-ngotuong2105.vercel.app>, project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, trạng thái `Ready`, Functions `sin1`;
  alias <https://tindung-preview.vercel.app> đã được promote sau gate. Public và authenticated
  smoke ở Chrome/Safari đạt cho privacy mode, heading, modal focus/state và bottom nav ở Chrome
  zoom 400%/mức zoom tối đa Safari; không ghi giao dịch tài chính, tài khoản kỹ thuật đã
  deactive/ban. App console không có lỗi; CSP message của Vercel Toolbar được tách riêng, không ảnh
  hưởng luồng app. Runtime error và HTTP 500 log đều rỗng. Rollback target đã xác minh là
  `dpl_FrsRPc3CqyKpkdkutFGCZ16Foq5u`; không cần rollback. Không đổi schema/migration, secret,
  Apps Script/Sheets, dữ liệu nghiệp vụ hoặc Production alias.
- C66 `COMPLETED` ngày 2026-10-01: audit Safari/Chrome thật và E2E cô lập ghi nhận 2 HIGH, 2 MEDIUM,
  1 LOW tại `docs/UI_UX_AUDIT_C66.md`. HIGH gồm privacy mode còn lộ số tiền qua accessible name và
  bottom navigation chồng chữ ở zoom 400%. Focus sheet **Thêm**, outline heading và semantic trạng
  thái mở là backlog còn lại. Safari login/zoom 200% đạt; full E2E đạt 35 PASS + 1 audit skip. Không
  có iPhone/Android hay screen reader bật nên VoiceOver/TalkBack, bàn phím mềm và safe-area thiết bị
  thật giữ `NOT_TESTED`. Không sửa code, dữ liệu, deploy hoặc push.
- C67 `COMPLETED` ngày 2026-10-01: privacy mode không còn đưa tiền thật vào accessible name/tooltip;
  bottom nav reflow không chồng nhãn ở Chrome zoom 400% và mức zoom tối đa Safari; sheet **Thêm**
  có focus loop, focus return, `aria-expanded`/`aria-controls`; action banner dùng heading cấp 2.
  Regression C67 4/4 và full E2E 39 PASS + 1 audit skip; lint, typecheck, 80/80 unit/script và build
  19 route đạt. Tài khoản/DB test synthetic đã dọn; không đổi nghiệp vụ/schema/dữ liệu remote,
  deploy hoặc push. Chi tiết tại `docs/UI_UX_REMEDIATION_C67.md`.
- C68 `COMPLETED` ngày 2026-10-01: nâng `next`/`eslint-config-next` lên `16.3.8` để vá
  `GHSA-vcvr-r3jv-pc5j`, ổn định focus trap/bottom-sheet và full E2E. Các commit cuối
  `27125e9`, `993bfb6`, `f448a6b`, `d2bd90d1872ca31aedf592019662904794b251f5` đã push
  fast-forward; GitHub Actions run `36818958055` đạt toàn bộ job và `Required CI gate` trên đúng
  SHA cuối. Local đạt audit sạch, CI policy, lint, typecheck, 80/80 unit/script, build 19 route,
  stress focus 20/20, drawer tài chính 9/9 và full E2E 39 PASS + 1 audit skip.
- Candidate Preview `dpl_6JfpS3eqM89Jtjr2b8JVzvZHLaZw`, immutable URL
  <https://quan-ly-vay-ca-nhan-rj9pn2zao-ngotuong2105.vercel.app>, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `preview`, `Ready`, Functions `sin1`. Chrome/Safari
  thật và authenticated smoke xác nhận privacy accessible name không lộ tiền, heading H1→H2,
  bottom nav không chồng ở zoom 400%/mức tối đa Safari, focus loop/Escape/focus return và
  `aria-expanded` đúng. Stable alias đã chuyển sau gate và smoke lại đạt; runtime error/HTTP 500
  đều 0. Rollback target `dpl_FrsRPc3CqyKpkdkutFGCZ16Foq5u` không cần kích hoạt. Tài khoản smoke
  đã inactive/banned; Git không chứa credential/cache. Production không đổi.
- C69 `COMPLETED` ngày 2026-10-01: revision `039be56a2fba3e2acc60adb4c4f10b85c14b0fbe`
  có GitHub Actions run `36827783372` đạt toàn bộ job và `Required CI gate`. Preflight local đạt
  dependency audit, CI policy/actionlint, lint, typecheck, 80/80 unit/script, build 19 route,
  full E2E 39 PASS + 1 audit skip và Gitleaks toàn bộ 133 commit.
- Production candidate `dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T`, immutable URL
  <https://quan-ly-vay-ca-nhan-6ghj4fitw-ngotuong2105.vercel.app>, đúng project
  `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`, target `production`, `Ready`, Functions `sin1`. Public smoke
  đạt `/login`/manifest 200 và hai API không secret 401. Authenticated Chrome smoke đạt privacy,
  heading H1→H2, modal focus/state và reflow 500/390/320 px; Safari tải đúng login trên candidate.
  Một phép đo focus tự động timeout lần đầu, chạy lại cùng candidate/tài khoản đạt và không có lỗi
  console/runtime.
- Alias <https://tindung.vercel.app> đã promote sau gate, inspect trỏ đúng candidate; public,
  authenticated Chrome và Safari login smoke sau promote đều đạt. Runtime error và HTTP 500 đều
  0. Rollback target `dpl_QQ4ymp6KrfYHngugdMdv4zu5bRrJ` không cần kích hoạt. Tài khoản smoke đã
  inactive/banned; không đổi schema/RPC, công thức tài chính, Supabase data/secret, Apps
  Script/Sheets hoặc ghi giao dịch tài chính.
- C70 `COMPLETED` ngày 2026-10-01 theo phạm vi điều chỉnh OWNER đã đồng ý: tổng hợp kiểm
  accessibility khả dụng trên Production, giữ VoiceOver/TalkBack/mobile thật NOT_TESTED.
  Safari login semantic/keyboard/focus đạt. Chrome Production đạt privacy attributes, dashboard
  heading, modal focus/state, reflow 320/390/500 px, loans/detail bốn tab và landscape giả lập;
  console/pageerror = 0. Tài khoản kỹ thuật VIEWER inactive/banned đã hậu kiểm đọc-only đạt.
  Bằng chứng/giới hạn tại `docs/UI_UX_AUDIT_C70.md`; gate tài liệu `git diff --check` đạt.
  Không sửa runtime/harness, không cần chạy lại full suite. Cache/helper/credential bị Git ignore.
  Giới hạn còn mở: VoiceOver đã bật nhưng bind công cụ timeout -10005/không thu được đầu ra;
  adb/simctl không có. Không coi đóng C70 là PASS screen reader/mobile hay đóng toàn bộ rủi ro
  accessibility. Không yêu cầu OWNER học VoiceOver. VoiceOver đã bật ở lượt trước, chưa tắt;
  phiên chốt tài liệu này không thao tác hệ thống. Blocker đóng C70 đã được gỡ bằng phạm vi
  OWNER điều chỉnh; giới hạn kiểm chứng vẫn được lưu, chưa có phát hiện screen reader mới đủ bằng chứng.
- C71 `COMPLETED` ngày 2026-10-01: audit UI/UX có 110 tổ hợp screen/viewport/theme local
  synthetic và 20 login local/Production public. Báo cáo `docs/UI_UX_AUDIT_C71.md`, ma trận/ảnh/
  mockup tại `docs/audit-c71/`, harness opt-in `apps/web/test/e2e/c71-audit.spec.ts`.
  Có 1 HIGH (Back SPA làm mất draft), 4 MEDIUM (pending/error thông báo, target, chi phí form-first,
  active filter), 1 LOW (task dashboard dưới KPI mobile). Không sửa các lỗi trong audit.
  Loading cold auth và financial drawer close/reset/toast/focus đã kiểm lại đạt; không coi lỗi
  C62 đã sửa là hiện hành. Screen reader/mobile thật/contrast toàn bộ tiếp tục NOT_TESTED.
  Gates: lint/typecheck PASS phiên bản cuối; 16 regression C63/C64/C67 PASS ở lượt đầu; C71
  matrix+friction 2 PASS ở lượt rerun, friction bổ sung read-after-write/count/retry/quick journey
  1 PASS. Lượt đầu một timeout harness do goBack chờ load khi dismiss beforeunload đã sửa ở
  harness, không sản phẩm. Build chạy trong gate E2E; không chạy lại full unit/DB suite/CI.
  Teardown + hậu kiểm read-only DB riêng :55321: profiles/loans/transactions đều 0; artifact
  secret-pattern scan PASS, không SQL/dump, git diff --check PASS. Không thay runtime/schema,
  dữ liệu dùng chung, secret, tài khoản remote, deploy, commit hoặc push. Local C70/C71 chưa
  đồng bộ GitHub. Production inspect chỉ đọc vẫn C69 dpl_HZHgS3m93v2MoYNQSPVHi9vGwZ1T/sin1;
  không kiểm lại authenticated Production trong C71, không tuyên bố rollout remediation.
- C72 `COMPLETED` local ngày 01/10/2026, OWNER phê duyệt trong hội thoại: đã sửa sáu phát hiện
  C71 về draft Back/Forward/link/close, notification pending/error/retry/active, target44px,
  expense sheet list-first và task priority mobile. Báo cáo `docs/UI_UX_REMEDIATION_C72.md`,
  đối chiếu ảnh `docs/remediation-c72/review.html`. Không thay RPC/schema/quyết toán VND.
  Lint/typecheck/diff-check, 80 unit, build và full E2E45 PASS/3 audit opt-in SKIP đều đạt.
  Geometry100 samples không overflow/target nhỏ; task bottom648,03, expense list top436,86 px.
  RPC timeout thật trên fixture local giữ unread, retry đạt; teardown profiles/loans/transactions0.
  Secret/artifact scan sạch. Thay đổi C70/C71 bảo toàn; C70–C72 chưa commit/push/deploy.
  Không blocker local. Safari/Firefox, screen reader/mobile vật lý tiếp tục NOT_TESTED.
- C73 `IN_PROGRESS`: đồng bộ C70–C72, Required CI đúng SHA, rollout Preview và Production
  có public/authenticated smoke chỉ đọc, kiểm alias/region/runtime và rollback nếu hậu kiểm lỗi.
  Phạm vi/acceptance tại mục31 roadmap. OWNER phê duyệt trong hội thoại ngày 02/10/2026.
  Source đã push fast-forward tại `e0cb3956ae5ca01811f28a938eebac0ad56d0525`.
  CI run `36960703897` thất bại ở beforeAll C72: `E2E_DATABASE_PREPARED=true` bỏ reset
  sau volume fixtures, rồi globalSetup tạo lại user synthetic đã tồn tại (39 PASS/1 FAIL,
  3 SKIP/5 chưa chạy). Sửa riêng fixture để gọi resetLocalDatabase có guard khi cờ prepared
  còn bật; không đổi runtime/schema hoặc remote DB. Lint/typecheck/80 unit/build đạt,
  full E2E với cờ prepared và CI revision sửa đang chờ xác minh.
  Preview candidate `dpl_A5ViQwiJSrfATNwSyWq7VEvCc2Hh`, URL
  <https://quan-ly-vay-ca-nhan-bxhs8qq9j-ngotuong2105.vercel.app>, Ready/preview/sin1,
  đúng project. Candidate đã tạo sau local gate nhưng trước kết quả CI; chưa chuyển alias.
  Dashboard authenticated375/390 và expense sheet mở/đóng trả focus đạt; chưa đủ ma trận smoke.
  Console có CSP chặn Vercel toolbar và cảnh báo font preload, chưa thấy lỗi ứng dụng.
  Stable Preview/Production chưa thay đổi; không promote khi Required CI còn đỏ.



- C52 `COMPLETED` ngày 2026-09-25: backup Production mã hóa và restore rehearsal đạt; CI dùng kiểm
  soát bù phù hợp GitHub Free/private; notification runner, Production smoke và runtime log đạt.
  Không deploy, migrate remote, push GitHub, `clasp push` hoặc thay đổi dữ liệu nghiệp vụ.
- C53/C54 `COMPLETED` ngày 2026-09-26: migration C51/C54, backup, rollout Vercel Production,
  authenticated smoke, runtime log, commit/push và Required CI gate đúng SHA đều đạt. Không còn
  blocker dashboard hoặc source local chưa đồng bộ GitHub.
- C55 `COMPLETED` ngày 2026-09-26: Apps Script version 6 và workbook hiện hữu đã nhận schema đối
  chiếu C47; full sync, log, hiển thị và retry idempotent đều đạt. Không ghi ngược Supabase, không
  tạo tài nguyên Google mới và không đưa secret/dữ liệu tài chính vào Git.
- C56 `COMPLETED` ngày 2026-09-26: commit C55 đã push fast-forward, local/remote khớp SHA,
  GitHub run `36226393389` đạt `Required CI gate`; Apps Script version 6/HEAD và workbook được
  hậu kiểm chỉ đọc thành công.
- C57 `COMPLETED` ngày 2026-09-26: action Supabase đã pin v3.0.1/full SHA; run
  `36228136823` đạt `Required CI gate`, không cò cảnh báo Node.js 20 hay annotation job.
- C58 `COMPLETED` ngày 2026-09-26: ma trận Production readiness đã chốt tại
  `docs/PRODUCTION_READINESS.md`; không còn phát hiện CRITICAL/HIGH, còn hai MEDIUM và một LOW.
- C59 `COMPLETED` ngày 2026-09-26: HTTP headers, lịch backup và Auth readiness đã đạt; Production,
  local full gate và Required CI của revision sửa cuối đều xanh.
- C60 `COMPLETED` ngày 2026-09-27: LaunchAgent tự tạo backup
  `qlv-prod-20260927T120432Z`, exit 0, đúng project `hmfxnstrqfqpvsgfmjmd` và migration
  `20260926001000`. Cả sáu ciphertext đạt checksum/GCM/SQL shape, quyền file `0600`, tuổi khi hậu
  kiểm 0,83 giờ; không còn `.partial`, FIFO hoặc SQL thuần. Retention 7 daily/4 weekly/12 monthly
  chỉ dry-run: giữ bốn bản và nêu một candidate, không xóa. LaunchAgent vẫn loaded, chu kỳ 3.600
  giây; secret/log/Git scan sạch. Các lần đầu fail-closed đã phơi bày hai sai lệch môi trường:
  `--file` không nhận thiết bị/FIFO dưới launchd và `migration list` có thể trả bảng; pipeline nay
  dùng stdout mặc định và parser có regression cho JSON/bảng. RPO vượt khoảng 10 phút trong lúc
  remediation rồi đã phục hồi; cảnh báo hoạt động đúng và không mất backup hợp lệ.
- C61 `COMPLETED` qua C65 ngày 2026-09-30: toàn bộ commit remediation C60 đã được push
  fast-forward; secret/dependency scan và `Required CI gate` của đúng SHA đạt. Không migration,
  thay secret hoặc sửa dữ liệu.
- OWNER xác nhận tiếp tục dùng GitHub Free/private và không nâng gói. Branch protection không được
  enforce; rủi ro được giảm bằng quy tắc chỉ phát hành SHA có Required CI gate xanh.
- Không còn blocker C52–C54 hoặc lệnh terminal dự án bị treo.
