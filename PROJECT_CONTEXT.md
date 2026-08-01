---
project: QuanLyVayCaNhan
roadmap_version: 1.0.9
last_updated: 2026-08-01 17:45:43 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C9
current_status: AWAITING_APPROVAL
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
- Chưa có mã nguồn Apps Script.
- Chưa đăng nhập hay liên kết Google, Supabase, Vercel hoặc `clasp`.

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
| Checkpoint | C9 — Google Sync local |
| Trạng thái | `AWAITING_APPROVAL` |
| Phạm vi được duyệt | Chưa có; C9 chưa được phép triển khai |
| Mục tiêu dự kiến | Apps Script đồng bộ một chiều, cấu trúc Sheet, snapshot tuần và retention 12 tuần bằng mock local |

## 4. Checkpoint hoàn tất gần nhất

### C8 — PWA và thông báo local

- Trạng thái: `COMPLETED`.
- Đầu ra: PWA installable, service worker Push, notification center theo user, lịch đúng hạn/quá hạn, đăng ký subscription, delivery lease/retry và API worker được bảo vệ bằng secret.
- Commit evidence: `79ca6e5` (`C8: xây dựng PWA và thông báo local`).
- Verification: database lint không lỗi; 196/196 pgTAP assertions, 5/5 Auth tests, 11/11 domain tests và 4/4 Playwright flows đạt; lint, typecheck và production build đạt; database đã reset sau E2E.

## 5. Checkpoint tiếp theo

C9 chỉ được bắt đầu sau phê duyệt rõ của người dùng. Phạm vi dự kiến:

- Apps Script đồng bộ Supabase → Google Sheets một chiều bằng mock local.
- Khóa cấu trúc Sheet đối chiếu và checkpoint incremental.
- Snapshot tuần, giữ 12 tuần và kiểm thử phục hồi; chưa đăng nhập hoặc `clasp push`.

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
- Supabase production dự kiến dùng tài khoản mới; chỉ tạo ở C10 sau xác nhận.
- Vercel dự kiến dùng tài khoản cũ; kiểm tra usage 30 ngày trước khi link ở C12.
- Google Sheets và Apps Script tiếp tục dùng tài khoản Google cũ với named `clasp --user`.

## 7. Tài nguyên remote

| Dịch vụ | Trạng thái |
|---|---|
| Git remote | `https://github.com/ngotuong/quanlyvay.git` — private, `main` theo dõi `origin/main` |
| Supabase | Chưa đăng nhập; dự kiến tạo project bằng tài khoản mới ở C10 |
| Vercel | Chưa truy cập; dự kiến kiểm tra và dùng tài khoản cũ ở C12 |
| Google Apps Script / `clasp` | Chưa đăng nhập; dự kiến dùng tài khoản Google cũ với named user |
| Google Sheets / Drive | Chưa tạo tài nguyên |

Không có secret hoặc ID remote nào được lưu trong repository.

## 8. Blocker và cổng xác nhận

- C8 đã hoàn tất local; C9 đang chờ người dùng phê duyệt.
- VAPID/cron mới có contract và `.env.example`; chưa tạo hoặc cấu hình secret remote. Việc chạy lịch thật thuộc checkpoint remote sau xác nhận.
- Mọi thao tác tài khoản/remote tiếp tục bị khóa theo `AGENTS.md`.
- Git identity local là `Ngo Tuong <vipmoschino@gmail.com>`; remote `origin` trỏ tới repository private `ngotuong/quanlyvay`.
- GitHub CLI 2.97.0 đã đăng nhập active account `ngotuong`; credential nằm trong macOS keyring, không nằm trong repository.
- Supabase local đang chạy bằng Docker; có thể dừng bằng `supabase stop` khi không sử dụng.
- Chưa tạo tài khoản OWNER thật. Trước khi chạy bootstrap với thông tin đăng nhập thật phải hỏi người dùng xác nhận riêng.
- Tới C10/C11/C12 phải nhắc người dùng xác nhận riêng trước khi truy cập Supabase, Google/clasp hoặc Vercel.

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

1. `2026-08-01` — Hoàn tất C8: PWA, notification center, Web Push queue, 196 database assertions và 4 Playwright flows đạt.
2. `2026-08-01` — Hoàn tất C7G: tạo GitHub private, cài/xác thực GitHub CLI, thêm `origin` và push `main`.
3. `2026-08-01` — Hoàn tất C7: dashboard authoritative, 178 database assertions và 3 Playwright flows responsive/dark đạt.
4. `2026-08-01` — Hoàn tất C6: nghiệp vụ web, 163 database assertions và 2 Playwright flows đạt.
5. `2026-08-01` — Hoàn tất C5: Auth/RBAC local, 146 database assertions và 5 Auth integration tests đạt.
