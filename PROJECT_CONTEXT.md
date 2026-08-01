---
project: QuanLyVayCaNhan
roadmap_version: 1.0.7
last_updated: 2026-08-01 17:03:00 +07
timezone: Asia/Ho_Chi_Minh
current_checkpoint: C7G
current_status: IN_PROGRESS
---

# Project Context

## 1. Mục tiêu

Xây dựng webapp/PWA Next.js cho tối đa hai người dùng để quản lý cả khoản đi vay và cho vay cá nhân, tính lãi theo ngày, theo dõi giao dịch gốc/lãi, nhắc hạn, dashboard tài chính, audit log và sao lưu định kỳ.

Supabase là nguồn dữ liệu chuẩn. Google Sheets và Google Drive chỉ dùng để đối chiếu và sao lưu một chiều thông qua Apps Script.

## 2. Kiến trúc hiện tại

Repository đã có lớp quản trị dự án và nền tảng web local:

- Git repository local, branch `main`, chưa có remote.
- `AGENTS.md` là quy tắc làm việc ổn định.
- `PROJECT_CONTEXT.md` là handoff trạng thái hiện tại.
- `docs/IMPLEMENTATION_PLAN.md` là roadmap chuẩn.
- pnpm workspace tại root, pin Node.js 24.15.0 và pnpm 11.9.0.
- `apps/web` dùng Next.js 16.2.12, React 19.2.4, TypeScript 5.9.3, Tailwind CSS 4.3.3 và ESLint 9.39.5.
- `packages/domain-contract` chứa type contract và test fixture độc lập với production engine.
- `docs/DOMAIN_SPEC.md` là đặc tả nghiệp vụ v1 đã khóa cho C3–C4.
- Supabase local đã được khởi tạo với PostgreSQL 17, migration schema, RLS và 178 pgTAP assertions.
- Bộ máy tài chính authoritative nằm trong PostgreSQL, có RPC tính/rebuild, ghi thanh toán, lifecycle, reversal và tất toán nguyên tử.
- `docs/FINANCIAL_ENGINE.md` mô tả contract C4; engine đã được giữ nguyên qua regression C5.
- Local Auth dùng username/password ánh xạ sang email nội bộ, session SSR, bắt đổi mật khẩu và vai trò `OWNER`/`EDITOR`/`VIEWER`; public signup bị tắt.
- `docs/AUTH.md` mô tả contract Auth/RBAC; bootstrap OWNER thật đã được chuẩn bị nhưng chưa chạy.
- Web C6 đã có CRUD đối tác/khoản vay, ghi giao dịch gốc/lãi/chi phí, lifecycle, tất toán, reversal, timeline và audit.
- `docs/WEB_WORKFLOWS.md` mô tả contract web; giao diện responsive dùng sidebar desktop và bottom navigation mobile.
- Dashboard C7 dùng RPC PostgreSQL authoritative cho KPI, lợi nhuận tiền mặt/dồn tích, dòng tiền và lịch đến hạn; `/dashboard` là trang sau đăng nhập.
- `docs/DASHBOARD.md` mô tả định nghĩa chỉ số và quy ước dòng tiền; UI đã kiểm tra responsive 375/768/1440px và light/dark mode.
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
| Checkpoint | C7G — GitHub remote |
| Trạng thái | `IN_PROGRESS` |
| Phạm vi được duyệt | Tạo repository `ngotuong/quanlyvay` ở chế độ private, thêm `origin` và push `main` |
| Mục tiêu | Tạo repository đúng tài khoản, thêm `origin` và push `main` sau xác nhận riêng |

## 4. Checkpoint hoàn tất gần nhất

### C7 — Dashboard và UX

- Trạng thái: `COMPLETED`.
- Đầu ra: RPC dashboard authoritative, KPI dư nợ/lãi/lợi nhuận, dòng tiền 6 tháng, danh sách đến hạn/quá hạn, trang mặc định mới và UX responsive/light/dark.
- Commit evidence: C7 tại `f76ada1` (`C7: xây dựng dashboard và hoàn thiện UX`).
- Verification: database lint không lỗi; 178/178 pgTAP assertions, 5/5 Auth integration tests, 11/11 domain tests và 3/3 Playwright flows đạt; lint, typecheck và production build đạt; database đã reset để xóa dữ liệu test; không có Git remote.

## 5. Checkpoint tiếp theo

C7G đã được người dùng phê duyệt và đang thực hiện:

- Tài khoản sở hữu: `ngotuong`.
- Repository: `quanlyvay`, chế độ `private`.
- Dùng phiên trình duyệt để tạo repository vì máy chưa có GitHub CLI.
- Sau khi tạo: thêm `origin`, push nhánh `main` và xác minh remote.

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
| Git remote | Chưa tạo |
| Supabase | Chưa đăng nhập; dự kiến tạo project bằng tài khoản mới ở C10 |
| Vercel | Chưa truy cập; dự kiến kiểm tra và dùng tài khoản cũ ở C12 |
| Google Apps Script / `clasp` | Chưa đăng nhập; dự kiến dùng tài khoản Google cũ với named user |
| Google Sheets / Drive | Chưa tạo tài nguyên |

Không có secret hoặc ID remote nào được lưu trong repository.

## 8. Blocker và cổng xác nhận

- C7 đã hoàn tất ở local; C7G đã được duyệt cho `ngotuong/quanlyvay` private và đang thực hiện.
- Mọi thao tác tài khoản/remote tiếp tục bị khóa theo `AGENTS.md`.
- Git identity local đã cấu hình là `Ngo Tuong <vipmoschino@gmail.com>`; không có Git remote.
- GitHub CLI chưa được cài; chưa đăng nhập hoặc thay đổi tài nguyên GitHub.
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

1. `2026-08-01` — Hoàn tất C7: dashboard authoritative, 178 database assertions và 3 Playwright flows responsive/dark đạt.
2. `2026-08-01` — Hoàn tất C6: nghiệp vụ web, 163 database assertions và 2 Playwright flows đạt.
3. `2026-08-01` — Hoàn tất C5: Auth/RBAC local, 146 database assertions và 5 Auth integration tests đạt.
4. `2026-08-01` — Hoàn tất C4: engine/RPC tài chính và 123/123 database assertions đạt.
5. `2026-08-01` — Hoàn tất C3: migration schema/RLS và 72/72 database assertions đạt.
