---
project: QuanLyVayCaNhan
roadmap_version: 1.0.48
last_updated: 2026-08-03 21:16:45 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C16
current_status: AWAITING_APPROVAL
---

# Project Context

## 1. Mục tiêu

Xây dựng webapp/PWA Next.js cho tối đa hai người dùng để quản lý cả khoản đi vay và cho vay cá nhân, tính lãi theo ngày, theo dõi giao dịch gốc/lãi, nhắc hạn, dashboard tài chính, audit log và sao lưu định kỳ.

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
- Supabase local đã được khởi tạo với PostgreSQL 17, 8 migration, RLS và 222 pgTAP assertions.
- Bộ máy tài chính authoritative nằm trong PostgreSQL, có RPC tính/rebuild, ghi thanh toán, lifecycle, reversal và tất toán nguyên tử.
- `docs/FINANCIAL_ENGINE.md` mô tả contract C4; engine đã được giữ nguyên qua regression C5.
- Local Auth dùng username/password ánh xạ sang email nội bộ, session SSR, bắt đổi mật khẩu và vai trò `OWNER`/`EDITOR`/`VIEWER`; public signup bị tắt.
- `docs/AUTH.md` mô tả contract Auth/RBAC; bootstrap OWNER thật đã được chuẩn bị nhưng chưa chạy.
- Web đã có CRUD đối tác/khoản vay, ghi giao dịch gốc/lãi/chi phí, lifecycle, tất toán, reversal,
  timeline, audit, trang chi phí chung `/expenses` và quản trị tài khoản OWNER tại `/settings`.
- `docs/WEB_WORKFLOWS.md` mô tả contract web; giao diện responsive dùng sidebar desktop và bottom navigation mobile.
- Dashboard C7 dùng RPC PostgreSQL authoritative cho KPI, lợi nhuận tiền mặt/dồn tích, dòng tiền và lịch đến hạn; `/dashboard` là trang sau đăng nhập.
- `docs/DASHBOARD.md` mô tả định nghĩa chỉ số và quy ước dòng tiền; UI đã kiểm tra responsive 375/768/1440px và light/dark mode.
- PWA có manifest, icon, service worker không cache dữ liệu tài chính, notification center và Web
  Push queue idempotent; trạng thái Push theo đúng thiết bị và subscription mới không nhận lịch sử.
- `docs/PWA_NOTIFICATIONS.md` mô tả quy tắc nhắc hạn, retry, VAPID local và ranh giới cấu hình cron remote.
- Google Sync có endpoint export Next.js bảo vệ bằng secret và phân trang hết dữ liệu, Apps Script
  chống formula injection, tám tab đối chiếu, cursor nguồn, snapshot tuần giữ 12 bản và phục hồi chỉ
  trong workbook.
- `docs/GOOGLE_SYNC.md` mô tả contract Sheet, Script Properties và ranh giới cấu hình remote C11–C12.
- Supabase Production project Singapore `hmfxnstrqfqpvsgfmjmd`, thuộc tài khoản
  `tuongnt2105@gmail.com`, đã áp 7/7 migration, không seed và public signup đã tắt. CLI đã đăng nhập
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
| Checkpoint | C16 — Kiểm thử dữ liệu thực tế đầu tiên |
| Trạng thái | `AWAITING_APPROVAL` |
| Phạm vi đề xuất | Người dùng nhập các khoản vay hiện hữu; đối chiếu hợp đồng, lịch lãi, dòng tiền và Dashboard với ghi chép thủ công; mọi sửa dữ liệu Production xác nhận riêng |
| Kết quả | Chưa bắt đầu |

## 4. Checkpoint hoàn tất gần nhất

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

| Checkpoint | C16 — Kiểm thử dữ liệu thực tế đầu tiên |
|---|---|
| Trạng thái | `AWAITING_APPROVAL` |
| Phạm vi đề xuất | Nhập các khoản vay hiện hữu, đối chiếu từng hợp đồng/lịch lãi/dòng tiền/Dashboard với ghi chép thủ công; mọi sửa dữ liệu Production cần xác nhận riêng |

## 6. Quyết định nghiệp vụ đang có hiệu lực

- Quản lý cả `LENDING` và `BORROWING`, chỉ dùng VND.
- Lãi = dư nợ gốc × lãi suất/ngày × số ngày thực tế; ngày giải ngân được tính.
- Chu kỳ đóng lãi 15 hoặc 30 ngày; kỳ cuối rút ngắn đến ngày đáo hạn.
- Ngày đáo hạn = ngày giải ngân + số ngày vay - 1.
- Trả gốc giữa kỳ có hiệu lực trên dư nợ từ ngày kế tiếp.
- Trả thiếu/thừa lãi được chuyển số dư sang kỳ sau; không tính lãi trên lãi.
- Quá hạn không có lãi phạt.
- Nợ xấu được bật/tắt tính lãi thủ công với ngày hiệu lực và lịch sử đầy đủ.
- Lợi nhuận theo cả tiền mặt và dồn tích; chi phí có thể chung hoặc gắn khoản vay.
- Giao dịch đã ghi nhận chỉ được đảo, không xóa vật lý.
- Lãi giữ decimal đầy đủ và làm tròn `HALF_UP` một lần ở cuối kỳ.
- Đổi lãi suất có hiệu lực đầu ngày; trả gốc có hiệu lực từ ngày kế tiếp; ngày ngừng lãi vẫn được tính.
- Sau đáo hạn, lãi mức cũ tiếp tục trong kỳ `OVERDUE` mở, không có lãi phạt.
- Reversal giữ lịch sử nhưng tính lại kết quả từ ngày hiệu lực của giao dịch gốc.
- Supabase production dùng tài khoản mới và project Singapore đã tạo/link ở C10.
- Vercel dự kiến dùng tài khoản cũ; kiểm tra usage 30 ngày trước khi link ở C12.
- Google Sheets và Apps Script tiếp tục dùng tài khoản Google cũ với named `clasp --user`.

## 7. Tài nguyên remote

| Dịch vụ | Trạng thái |
|---|---|
| Git remote | `https://github.com/ngotuong/quanlyvay.git` — private, `main` theo dõi `origin/main` |
| Supabase | Profile `quanlyvay`; project `hmfxnstrqfqpvsgfmjmd` (`quan-ly-vay-ca-nhan`) tại Singapore; 8/8 migration gồm C15 correction đã áp |
| Vercel | Project `quan-ly-vay-ca-nhan` ID `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F`; C15 Production `dpl_8LugJRs4T3YB3R9u4gUhkfqZnENr` Ready tại `https://quan-ly-vay-ca-nhan.vercel.app`, Functions ở `sin1`, đủ 8 env và cron `/api/notifications/run` lúc `0 0 * * *`; Preview C13 vẫn Ready |
| Google Apps Script / `clasp` | `QuanLyVayCaNhanSync`, script ID `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`; 4 file đã push, `SYNC_API_URL` dùng Production canonical, restore xóa cursor để lần sync kế tiếp tải lại nguồn, hai trigger `runWeeklySnapshot` và `runGoogleSheetSync` cùng hoạt động |
| Google Sheets / Drive | Bound Sheet ID `1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8`; restore snapshot `QLV_Snapshot_2026-08-02` và sync lại đã đạt, workbook hiện phản ánh nguồn `empty`; thư mục `QuanLyVayCaNhan_Backups` cùng hai snapshot giữ nguyên |

Repository chỉ lưu metadata remote cần cho handoff như project ref/URL; không lưu secret.

## 8. Blocker và cổng xác nhận

- C15 không còn blocker. C16 đang chờ người dùng phê duyệt; không tự nhập, sửa hoặc đối chiếu dữ
  liệu Production nếu chưa có phạm vi/xác nhận tương ứng.
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

1. `2026-08-03` — Sau xác nhận riêng, áp migration C15 remote và xác minh history 8/8, bốn RPC cùng
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
