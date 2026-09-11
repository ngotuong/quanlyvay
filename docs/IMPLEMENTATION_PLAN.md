# Implementation Plan

Đây là roadmap trạng thái hiện hành. Chi tiết triển khai của checkpoint đã hoàn tất được lưu trong
Git history, migration, test và các contract/runbook chuyên biệt; không dùng lịch sử đó làm yêu cầu
đang chờ.

## 1. Quy tắc

- Chỉ checkpoint được người dùng phê duyệt rõ mới được chuyển sang `IN_PROGRESS`.
- Trạng thái hợp lệ: `NOT_STARTED`, `AWAITING_APPROVAL`, `APPROVED`, `IN_PROGRESS`, `BLOCKED`,
  `COMPLETED`.
- Cập nhật trạng thái đồng thời tại đây và `PROJECT_CONTEXT.md`.
- Hoàn tất checkpoint thì dừng; không suy ra checkpoint kế tiếp từ kế hoạch hoặc commit cũ.
- Phạm vi remote, dữ liệu và secret tuân theo cổng phê duyệt trong `AGENTS.md`.

## 2. Roadmap

| ID | Kết quả bền vững | Trạng thái |
|---|---|---|
| C0–C2 | Quản trị repository, monorepo Next.js và đặc tả nghiệp vụ | `COMPLETED` |
| C3–C5 | Supabase schema/RLS, engine tài chính authoritative và Auth/RBAC | `COMPLETED` |
| C6–C7 | Workflow nghiệp vụ web, Dashboard và UX responsive | `COMPLETED` |
| C7G | GitHub private remote và branch `main` | `COMPLETED` |
| C8–C9 | PWA/Web Push và Google Sync/snapshot local | `COMPLETED` |
| C10–C12 | Supabase Singapore, Google/Clasp và Vercel Preview | `COMPLETED` |
| C13–C15 | Production/UAT, tối ưu `sin1`, correction và trình bày lãi theo kỳ | `COMPLETED` |
| C16 | Remediation audit, UI/UX, backup/restore và đối chiếu dữ liệu thật | `COMPLETED` |
| C17 | CI fail-closed và kiểm chứng provenance Vercel | `COMPLETED` |
| C18 | Sanitize Push secret trong audit/UI/export và thu hồi raw access | `COMPLETED` |
| C19 | Scrub lịch sử, rotate VAPID, backup/snapshot sạch và đăng ký lại thiết bị | `COMPLETED` |
| C20 | Khắc phục audit, bỏ VietQR/tạo phiếu và nâng cấp UI/UX; nghiệm thu local | `COMPLETED` |
| C21 | Tối ưu hiệu năng danh sách khoản vay và kiểm chứng Preview | `COMPLETED` |
| C22 | Làm sạch ảnh hưởng dữ liệu QA C21 trên Preview bằng nghiệp vụ có audit | `COMPLETED` |
| C23 | Sửa kỳ so sánh dashboard và cách ly dữ liệu QA khỏi số liệu vận hành | `COMPLETED` |
| C24 | Rollout C20–C23 lên Production với candidate, smoke và rollback an toàn | `COMPLETED` |
| C25 | Tinh gọn thẻ khoản vay, bộ lọc mặc định và chỉ báo KPI | `COMPLETED` |
| C26 | Rollout C25 lên Preview và Production với authenticated smoke | `AWAITING_APPROVAL` |

## 3. Trạng thái kế tiếp

- C23 hoàn tất ngày 2026-09-10 theo
  [kế hoạch độ chính xác dữ liệu](C23_DATA_CORRECTNESS_PLAN.md): gate local/DB, migration
  Preview, authenticated smoke trên immutable URL và stable alias, cùng runtime log đều đạt.
- C24 hoàn tất ngày 2026-09-11; Production candidate, authenticated smoke, promote, stable
  smoke và runtime log đều đạt. Bằng chứng tại [kế hoạch rollout Production](C24_PRODUCTION_ROLLOUT.md).
- C25 hoàn tất local ngày 2026-09-11: thẻ đã tất toán hiển thị ngày tất toán,
  danh sách mặc định lọc `ACTIVE`, KPI chỉ còn icon và số chênh lệch; tất cả gate đạt.
- C26 chờ người dùng phê duyệt rollout C25 lên Preview/Production; không có migration hay
  thay đổi dữ liệu, Google resources hoặc Git remote trong phạm vi đề xuất.
- C22 hoàn tất ngày 2026-09-09: 6 khoản `C21 TEST ONLY` được tất toán qua RPC, dư gốc 0; dashboard
  stable đã xác minh và tài khoản kỹ thuật đã vô hiệu hóa. Bằng chứng tại `docs/C22_VALIDATION.md`.
- C21 hoàn tất ngày 2026-09-08; kế hoạch chi tiết tại
  [C21 — Hiệu năng và thiết bị thật](C21_PERFORMANCE_DEVICE_PLAN.md).
- Phạm vi remote chỉ gồm Vercel Preview theo runbook; không gồm Production, Supabase Production,
  Apps Script/Google resources hoặc git push.
- C20 đã được người dùng phê duyệt ngày 2026-09-07 và nghiệm thu local ngày 2026-09-08.
- Kế hoạch chi tiết: [C20 — Remediation và UI/UX](C20_REMEDIATION_PLAN.md).
- Bằng chứng hoàn tất: [C20 — Nghiệm thu local](C20_VALIDATION.md).
- Bao phủ F01–F12 của audit: F01/F03 giải quyết bằng loại bỏ VietQR và phiếu văn bản; các lỗi
  còn lại được sửa và có regression test. Bao gồm nâng cấp luồng mobile/form, đồng bộ thiết kế
  và kiểm chứng các rủi ro bổ sung trong phạm vi nêu ở kế hoạch.
- Nghiệm thu bằng các gate local ở mục 5 cùng ma trận UI/UX và dữ liệu lớn của C20.
- Không deploy, migrate remote, clasp push, đổi secret/trigger hoặc git push trong C20.
  Sau khi C20 đạt nghiệm thu, dừng; chưa có checkpoint tiếp theo được định nghĩa.

## 4. Contract không được phá vỡ

```text
LoanDirection: LENDING | BORROWING
LoanStatus: ACTIVE | OVERDUE | BAD_DEBT | SETTLED
UserRole: OWNER | EDITOR | VIEWER
TransactionType: DISBURSEMENT | INTEREST_PAYMENT | PRINCIPAL_PAYMENT | EXPENSE | REVERSAL
```

- Supabase là nguồn dữ liệu chuẩn; Google Sheets không ghi ngược.
- Giao dịch tài chính chỉ đảo/correction, không xóa vật lý.
- Tiền VND là số nguyên; lãi suất decimal; quyết toán authoritative ở PostgreSQL.
- Ngày nghiệp vụ theo `Asia/Ho_Chi_Minh`; audit timestamp UTC.
- Notification và sync idempotent; secret không vào Git/log.
- Chính sách mật khẩu tối thiểu 6 ký tự ASCII chữ hoặc số giữ nguyên cho đến khi người dùng đổi.

## 5. Gate chuẩn

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:auth
pnpm test:e2e
supabase db lint --level warning
supabase test db
git diff --check
```

## 6. Revision hiện hành

| Phiên bản | Ngày | Thay đổi |
|---|---|---|
| 1.0.147 | 2026-09-11 | Hoàn tất C25 local; mở C26 `AWAITING_APPROVAL` cho rollout Preview/Production. |
| 1.0.146 | 2026-09-11 | Mở C25 `IN_PROGRESS`: tinh gọn thẻ khoản vay, bộ lọc ACTIVE mặc định và chỉ báo KPI. |
| 1.0.145 | 2026-09-11 | Hoàn tất C24: C20–C23 đã lên Production, authenticated/public smoke và runtime log sạch. |
| 1.0.144 | 2026-09-11 | Mở C24 `IN_PROGRESS`: rollout C20–C23 lên Production bằng candidate không gán domain, smoke và promote có rollback. |
| 1.0.143 | 2026-09-10 | Hoàn tất C23: số liệu/kỳ so sánh chính xác, QA được cách ly và stable Preview đạt hậu kiểm. |
| 1.0.142 | 2026-09-10 | Mở C23 `IN_PROGRESS`: sửa kỳ so sánh và cách ly dữ liệu QA khỏi số liệu vận hành/Google Sync. |
| 1.0.141 | 2026-09-09 | Hoàn tất C22: tất toán có audit 6 khoản QA, xác minh dashboard stable và vô hiệu hóa tài khoản cleanup. |
| 1.0.140 | 2026-09-09 | Mở C22: làm sạch ảnh hưởng của dữ liệu QA C21 trên Preview bằng nghiệp vụ có audit. |
| 1.0.139 | 2026-09-08 | Hoàn tất C21: benchmark, QA giao dịch/mobile và stable Preview đều đạt; tài khoản test đã vô hiệu hóa. |
| 1.0.138 | 2026-09-08 | C21 đạt toàn bộ local gate và public Preview smoke; chờ authenticated smoke cùng iPhone/Android thật trước stable alias. |
| 1.0.137 | 2026-09-08 | Mở C21 `IN_PROGRESS`: tối ưu list RPC với ngưỡng đo cố định và kiểm chứng Preview trên thiết bị thật. |
| 1.0.136 | 2026-09-08 | Hoàn tất C20 local: đóng F01–F12 và rủi ro bổ sung; toàn bộ gate đạt, chưa rollout remote. |
| 1.0.135 | 2026-09-07 | Tạo C20 `AWAITING_APPROVAL`: remediation audit, bỏ VietQR/phiếu và nâng cấp UI/UX; phạm vi nghiệm thu local, rollout remote riêng. |
| 1.0.134 | 2026-09-01 | Dọn context/roadmap; bỏ kế hoạch C16–C19 đã hoàn tất khỏi nhánh hiện tại; Git history giữ bằng chứng. C0–C19 hoàn tất, chưa có checkpoint mới. |
| 1.0.133 | 2026-09-01 | Hoàn tất C19 với migration 24, rotate VAPID, backup/restore và rollout Preview/Production sạch. |
