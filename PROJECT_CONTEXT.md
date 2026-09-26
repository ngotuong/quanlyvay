---
project: QuanLyVayCaNhan
roadmap_version: 1.0.208
last_updated: 2026-09-26 12:46:45 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C55
current_status: AWAITING_APPROVAL
last_completed_checkpoint: C54
next_checkpoint: C55
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

## 6. Kiểm thử gần nhất

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

## 7. Việc chờ

- C52 `COMPLETED` ngày 2026-09-25: backup Production mã hóa và restore rehearsal đạt; CI dùng kiểm
  soát bù phù hợp GitHub Free/private; notification runner, Production smoke và runtime log đạt.
  Không deploy, migrate remote, push GitHub, `clasp push` hoặc thay đổi dữ liệu nghiệp vụ.
- C53/C54 `COMPLETED` ngày 2026-09-26: migration C51/C54, backup, rollout Vercel Production,
  authenticated smoke, runtime log, commit/push và Required CI gate đúng SHA đều đạt. Không còn
  blocker dashboard hoặc source local chưa đồng bộ GitHub.
- C55 `AWAITING_APPROVAL`: rollout phần Google Apps Script/Sheets của C47 đang có trong
  `apps/google-sync/src/Config.js`; chưa chạy `clasp push` hoặc đồng bộ Sheet remote. Phạm vi dự
  kiến chỉ xác minh target, build, đẩy Apps Script và smoke đồng bộ một chiều sang Sheet hiện hữu;
  không ghi ngược Supabase và không sửa dữ liệu tài chính.
- OWNER xác nhận tiếp tục dùng GitHub Free/private và không nâng gói. Branch protection không được
  enforce; rủi ro được giảm bằng quy tắc chỉ phát hành SHA có Required CI gate xanh.
- Không còn blocker C52–C54 hoặc lệnh terminal dự án bị treo.
