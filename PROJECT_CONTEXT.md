---
project: QuanLyVayCaNhan
roadmap_version: 1.0.112
last_updated: 2026-08-13 16:24:04 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C17-K04
current_status: IN_PROGRESS
---

# Project Context

## 1. Mục tiêu

Xây dựng webapp/PWA Next.js cho một OWNER và các tài khoản EDITOR/VIEWER được quản lý để theo dõi cả khoản đi vay và cho vay cá nhân, tính lãi theo ngày, giao dịch gốc/lãi, nhắc hạn, dashboard tài chính, audit log và sao lưu định kỳ.

Supabase là nguồn dữ liệu chuẩn. Google Sheets và Google Drive chỉ dùng để đối chiếu và sao lưu một chiều thông qua Apps Script.

Ánh xạ tài khoản vận hành bắt buộc:

- Apps Script, Google Sheets/Drive và Vercel: `vipmoschino@gmail.com`; giao diện Google có thể hiển
  thị định danh thứ hai `ngotuong077@gmail.com`, nhưng đây là cùng một tài khoản.
- Supabase: `tuongnt2105@gmail.com`.
- Không dùng tài khoản Google/Vercel để đăng nhập Supabase và không dùng tài khoản Supabase cho tài
  nguyên Google/Vercel.

## 2. Kiến trúc hiện tại

Repository đã có lớp quản trị dự án và nền tảng web local:

- Đường dẫn repository hiện tại là `/Users/ngotuong/AppsScript/QuanLyVayCaNhan`. Trong giao diện,
  thư mục cha có thể được hiển thị bằng nhãn “Apps Script”, nhưng tên filesystem không có dấu cách.
- Git repository branch `main` đã liên kết và theo dõi `origin/main` trên GitHub private.
- `AGENTS.md` là quy tắc làm việc ổn định.
- `PROJECT_CONTEXT.md` là handoff trạng thái hiện tại.
- `docs/IMPLEMENTATION_PLAN.md` là roadmap chuẩn.
- pnpm workspace tại root, pin Node.js 24.15.0 và pnpm 11.9.0.
- `apps/web` dùng Next.js 16.2.12, React 19.2.4, TypeScript 5.9.3, Tailwind CSS 4.3.3 và ESLint 9.39.5.
- `packages/domain-contract` chứa type contract và test fixture độc lập với production engine.
- `docs/DOMAIN_SPEC.md` là đặc tả nghiệp vụ v1 đã khóa cho C3–C4.
- Supabase local đã được khởi tạo với PostgreSQL 17, 21 migration, RLS và 364 pgTAP assertions.
- Bộ máy tài chính authoritative nằm trong PostgreSQL, có RPC tính/rebuild, ghi thanh toán, lifecycle, reversal và tất toán nguyên tử.
- `docs/FINANCIAL_ENGINE.md` mô tả contract C4; engine đã được giữ nguyên qua regression C5.
- Local Auth dùng username/password ánh xạ sang email nội bộ, session SSR, bắt đổi mật khẩu và vai trò `OWNER`/`EDITOR`/`VIEWER`; public signup bị tắt.
- `docs/AUTH.md` mô tả contract Auth/RBAC; OWNER Production thật đã được bootstrap và đổi mật khẩu.
- Web đã có CRUD đối tác/khoản vay, ghi giao dịch gốc/lãi/chi phí, lifecycle, tất toán, reversal,
  timeline, audit, trang chi phí chung `/expenses` và quản trị tài khoản OWNER tại `/settings`.
- `docs/WEB_WORKFLOWS.md` mô tả contract web; giao diện responsive dùng sidebar desktop và bottom navigation mobile.
- `docs/DESIGN_SYSTEM.md` khóa token semantic, typography Inter, primitive, Lucide SVG và app icon banking hình học,
  responsive và accessibility cho giao diện C16.
- Dashboard C7 dùng RPC PostgreSQL authoritative cho KPI, lợi nhuận tiền mặt/dồn tích, dòng tiền và lịch đến hạn; `/dashboard` là trang sau đăng nhập.
- `docs/DASHBOARD.md` mô tả định nghĩa chỉ số và quy ước dòng tiền; bundle Dashboard local dùng một
  snapshot hiện tại dùng chung cho KPI/analytics, UI đã kiểm tra responsive 375/768/1440px và light/dark mode.
- PWA có manifest, icon, service worker không cache dữ liệu tài chính, notification center và Web
  Push queue idempotent; trạng thái Push theo đúng thiết bị và subscription mới không nhận lịch sử.
- `docs/PWA_NOTIFICATIONS.md` mô tả quy tắc nhắc hạn, retry, VAPID local và ranh giới cấu hình cron remote.
- Google Sync local dùng schema v3, endpoint export Next.js bảo vệ bằng secret và phân trang hết dữ liệu;
  Apps Script chống formula injection, mười một tab đối chiếu gồm correction/settlement reversal/onboarding, cursor
  nguồn theo cả trạng thái đọc thông báo, giữ nguyên bigint audit dạng text, snapshot tuần giữ 12 bản và phục hồi chỉ trong workbook. Workbook cố định múi giờ
  `Asia/Ho_Chi_Minh`; có hàm bảo trì refresh contract và full sync để sửa header/ngày cũ an toàn.
- `docs/GOOGLE_SYNC.md` mô tả contract Sheet, Script Properties và ranh giới cấu hình remote C11–C12.
- Supabase Production project Singapore `hmfxnstrqfqpvsgfmjmd`, thuộc tài khoản
  `tuongnt2105@gmail.com`, đã áp 21/21 migration gồm Dashboard/analytics quản trị, notification theo
  giờ và tài khoản quản lý không giới hạn, không seed và public signup đã tắt.
  CLI đã đăng nhập
  đúng tài khoản/profile `quanlyvay`; legacy `anon`/`service_role` runtime keys đã phục hồi vào hai
  Keychain services Publishable/Secret tương ứng.
- Google/Clasp C11 đã đăng nhập bằng named user, tạo bound Sheet/Apps Script, push mã lần đầu và
  chạy installer. Snapshot tuần hoạt động độc lập; trigger sync theo giờ được hoãn đến khi C12 có
  Vercel URL/secret để không tạo lỗi định kỳ.

Kiến trúc đích:

```text
apps/web             Next.js PWA
apps/google-sync     Apps Script đồng bộ Google Sheets/Drive
supabase             Migration, RLS, database/Edge Functions
docs                 Kế hoạch và tài liệu kỹ thuật
```

## 3. Checkpoint hiện tại

| Trường | Giá trị |
|---|---|
| Checkpoint | C17-K04 — CI fail-closed |
| Trạng thái | `IN_PROGRESS` |
| Phạm vi đã duyệt | Workflow local cho PR/push gồm frozen install, lint/typecheck/unit/build, Supabase reset/lint/pgTAP/Auth, Playwright E2E, dependency/secret scan, pin version và concurrency cancel; giữ chính sách mật khẩu 6 ký tự |
| Kết quả local | Workflow/policy/runbook đã sẵn sàng; actionlint, fixture fail-closed, Gitleaks 60 commit, dependency audit, lint/typecheck/41 tests/build, DB lint, pgTAP 364/364, Auth 6/6 và E2E 10/10 đều đạt |
| Giới hạn | Workflow và bản sửa đã push; GitHub run `31685578084` xanh toàn bộ. Branch protection chưa bật vì GitHub API trả 403: repository private cần GitHub Pro hoặc public; chờ quyết định của OWNER, không tự đổi visibility/nâng gói |

## 4. Checkpoint hoàn tất gần nhất

### C16 — Kiểm thử dữ liệu thực tế đầu tiên

- Trạng thái: `COMPLETED` ngày `2026-08-13`.
- K01: backup Production AES-256-GCM local + Drive khớp GCM/SHA/RPO; restore cô lập khớp 21
  migration, RLS/Auth/calculation/export và RTO 278 giây.
- K02: GitHub `main` fast-forward tới `29cfd33`; remote hash và fresh-clone frozen install/lint/
  typecheck/39 tests/build đạt.
- K03: Supabase và Google Sheet khớp số dòng cùng SHA-256 tập ID của 11 dataset; snapshot cuối có
  24 khoản, 215 giao dịch, 213 kỳ và 326 audit; calculation 24/24, Dashboard không mismatch. OWNER
  xác nhận danh mục và hai khoản mới ngày 13/08 đúng sổ thực tế.
- Full gate cuối: `git diff --check`, lint, typecheck, 39/39 unit, build, Auth 6/6, E2E 10/10,
  DB lint không lỗi và pgTAP 364/364. Không correction/reversal hoặc xóa vật lý giao dịch.

### K02 — Đồng bộ mã nguồn an toàn lên GitHub

- Trạng thái: `COMPLETED` ngày `2026-08-13`.
- Preflight xác nhận `origin/main` là ancestor, không diverged; secret/dump/tệp lớn scan và toàn bộ
  local gate đạt trước push. Không force-push, tag hoặc PR.
- Sau xác nhận riêng, fast-forward `main` từ `15d1058` lên `29cfd33`. `git fetch`, local ref và
  `git ls-remote` cùng trả `29cfd33f23e9f8a735387de310b4c7c0cc4b8d63`.
- Fresh clone đúng remote commit đạt `pnpm install --frozen-lockfile`, lint, typecheck, 39/39 unit
  tests và production build. Workspace tạm đã được dọn khỏi repository.

### C15 — Sửa dữ liệu khoản vay và trình bày lãi theo kỳ

- Trạng thái: `COMPLETED`.
- Đầu ra: correction có reversal/replacement/audit/idempotency, nhập-hiển thị lãi theo kỳ, tiền lãi
  kỳ đầu authoritative, nhãn vay tự sinh và tên chỉ số Dashboard rõ nghĩa.
- Verification: lint/typecheck/28 tests/build, Auth 6/6, E2E 6/6, pgTAP 222/222; Supabase remote
  8/8; deployment Production Ready tại `sin1`; browser, HTTP smoke và cron đạt.
- Migration `20260803204500_c15_loan_corrections.sql` đã áp lên Production sau xác nhận. Bốn RPC C15
  hiện diện, bảng correction rỗng và dữ liệu hiện hữu vẫn là 1 khoản vay/1 giao dịch; RPC term
  summary đọc được khoản hiện tại mà không sửa dữ liệu.
- Vercel Production `dpl_8LugJRs4T3YB3R9u4gUhkfqZnENr` Ready, canonical alias đúng. Browser OWNER
  xác nhận Dashboard/chi tiết/form correction C15, console không lỗi. Login, manifest, service
  worker trả 200; endpoint cron/export thiếu secret trả 401; cron hằng ngày còn đủ.

### C13 — Production/UAT

- Trạng thái: `COMPLETED`.
- Đầu ra: restore snapshot và cleanup UAT đạt; Production Ready; OWNER `ngotuong` đổi mật khẩu và
  đăng nhập thành công; Web Push delivery thật đạt; Google Sync/backup triggers hoạt động; secrets
  đã rotate và lưu đúng Keychain theo tài khoản vận hành.
- Verification: gate C13 toàn trình trước deploy gồm Auth 5/5, E2E 6/6 và database 201/201 đạt;
  gate cuối lint/typecheck/28 tests/build và `git diff --check` đạt. Production smoke cuối: login 200,
  cron/export thiếu secret 401 và có secret 200. Web Push test `claimed=1`, `sent=1`, `failed=0` được
  người dùng nhìn thấy; notification/delivery test đã xóa, subscription OWNER vẫn còn.

### C14 — Hiệu năng và độ mượt UX

- Trạng thái: `COMPLETED`.

- Baseline Production: header `x-vercel-id` xác nhận Function ở `iad1` trong khi Supabase ở Singapore;
  năm lần tải `/login` có TTFB 401–529 ms, median khoảng 424 ms từ máy kiểm thử.
- Bản local đặt Vercel Function tại `sin1`; dữ liệu trang và unread count chạy song song sau cổng
  Auth; RPC calculation của workspace khoản vay chạy song song với bốn truy vấn lịch sử; profile
  được dedupe trong cùng request bằng React cache.
- Điều hướng có prefetch, progress bar/dấu pending phản hồi ngay khi bấm, `aria-busy`/live status cho
  screen reader và tự tắt chuyển động theo `prefers-reduced-motion` hiện có.
- Production `dpl_Eq1pHfEm95k3shoKEtwy2oP5N1kB` Ready và canonical alias đúng; header/inspect xác
  nhận toàn bộ Function tại `sin1`. Mười hai mẫu nóng `/login` có median TTFB 247 ms, giảm khoảng
  42% so với baseline 424 ms; cold start đầu tiên vẫn có thể cao hơn.
- Gate cuối đạt: lint, typecheck, 28/28 unit/domain/mock tests, Next.js/Vercel build, Auth 6/6, E2E
  6/6, pgTAP 201/201 và `git diff --check`. Production browser xác minh OWNER session, Dashboard,
  chuyển module, responsive 375 px không tràn ngang/touch target 52 px và không có console error.
- Lỗi CLI local được xử lý không phá hủy bằng biến lệnh `SUPABASE_PROFILE=supabase`; profile toàn
  cục `quanlyvay` và đăng nhập Production không bị sửa. Dùng cùng prefix khi chạy `supabase start`,
  `pnpm test:auth`, `pnpm test:e2e` hoặc `supabase test db` trên máy này.

## 5. Checkpoint tiếp theo

| Checkpoint | K04 — CI fail-closed trong C17 |
|---|---|
| Trạng thái | `IN_PROGRESS` |
| Phạm vi đã duyệt | Workflow/bản sửa đã push và GitHub Actions xanh. Cổng branch protection bị giới hạn gói cho private repository; chờ OWNER chọn nâng GitHub Pro hoặc bỏ qua acceptance này. Không khuyến nghị chuyển public. Chính sách mật khẩu 6 ký tự giữ nguyên |

## 6. Quyết định nghiệp vụ đang có hiệu lực

- Quản lý cả `LENDING` và `BORROWING`, chỉ dùng VND.
- Lãi = dư nợ gốc × lãi suất/ngày × số ngày thực tế; ngày giải ngân được tính.
- Chu kỳ đóng lãi 15 hoặc 30 ngày; khoản không đáo hạn tiếp tục mở kỳ mới đến khi tất toán.
- Khoản vay mặc định không có đáo hạn. Nếu bật tùy chọn đáo hạn thì ngày đáo hạn = ngày giải ngân + số ngày vay - 1 và kỳ cuối được rút ngắn tại mốc này.
- Trả gốc giữa kỳ có hiệu lực trên dư nợ từ ngày kế tiếp.
- Trả thiếu/thừa lãi được chuyển số dư sang kỳ sau; không tính lãi trên lãi.
- Quá hạn không có lãi phạt.
- Nợ xấu được bật/tắt tính lãi thủ công với ngày hiệu lực và lịch sử đầy đủ.
- Lợi nhuận theo cả tiền mặt và dồn tích; chi phí có thể chung hoặc gắn khoản vay.
- Giao dịch đã ghi nhận chỉ được đảo, không xóa vật lý.
- Lãi giữ decimal đầy đủ và làm tròn `HALF_UP` một lần ở cuối kỳ.
- Đổi lãi suất có hiệu lực đầu ngày; trả gốc có hiệu lực từ ngày kế tiếp; ngày ngừng lãi vẫn được tính.
- Chỉ khoản có ngày đáo hạn mới chuyển `OVERDUE`; sau đáo hạn lãi mức cũ tiếp tục trong kỳ `OVERDUE` mở và không có lãi phạt.
- Reversal giữ lịch sử nhưng tính lại kết quả từ ngày hiệu lực của giao dịch gốc.
- Supabase production dùng tài khoản mới và project Singapore đã tạo/link ở C10.
- Vercel dự kiến dùng tài khoản cũ; kiểm tra usage 30 ngày trước khi link ở C12.
- Google Sheets và Apps Script tiếp tục dùng tài khoản Google cũ với named `clasp --user`.

## 7. Tài nguyên remote

| Dịch vụ | Trạng thái |
|---|---|
| Git remote | `https://github.com/ngotuong/quanlyvay.git` — private, `main` theo dõi `origin/main` |
| Supabase | Profile `quanlyvay`; project `hmfxnstrqfqpvsgfmjmd` (`quan-ly-vay-ca-nhan`) tại Singapore; Production khớp 21/21 migration. Migration 20–21 đã áp qua SQL Editor từ source đã review; 2/2 profile có giờ hợp lệ, dữ liệu giữ 22 khoản/209 giao dịch. `pg_cron`, `pg_net`, `supabase_vault` đã bật; job `qlv-notification-runner-hourly` ID 1 active lịch `0 * * * *`, có hai Vault secret và test `net.http_post` trả 200/`queueRemaining=false`. Tài khoản EDITOR smoke cũ đã vô hiệu hóa và ban Auth; policy database không cho xóa vật lý profile |
| Vercel | Project `quan-ly-vay-ca-nhan` ID `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`. Production `dpl_5eSWfa11fZVESNLpeSrAr9qnssUX` target Production/Ready tại immutable `https://quan-ly-vay-ca-nhan-yx9w2e34a-ngotuong2105.vercel.app`, alias `https://tindung.vercel.app`. Stable Preview `dpl_3pMZZKUaUTh4E5WgLdRJ9VhWgnXV` target Preview/Ready tại immutable `https://quan-ly-vay-ca-nhan-734val51b-ngotuong2105.vercel.app`, alias `https://tindung-preview.vercel.app`; Functions `sin1`. Authenticated UI Playground component selection/persistence, console, public smoke và runtime error log đạt. Production `CRON_SECRET` đã xoay, lưu Keychain/Vault; gọi có secret trả 200 |
| Google Apps Script / `clasp` | `QuanLyVayCaNhanSync`, script ID `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`; schema v3 và audit follow-up đã push đủ 4 file bằng named user `quanlyvay-google` lúc 16:52 ngày 10/08/2026; hai trigger giữ nguyên, chưa chạy full sync thủ công |
| Google Sheets / Drive | Bound Sheet ID `1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8`; workbook schema v3 có 11 tab dữ liệu cộng `Tổng quan`. Backup đạt mới nhất `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260812T165654Z` gồm logical stream có ACL cho `auth/private/public/supabase_migrations` + manifest tại `/Users/ngotuong/Backups/QuanLyVayCaNhan` và DriveFS `QuanLyVayCaNhan_Backups`; GCM/SHA/RPO/restore rehearsal khớp, không lưu plaintext |

Repository chỉ lưu metadata remote cần cho handoff như project ref/URL; không lưu secret.

## 8. Blocker và cổng xác nhận

- K01 `COMPLETED` ngày `2026-08-13`. Sau xác nhận riêng, Supabase CLI đăng nhập đúng project và
  database password được xoay; password cùng khóa backup mới chỉ lưu trong macOS Keychain. Backup đạt
  `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260812T165654Z` ở local + DriveFS, ciphertext 861.546 byte,
  SHA-256 `c7cf1b051d686548cc968570e1a6234ec844d677c9be052c97edbb057dcfb22e`, GCM và RPO dưới 24 giờ đạt.
  Manifest có 21 migration, 2 profile/2 Auth user, 15 đối tác, 22 khoản, 209 giao dịch, 7 lifecycle,
  6 correction, 0 settlement reversal, 208 kỳ và 316 audit log.
- Restore rehearsal dùng image PostgreSQL `17.6.1.155`, bật `extensions.citext`, restore bằng
  `supabase_admin` vào container cô lập. Toàn bộ row count khớp; 22/22 calculation, invariant
  transaction/principal/reversal/settlement, Auth mapping, authenticated RLS và 11 projection Google
  export đều đạt; `anon` không có quyền SELECT. RTO đo 278 giây (4,63 phút) dưới mục tiêu 4 giờ;
  container đã dừng và tự xóa, Production không bị restore/mutate. Bản thử `...T165336Z` thiếu ACL
  bị rehearsal từ chối, vẫn giữ ở hai nơi; retention chỉ dry-run, không xóa bản nào.
- K02 `COMPLETED` ngày `2026-08-13`. Preflight xác nhận
  `origin/main` là ancestor, local ahead 16 commit trước commit K02 và không diverged; 195 file ứng
  viên không có dump/backup/credential file, không file nào trên 5 MiB và secret scan không có phát
  hiện rủi ro cao. Stable Preview được ghi nhận từ cùng `HEAD` trong lịch sử rollout; `vercel inspect`
  xác nhận deployment đúng project/target/Ready nhưng metadata CLI hiện không có Git provenance nên
  không được xem là bằng chứng độc lập cho commit.
- Full local gate K02 đạt: `git diff --check`, lint, typecheck, 39/39 unit, build, Auth 6/6 (gồm mật
  khẩu sáu chữ số), E2E 10/10, DB lint không lỗi và pgTAP 364/364. Docker credential helper local bị
  treo ở lần đầu; phần Supabase được chạy lại thành công với `DOCKER_CONFIG` tạm, không đăng nhập hay
  thay đổi remote. Sau xác nhận riêng, `git push origin main` fast-forward thành công từ `15d1058`
  lên `29cfd33`; local/origin/advertised hash khớp. Fresh clone đúng commit đạt frozen install, lint,
  typecheck, 39/39 unit và build; không push tag/PR hoặc force-push.
- K03 `COMPLETED` ngày `2026-08-13`. Phạm vi chỉ đọc đã đối chiếu từng khoản; không correction/
  reversal và không xóa vật lý giao dịch.
- Đối chiếu Supabase Production tại ngày nghiệp vụ `2026-08-13` đạt 22/22 calculation và không có
  sai lệch nội bộ về loan ID, trạng thái, dư gốc âm, khoản đã tất toán, giao dịch, kỳ materialize hay
  audit khoản vay. Số dòng khớp recovery point K01: 15 đối tác, 22 khoản, 209 giao dịch, 7 lifecycle,
  6 correction, 0 settlement reversal, 0 onboarding, 208 kỳ và 316 audit log.
- Tổng calculation khớp RPC Dashboard kỳ `2026-08-01`–`2026-08-13`: cho vay hoạt động 3,73 tỷ,
  nợ xấu cho vay 50 triệu, tổng cho vay 3,78 tỷ; đi vay hoạt động 950 triệu, nợ xấu đi vay 0. Không
  có correction/reversal hoặc mutation nào được gọi.
- Sau khi người dùng đăng nhập đúng tài khoản Google (UI hiển thị `ngotuong077@gmail.com`), workbook
  `QuanLyVayCaNhanSync` đọc được và xác nhận stale: source version
  `2026-08-04T08:38:06.21076+00:00`, xuất lúc `2026-08-04 15:54:45`; chỉ có 8 đối tác, 4 khoản,
  11 giao dịch, 0 lifecycle, 3 correction, 0 settlement reversal/onboarding, 87 kỳ, 0 chi phí,
  0 thông báo và 39 audit. Supabase hiện có 15/22/209/7/6/0/0/208/0/9/316 tương ứng.
- Lịch thực thi Apps Script cho thấy `runGoogleSheetSync` thất bại mỗi giờ; lần gần nhất
  `23:54:41 12/08/2026` ghi `Export API trả về HTTP 404` tại `Code:108:51`. Đối chiếu HTTP chỉ đọc
  xác nhận alias cũ `https://quan-ly-vay-ca-nhan.vercel.app/api/google-sync/export` trả 404, còn
  endpoint chuẩn `https://tindung.vercel.app/api/google-sync/export` trả 401 đúng khi thiếu secret.
  Sau xác nhận riêng, Script Property `SYNC_API_URL` đã đổi sang alias chuẩn; không đổi secret,
  source code, trigger, Supabase hay dữ liệu tài chính.
- `runGoogleSheetFullSync` chạy từ editor lúc `15:05:30 13/08/2026`, hoàn tất trong 18,297 giây.
  Workbook mới xuất lúc `15:05:34`, source version `2026-08-13T03:58:15.416559+00:00`; có 15 đối
  tác, 24 khoản, 215 giao dịch, 7 lifecycle, 6 correction, 0 settlement reversal/onboarding,
  213 kỳ, 0 chi phí, 9 thông báo và 326 audit. SHA-256 của tập ID từng tab khớp Supabase cho cả
  11 dataset; không chỉ dựa vào số dòng.
- Production tăng thêm hai khoản ACTIVE ngày `2026-08-13` trong khoảng K03 (một `LENDING` 400 triệu
  và một `BORROWING` 400 triệu), không phải mutation của agent. Snapshot hiện tại đã được tính lại:
  24/24 calculation, 0 internal issue, 0 Dashboard mismatch; tổng cho vay 4,18 tỷ gồm 4,13 tỷ hoạt
  động + 50 triệu nợ xấu, tổng đi vay 1,35 tỷ. Còn cần OWNER xác nhận các khoản/số tổng này phản ánh
  đúng sổ thực tế; OWNER sau đó xác nhận đây là các giao dịch mới phát sinh cùng ngày và toàn bộ danh
  mục/tổng số đúng. Full gate cuối đạt lint/typecheck/39 unit/build, Auth 6/6, E2E 10/10, DB lint và
  pgTAP 364/364; C16 đã hoàn tất.
- K04 thuộc C17 được người dùng phê duyệt ngày `2026-08-13` và đang `IN_PROGRESS`; workflow đã push,
  branch protection chưa thay đổi.
- K04 local đã thêm workflow bốn job bắt buộc cộng gate tổng hợp, concurrency cancel, quyền chỉ đọc,
  frozen install và khóa Node 24.15.0/pnpm 11.9.0/Supabase 2.109.0/Playwright 1.62.1. Action ngoài
  pin SHA, image actionlint/Gitleaks pin digest; workflow không tham chiếu repository/environment
  secret hoặc Production credential. Policy/actionlint đạt, fixture unsafe bị từ chối, Gitleaks
  quét 60 commit sạch và dependency audit không có lỗ hổng đã biết.
- Full local gate K04 đạt: `git diff --check`, lint, typecheck, 41/41 unit/regression, build, DB lint,
  pgTAP 364/364, Auth 6/6 gồm mật khẩu sáu chữ số và E2E 10/10. Workflow sau đó đã push; branch
  protection vẫn cần một xác nhận riêng sau khi GitHub Actions xanh.
- Sau xác nhận và GitHub OAuth scope `workflow`, push fast-forward hai commit C16/K04 tới `577a195`
  thành công; local/origin/advertised hash khớp. GitHub Actions run `31683908290` chứng minh policy,
  quality/build và security xanh; integration đạt reset 21 migration, DB lint, pgTAP và Auth nhưng
  E2E có 9/10 đạt, ca đầu timeout 30 giây trên runner lạnh tại bước mở disclosure. Required gate đỏ
  đúng fail-closed; không phải lỗi nghiệp vụ hoặc secret.
- Local tăng riêng Playwright timeout khi `CI=true` từ 30 lên 60 giây, giữ local 30 giây và retries=0;
  chạy lại `CI=true` đạt E2E 10/10. Bản sửa sau đó đã push theo xác nhận riêng; branch protection
  chưa thay đổi.
- Sau xác nhận riêng, push fast-forward bản sửa `e60f547`; local/origin/advertised hash khớp. GitHub
  run `31685578084` đạt cả năm check: workflow policy, quality/build, dependency/secret scan,
  Supabase/Auth/pgTAP/E2E và `Required CI gate`; E2E 10/10. Annotation duy nhất là action cài
  Supabase CLI còn metadata Node 20 nhưng runner ép Node 24 và job đạt; cần theo dõi/nâng action trước
  khi GitHub bỏ runtime tương thích.
- Kiểm tra branch protection chỉ đọc trả HTTP 403: GitHub yêu cầu nâng Pro hoặc chuyển repository
  private thành public. Không tự đổi visibility hoặc mua gói; với mã ứng dụng tài chính không khuyến
  nghị public. K04 giữ `IN_PROGRESS` chờ OWNER chọn nâng Pro hoặc bỏ qua acceptance branch protection.
- Đã rollout UI Playground từ cấp khối lên cấp thành phần ngày `2026-08-12`: người dùng có thể
  bấm trực tiếp tab/text/card trên canvas, chỉnh nhãn và tiêu đề, cỡ chữ/độ đậm, kích thước tab,
  padding/viền/bóng card; cấu hình tiếp tục tự lưu và xuất JSON. Full gate cùng authenticated,
  public, console và runtime smoke đạt; không còn blocker deploy.
- UI Playground Tổng quan đã rollout stable Preview ngày `2026-08-12`; không còn blocker deploy.
  Route dùng dữ liệu mẫu, lưu cấu hình trong `localStorage`, không mutate database và bị 404 trên
  Vercel Production. Bước tiếp theo là người dùng chỉnh trên Preview, sao chép cấu hình rồi gửi lại
  để chuyển thành code sản phẩm; mở rộng playground sang module khác cần chỉ dẫn tiếp theo.
- Revision giao diện/notification ngày `2026-08-12` đã rollout đủ Supabase, Preview và Production;
  authenticated/public/runtime smoke cùng scheduler test đều đạt. Không còn blocker migration,
  deploy hoặc cron. Vercel daily 07:00 giữ làm fallback; unique delivery/lease bảo vệ khi trùng job.
- Hardening ngày `2026-08-11` đã rollout đủ sau xác nhận: Supabase Production 19/19; Preview
  `dpl_CcfBZ534rdB3v8xoPF1GXatQy4PJ` và Production `dpl_6JNq6nufC3i9Y3pK1tG7UUqMuhHM`
  Ready/`sin1`, alias và toàn bộ smoke đạt. Không còn blocker migration/deploy. C16 vẫn
  `IN_PROGRESS` vì còn đối chiếu dữ liệu thật; mọi sửa dữ liệu Production tiếp tục cần xác nhận.
- Sau xác nhận ngày `2026-08-10`, source đã đạt Preview gate được deploy lại bằng Production
  environment thành `dpl_A8PwKgcoyPnRkpoUzX811SrDua5e`; alias `https://tindung.vercel.app` đã
  chuyển, app/API Functions ở `sin1`, smoke đạt và không có runtime error mới. Preview stable vẫn
  giữ nguyên để đối chiếu; Production cũ không bị xóa và còn dùng được làm điểm rollback.
- Preview lỗi ngày `2026-08-10` đã xử lý: `/loans` và Dashboard từng truyền event handler từ Server
  Component nên chỉ lỗi runtime sau đăng nhập dù Vercel báo `Ready`. Đã bỏ handler sai ranh giới,
  thêm điều khiển lọc thuần form/accessibility, E2E đạt 8/8 và chuyển stable alias sang deployment
  `dpl_9XzJ7353PG7rGxZoohrpDVXrhq1z`. Quy trình mới bắt buộc `pnpm deploy:preview`, candidate-first,
  đủ gate, smoke immutable URL, rồi mới gán alias và tự rollback nếu hậu kiểm thất bại.
- Vòng audit follow-up ngày `2026-08-10` đã rollout đủ: Supabase Production 17/17, Vercel
  `dpl_FiGJRF2QwFJHv4MVuQCmu4aZnV68` Ready/`sin1` và Apps Script push đủ 4 file. Dữ liệu tài chính
  Production không bị sửa. Audit frontend sau rollout ghi nhận ưu/nhược điểm và đề xuất tại
  `docs/audits/2026-08-10-frontend/AUDIT.md`.
- UI/UX follow-up A–E đã rollout ngày `2026-08-10` sau xác nhận riêng: Supabase Production 18/18;
  Vercel `dpl_8qr1E6uXb3j9PFGgagheFGJ98PS7` Ready/`sin1`, alias canonical và smoke đạt. Cảnh báo
  cache catalog `pg-delta` của CLI xuất hiện sau khi push nhưng migration history đã hậu kiểm khớp
  18/18. Apps Script không có thay đổi và không được push trong vòng này.
- C16 đã được người dùng phê duyệt ngày `2026-08-03` và đang `IN_PROGRESS`. Phần bổ sung không đáo
  hạn ngày `2026-08-04` đã rollout sau xác nhận riêng: backup mã hóa và restore rehearsal đạt;
  migration thứ 10, Vercel deploy, Apps Script push/full sync hoàn tất; khoản `Test` được sửa qua RPC
  correction có reversal/audit sang không đáo hạn. Production/browser/REST xác nhận `ACTIVE`, ngày
  đóng lãi tiếp theo 27/08/2026, kỳ 29/06–28/07 vẫn có lãi 13,5 triệu và đã đóng đủ. Gate cuối sau
  rollout đạt lint/typecheck/30 tests/build; Auth 6/6, E2E 7/7 và pgTAP 268/268 đã đạt với migration
  optional-maturity. Remediation trước đó đạt database lint, concurrency hai
  session và restore rehearsal logical stream (9 migration/9 bảng, SHA-256) trên database tạm đã
  xóa. Production pre-C16 backup đã hoàn tất: AES-256-GCM, khóa trong macOS Keychain, bản chính tại
  `/Users/ngotuong/Backups/QuanLyVayCaNhan`, bản sao DriveFS tại `QuanLyVayCaNhan_Backups`, SHA-256
  và GCM tag khớp, restore đầy đủ auth + app cùng calculation/RLS smoke đạt; container/database tạm
  đã xóa. Còn phải nhập và đối chiếu các khoản vay thực tế còn lại; mọi sửa sai lệch dữ liệu
  Production tiếp tục cần xác nhận riêng.
- Production hiện có 4 khoản vay. Bản đã rollout giữ kỳ Dũng Hùng 700 triệu kết thúc 18/08/2026 và
  tiền lãi đủ kỳ 21 triệu, nhưng cho phép nhắc thu 17/08 bằng offset một ngày. Onboarding khoản cũ lưu một
  snapshot bất biến gồm ngày chốt, dư gốc, tổng lãi đã thu và ngày nợ xấu; tạo giao dịch tổng hợp có
  audit, không yêu cầu nhập từng kỳ và không cho đảo lẻ. Gate đạt lint/typecheck/30 tests/build,
  Auth 6/6, E2E 7/7, pgTAP 293/293 và DB lint. Sau xác nhận riêng, backup mã hóa, migration 11,
  Vercel Production và Apps Script/Sheet schema v3 đã rollout. Lần chạy full sync đầu tiên gặp một
  HTTP 500 tạm thời từ Export API; retry ngay sau đó hoàn tất trong 24 giây và workbook đã hậu kiểm.
  C16 tiếp tục `IN_PROGRESS` để người dùng thử offset/onboarding và đối chiếu từng khoản; mọi sửa dữ
  liệu Production vẫn cần xác nhận riêng.
- Sau xác nhận phạm vi, local đã thêm **Ghi nhận đóng lãi** trên từng card kỳ còn dư: số tiền điền
  từ `closing_interest_balance_vnd`, ngày mặc định là ngày dự kiến thu sau offset, vẫn cho sửa và
  cảnh báo nếu nằm ngoài khoảng kỳ. Kỳ đủ/ứng trước hiển thị **Đã đóng đủ**. Engine/RPC không đổi;
  giao dịch vẫn thuộc kỳ chứa ngày thực tế và giữ idempotency. Gate đạt lint, typecheck, 30/30
  unit/domain/mock tests, build và E2E 7/7 từ database sạch. Thay đổi chỉ ở local, cần xác nhận riêng
  trước khi deploy Vercel Production để người dùng nhập dữ liệu thật. Sau xác nhận riêng, deployment
  `dpl_3zr2dbAFnNR9txwVzsXAqqfM2fzg` đã Ready, alias `https://tindung.vercel.app`, login/manifest 200
  và export thiếu secret 401; Functions hậu kiểm ở `sin1`.
- Lần gọi deploy đầu tiên từ `apps/web` không đọc `.vercel/project.json` ở repository root nên CLI
  tạo nhầm project `web` (`prj_Wi1AlfHl5N0ajzE1SJX4qxqAZubR`) và deployment
  `dpl_4pzzFrFVw2QfFCKBZUTzLNpphQrh`. Project này tách biệt, không có Production env/secrets hoặc dữ
  liệu. Sau xác nhận riêng, project và toàn bộ deployment/alias riêng của nó đã xóa; `project inspect web`
  trả not found. Project chính vẫn đúng ID, deployment Ready và smoke 200/200/401. Các lần deploy
  project thật phải chạy tại repository root.
- Đối chiếu Production ngày 04/08 xác nhận `A.Phúc Hà · Cho vay · 200.000.000 ₫ · 16/03/2026`
  đang có `direction=LENDING`, còn khoản 450 triệu cùng đối tác là `BORROWING`; vì vậy khoản 200 triệu
  không xuất hiện trong số lượng/nhóm đi vay. Chưa sửa dữ liệu remote. Local bỏ mặc định `LENDING`,
  bắt buộc chọn rõ hướng và dùng `VndInput` tự chèn dấu chấm cho toàn bộ trường tiền gốc, thanh toán,
  chi phí, onboarding và đóng lãi nhanh; Server Action tiếp tục chuẩn hóa về số nguyên. Gate đạt
  lint/typecheck/30 tests/build và E2E 7/7. Người dùng sau đó tự correction khoản này; hậu kiểm hiện
  là `A.Phúc Hà · Đi vay · 200.000.000 ₫ · 16/03/2026`, `direction=BORROWING`, `ACTIVE`. Sau xác nhận
  riêng, deploy `dpl_FyPUjxnZtf1KacCHehESA3NbKCoV` Ready/`sin1`; smoke 200/200/401 đạt.
- Production hiện có 192 dòng `transactions`. Chính sách ledger append-only tiếp tục giữ nguyên:
  giao dịch sai được đảo thay vì xóa. Với quy mô cá nhân, số dòng này rất nhỏ; ưu tiên khả năng đối
  chiếu/audit hơn tiết kiệm dung lượng. Không tạo dữ liệu test trong Production; nếu tăng lớn bất
  thường thì theo dõi kích thước bảng/index và cân nhắc archive lạnh, không xóa giao dịch tài chính.
- Đối chiếu chỉ-đọc ngày 05/08 xác nhận Đạt Pha 50 triệu đang `BAD_DEBT`, đã đóng lãi đến kỳ
  11/09–10/10/2024 và có `BAD_DEBT_START` ngày 09/11/2024. Engine giữ đúng toàn bộ kỳ chưa đóng
  11/10–09/11 là 1,5 triệu lãi còn thiếu, dừng phát sinh từ 10/11, dư gốc 50 triệu. Không cần
  correction/onboarding hoặc sửa dữ liệu Production.
- Theo phê duyệt revision C16 ngày 05/08, local có migration thứ 12 tạo
  `get_management_dashboard(period_start, period_end)`: số dư chốt cuối kỳ; lãi/chi phí/dòng tiền
  chỉ trong kỳ; dư gốc nợ xấu tách khỏi hoạt động nhưng giữ trong tổng vốn. Dashboard có preset và
  khoảng tùy chỉnh; `/loans` tìm tên khoản/đối tác, lọc hướng/trạng thái/ngày, sắp xếp và giữ trạng
  thái trên URL. UI gọi mốc nợ xấu là “Ngày cuối cùng còn tính lãi”. DB lint, pgTAP 309/309, Auth
  6/6 và E2E 8/8 đạt. Sau xác nhận cả ba bước, backup mã hóa
  `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260805T104926Z` đã lưu local + DriveFS và xác minh; migration
  12/12 đã áp; Vercel `dpl_2ZV4SEs6QHWAwYX1yqpHqwUS95Mu` Ready/`sin1`. RPC remote trả đúng
  4,1 tỷ hoạt động + 50 triệu nợ xấu = 4,15 tỷ tổng; anonymous 401, số dòng dữ liệu không đổi và
  HTTP smoke đạt. Không cần Apps Script push vì export/Sheet schema không đổi.
- Theo phê duyệt UX quản trị ngày 05/08, migration thứ 13 tạo
  `get_management_analytics` và `get_loan_management_summary`: biểu đồ/tổng lãi lấy số liệu
  authoritative, gồm onboarding lịch sử và loại giao dịch đã đảo. Dashboard phân tầng bốn KPI chính
  trước vốn/nợ xấu, giữ tên ngắn “Lãi ròng phát sinh” với công thức; thêm ba biểu đồ. `/loans` có sáu
  chip lọc nhanh; chi tiết chia bốn tab URL, tách xem dữ liệu khỏi thao tác rủi ro và có biểu đồ 12 kỳ.
  Gate local đạt lint/typecheck/30 tests/build, Auth 6/6, E2E 8/8, pgTAP 318/318; browser QA 375px
  xác nhận touch target tab 48px, không tràn ngang. Dữ liệu QA local đã reset. Sau xác nhận riêng,
  Production áp đủ 13/13 và giữ nguyên 20 khoản/192 giao dịch/201 kỳ; RPC mới trả đúng cấu trúc,
  anonymous 401. Vercel `dpl_6tLW1RRqEhawJoRnnWDGytMPtdsL` Ready/`sin1`, canonical và smoke đạt.
- UI/UX Giai đoạn 3 đã rollout ngày 06/08. Migration thứ 15 thêm
  `get_management_dashboard_bundle_v2`, trả Dashboard/analytics kỳ hiện tại và Dashboard kỳ liền
  trước cùng số ngày trong một round trip; không thay đổi engine hoặc dữ liệu. First fold giữ bốn
  KPI có nhãn tăng/giảm, xu hướng dòng tiền có trục/tooltip focus-touch/bảng số liệu và danh sách
  cần xử lý; vốn, nợ xấu và phân tích chi tiết nằm trong disclosure. Gate đạt lint/typecheck/30
  tests/build, E2E 8/8, pgTAP 328/328 và diff-check. Production 15/15, giữ 20 khoản/192 giao
  dịch/201 kỳ; Vercel `dpl_HCKarHQbgg3etjkJUgi1z37TQSwA` Ready/`sin1`, canonical và smoke
  200/200/200/401/401 đạt. Giai đoạn 4 là bước tiếp theo; C16 vẫn `IN_PROGRESS`.
- UI/UX Giai đoạn 4 đã rollout ngày 06/08 và không có migration mới. Design system dùng token
  semantic, Be Vietnam Pro 16 px, nền canvas ấm/surface phân tầng, primitive form 48 px, custom
  brand SVG và Lucide SVG; mọi input/select được ràng buộc theo container nên bộ lọc không tràn ở
  mobile 375 px. Responsive QA đạt 375/768/1024/1440 px và mobile landscape, console sạch và dark
  mode đúng token; gate
  đạt lint/typecheck/30 tests/build, E2E 8/8, pgTAP 328/328 và diff-check. Production giữ 15/15,
  20 khoản/192 giao dịch/201 kỳ; Vercel `dpl_5Hfm1zcftVbjoQBR3r4Y2J3pSxSx` Ready/`sin1`, canonical
  và smoke 200/200/200/401/401 đạt. Bốn giai đoạn UI/UX đã hoàn tất; C16 vẫn `IN_PROGRESS` để người
  dùng kiểm tra Production và tiếp tục đối chiếu dữ liệu thật.
- Sau phản hồi Production cùng ngày 06/08, design system Giai đoạn 4 được tinh chỉnh: loại toàn bộ
  sắc kem/vàng đồng và gradient trang trí khỏi shell/card/button/filter; chuyển sang canvas
  cool-white `#f6f7fb`, cobalt `#4f46e5`, cyan accent và elevation thấp. Logo tự vẽ được thay bằng
  ChartSpline; navigation và tiêu đề module dùng các Lucide hình học đồng nhất. Visual QA Dashboard
  xác nhận 44 SVG, card không còn background gradient, không overflow và console không lỗi. Gate
  đạt lint/typecheck/30 tests/build, E2E 8/8, pgTAP 328/328, diff-check; QA user local đã được xóa
  bằng reset database local. Không migration; Production giữ 15/15, 20 khoản/192 giao dịch/201 kỳ.
  Vercel `dpl_4arxAzUaVakmJf5dejeFwdB4ZNgP` Ready/`sin1`, canonical và smoke
  200/200/200/401/401 đạt. C16 vẫn `IN_PROGRESS` để người dùng kiểm tra trực tiếp.
- Vòng tinh chỉnh nhận diện ngày 06/08 dùng app icon chân dung tối giản dựa trên ảnh Ngô Tường
  Banking, giữ cobalt nhưng bỏ chữ/crypto/chi tiết huy hiệu để đọc tốt ở 192/512 px và maskable.
  Toàn bộ UI đổi Be Vietnam Pro sang Inter; bỏ mô tả lặp ở heading, KPI chính, trang đăng nhập và
  hướng dẫn tab; đổi `Dashboard` thành `Tổng quan`. Thông báo đẩy và nhật ký hệ thống được Việt hóa;
  audit hiển thị tên bảng, trường, enum/vai trò/trạng thái bằng tiếng Việt, có E2E chống lộ khóa
  `direction`/giá trị `LENDING`. Gate đạt lint/typecheck/30 tests/build, E2E 8/8, pgTAP 328/328 và
  diff-check. Không có migration hoặc ghi dữ liệu Production. Vercel
  `dpl_9K7Q6KbxFcw7F9GKtK6uxqnt7wpi` Ready/`sin1`, canonical và smoke
  login/manifest/icon/dashboard 200, export thiếu secret 401.
- Phản hồi Production ngày 06/08 về khoản `Ngân · Đi vay · 100.000.000 ₫ · 09/04/2026` xác nhận
  engine `calculate_loan` tính đúng kỳ 08/07–06/08 đủ 30 ngày và 2.100.000 ₫. UI Các kỳ lãi trước
  đó đọc `interest_periods` materialize ngày 05/08 nên hiện kỳ mở 29 ngày/2.030.000 ₫. Web nay ánh
  xạ trực tiếp các kỳ từ calculation snapshot theo ngày hiện tại, gồm số tiền điền sẵn khi đóng
  lãi; không sửa schema, engine, giao dịch hay dữ liệu Production. App icon chân dung được thay bằng
  biểu tượng banking hình học không chữ/người. Gate đạt lint/typecheck/30 tests/build, E2E 8/8,
  pgTAP 328/328 và diff-check. Vercel `dpl_DqNjxmmdPt25ToknLtzh4pJSwfm7` Ready/`sin1`, alias chính
  đúng; login/manifest/icon 200 và asset Production khớp SHA-256 local.
- Vòng phản hồi tiếp theo xác nhận lỗi kỳ đang chạy có thể ảnh hưởng hiển thị mọi khoản không có
  mutation mới, nhưng không ảnh hưởng calculation authoritative; bản 1.0.75 đã sửa chung. Badge
  thông báo trước đó không giảm khi mở vì item chỉ điều hướng, không đánh dấu đã đọc, và layout
  chưa được revalidate. Nay click notification đánh dấu đúng một item rồi mở khoản vay; đánh dấu
  tất cả cũng làm mới badge toàn app. Production được kiểm tra chỉ-đọc có đúng 2 thông báo chưa đọc,
  không tự đổi trạng thái của người dùng. Tab kết quả khoản vay thành một hàng trượt ngang; card có
  ba cột Dư nợ/Lãi còn lại/Lãi đã thu hoặc trả. Migration 16 bổ sung tổng lãi effective đến ngày
  hiện tại, loại reversal và cộng onboarding. Gate đạt lint/typecheck/30 tests/build, E2E 8/8,
  pgTAP 329/329 và diff-check. Production 16/16; Vercel `dpl_B17L9WG5Az66dBXG6B8ZijF3XAwf`
  Ready/`sin1`, canonical và smoke đạt.
- C11 hoàn tất; kiểm thử phục hồi snapshot toàn trình được giữ cho UAT ở C13.
- Google Drive connector hiện đăng nhập tài khoản khác nên không đọc được Sheet ID của dự án; đây
  không phải lỗi runtime. `clasp logs` cũng không khả dụng vì Apps Script chưa liên kết GCP project;
  không tạo thêm GCP project chỉ để đọc log.
- C12 đã được phê duyệt; Vercel CLI 54.20.0 có sẵn. Không truy cập tài khoản, link project, thay đổi
  secret, deploy hoặc kích hoạt trigger sync cho đến khi có xác nhận riêng cho thao tác tương ứng.
- Usage Vercel 30 ngày (02/07–01/08) đã kiểm tra chỉ-đọc: Fast Data Transfer 215,67 MB/100 GB,
  Fast Origin Transfer 45,09 MB/10 GB, Edge Requests 19.887/1.000.000, Function Invocations
  9.482/1.000.000 và Build Time 3/100 giờ. Tài khoản Hobby đủ dư địa cho project mới.
- Project Vercel đã link local; `.vercel/` và `.env.local` có OIDC token đều được Git bỏ qua. Remote
  settings đã cập nhật đúng Next.js, root `apps/web`, Node.js 24.x.
- Tám biến Preview đã cấu hình và xác minh metadata; Supabase keys lấy từ Keychain. Cặp VAPID,
  `CRON_SECRET` và `SYNC_SECRET` sinh mới được lưu trong Keychain theo account project ID; không
  hiển thị hoặc commit giá trị. Preview deployment đã đọc đúng các biến này.
- Điều tra Preview xác nhận project tracking đúng: Production=`main`, Preview=tất cả nhánh khác.
  Lần thử thứ tư vẫn bị ép thành Production dù dùng `--target=preview`, `githubDeployment=1` và
  `githubCommitRef=c12-audit-preview`, chứng minh nguyên nhân không phải Git ref. Vercel Community
  staff xác nhận deployment đầu tiên của project rỗng tự động là Production và khuyến nghị tạo
  placeholder bằng `--prod --skip-domain`, sau đó tạo deployment thứ hai đúng Preview.
- `vercel deploy --dry` ban đầu phát hiện 151 file/7,36 MB, gồm `.clasp.json` và catalog tạm Supabase.
  Pattern `.vercelignore` đầu tiên quá rộng và loại nhầm `apps/web/src/lib/supabase`, khiến build
  remote lần bốn lỗi module. Pattern đã neo vào root; dry-run hiện còn 93 file/402 KB, không còn
  Clasp/Supabase root/Google Sync nhưng giữ đủ 5 module Supabase web. `pnpm build` local đạt lại.
- Endpoint notification hỗ trợ `GET|POST`; `apps/web/vercel.json` đăng ký cron `0 0 * * *`, phù hợp
  giới hạn Hobby một lần/ngày. Lint/typecheck/test/build đều đạt sau thay đổi.
- Revision audit local đã xử lý phân trang export vượt 1.000 dòng, giữ tiền/lãi suất dưới dạng chuỗi
  chính xác, idempotency category chi phí, Push lịch sử/trạng thái thiết bị, lỗi query bị che, reversal
  sau tất toán, formula injection, dependency CVE, UI chi phí chung và quản trị tài khoản thứ hai.
- Migration thứ bảy `20260802123000_audit_remediation.sql` đã áp lên Supabase remote sau xác nhận
  riêng. Hậu kiểm xác nhận history 7/7, constraint/index hợp lệ, ba RPC chứa đúng remediation và chỉ
  `service_role` có quyền claim Push. Không seed hoặc xóa dữ liệu tài chính.
- Gate revision đạt: lint, typecheck, 24 unit/domain tests, build production, dependency audit không
  còn lỗ hổng đã biết, database lint và 201/201 pgTAP trên database hiện tại. Toàn bộ 7 migration cũng
  được dựng lại và đạt 201/201 pgTAP trên database tạm độc lập; database tạm đã xóa sau kiểm thử.
- Supabase CLI 2.109.0 đọc active profile tùy chỉnh `quanlyvay` thành một đường dẫn không có phần mở
  rộng nên báo `Unsupported Config Type ""`. Workaround không phá hủy là đặt
  `SUPABASE_PROFILE=supabase` cho lệnh local; stack đã start và Auth 6/6, E2E 6/6, pgTAP 201/201 đạt.
  Không cần sửa/xóa profile toàn cục hoặc đăng nhập lại Supabase Production.
- Lệnh `vercel deploy --yes` không có `--prod` vẫn tạo deployment đầu tiên với target Production,
  gán alias public và đăng ký một cron. Deployment `dpl_FwHD1YJfUQhiv9o7GGh1CqhgsR2H` đã được
  xóa sau xác nhận; kiểm tra lại cho thấy không còn deployment hoặc cron. Lần deploy kế tiếp bắt
  buộc dùng `--target=preview` tường minh.
- Lần deploy thứ hai vẫn bị Production dù có `--target=preview`. Metadata cho thấy CLI gửi
  `githubCommitRef: main` và backend suy diễn nhánh production dù project chưa link GitHub. Không
  tìm thấy log lỗi cron trong 30 phút gần nhất. Deployment thứ hai đã xóa sau xác nhận; kiểm tra
  lại cho thấy không còn deployment/cron. Lần thử tiếp theo dùng nhánh local tạm `c12-preview`,
  sau đó quay về `main`, không push nhánh.
- Lần deploy thứ ba từ nhánh local tạm `c12-preview` vẫn bị suy diễn thành Production. Sau xác nhận
  riêng ngày `2026-08-02`, deployment `dpl_CRBZgN83d4x9yCSstWCKoPQt52Js` đã được xóa. Hậu kiểm:
  `vercel inspect` không còn tìm thấy ID, project không còn deployment, `vercel crons ls` không còn
  cron và ba alias của project không còn trong danh sách alias account.
- Lần deploy thứ tư tạo `dpl_JgSzJ1qFKEqS488hrc5umXkyyjR1` vẫn bị Vercel đánh dấu Production dù
  target và Git metadata Preview tường minh; build đồng thời lỗi do `.vercelignore` loại nhầm module.
  Theo quyền cleanup đã xác nhận, deployment được xóa ngay. Hậu kiểm xác nhận ID không còn, project
  không có deployment, alias hoặc cron. Không smoke test và không cấu hình Google Sync.
- Workflow lần năm tạo placeholder Production `dpl_2s7VzLH52U44MrthakxCSiG7VXLt` bằng
  `--prod --skip-domain`, sau đó deployment thứ hai `dpl_A7XSVMo1iNayxaMEZN4XbPWc4CfX` được
  `vercel inspect` xác nhận `target=preview`, Ready. Placeholder đã xóa; hiện chỉ còn Preview và
  không còn cron Production.
- Smoke Preview đạt: `/login`, manifest và service worker trả 200; endpoint Sync/Cron thiếu secret
  trả 401; Google Sync với Keychain secret trả 200 và đọc đủ tám bảng Supabase remote. Dữ liệu remote
  hiện rỗng. Automation bypass do `vercel curl` tạo đã được thu hồi; SSO protection trở lại cấu hình
  ban đầu và `protectionBypass` rỗng.
- Preview được bảo vệ bằng SSO. Persistent automation bypass đã tạo và lưu Keychain; Google Sync
  gửi thêm `x-vercel-protection-bypass`. Bốn file Apps Script đã push, ba Script Properties đã lưu,
  installer tạo đúng hai trigger và hai lần sync cuối hoàn tất; lần gọi đầu gặp HTTP 500 tạm thời,
  đối chiếu trực tiếp trả 200 và chạy lại thành công, không có dữ liệu Sheet bị ghi sai.
- Git local đã chuyển về `main`; nhánh tạm `c12-preview` (cùng trỏ `7f2f346`) đã xóa sau khi bảo toàn
  toàn bộ working tree. Local `main` đang đi trước `origin/main` 33 commit; không được push nếu chưa
  có xác nhận riêng.
- Mật khẩu database remote nằm trong macOS Keychain service `QuanLyVayCaNhan Supabase Database`, account `postgres`; không lưu trong Git.
- Remote migration history hiện khớp local 7/7. `db lint --linked` của CLI 2.111 trước đó bị treo và
  đã được dừng; migration mới đã qua db lint và 201 pgTAP local trước khi áp remote.
- Publishable/secret API keys nằm trong Keychain services `QuanLyVayCaNhan Supabase Publishable Key` và `QuanLyVayCaNhan Supabase Secret Key`, account `hmfxnstrqfqpvsgfmjmd`.
- Remote Auth smoke test đạt với `disable_signup=true`; anonymous đọc `loans` bị RLS từ chối HTTP 401.
- VAPID/cron/sync secret và Vercel bypass đã cấu hình cho Preview, lưu đối chiếu trong Keychain;
  Production không có deployment hoặc cron. Google Sync theo giờ đã kích hoạt sau xác nhận riêng.
- Mọi thao tác tài khoản/remote tiếp tục bị khóa theo `AGENTS.md`.
- Git identity local là `Ngo Tuong <vipmoschino@gmail.com>`; remote `origin` trỏ tới repository private `ngotuong/quanlyvay`.
- GitHub CLI 2.97.0 đã đăng nhập active account `ngotuong`; credential nằm trong macOS keyring, không nằm trong repository.
- Supabase local đang chạy bằng Docker; có thể dừng bằng `supabase stop` khi không sử dụng.
- OWNER tạm `preview_owner` từng được tạo cho Preview để UAT; Auth user/profile này cùng
  `c13_editor` đã xóa cứng ngày `2026-08-03`. Credential cũ trong Keychain không còn đăng nhập được.
- C13 đã được duyệt; restore snapshot, xóa UAT, cấu hình 8 Production env/secrets và Production deploy
  đã hoàn tất sau các xác nhận riêng. Không tự bootstrap OWNER thật nếu chưa có xác nhận mới.
- UAT Preview đã tạo tài khoản `c13_editor` (EDITOR), đổi mật khẩu bắt buộc thành công, tạo một đối
  tác, ba khoản vay có nhãn `UAT C13`, một thanh toán lãi và một chi phí chung. Notification runner
  sinh đúng hai thông báo cho khoản đến hạn; EDITOR đánh dấu đã đọc độc lập thành công.
- UAT phát hiện và đã deploy lên Preview ba bản sửa: OWNER không đăng nhập được khi có profile thứ
  hai do query thiếu `user_id`; EDITOR vào trang OWNER-only gây lỗi máy chủ; quan hệ one-to-one
  `expenses` khiến category không hiển thị đúng trên trang chi phí và timeline. Hậu kiểm Preview xác
  nhận redirect EDITOR và category đúng; OWNER remote chưa thể thử lại vì người dùng đã đổi mật khẩu.
- Test harness local có fallback Docker khi Supabase CLI profile toàn cục lỗi; `test:auth` đạt 5/5,
  E2E đạt 6/6 gồm multi-user/owner-only/category regression. Lint/typecheck/24 tests/build đạt.
- Google Sync sau dữ liệu UAT hoàn tất và weekly snapshot chạy idempotent. Snapshot trước UAT đã
  được restore toàn trình rồi sync về nguồn chuẩn thành công ngày `2026-08-03`. Web Push không thể
  cấp permission trong in-app browser và Chrome connector không khả dụng; notification generation/UI
  đã đạt nhưng delivery thật còn chờ thiết bị có thể cấp permission.
- Preview C13 mới nhất `dpl_FmoZL1DvYnesrafCNVCSMExTPaPd` đã deploy sau xác nhận riêng,
  `target=preview`, Ready và stable alias đã chuyển sang bản này; không tạo Production deployment
  hoặc cron. Smoke đạt `/login` 200, manifest 200, export thiếu secret 401 và có secret 200.
- Bản cast tiền/lãi suất/bigint sang `text` đã được xác minh trên export remote bằng dữ liệu UAT:
  1 đối tác, 3 khoản vay, 5 giao dịch, 3 kỳ lãi, 1 chi phí, 2 thông báo và 14 audit log đều giữ kiểu
  chính xác. Local gate tương ứng đạt lint/typecheck/25 tests/build/E2E 6/6.
- Restore toàn trình đã đạt: snapshot đưa 8 bảng về 0, phát hiện cursor cũ làm sync bị bỏ qua, sửa
  `restoreSnapshotById` xóa `SYNC_CURSOR`, regression test đạt và sync lại đúng dữ liệu nguồn. Wrapper
  UAT tạm đã xóa khỏi local và Apps Script remote.
- Cleanup UAT đã xóa đúng 2 Auth user, 2 profile, 1 đối tác, 3 khoản vay, 5 giao dịch, 1 chi phí,
  3 kỳ lãi, 2 thông báo và 14 audit log sau transaction có assertion ID/số lượng. Supabase public,
  Auth và workbook Google Sheets đều hậu kiểm về 0; hai snapshot Drive được giữ nguyên.
- Full gate sau restore/cleanup đạt lint, typecheck, 25 tests, build, E2E 6/6 và pgTAP 201/201.
- Production Vercel `dpl_7imjmJCiWXhYsTKAGkF8CGGNgtsC` đã deploy `target=production`, Ready và alias
  `https://quan-ly-vay-ca-nhan.vercel.app`. Tám env được cấu hình từ Keychain; cron hằng ngày tồn tại.
  Smoke đạt login/manifest 200, thiếu secret 401, cron có secret 200; export có secret gặp một HTTP 500
  tạm thời rồi retry trả payload `empty` hợp lệ. Google Sync đã chuyển sang canonical Production URL,
  chạy thành công và wrapper cấu hình tạm đã xóa khỏi Apps Script remote.
- Theo yêu cầu ngày `2026-08-03`, contract mật khẩu đã đổi thành tối thiểu 6 ký tự, chỉ gồm
  chữ ASCII hoặc số, không bắt buộc chữ hoa hay phối hợp chữ/số. Contract dùng chung cho bootstrap,
  Server Action và UI; lint/typecheck/27 tests/build/E2E 6/6 đạt. Production đã redeploy bản này bằng
  deployment `dpl_5hhHjcJeod8atQYMsLXEsQB1vwdk`; smoke login/manifest/cron/export đạt.
- OWNER Production `ngotuong` (`Ngô Tường`) đã bootstrap qua Admin API sau xác nhận, profile có vai
  trò `OWNER`, active và `must_change_password=true`; đăng nhập Auth thật đạt. Mật khẩu tạm chỉ lưu
  trong macOS Keychain service `QuanLyVayCaNhan Production Owner Password`, account `ngotuong`, và
  được bàn giao trực tiếp cho người dùng; không ghi vào repository.
- UAT đổi mật khẩu Production ngày `2026-08-03` trả lỗi generic. Đối chiếu xác nhận
  `supabase/config.toml` vẫn cấu hình `minimum_password_length=10` và bắt chữ thường/chữ hoa/số,
  không khớp contract UI 6 ký tự. Regression Auth với `123456` tái hiện chính xác
  `AuthWeakPasswordError`; đây là nguyên nhân, không phải lỗi kết nối. Local đã đổi config về 6 và bỏ
  yêu cầu thành phần, thêm log code/status an toàn và E2E cho `123456`/`abcdef`. Lint/typecheck/27
  tests/build đạt; `test:auth` ban đầu 4/5 subtest đạt và ca mới thất bại đúng policy daemon cũ.
- Sau xác nhận riêng, `supabase config push` hiển thị diff Auth chỉ gồm `minimum_password_length`
  10→6 và `password_requirements` từ `lower_upper_letters_digits` về rỗng; API/DB/Storage đều
  `up_to_date`. Lần chạy hậu kiểm báo toàn bộ remote config `up_to_date`, xác nhận public signup vẫn
  giữ disabled theo config. Production đã redeploy bản xử lý lỗi bằng
  `dpl_C3LZT8ZipBxVe5JHT1NKWb2cxACs`, Ready/target production/canonical alias đúng; smoke login 200,
  cron thiếu secret 401, cron có secret 200 và export có secret 200. Supabase local đã stop có backup
  volume nhưng lần start lại treo khi Docker inspect image dù image tồn tại, nên chưa chạy lại
  `test:auth`/E2E sau restart; không dùng gate cũ làm bằng chứng đạt policy mới.
- Người dùng xác nhận đổi mật khẩu Production thành công sau bản sửa. Phiên browser kiểm thử mới
  không mang session sau đổi mật khẩu, nên trang login đã bàn giao để người dùng tự nhập credential
  mới trước khi agent tiếp tục Push; mật khẩu mới không được yêu cầu hoặc đọc.
- Kiểm tra vận hành phát hiện các generic-password item dự án (Supabase CLI/API keys, Vercel secrets
  và OWNER tạm) không còn trong login Keychain dù trước đó đã tồn tại. Production vẫn hoạt động vì
  secret remote không đổi. `vercel env pull --environment=production` chỉ trả giá trị rỗng cho các
  biến sensitive nên không thể phục hồi plaintext; file tạm đã xóa tự động. Supabase CLI cũng báo
  thiếu access token. Không rotate hoặc thay remote secret khi chưa có xác nhận riêng. Local Supabase
  hiện đang dừng với database volume được backup sau lần restart phục vụ Auth regression.
- Người dùng đăng nhập lại Production thành công và `/notifications` nhận đúng profile OWNER. Nút
  `Bật thông báo` hoạt động nhưng in-app browser trả permission khác `granted`; UI hiển thị đúng hướng
  dẫn bật quyền và không tạo subscription giả. Chrome connector không khả dụng. Web Push delivery
  thật vì vậy vẫn cần người dùng đăng nhập/cấp Notification trên Chrome hoặc Safari. Việc gọi runner
  thủ công để xác minh delivery cũng cần rotate/phục hồi `CRON_SECRET`; không tạo dữ liệu Production
  hoặc đổi secret khi chưa có xác nhận riêng.
- Sau xác nhận riêng, sinh mới cặp VAPID, `CRON_SECRET` và `SYNC_SECRET`, lưu 5 mục trong login
  Keychain, cập nhật 5 Production env và deploy `dpl_FyEms173nyotuyToed6XSZgR1LxJ` Ready với
  canonical alias. Smoke login 200; cron/export thiếu secret 401 và có secret mới 200; cron hằng ngày
  vẫn tồn tại. Apps Script source đã push và Google Sync local đạt typecheck/12 tests/build, nhưng
  `clasp run` trả “Script function not found” cho các entry point nên Script Properties chưa nhận
  secret mới. Không tự tạo `clasp deploy`; Google Sync theo giờ đang tạm gián đoạn do secret mismatch.
- Đăng nhập lại Supabase CLI bằng OAuth thành công với tài khoản `vipmoschino@gmail.com`, nhưng tài
  khoản chỉ thấy project `vtdb` (`lyquwesyjbpalnwfxzwl`); gọi API keys cho Production
  `hmfxnstrqfqpvsgfmjmd` bị 403. Không lấy key project khác và chưa ghi hai Supabase API key vào
  Keychain. Docker daemon đang dừng nên chưa thể chạy lại Auth/E2E/pgTAP local. Full gate không phụ
  thuộc Docker đạt: lint, typecheck, 28 tests và build.
- Người dùng xác nhận ánh xạ tài khoản: Google Apps Script/Vercel dùng `vipmoschino@gmail.com`, còn
  Supabase dùng `tuongnt2105@gmail.com`. Phiên Supabase CLI và web sai đã đăng xuất; OAuth mới đang
  chờ người dùng tự nhập credential đúng. Apps Script manifest đã thêm `executionApi.access=MYSELF`,
  push và deploy `AKfycbzaCdwUgej073WAhA04kS4zM9HUPLBTxBU5FpvmvZB4yjkSMNqJVJE09WBjTceWlu4`
  phiên bản `@3`. CLI đã nhận diện hàm nhưng không có quyền `scripts.run` do giới hạn OAuth client;
  Script Properties vẫn cần cập nhật qua giao diện chủ sở hữu.
- Người dùng đăng nhập Supabase web đúng `tuongnt2105@gmail.com`; OAuth CLI hoàn tất và project list
  chỉ ra đúng linked Production `hmfxnstrqfqpvsgfmjmd`. API trả đủ legacy/publishable/secret keys;
  chỉ cặp publishable/secret được lưu vào đúng hai Keychain services, không in giá trị. Apps Script
  UI đã mở để người dùng đăng nhập `vipmoschino@gmail.com`; secret mismatch vẫn chưa được xử lý.
- Người dùng xác nhận Apps Script hiển thị `ngotuong077@gmail.com`, là định danh thứ hai của cùng tài
  khoản `vipmoschino@gmail.com`. Qua Project Settings, `SYNC_API_SECRET` đã thay bằng secret Vercel
  mới và `VERCEL_PROTECTION_BYPASS_SECRET` cũ đã xóa. Manual `runGoogleSheetSync` lần đầu nhận HTTP
  500 tạm thời, retry hoàn tất thành công lúc 15:24:33; sync theo giờ không còn mismatch. Keychain
  hậu kiểm đủ Supabase publishable/secret và Vercel sync secret; `git diff --check` đạt. Trang trigger
  xác nhận còn đủ `runGoogleSheetSync` và `runWeeklySnapshot`; tỷ lệ lỗi lịch sử của sync đang 75% do
  các lần chạy trong khoảng secret mismatch, cần các lần chạy thành công tiếp theo để tự giảm.
- Người dùng cấp Notification permission và Production có đúng một subscription cho OWNER
  `ngotuong`. Hậu kiểm phát hiện các key loại `default` do Supabase CLI trả không phải plaintext
  runtime dùng được (`401 Invalid API key`), nên Keychain đã sửa về đúng legacy `anon` và
  `service_role`; REST profile/subscription smoke đạt. Tạo một notification kiểm thử C13 không chứa
  dữ liệu tài chính, runner trả HTTP 200 với `claimed=1`, `sent=1`, `failed=0`. Notification test id
  `c386bbe2-14af-4564-9d15-441d616166b4` đã được người dùng xác nhận nhìn thấy trên thiết bị; delivery
  acceptance đạt. Sau xác nhận riêng, xóa trả HTTP 204; notification và delivery còn 0, subscription
  OWNER vẫn còn 1.

## 9. Lệnh kiểm tra chuẩn

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
supabase db reset
supabase db lint --level warning
supabase test db
git status --short --branch
git diff --check
git remote -v
```

## 10. Thay đổi gần nhất

1. `2026-08-13` — Push bản sửa `e60f547`; GitHub CI run `31685578084` xanh toàn bộ năm check,
   gồm E2E 10/10 và `Required CI gate`. Branch protection API trả 403 vì repository private cần
   GitHub Pro hoặc public; không đổi visibility/nâng gói. K04 giữ `IN_PROGRESS` chờ OWNER quyết định
   nâng Pro hay bỏ qua acceptance branch protection.
1. `2026-08-13` — Push C16/K04 fast-forward tới GitHub `577a195`. Run CI đầu `31683908290` xanh
   policy/quality/security và DB/Auth, nhưng E2E 9/10 do ca đầu vượt timeout 30 giây trên runner lạnh;
   required gate đỏ đúng fail-closed. Local tăng timeout chỉ khi CI lên 60 giây, giữ retries=0 và
   E2E `CI=true` đạt 10/10; chờ xác nhận riêng để push bản sửa, chưa bật branch protection.
1. `2026-08-13` — K04 local sẵn sàng: thêm GitHub Actions fail-closed, policy regression, fixture
   unsafe và runbook CI; action/version/image đều pin, không dùng Production secret. Policy/actionlint,
   Gitleaks 60 commit, dependency audit, diff-check, lint/typecheck/41 tests/build, DB lint, pgTAP
   364/364, Auth 6/6 và E2E 10/10 đạt. K04 giữ `IN_PROGRESS`, chờ xác nhận riêng để push workflow;
   branch protection là cổng remote kế tiếp độc lập.
1. `2026-08-13` — Người dùng phê duyệt K04. Chuyển C17-K04 sang `IN_PROGRESS` để dựng và kiểm thử
   GitHub Actions fail-closed tại local; giữ chính sách mật khẩu 6 ký tự. Chưa push workflow, chưa
   bật branch protection và không dùng Production secret/dữ liệu thật.
1. `2026-08-13` — OWNER xác nhận 24 khoản và hai khoản 400 triệu mới đúng sổ thực tế. Full gate cuối
   đạt diff-check, lint, typecheck, 39/39 unit, build, Auth 6/6, E2E 10/10, DB lint và pgTAP 364/364.
   K03/C16 chuyển `COMPLETED`; không correction/reversal hoặc xóa giao dịch. K04 CI fail-closed trong
   C17 chuyển `AWAITING_APPROVAL`; chưa push hay đổi branch protection.
1. `2026-08-13` — Sau phê duyệt ba thao tác, đổi duy nhất Apps Script `SYNC_API_URL` sang
   `https://tindung.vercel.app`; full sync hoàn tất 18,297 giây. Sheet hiện khớp Supabase theo số
   dòng và SHA-256 tập ID của 11 dataset: 15 đối tác/24 khoản/215 giao dịch/213 kỳ/326 audit cùng các
   bảng phụ. Tính lại snapshot mới đạt 24/24 calculation và Dashboard 4,18 tỷ cho vay/1,35 tỷ đi vay.
   Không đổi secret/source/trigger/Supabase và chưa correction/reversal; chờ OWNER xác nhận sổ thật.
1. `2026-08-13` — Sau đăng nhập Google, xác nhận Sheet stale từ bản xuất 04/08: 4 khoản/11 giao
   dịch/87 kỳ/39 audit so với Supabase 22/209/208/316. Trigger sync thất bại mỗi giờ với HTTP 404 do
   `SYNC_API_URL` còn alias cũ `quan-ly-vay-ca-nhan.vercel.app`; alias chuẩn `tindung.vercel.app`
   đáp ứng đúng. Chờ xác nhận riêng để sửa đúng một Script Property và chạy full sync; chưa mutation
   Supabase hay correction/reversal.
1. `2026-08-13` — K03 đối chiếu chỉ đọc Supabase đạt 22/22 calculation, 0 invariant issue; 15 đối
   tác/22 khoản/209 giao dịch/208 kỳ/316 audit khớp recovery point. Tổng Dashboard khớp calculation:
   cho vay 3,78 tỷ (3,73 tỷ hoạt động + 50 triệu nợ xấu), đi vay 950 triệu. Google Sheet private trả
   401 và in-app browser đã mở trang sign-in đúng workbook; chờ người dùng đăng nhập đúng tài khoản
   Google trước khi đọc Sheet. Chưa correction/reversal hoặc sửa remote.
1. `2026-08-13` — Người dùng phê duyệt K03. Chuyển K03 sang `IN_PROGRESS` để đối chiếu chỉ đọc
   từng khoản giữa Supabase authoritative, calculation, Dashboard, audit và Google Sheet. Chưa
   correction/reversal hoặc sửa remote; mật khẩu 6 ký tự giữ nguyên.
1. `2026-08-13` — Hoàn tất K02 sau xác nhận push: fast-forward GitHub `main` từ `15d1058` lên
   `29cfd33`; local, `origin/main` và `git ls-remote` cùng hash. Fresh clone đúng commit đạt
   `pnpm install --frozen-lockfile`, lint, typecheck, 39/39 unit và build; workspace tạm đã dọn khỏi
   repository. Không force-push/tag/PR. K03 chuyển `AWAITING_APPROVAL`.
1. `2026-08-13` — K02 preflight đạt: fetch xác nhận `origin/main` là ancestor và local ahead 16
   commit trước commit K02; 195 file không chứa dump/credential, không có file trên 5 MiB, secret
   scan không có phát hiện rủi ro cao. `git diff --check`, lint, typecheck, 39/39 unit, build, Auth
   6/6, E2E 10/10, DB lint và pgTAP 364/364 đều đạt. Chưa push; đang chờ xác nhận riêng cho
   fast-forward `git push origin main` rồi mới fresh-clone smoke.
1. `2026-08-13` — Hoàn tất K01 sau xác nhận remote: đăng nhập đúng Supabase và xoay database
   password; backup đạt `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260812T165654Z` mã hóa AES-256-GCM có
   ACL tại local + DriveFS, SHA/GCM/RPO khớp. Restore container cô lập khớp 21/21 migration và toàn
   bộ row count, 22/22 calculation, invariant/RLS/Auth/11 Google export projection; RTO 278 giây,
   container đã cleanup. Rehearsal loại một bản thử thiếu ACL nhưng không xóa file; retention chỉ
   dry-run. Sửa CLI manifest và thêm regression; lint/typecheck/39 tests/build/diff-check đạt.
   K02 chuyển `AWAITING_APPROVAL`, chưa push GitHub; chính sách mật khẩu 6 ký tự không đổi.
1. `2026-08-12` — Người dùng phê duyệt Giai đoạn 1 K01–K03. Bắt đầu K01 local: thêm manifest
   `QLV_BACKUP_MANIFEST_V1`, CLI create/verify fail-closed theo project/RPO 24 giờ/path/kích thước/
   SHA-256 và retention dry-run 7 ngày–4 tuần–12 tháng không tự xóa. Thêm 6 unit tests vào
   `pnpm test`; lint/typecheck/38 workspace tests/build/diff-check đạt. Không truy cập/dump
   Production, không ghi Drive và không đổi chính sách mật khẩu 6 ký tự. K01 chờ xác nhận riêng cho
   backup Production cùng restore rehearsal cô lập.
1. `2026-08-12` — Sau phê duyệt K01 remote, preflight chỉ đọc xác minh toàn bộ 20 ciphertext local
   cũ và 5/5 file bản mới nhất trên DriveFS đều khớp SHA-256; manifest mới nhất hai nơi giống nhau.
   Phát hiện Supabase CLI mất access token, database password và khóa backup trong Keychain hiện tại
   không còn; hai Keychain cũ chỉ trả metadata nhưng payload rỗng. Dừng trước đăng nhập/reset/sinh
   khóa mới để xin xác nhận riêng; chưa dump, chưa ghi Drive và Production không thay đổi.
1. `2026-08-12` — Sau xác nhận riêng, chạy runbook Preview đủ hai pha cho Playground cấp thành
   phần. Candidate `dpl_3pMZZKUaUTh4E5WgLdRJ9VhWgnXV` target Preview/Ready/`sin1`, immutable
   `https://quan-ly-vay-ca-nhan-734val51b-ngotuong2105.vercel.app`; authenticated smoke xác nhận
   chọn text/card, sửa nội dung và persistence, console/runtime log sạch. Stable alias
   `https://tindung-preview.vercel.app` đã chuyển và hậu kiểm đúng deployment; full gate đạt lại
   lint/typecheck/32 tests/build, E2E 10/10. Production không thay đổi.
1. `2026-08-12` — Nâng UI Playground Tổng quan từ chỉnh cấp khối sang chọn/chỉnh cấp thành phần.
   Canvas cho phép bấm tab, text hoặc card để mở nhóm thuộc tính tương ứng; tab sửa được ba nhãn,
   cỡ chữ, chiều cao, padding, khoảng cách và bo góc; text sửa ba tiêu đề, cỡ chữ và độ đậm; card
   sửa padding, viền và bóng. Giữ điều khiển 44 px, focus/keyboard alternative, responsive và
   localStorage/JSON. Gate local đạt lint/typecheck/32 tests/build, E2E 10/10; chưa deploy Preview.
1. `2026-08-12` — Bỏ workflow Figma do giới hạn gói miễn phí; thêm `/ui-playground` chỉ ở
   Local/Preview với dữ liệu mẫu, bảng điều khiển nội dung/màu/spacing/radius, Mobile/Desktop,
   Light/Dark, kéo-thả cùng nút lên/xuống accessible, ẩn/hiện khối, tự lưu `localStorage` và sao chép
   JSON. Gate đạt lint/typecheck/32 tests/build và E2E 10/10. Candidate
   `dpl_A241RwoGLzm3G4mQov3UA5R6Pywi` target Preview/Ready/`sin1`, immutable
   `https://quan-ly-vay-ca-nhan-34b8azojd-ngotuong2105.vercel.app`; authenticated smoke playground,
   persistence, console và runtime log đạt rồi chuyển `tindung-preview.vercel.app` thành công.
1. `2026-08-12` — Sau xác nhận riêng, áp migration 20–21 lên Supabase Production, history khớp
   21/21; schema/RPC/quyền đúng và dữ liệu giữ 22 khoản/209 giao dịch. Full Preview gate đạt lại,
   authenticated smoke Dashboard/Thông báo/Khoản vay cùng console/log sạch; chuyển stable Preview
   sang `dpl_G2r3YPUsRwbLVRiGzLoHQbyAQeon`, immutable
   `https://quan-ly-vay-ca-nhan-1q2pd332o-ngotuong2105.vercel.app`. Production cuối là
   `dpl_5eSWfa11fZVESNLpeSrAr9qnssUX`, immutable
   `https://quan-ly-vay-ca-nhan-yx9w2e34a-ngotuong2105.vercel.app`, alias `tindung.vercel.app`;
   cả hai ở `sin1` và public smoke 200/200/401. Bật pg_cron/pg_net/Vault, xoay `CRON_SECRET` vào
   Keychain/Vault, tạo job ID 1 mỗi giờ và test thật trả 200, `queueRemaining=false`.
1. `2026-08-12` — Hoàn tất local revision theo phản hồi giao diện: mobile chỉ còn một tiêu đề module
   trong header; toàn bộ disclosure dùng `+` khi đóng và `−` khi mở; card Dashboard đổi thành
   `Lịch Dự Kiến`, bỏ các nhãn lặp, dùng icon cho vay xanh/đi vay đỏ và kẻ phân cách từng dòng;
   banner tháng hiển thị tổng giao dịch cùng số khoản/tổng tiền phải thu và phải trả. Notification
   cho phép từng tài khoản chọn giờ 00–23 theo Việt Nam; worker claim đúng giờ, gửi từng item riêng,
   drain tối đa 20 batch × 500 và giữ idempotency/retry. Gate đạt lint/typecheck/32 tests/build,
   E2E 9/9, DB lint và pgTAP 364/364. Migration 20–21, Supabase Cron/Vault và web chưa rollout remote.
1. `2026-08-11` — Người dùng xác nhận authenticated smoke candidate UI đạt; runbook chạy lại
   lint/typecheck/32 tests/build/E2E 9/9 rồi chuyển stable alias sang
   `dpl_F6kXSWBSn3gTxWQpA5PXj6wi7S29`, target Preview/Ready/`sin1`, immutable
   `https://quan-ly-vay-ca-nhan-j9b5n211g-ngotuong2105.vercel.app`. Hậu kiểm
   `https://tindung-preview.vercel.app` trỏ đúng deployment, login/manifest 200, export/cron thiếu
   secret 401 và Vercel runtime error log sạch. Không rollout migration hoặc Production.
1. `2026-08-11` — Sau xác nhận deploy Preview, runbook chạy lại lint/typecheck/32 tests/build và
   E2E 9/9, tạo candidate `dpl_F6kXSWBSn3gTxWQpA5PXj6wi7S29` target Preview/Ready tại immutable
   `https://quan-ly-vay-ca-nhan-j9b5n211g-ngotuong2105.vercel.app`; Functions ở `sin1`, public smoke
   login/manifest 200 và export/cron thiếu secret 401, Vercel error log sạch. Không có browser session
   kết nối để authenticated smoke, nên script giữ `awaiting_authenticated_smoke` và chưa chuyển
   `tindung-preview.vercel.app`.
1. `2026-08-11` — Hoàn tất local revision UI: tìm kiếm khoản vay debounce 300 ms, quick/select/date/
   sort cập nhật kết quả và URL ngay, bỏ nút `Áp dụng`; Dashboard tùy chỉnh ngày cũng cập nhật ngay.
   Card khoản vay đưa tên–gốc và tag lên hàng đầu, hiển thị giải ngân/lãi suất/ngày đóng lãi cùng ba
   chỉ số dư gốc–lãi phải thu/trả–lãi đã thu/trả authoritative. Icon `HandCoins` cho vay dùng xanh,
   `Landmark` đi vay dùng đỏ; mobile header hiển thị tên/icon module hiện tại. Thiết kế giữ design
   system hiện hữu, thêm semantic token light/dark và nhãn dialog rõ ngữ cảnh. Gate đạt
   lint/typecheck/32 tests/build, E2E 9/9 và diff-check. Chưa deploy Preview, không đổi remote/schema.
1. `2026-08-11` — Người dùng xác nhận notification mẫu trên immutable candidate tạm ổn và duyệt
   chuyển stable Preview. Runbook chạy lại lint/typecheck/32 tests/build/E2E 9/9, xác nhận
   `dpl_9mwFrBZ81RZDLbKjLSZEjiFzbRwy` target Preview/Ready/`sin1`, rồi chuyển
   `https://tindung-preview.vercel.app`. Hậu kiểm alias đạt 200/200/401/401 và runtime error log
   sạch. Migration 20 chưa áp Supabase remote; tiếp tục chỉnh sửa trên stable Preview.
1. `2026-08-11` — Theo xác nhận deploy Preview, thêm nút `Gửi thông báo thử` chỉ ở local/Preview;
   nút dùng service worker hiển thị đúng mẫu thu lãi và không ghi database. Gate bắt buộc đạt
   lint/typecheck/32 tests/build và E2E 9/9. Candidate `dpl_9mwFrBZ81RZDLbKjLSZEjiFzbRwy`
   target Preview/Ready, immutable `https://quan-ly-vay-ca-nhan-adl5zw858-ngotuong2105.vercel.app`,
   Functions `sin1`; public smoke và runtime error log đạt. Stable alias chưa chuyển vì còn chờ
   authenticated smoke trên immutable URL; migration 20 chưa áp Supabase remote.
1. `2026-08-11` — Hoàn tất local revision notification/Dashboard: nhắc lãi dùng tiêu đề
   `Đến ngày thu lãi`/`Đến ngày đóng lãi`, body đối tác–gốc–ngày giải ngân và số phải thu/trả;
   migration làm mới item chưa đọc hiện hữu và Push mang tổng unread để đồng bộ app-icon badge khi
   nền tảng hỗ trợ. Dashboard mặc định tháng này; banner bỏ chú thích cũ, tách gross phải thu/phải
   trả thay vì cộng lẫn hai hướng. Gate đạt lint/typecheck/32 tests/build, Auth 6/6, E2E 9/9,
   DB lint và pgTAP 360/360; migration 20 và web chưa rollout.
1. `2026-08-11` — Sau xác nhận riêng, áp migration 19 lên Supabase Production; migration history
   khớp 19/19 và DB lint remote sạch. Preview candidate `dpl_CcfBZ534rdB3v8xoPF1GXatQy4PJ`
   target Preview/Ready/`sin1` vượt đủ gate, immutable authenticated smoke và runtime log trước khi
   chuyển `https://tindung-preview.vercel.app`; hậu kiểm alias đạt. Production
   `dpl_6JNq6nufC3i9Y3pK1tG7UUqMuhHM` target Production/Ready/`sin1`, immutable URL và alias
   `https://tindung.vercel.app` đạt login/manifest 200, export/cron thiếu secret 401, authenticated
   route/RBAC, console và runtime log sạch. Tài khoản EDITOR smoke `codex_smoke_36832493` đã vô hiệu
   hóa và ban Auth; policy database chủ động chặn xóa vật lý profile. Không push GitHub hoặc Apps Script.
1. `2026-08-11` — Theo yêu cầu sửa các phát hiện audit, local hardening bốn nhóm: Preview candidate
   dừng trước alias cho đến khi có xác nhận authenticated smoke và runtime log; Auth/E2E luôn dùng
   profile `supabase` và `db reset` đầy đủ migration thay vì truncate schema có thể stale; runner
   Push retry ba lần khi ghi trạng thái delivery, trả 500 và đếm `stateUpdateFailed` nếu vẫn lỗi;
   migration 19 bỏ giới hạn hai tài khoản, giữ một OWNER và cho quản lý nhiều EDITOR/VIEWER tại
   `/settings`. Gate đạt lint/typecheck/32 tests/build, Auth 6/6, E2E 9/9, DB lint, pgTAP 355/355
   và diff-check. Sau đó đã rollout theo mục mới nhất ở trên.
1. `2026-08-10` — Theo xác nhận trực tiếp, deploy source đã qua Preview gate lên Vercel Production
   bằng Production environment: `dpl_A8PwKgcoyPnRkpoUzX811SrDua5e` target Production/Ready,
   immutable `https://quan-ly-vay-ca-nhan-aby8upnqh-ngotuong2105.vercel.app`, alias
   `https://tindung.vercel.app`. App/API Functions ở `sin1`; middleware edge toàn cầu. Smoke
   login/manifest/dashboard 200, export/cron thiếu secret 401; không có runtime error mới. Preview
   `dpl_9XzJ7353PG7rGxZoohrpDVXrhq1z` và Production cũ được giữ nguyên làm điểm đối chiếu/rollback.
1. `2026-08-10` — Khắc phục Preview không dùng được sau chỉnh UI/UX: Vercel runtime log xác nhận
   `/loans` nhận hai `onChange` và Dashboard nhận một `onClick` từ Server Component. Đã chuyển bộ
   lọc về form submit có label, bỏ handler cuộn không cần thiết và sửa regression E2E; gate đạt
   lint/typecheck/32 tests/build/E2E 8/8. Preview `dpl_9XzJ7353PG7rGxZoohrpDVXrhq1z`
   target Preview/Ready/`sin1`, alias `https://tindung-preview.vercel.app`; browser login sạch,
   smoke 200/200/401/401 và không có runtime error mới. Thêm script fail-closed
   `pnpm deploy:preview`, runbook và quy tắc bắt buộc candidate-first/rollback alias.
1. `2026-08-10` — Sau xác nhận riêng cho đúng hai thao tác remote, áp migration actionable lên
   Supabase Production và hậu kiểm history khớp 18/18; migration không có DML, REST chỉ-đọc ghi nhận
   22 khoản vay/209 giao dịch/208 kỳ lãi hiện có. Deploy Vercel Production
   `dpl_8qr1E6uXb3j9PFGgagheFGJ98PS7` Ready/`sin1`, alias `https://tindung.vercel.app`; smoke
   login/manifest/dashboard 200 và export/cron thiếu secret 401. Không push Apps Script, không sửa
   dữ liệu tài chính.
1. `2026-08-10` — Hoàn tất local UI/UX follow-up C16 A–E: migration 18 sửa `Cần xử lý` thành
   actionable contract có `PRINCIPAL_OVERDUE`/`INTEREST_DUE`, lọc số dư lãi dương và trả riêng ngày
   nhắc/kỳ chốt. Dashboard giữ bốn KPI đầu và bỏ nested scroll; list bỏ shortcut lặp, ưu tiên dư nợ/
   việc kế tiếp và có advanced bottom sheet; detail có hero, modal context, summary dưới ba kỳ và
   nhóm settings rõ. Gate đạt lint/typecheck/32 tests/build, Auth 6/6, E2E 8/8 năm viewport, DB lint,
   pgTAP 355/355 và diff-check. Chưa migration/deploy/push remote.
1. `2026-08-10` — Người dùng phê duyệt toàn bộ kế hoạch UI/UX follow-up C16. Chuyển kế hoạch sang
   `IN_PROGRESS`, triển khai local theo thứ tự contract `Cần xử lý`, Dashboard, danh sách, chi tiết,
   responsive/accessibility; migration/deploy/push remote tiếp tục cần xác nhận riêng.
1. `2026-08-10` — Lập kế hoạch UI/UX follow-up theo audit và phản hồi người dùng: giữ đủ bốn KPI ở
   đầu Dashboard; xác định `Cần xử lý` hiện gộp quá hạn gốc với mọi lịch nhắc lãi trong 30 ngày mà
   không lọc số dư dương. Contract đề xuất chỉ giữ item actionable, phân biệt hạn gốc/nhắc lãi và
   loại khoản đã đóng đủ/ứng trước. Kế hoạch năm giai đoạn ở `docs/C16_UI_UX_FOLLOWUP_PLAN.md`
   đang `AWAITING_APPROVAL`; chưa đổi code, migration hoặc remote.
1. `2026-08-10` — Sau xác nhận riêng, áp migration audit follow-up lên Supabase Production 17/17;
   deploy Vercel Production `dpl_FiGJRF2QwFJHv4MVuQCmu4aZnV68` Ready/`sin1`, alias canonical và
   smoke 200/200/401/401 đạt; push Apps Script đủ 4 file. Audit frontend bằng bảy ảnh xác nhận visual
   system và modal tốt, nhưng Dashboard/list quá dày, detail/interest không đều mật độ, settings rối
   và chuyển màn thiếu liên tục thị giác; server local warm vẫn 80–173 ms. Báo cáo tại
   `docs/audits/2026-08-10-frontend/AUDIT.md`.
1. `2026-08-10` — Hoàn tất audit follow-up cục bộ: cursor export nhận thay đổi `notifications.read_at`;
   audit bigint đi qua Apps Script dưới dạng text; lần sync thành công không đổi dữ liệu vẫn cập nhật
   `LAST_SYNC_AT`; `/loans` loại ngày lịch không hợp lệ; bundle Dashboard tái sử dụng một snapshot
   hiện tại thay vì tính engine lặp; nâng dependency để xóa hai High CVE; đồng bộ README/context.
   Gate đạt lint/typecheck/32 tests/build, Auth 6/6, E2E 8/8, dependency audit sạch, DB lint,
   pgTAP 335/335 và migration local 17/17. Chưa áp migration, deploy hoặc push remote.
1. `2026-08-06` — Sửa click thông báo tự đánh dấu đúng item và làm mới badge layout; Production
   hiện có 2 item chưa đọc và được giữ nguyên để người dùng kiểm tra. Chuyển sáu tab kết quả khoản
   vay thành một hàng trượt ngang; card có thêm Lãi đã thu/trả cùng hàng Dư nợ và Lãi còn lại.
   Migration 16 trả tổng lãi effective, loại reversal và cộng onboarding. Gate đạt
   lint/typecheck/30 tests/build, E2E 8/8, pgTAP 329/329, diff-check. Supabase Production 16/16;
   Vercel `dpl_B17L9WG5Az66dBXG6B8ZijF3XAwf` Ready/`sin1`, canonical và smoke đạt.
1. `2026-08-06` — Sửa sai lệch hiển thị kỳ lãi đang chạy: khoản Ngân engine trả đúng 30 ngày/
   2.100.000 ₫ nhưng UI đọc bản materialize ngày trước nên hiện 29 ngày/2.030.000 ₫. Tab Các kỳ lãi
   và nút đóng lãi nhanh nay dùng trực tiếp calculation snapshot theo ngày hiện tại; không đổi dữ
   liệu hay engine. Thay app icon chân dung bằng biểu tượng banking hình học. Gate đạt
   lint/typecheck/30 tests/build, E2E 8/8, pgTAP 328/328, diff-check; không migration. Production
   `dpl_DqNjxmmdPt25ToknLtzh4pJSwfm7` Ready/`sin1`, canonical và smoke login/manifest/icon đạt.
1. `2026-08-06` — Tinh chỉnh nhận diện và ngôn ngữ theo phản hồi Production: tạo app icon chân
   dung tối giản từ ảnh tham chiếu, tích hợp PWA/shell/auth; đổi font sang Inter; gỡ mô tả lặp ở
   heading/KPI/login/chi tiết khoản; đổi `Dashboard` thành `Tổng quan`; Việt hóa toàn bộ thông báo
   thiết bị và payload nhật ký hệ thống. Gate đạt lint/typecheck/30 tests/build, E2E 8/8, pgTAP
   328/328 và diff-check. Không migration; Vercel `dpl_9K7Q6KbxFcw7F9GKtK6uxqnt7wpi`
   Ready/`sin1`, canonical và smoke login/manifest/icon/dashboard 200, export thiếu secret 401.
1. `2026-08-06` — Tinh chỉnh Giai đoạn 4 theo phản hồi Production: bỏ kem/navy/bronze và gradient
   trang trí, chuyển sang cool-white/cobalt/cyan với card phẳng/elevation thấp; thay logo tự vẽ bằng
   ChartSpline và chuẩn hóa icon navigation/module bằng Lucide hình học. Visual QA xác nhận 44 SVG,
   không overflow, console sạch. Gate đạt lint/typecheck/30 tests/build, E2E 8/8, pgTAP 328/328 và
   diff-check; không migration, Production giữ 15/15 và 20 khoản/192 giao dịch/201 kỳ. Vercel
   `dpl_4arxAzUaVakmJf5dejeFwdB4ZNgP` Ready/`sin1`, canonical và smoke 200/200/200/401/401 đạt.
1. `2026-08-06` — Hoàn tất và rollout UI/UX Giai đoạn 4: hoàn thiện design system semantic, nền
   canvas ấm/surface phân tầng, Be Vietnam Pro 16 px, custom brand SVG và Lucide SVG; chuẩn hóa
   primitive form 48 px và sửa filter mobile không tràn container. Thêm `docs/DESIGN_SYSTEM.md`.
   Responsive QA 375/768/1024/1440 px và mobile landscape đạt, console sạch; gate đạt
   lint/typecheck/30 tests/build, E2E 8/8,
   pgTAP 328/328 và diff-check. Không có migration mới; Supabase Production giữ 15/15 và dữ liệu
   20 khoản/192 giao dịch/201 kỳ. Vercel `dpl_5Hfm1zcftVbjoQBR3r4Y2J3pSxSx` Ready/`sin1`,
   canonical và smoke 200/200/200/401/401 đạt. Bốn giai đoạn UI/UX đã hoàn tất; C16 tiếp tục
   kiểm tra Production và đối chiếu dữ liệu thật.
1. `2026-08-06` — Hoàn tất và rollout UI/UX Giai đoạn 3: Dashboard first fold gồm bốn KPI có so
   sánh kỳ liền trước, xu hướng dòng tiền và danh sách cần xử lý; bộ lọc thời gian compact, khoảng
   tùy chỉnh dạng sheet; phân tích vốn/rủi ro/cơ cấu nằm trong disclosure. Biểu đồ có trục, tooltip
   touch/keyboard, nhãn số và bảng accessible. Migration 15/15; dữ liệu giữ 20 khoản/192 giao
   dịch/201 kỳ. Gate đạt lint/typecheck/30 tests/build, E2E 8/8, pgTAP 328/328 và diff-check.
   Vercel `dpl_HCKarHQbgg3etjkJUgi1z37TQSwA` Ready/`sin1`, canonical và smoke
   200/200/200/401/401 đạt. Tiếp theo là Giai đoạn 4.
1. `2026-08-05` — Rollout vòng tinh chỉnh UI/UX Giai đoạn 2 theo năm phản hồi kiểm tra thật: filter
   mobile dùng hai cột (ô tìm kiếm giữ toàn hàng); bốn tab chi tiết nằm một hàng trượt ngang; modal
   giao dịch có enter/exit motion 260/180 ms và reduced-motion; marker tam giác native được thay bằng
   chevron nét mảnh; nhãn khoản vay tự sinh chỉ hiện tên đối tác và ngày giải ngân, không lặp hướng/
   số tiền/ngày. Gate đạt lint/typecheck/30 tests/build, Auth 6/6, E2E 8/8, pgTAP 326/326 và
   diff-check. Không có migration mới; Supabase Production giữ 14/14. Vercel
   `dpl_bPEGpkxELRmUYGvsXKNiyxnyXCd2` Ready, Functions `sin1`, canonical và smoke
   200/200/200/401/401 đạt. Chưa bắt đầu Giai đoạn 3.
1. `2026-08-05` — Hoàn tất và rollout UI/UX Giai đoạn 2: danh sách Khoản vay giữ tìm kiếm/hướng/
   trạng thái ở lớp chính, đưa ngày và sắp xếp vào bộ lọc nâng cao, dùng list compact trên desktop
   và row card trên mobile; chi tiết giữ `returnTo` khi quay lại và tab mobile không cuộn ngang.
   `Ghi giao dịch` mở modal/bottom sheet; thao tác điều chỉnh và kết thúc khoản được tách nhóm, tất
   toán dùng xác nhận inline. Gate đạt lint/typecheck/30 tests/build, Auth 6/6, E2E 8/8, pgTAP
   326/326 và diff-check. Không có migration mới; Supabase Production giữ 14/14. Vercel
   `dpl_9zveQfoHk4ZCkj9WZVZrNj385xh1` Ready, Functions `sin1`, canonical và smoke
   200/200/200/401/401 đạt. Giai đoạn 3 Dashboard và biểu đồ là bước tiếp theo.
1. `2026-08-05` — Hoàn tất và rollout UI/UX Giai đoạn 1 sau quyền triển khai theo giai đoạn: AppShell
   được giữ ở root layout; loading chỉ thay vùng nội dung; navigation pending áp dụng toàn cục;
   bottom navigation còn 5 mục; chi tiết khoản vay tải dữ liệu theo tab; danh sách và Dashboard lần
   lượt dùng một RPC/response. Gate đạt lint/typecheck/30 tests/build, Auth 6/6, E2E 8/8, pgTAP
   326/326 và diff-check. Supabase Production áp migration 14/14, hai RPC hiện diện, dữ liệu giữ 20
   khoản. Vercel `dpl_EMCjyztNrfm1buWNsZUq4ZNwKcRu` Ready, Functions `sin1`, canonical và smoke
   200/200/200/401/401 đạt. Giai đoạn 2 là bước tiếp theo.
1. `2026-08-05` — Người dùng phê duyệt cải tổ UI/UX bốn giai đoạn trong C16. Thêm
   `docs/C16_UI_UX_PLAN.md`; bắt đầu Giai đoạn 1 local với phản hồi pending cho mọi internal link,
   bottom navigation 5 mục có menu `Thêm`, nhãn `Nhật ký hệ thống` và RPC
   `list_loan_summaries` thay khoảng 2N network calls bằng một response có calculation/schedule/facet.
   Danh sách giữ tìm/lọc/sắp xếp và số đếm, đồng thời phân biệt `Nhắc thu lãi`/`Nhắc trả lãi`.
   Gate đạt lint, typecheck, 30 tests, build, E2E 8/8, pgTAP 325/325 và diff-check. Migration 14 và
   UI mới chỉ ở local; chưa áp Supabase remote hoặc deploy Vercel.
1. `2026-08-05` — Sau xác nhận hai bước, áp migration analytics Production 13/13; hậu kiểm RPC/quyền
   đạt và dữ liệu giữ nguyên 20 khoản/192 giao dịch/201 kỳ. Deploy Vercel Production
   `dpl_6tLW1RRqEhawJoRnnWDGytMPtdsL` Ready, canonical `tindung.vercel.app`, Functions `sin1`; smoke
   login/manifest/dashboard 200 và export/cron thiếu secret 401. C16 tiếp tục đối chiếu dữ liệu thật.
1. `2026-08-05` — Hoàn tất local revision UX quản trị C16: Dashboard phân tầng KPI, giữ nhãn ngắn
   “Lãi ròng phát sinh” kèm công thức, thêm ba biểu đồ; chip danh sách bấm được; chi tiết khoản vay
   chia bốn tab, có tổng lãi đã thu/trả và biểu đồ kỳ. Migration 13 thêm hai RPC authoritative.
   Gate đạt lint/typecheck/30 tests/build, Auth 6/6, E2E 8/8 và pgTAP 318/318; visual QA 375px không
   tràn ngang. Chưa áp migration hoặc deploy Production.
1. `2026-08-05` — Sau xác nhận cả ba cổng, tạo backup AES-256-GCM
   `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260805T104926Z` tại local + DriveFS, GCM/SHA khớp; áp migration
   12/12 và deploy Production `dpl_2ZV4SEs6QHWAwYX1yqpHqwUS95Mu` Ready/`sin1`. RPC và HTTP smoke
   đạt, số dòng Production không đổi; tiếp tục C16 với dữ liệu thật.
1. `2026-08-05` — Đối chiếu Đạt Pha Production đúng 50 triệu gốc + 1,5 triệu lãi kỳ cuối chưa đóng,
   ngừng lãi từ 10/11/2024. Local hoàn tất revision quản trị: Dashboard theo kỳ tách nợ xấu, lọc
   khoản vay qua URL và giải thích ngày cuối tính lãi. DB lint, pgTAP 309/309, Auth 6/6, E2E 8/8;
   chưa migration/deploy remote.
1. `2026-08-04` — Người dùng tự sửa A.Phúc Hà 200 triệu thành `BORROWING`; hậu kiểm đúng tên Đi vay,
   trạng thái `ACTIVE`. Sau xác nhận riêng, deploy định dạng dấu chấm VND và bắt buộc chọn hướng bằng
   `dpl_FyPUjxnZtf1KacCHehESA3NbKCoV`, Ready/`sin1`, alias `tindung.vercel.app`, smoke 200/200/401.
   Production hiện có 148 giao dịch; ledger append-only chưa tạo áp lực lưu trữ đáng kể.
2. `2026-08-04` — Đối chiếu chỉ-đọc xác nhận khoản A.Phúc Hà 200 triệu được nhập `LENDING`, nên
   không thuộc nhóm đi vay; khoản 450 triệu cùng đối tác vẫn đúng `BORROWING`. Local bỏ hướng mặc
   định, bắt buộc chọn rõ Cho vay/Đi vay và thêm input tự chèn dấu chấm hàng nghìn cho mọi trường
   tiền VND. Gate đạt lint/typecheck/30 tests/build và E2E 7/7; chưa sửa/deploy Production.
2. `2026-08-04` — Sau xác nhận riêng, xóa đúng project Vercel tạo nhầm `web`
   (`prj_Wi1AlfHl5N0ajzE1SJX4qxqAZubR`) cùng deployment/alias riêng. Hậu kiểm project không còn tồn
   tại; Production chính `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F` và deployment
   `dpl_3zr2dbAFnNR9txwVzsXAqqfM2fzg` vẫn Ready/`sin1`, URL `tindung.vercel.app` đạt 200/200/401.
2. `2026-08-04` — Sau xác nhận riêng, deploy nút đóng lãi nhanh lên đúng Vercel Production bằng
   `dpl_3zr2dbAFnNR9txwVzsXAqqfM2fzg`, Ready tại `sin1`; alias chính `https://tindung.vercel.app`,
   login/manifest 200 và export thiếu secret 401. Một project `web` không secrets/dữ liệu bị CLI tạo
   nhầm khi chạy từ thư mục con; đã dừng thao tác local và chờ xác nhận riêng để xóa remote project.
3. `2026-08-04` — Bổ sung local nút **Ghi nhận đóng lãi** trên mỗi card kỳ còn dư, tự điền số dư
   authoritative và ngày dự kiến thu, cho sửa ngày/số tiền, cảnh báo ngày ngoài kỳ và hiện **Đã
   đóng đủ** sau khi ghi. Không đổi schema/engine. Gate đạt lint/typecheck/30 tests/build và E2E
   7/7; chờ xác nhận riêng để deploy Vercel Production rồi tiếp tục nhập/đối chiếu C16.
4. `2026-08-04` — Sau xác nhận riêng cho bốn thao tác, tạo backup Production AES-256-GCM
   `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260804T043524Z` tại local ngoài Git và DriveFS, xác minh tag/SHA;
   áp migration 11/11; deploy Vercel `dpl_23BXDqBAyjy8Z7aKTSV5LCUVEY5H` Ready tại `sin1`; push Apps
   Script và full sync schema v3 hoàn tất lúc 11:44. Sheet có tab `Khởi tạo khoản cũ` và giữ đủ bốn
   khoản. C16 tiếp tục `IN_PROGRESS` để thử nghiệm dữ liệu thật; chưa đổi offset của khoản Dũng Hùng.
4. `2026-08-04` — Sau phê duyệt, local bổ sung nhắc thu sớm theo từng khoản mà không đổi kỳ/lãi;
   mô phỏng Dũng Hùng nhắc 17/08, kết thúc kỳ 18/08 và đủ 21 triệu. Thêm onboarding bất biến cho
   khoản cũ/nợ xấu bằng dư gốc, tổng lãi đã thu và ngày ngừng lãi; Google Sync schema v3 có 11 tab.
   Gate đạt lint/typecheck/30 tests/build, Auth 6/6, E2E 7/7, pgTAP 293/293 và DB lint; chưa rollout.
5. `2026-08-04` — Đối chiếu bốn khoản Production: khoản Dũng Hùng 700 triệu có ngày đóng lãi kế tiếp
   theo engine là 18/08/2026; phát hiện nhu cầu anchor lịch sử và onboarding số dư đầu kỳ, chưa đổi
   nghiệp vụ khi chưa đủ ngày sổ tay mẫu. Sửa local danh sách khoản vay theo ngày giải ngân giảm dần,
   tie-break bằng thời điểm tạo; lint/typecheck/30 tests/build và diff-check đạt, chưa deploy.
3. `2026-08-04` — Sau xác nhận riêng, tạo backup Production mã hóa
   `qlv-prod-hmfxnstrqfqpvsgfmjmd-20260803T235806Z` tại local ngoài Git và Drive, restore rehearsal
   đầy đủ đạt; áp migration 10/10, deploy Vercel `dpl_Es54Y4hwzKXXLKbKv1GnD7zqW55A`, push Apps
   Script và full sync workbook. Sửa khoản `Test` bằng correction append-only sang không đáo hạn:
   `ACTIVE`, kỳ lãi kế tiếp 27/08/2026; kỳ cũ 13,5 triệu đã đóng đủ không đổi. Sửa timezone Sheet và
   refresh header/full-sync; sync sau correction hiển thị `ACTIVE`, term/maturity trống.
3. `2026-08-04` — Từ đối chiếu khoản vay thật, người dùng khóa quy tắc mới: khoản vay mặc định không
   đáo hạn, tiếp tục kỳ lãi 15/30 ngày cho đến khi tất toán; đáo hạn chỉ là tùy chọn. Thêm migration
   nullable term/maturity, RPC lịch đóng lãi, form/UI/Google Sync/docs và regression bảo toàn kỳ cũ
   khi đổi lãi từ đầu kỳ mới. Local gate đạt lint/typecheck/28 tests/build, Auth 6/6, E2E 7/7,
   pgTAP 268/268. Chưa thao tác remote hoặc sửa dữ liệu Production.
3. `2026-08-03` — C16 rollout remote hoàn tất sau xác nhận riêng: áp migration Production 9/9 bằng
   transaction và hậu kiểm constraint/RPC/privilege cùng dữ liệu không đổi; deploy Vercel Production
   `dpl_Cfj4JS8nxQUmXNRZCLMy376rzLWe` Ready, Functions `sin1`, canonical/cron/export schema v2 đạt;
   push 4 file Apps Script và manual sync hoàn thành, workbook có đủ 10 tab. C16 giữ `IN_PROGRESS`
   chờ nhập và đối chiếu dữ liệu thực tế.
3. `2026-08-03` — R6 backup pre-C16 Production hoàn tất sau xác nhận riêng: xuất app/auth schema và
   data trực tiếp vào AES-256-GCM, khóa ở macOS Keychain, lưu bản chính ngoài Git tại
   `/Users/ngotuong/Backups/QuanLyVayCaNhan` và đồng bộ 5 ciphertext + manifest vào Drive folder
   `QuanLyVayCaNhan_Backups`. GCM/SHA-256 đối chiếu đạt; restore đầy đủ trên container cô lập đạt với
   1 auth user/1 profile, calculation/RLS smoke và toàn bộ invariant; môi trường tạm đã xóa.
3. `2026-08-03` — C16 remediation local sẵn sàng: khóa direct DML/RPC v1, tuần tự hóa mutation,
   cho phép tất toán gốc 0, thêm hoàn tác settlement append-only và UI, nâng Google Sync schema v2
   lên 10 tab, bổ sung runbook backup/restore. Gate đạt lint/typecheck/28 tests/build, Auth 6/6,
   E2E 7/7, pgTAP 253/253, DB lint, race hai session và restore rehearsal 9 migration/9 bảng. Tại
   thời điểm gate chưa có thao tác remote; backup Production sau đó được ghi riêng ở mục 1.
3. `2026-08-03` — Người dùng phê duyệt C16 và yêu cầu lập kế hoạch sửa các phát hiện audit, ngoại
   trừ chính sách mật khẩu 6 ký tự được giữ nguyên. Thêm `docs/C16_REMEDIATION_PLAN.md`, chuyển C16
   sang `IN_PROGRESS`; chưa triển khai remediation hoặc thao tác Production.
3. `2026-08-03` — Sau xác nhận riêng, áp migration C15 remote và xác minh history 8/8, bốn RPC cùng
   dữ liệu hiện hữu không đổi; deploy Production `dpl_8LugJRs4T3YB3R9u4gUhkfqZnENr` Ready tại
   `sin1`, canonical/browser/smoke/cron đạt. C15 `COMPLETED`, C16 `AWAITING_APPROVAL`.
2. `2026-08-03` — C15 local sẵn sàng: correction nguyên tử có reversal/replacement/audit, input lãi
   theo kỳ, tiền lãi kỳ đầu authoritative, tên tùy chọn/tự sinh và nhãn Dashboard rõ nghĩa. Gate đạt
   lint/typecheck/28 tests/build, Auth 6/6, E2E 6/6, pgTAP 222/222; chờ migration/deploy remote.
3. `2026-08-03` — Người dùng phê duyệt C15; chuyển `IN_PROGRESS`. Khóa phạm vi sửa dữ liệu khởi tạo
   bằng reversal/audit, nhập-hiển thị lãi theo kỳ, tên khoản vay tùy chọn/tự sinh và đổi nhãn lợi
   nhuận; migration remote/deploy Production vẫn cần xác nhận riêng.
4. `2026-08-03` — C14 Production `dpl_Eq1pHfEm95k3shoKEtwy2oP5N1kB` Ready ở `sin1`; median TTFB nóng
   `/login` giảm 424→247 ms (~42%). Workaround profile Supabase local hoạt động; Auth 6/6, E2E 6/6,
   pgTAP 201/201, responsive/browser smoke và diff-check đạt. C14 chuyển `COMPLETED`.
5. `2026-08-03` — C13 hoàn tất. Người dùng xác nhận Web Push delivery; notification/delivery test đã
   xóa đúng phạm vi, subscription giữ nguyên. Gate cuối lint/typecheck/28 tests/build/diff-check và
   Production smoke đạt; roadmap hiện không có checkpoint sau C13.
2. `2026-08-03` — Apps Script owner xác minh đúng (UI hiển thị alias `ngotuong077@gmail.com` của
   `vipmoschino@gmail.com`); Script Properties nhận sync secret mới, bypass Preview cũ đã xóa và
   manual sync retry hoàn tất. Google Sync hourly hoạt động trở lại.
2. `2026-08-03` — Supabase CLI đã đăng nhập đúng `tuongnt2105@gmail.com`, xác minh linked Production
   ref và phục hồi publishable/secret keys vào Keychain. Apps Script UI đang chờ đăng nhập tài khoản
   Google chủ sở hữu để cập nhật Script Properties.
2. `2026-08-03` — Khóa ánh xạ tài khoản Google/Vercel=`vipmoschino@gmail.com`,
   Supabase=`tuongnt2105@gmail.com`; đăng xuất phiên Supabase sai và chờ người dùng đăng nhập đúng.
   Apps Script đã bật API executable MYSELF, push/deploy `@3`; CLI thấy hàm nhưng bị từ chối quyền
   chạy nên Script Properties còn chờ cập nhật qua UI chủ sở hữu.
2. `2026-08-03` — Rotate VAPID/cron/sync, lưu lại Keychain, cập nhật Vercel và deploy Production
   `dpl_FyEms173nyotuyToed6XSZgR1LxJ` Ready; smoke secret đạt. Apps Script source đã push nhưng
   Script Properties chưa cập nhật vì API executable không tìm thấy hàm; Google Sync hourly tạm 401.
   Supabase OAuth hiện chỉ thấy project khác và bị 403 với Production nên chưa phục hồi API keys.
3. `2026-08-03` — Đăng nhập lại OWNER Production đạt; trang notification/service worker tải đúng
   nhưng in-app browser không cấp Notification permission nên không tạo subscription. Cần thiết bị
   Chrome/Safari và xử lý secret Keychain trước khi test delivery thật.
3. `2026-08-03` — Người dùng xác nhận đổi mật khẩu Production thành công. Bàn giao login trong tab
   kiểm thử để tiếp tục Web Push; đồng thời phát hiện các item secret local Keychain đã biến mất,
   remote vẫn hoạt động và chưa rotate secret khi chưa có xác nhận riêng.
4. `2026-08-03` — Sau xác nhận riêng, cập nhật đúng hai trường Auth remote 10→6 và composition→rỗng;
   hậu kiểm toàn bộ config up-to-date. Redeploy Production `dpl_C3LZT8ZipBxVe5JHT1NKWb2cxACs`
   Ready, smoke đạt và bàn giao tab để người dùng thử lại đổi mật khẩu.
5. `2026-08-03` — C13 UAT phát hiện Supabase Auth còn policy 10 ký tự/composition làm đổi mật khẩu
   6 ký tự thất bại; regression tái hiện đúng lỗi. Bản sửa local đã đồng bộ config 6 ký tự, thêm log
   an toàn và E2E chỉ-số/chỉ-chữ; chờ xác nhận PATCH Auth remote và redeploy Production.
6. `2026-08-03` — Sau xác nhận riêng, redeploy chính sách mật khẩu lên Production bằng deployment
   `dpl_5hhHjcJeod8atQYMsLXEsQB1vwdk` Ready, smoke route/secret đạt; bootstrap và xác minh đăng nhập
   OWNER `ngotuong`, credential tạm lưu Keychain và bắt đổi ở lần đăng nhập đầu.
7. `2026-08-03` — Đổi contract mật khẩu local thành tối thiểu 6 ký tự chỉ gồm chữ hoặc số, dùng
   chung cho bootstrap/Server Action/UI và thêm regression test; lint/typecheck/27 tests/build/E2E
   6/6 đạt.
8. `2026-08-03` — Sau xác nhận riêng, cấu hình đủ 8 Production env, deploy
   `dpl_7imjmJCiWXhYsTKAGkF8CGGNgtsC` Ready, cron/smoke/export đạt và chuyển Google Sync sang Production
   canonical. Wrapper tạm đã xóa; C13 còn chờ OWNER thật và Web Push delivery trên thiết bị.
9. `2026-08-03` — C13 restore snapshot toàn trình đạt sau khi sửa cursor; wrapper tạm đã xóa. Xóa
   toàn bộ dữ liệu và hai tài khoản UAT bằng phạm vi ID được assertion, sync workbook về nguồn `empty`;
   full gate đạt.
10. `2026-08-02` — Redeploy Preview C13 có bản cast `text` cho tiền/lãi suất/bigint; deployment
   `dpl_FmoZL1DvYnesrafCNVCSMExTPaPd` đúng target Preview và Ready, stable alias đã cập nhật. Smoke
   route/secret/export exact types đạt trên dữ liệu UAT; không phát sinh Production cron.
11. `2026-08-02` — C13 UAT phát hiện/sửa lỗi login OWNER nhiều profile, route OWNER-only và category
   chi phí one-to-one; thêm Docker fallback cho test harness. Auth 5/5, E2E 6/6 và full local gates đạt;
   dữ liệu mẫu/notification/sync remote đạt.
12. `2026-08-02` — Người dùng phê duyệt C13; chuyển checkpoint sang `IN_PROGRESS`, giữ cổng xác nhận
   riêng cho restore, xóa dữ liệu và Production deploy.
13. `2026-08-02` — Hoàn tất C12: tạo persistent Vercel bypass, push 4 file Apps Script, cấu hình ba
   Script Properties, cài đủ hai trigger, sync workbook thành công; tạo OWNER tạm `preview_owner`
   theo xác nhận để kiểm tra. C13 chuyển `AWAITING_APPROVAL`.
14. `2026-08-02` — C12: bổ sung Google Sync support cho Vercel automation bypass; typecheck, 11 tests
   và build đạt.
15. `2026-08-02` — C12: hoàn tất workflow placeholder; Preview
   `dpl_A7XSVMo1iNayxaMEZN4XbPWc4CfX` Ready, smoke route/secret/Supabase đạt, placeholder và cron
   Production đã xóa, automation bypass đã thu hồi.
