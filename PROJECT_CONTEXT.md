---
project: QuanLyVayCaNhan
roadmap_version: 1.0.14
last_updated: 2026-08-01 23:30:57 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C12
current_status: IN_PROGRESS
---

# Project Context

## 1. Mục tiêu

Xây dựng webapp/PWA Next.js cho tối đa hai người dùng để quản lý cả khoản đi vay và cho vay cá nhân, tính lãi theo ngày, theo dõi giao dịch gốc/lãi, nhắc hạn, dashboard tài chính, audit log và sao lưu định kỳ.

Supabase là nguồn dữ liệu chuẩn. Google Sheets và Google Drive chỉ dùng để đối chiếu và sao lưu một chiều thông qua Apps Script.

## 2. Kiến trúc hiện tại

Repository đã có lớp quản trị dự án và nền tảng web local:

- Git repository branch `main` đã liên kết và theo dõi `origin/main` trên GitHub private.
- `AGENTS.md` là quy tắc làm việc ổn định.
- `PROJECT_CONTEXT.md` là handoff trạng thái hiện tại.
- `docs/IMPLEMENTATION_PLAN.md` là roadmap chuẩn.
- pnpm workspace tại root, pin Node.js 24.15.0 và pnpm 11.9.0.
- `apps/web` dùng Next.js 16.2.12, React 19.2.4, TypeScript 5.9.3, Tailwind CSS 4.3.3 và ESLint 9.39.5.
- `packages/domain-contract` chứa type contract và test fixture độc lập với production engine.
- `docs/DOMAIN_SPEC.md` là đặc tả nghiệp vụ v1 đã khóa cho C3–C4.
- Supabase local đã được khởi tạo với PostgreSQL 17, migration schema, RLS và 196 pgTAP assertions.
- Bộ máy tài chính authoritative nằm trong PostgreSQL, có RPC tính/rebuild, ghi thanh toán, lifecycle, reversal và tất toán nguyên tử.
- `docs/FINANCIAL_ENGINE.md` mô tả contract C4; engine đã được giữ nguyên qua regression C5.
- Local Auth dùng username/password ánh xạ sang email nội bộ, session SSR, bắt đổi mật khẩu và vai trò `OWNER`/`EDITOR`/`VIEWER`; public signup bị tắt.
- `docs/AUTH.md` mô tả contract Auth/RBAC; bootstrap OWNER thật đã được chuẩn bị nhưng chưa chạy.
- Web C6 đã có CRUD đối tác/khoản vay, ghi giao dịch gốc/lãi/chi phí, lifecycle, tất toán, reversal, timeline và audit.
- `docs/WEB_WORKFLOWS.md` mô tả contract web; giao diện responsive dùng sidebar desktop và bottom navigation mobile.
- Dashboard C7 dùng RPC PostgreSQL authoritative cho KPI, lợi nhuận tiền mặt/dồn tích, dòng tiền và lịch đến hạn; `/dashboard` là trang sau đăng nhập.
- `docs/DASHBOARD.md` mô tả định nghĩa chỉ số và quy ước dòng tiền; UI đã kiểm tra responsive 375/768/1440px và light/dark mode.
- PWA C8 có manifest, icon, service worker không cache dữ liệu tài chính, notification center và Web Push queue idempotent.
- `docs/PWA_NOTIFICATIONS.md` mô tả quy tắc nhắc hạn, retry, VAPID local và ranh giới cấu hình cron remote.
- Google Sync C9 có endpoint export Next.js bảo vệ bằng secret, Apps Script đồng bộ một chiều,
  tám tab đối chiếu, cursor nguồn, snapshot tuần giữ 12 bản và phục hồi chỉ trong workbook.
- `docs/GOOGLE_SYNC.md` mô tả contract Sheet, Script Properties và ranh giới cấu hình remote C11–C12.
- Supabase remote C10 đã hoàn tất: profile riêng `quanlyvay`, project Singapore đã link, 6/6 migration
  đã áp không seed, API credentials ở Keychain và public signup đã tắt.
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
| Checkpoint | C12 — Vercel Preview |
| Trạng thái | `IN_PROGRESS` |
| Phạm vi được duyệt | C12 đã được duyệt; truy cập tài khoản, link project, cấu hình secret và deploy vẫn cần xác nhận riêng |
| Mục tiêu | Kiểm tra usage tài khoản Vercel cũ, tạo Preview và kích hoạt Google Sync sau từng xác nhận |

## 4. Checkpoint hoàn tất gần nhất

### C11 — Google/Clasp remote

- Trạng thái: `COMPLETED`.
- Đầu ra: named `clasp` user, bound Sheet/Apps Script, chín tab workbook, thư mục Drive backup,
  mã remote và trigger snapshot tuần; trigger sync theo giờ được hoãn an toàn đến C12.
- Commit evidence: `e10523d` (installer), `e487f12` (trigger có điều kiện), `d7f77f7` (push remote), `819cbc8` (runtime setup).
- Verification: người dùng xác nhận installer và `runWeeklySnapshot` chạy thành công; `clasp push`
  cập nhật 4 file; lint/typecheck/test/build đạt, gồm Google Sync 10/10 và domain contract 11/11.

## 5. Checkpoint tiếp theo

C12 đã được phê duyệt. Từng thao tác remote vẫn cần xác nhận riêng:

- Deploy Preview sau xác nhận riêng và chạy smoke test read-only.
- Cấu hình Google Sync theo URL Preview sau khi deployment đạt.
- Cấu hình Script Properties rồi chạy lại installer để kích hoạt trigger Google Sync theo giờ.

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
| Supabase | Profile `quanlyvay`; project `hmfxnstrqfqpvsgfmjmd` (`quan-ly-vay-ca-nhan`) tại Singapore; CLI đã link |
| Vercel | CLI account `ngotuong`, scope `ngotuong2105`, Hobby active; project `quan-ly-vay-ca-nhan` ID `prj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F` đã link; root `apps/web`, Next.js, Node.js 24.x; 8 biến Preview đã cấu hình, chưa deploy |
| Google Apps Script / `clasp` | `QuanLyVayCaNhanSync`, script ID `1M6AgyI5BMXz4D7xsMCQyF0-FkpA__MWveWKdzrVyityWoxlCVt2EdmJT`; installer có điều kiện đã push và chạy lại thành công; hiện chỉ có trigger snapshot tuần theo cấu hình C11 |
| Google Sheets / Drive | Bound Sheet ID `1Q12dJCgCvDIjEQyRpeFVtbepGzTl6AsJ_KimAnEvjA8`; workbook tabs, thư mục `QuanLyVayCaNhan_Backups` và snapshot tuần đã tạo thành công theo xác nhận runtime |

Repository chỉ lưu metadata remote cần cho handoff như project ref/URL; không lưu secret.

## 8. Blocker và cổng xác nhận

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
  hiển thị hoặc commit giá trị. Preview deploy vẫn chờ xác nhận riêng.
- Endpoint notification hỗ trợ `GET|POST`; `apps/web/vercel.json` đăng ký cron `0 0 * * *`, phù hợp
  giới hạn Hobby một lần/ngày. Lint/typecheck/test/build đều đạt sau thay đổi.
- Mật khẩu database remote nằm trong macOS Keychain service `QuanLyVayCaNhan Supabase Database`, account `postgres`; không lưu trong Git.
- Remote migration history khớp local 6/6. `db lint --linked` của CLI 2.111 bị treo và đã được dừng; local database lint trước đó vẫn đạt, không có schema khác biệt vì remote dùng nguyên migration đã kiểm thử.
- Publishable/secret API keys nằm trong Keychain services `QuanLyVayCaNhan Supabase Publishable Key` và `QuanLyVayCaNhan Supabase Secret Key`, account `hmfxnstrqfqpvsgfmjmd`.
- Remote Auth smoke test đạt với `disable_signup=true`; anonymous đọc `loans` bị RLS từ chối HTTP 401.
- VAPID/cron mới có contract và `.env.example`; chưa tạo hoặc cấu hình secret remote. Việc chạy lịch thật thuộc checkpoint remote sau xác nhận.
- Mọi thao tác tài khoản/remote tiếp tục bị khóa theo `AGENTS.md`.
- Git identity local là `Ngo Tuong <vipmoschino@gmail.com>`; remote `origin` trỏ tới repository private `ngotuong/quanlyvay`.
- GitHub CLI 2.97.0 đã đăng nhập active account `ngotuong`; credential nằm trong macOS keyring, không nằm trong repository.
- Supabase local đang chạy bằng Docker; có thể dừng bằng `supabase stop` khi không sử dụng.
- Chưa tạo tài khoản OWNER thật. Trước khi chạy bootstrap với thông tin đăng nhập thật phải hỏi người dùng xác nhận riêng.
- Tới C11/C12 phải nhắc người dùng xác nhận riêng trước khi truy cập Google/clasp hoặc Vercel.

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

1. `2026-08-01` — C12: cấu hình 8 biến Preview, Keychain secrets và daily notification cron tương thích Hobby.
2. `2026-08-01` — C12: cấu hình Vercel remote root `apps/web`, framework Next.js và Node.js 24.x.
3. `2026-08-01` — C12: link repository local với Vercel project; metadata/secret local đều được Git bỏ qua.
4. `2026-08-01` — C12: tạo Vercel project `quan-ly-vay-ca-nhan` sau khi xác nhận Hobby còn dư địa.
5. `2026-08-01` — C12: xác nhận Vercel Hobby active và usage 30 ngày còn nhiều dư địa.
