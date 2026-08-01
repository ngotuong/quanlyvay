# Implementation Plan

## 1. Quy tắc roadmap

- Đây là roadmap chuẩn cho dự án `QuanLyVayCaNhan`.
- Chỉ triển khai checkpoint đã được người dùng phê duyệt rõ.
- Khi chuyển trạng thái phải cập nhật đồng thời bảng này và `PROJECT_CONTEXT.md`.
- Không đổi phạm vi checkpoint sau phê duyệt. Việc phát sinh phải được ghi thành revision hoặc checkpoint mới có lý do.
- Trạng thái hợp lệ: `NOT_STARTED`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`, `BLOCKED`, `COMPLETED`.

## 2. Bảng checkpoint

| ID | Checkpoint | Đầu ra và acceptance criteria | Gate xác nhận | Trạng thái |
|---|---|---|---|---|
| C0 | Quản trị dự án | Git local branch `main`; tạo `AGENTS.md`, `PROJECT_CONTEXT.md`, roadmap, README, `.gitignore`; không có remote | Duyệt checkpoint | `COMPLETED` |
| C1 | Monorepo Next.js | pnpm workspace; `apps/web` dùng Next.js App Router, TypeScript, Tailwind, ESLint; lint/typecheck/build đạt | Duyệt checkpoint | `COMPLETED` |
| C2 | Đặc tả nghiệp vụ | Khóa kiểu dữ liệu, quy tắc ngày/lãi, trả thiếu/thừa, trả gốc, tất toán, nợ xấu; bộ test fixture chuẩn được review | Duyệt checkpoint | `COMPLETED` |
| C3 | Supabase local | `supabase init`; migration cho người dùng, đối tác, khoản vay, giao dịch, kỳ lãi, chi phí, thông báo, audit; RLS/database tests đạt | Duyệt checkpoint; chưa đăng nhập | `COMPLETED` |
| C4 | Bộ máy tài chính | Database functions tính kỳ lãi, chia đoạn dư nợ, đổi lãi suất, đảo giao dịch và tính lại lịch sử; test tiền đạt | Duyệt checkpoint | `COMPLETED` |
| C5 | Auth và phân quyền local | Username/password ánh xạ Supabase Auth; owner/editor/viewer; không tự đăng ký; RLS tests đạt | Duyệt checkpoint | `COMPLETED` |
| C6 | Nghiệp vụ web | CRUD đối tác/khoản vay; nhập lãi/gốc/chi phí; tất toán, nợ xấu, timeline, audit; Playwright flow đạt | Duyệt checkpoint | `COMPLETED` |
| C7 | Dashboard và UX | KPI tiền mặt/dồn tích, dư nợ, lãi dự kiến, đến hạn/quá hạn, biểu đồ dòng tiền; responsive 375–1440px, dark mode | Duyệt checkpoint | `COMPLETED` |
| C7G | GitHub remote | Xác nhận tài khoản/tên/visibility; tạo repository, thêm `origin`, push branch `main`; không chứa secret | Xác nhận tài khoản + tạo remote + push | `COMPLETED` |
| C8 | PWA và thông báo local | Manifest, service worker, installable PWA, notification center, Web Push, idempotency và nhắc quá hạn hằng ngày | Duyệt checkpoint | `COMPLETED` |
| C9 | Google Sync local | Apps Script đồng bộ một chiều, cấu trúc Sheet, snapshot tuần, retention 12 tuần; test bằng mock; chưa `clasp login` | Duyệt checkpoint | `COMPLETED` |
| C10 | Supabase remote | Dùng tài khoản Supabase mới để tạo project `quan-ly-vay-ca-nhan` tại Singapore, link CLI, cấu hình secret và áp migration | Xác nhận tài khoản và thao tác remote | `AWAITING_APPROVAL` |
| C11 | Google/Clasp remote | Xác nhận Google account; tạo Apps Script `QuanLyVayCaNhanSync`, Sheet đối chiếu, Drive backup; push/deploy trigger | Xác nhận tài khoản và từng tài nguyên | `NOT_STARTED` |
| C12 | Vercel Preview | Kiểm tra usage tài khoản Vercel cũ, tạo/link project `quan-ly-vay-ca-nhan` với root `apps/web`, cấu hình env và deploy Preview | Xác nhận tài khoản và deploy | `NOT_STARTED` |
| C13 | Production/UAT | Kiểm thử dữ liệu mẫu, quyền, Push, sync, backup/restore; xóa seed; production deploy và checklist vận hành | Xác nhận production riêng | `NOT_STARTED` |

## 3. Contract cốt lõi

```text
LoanDirection: LENDING | BORROWING
LoanStatus: ACTIVE | OVERDUE | BAD_DEBT | SETTLED
UserRole: OWNER | EDITOR | VIEWER
TransactionType: DISBURSEMENT | INTEREST_PAYMENT | PRINCIPAL_PAYMENT | EXPENSE | REVERSAL
```

- Web mutate dữ liệu qua Server Actions/RPC đã validate bằng Zod.
- Bộ máy tính lãi authoritative nằm trong Supabase.
- Tiền VND dùng số nguyên; lãi suất dùng decimal.
- Ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`; audit timestamp dùng UTC.
- Google Sheets không ghi ngược vào Supabase.
- Notification và sync phải idempotent.

## 4. Test gate

Chạy các gate đã tồn tại và áp dụng cho checkpoint:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
supabase test db
```

Các test tài chính bắt buộc bao phủ: kỳ 15/30 ngày, kỳ cuối rút ngắn, ranh giới ngày, trả thiếu/thừa, trả gốc giữa kỳ, đổi lãi suất, tất toán sớm, quá hạn không phạt, dừng/bật lại nợ xấu, đảo giao dịch, RLS viewer, notification idempotency và phục hồi snapshot.

## 5. Revision log

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0.10 | 2026-08-01 | Hoàn tất C9 với export API bảo vệ bằng secret, Apps Script đồng bộ một chiều, 8 tab đối chiếu, snapshot tuần giữ 12 bản và 9 mock tests; C10 chờ xác nhận Supabase remote. |
| 1.0.9 | 2026-08-01 | Hoàn tất C8 với PWA, notification center, Web Push idempotent, 196 pgTAP assertions và 4 Playwright flows; C9 chờ phê duyệt. |
| 1.0.8 | 2026-08-01 | Hoàn tất C7G: GitHub private `ngotuong/quanlyvay`, GitHub CLI 2.97.0 và push `origin/main`; C8 chờ phê duyệt. |
| 1.0.7 | 2026-08-01 | Hoàn tất C7 với dashboard authoritative, 178 pgTAP assertions và 3 Playwright flows; thêm C7G chờ xác nhận GitHub remote. |
| 1.0.6 | 2026-08-01 | Hoàn tất C6 với web workflows, 163 pgTAP assertions và 2 Playwright flows; C7 chờ phê duyệt. |
| 1.0.5 | 2026-08-01 | Hoàn tất C5 với Auth/RBAC local, 146 pgTAP assertions và 5 Auth integration tests; C6 chờ phê duyệt. |
| 1.0.4 | 2026-08-01 | Hoàn tất C4 với financial engine/RPC, 10/10 fixture và 123 pgTAP assertions; C5 chờ phê duyệt. |
| 1.0.3 | 2026-08-01 | Hoàn tất C3 với migration schema/RLS, database lint và 72 pgTAP assertions; C4 chờ phê duyệt. |
| 1.0.2 | 2026-08-01 | Hoàn tất C2 với domain spec, type contract và 10 fixture; C3 chờ phê duyệt. |
| 1.0.1 | 2026-08-01 | Hoàn tất C1; C2 chờ phê duyệt; ghi nhận chiến lược tài khoản remote. |
| 1.0.0 | 2026-08-01 | Khởi tạo roadmap C0–C13; C0 hoàn tất, C1 chờ phê duyệt. |
