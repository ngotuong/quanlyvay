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
| C26 | Rollout C25 lên Preview và Production với authenticated smoke | `COMPLETED` |
| C27A | Thay bộ nhận diện logo, favicon, Apple Touch Icon và PWA icon | `COMPLETED` |
| C27 | Chuẩn hóa Design System và Tối ưu UI/UX Frontend | `COMPLETED` |
| C28 | Rollout C27 lên Vercel Preview và hậu kiểm | `COMPLETED` |
| C29 | Rollout C27/C27A lên Vercel Production với candidate, smoke và rollback an toàn | `COMPLETED` |
| C30 | Tinh gọn Push/Thông báo và chuẩn hóa bộ lọc, dialog mobile | `COMPLETED` |
| C31 | Rollout C30 lên Vercel Preview và áp migration notification | `COMPLETED` |
| C32 | Rollout C30 lên Vercel Production với authenticated smoke và rollback | `COMPLETED` |
| C33 | Chuẩn hóa bộ lọc ngày và tương tác biểu đồ dòng tiền | `COMPLETED` |
| C34 | Rollout C33 lên Vercel Preview và hậu kiểm | `COMPLETED` |
| C35 | Nhắc lãi lặp lại, tinh gọn thông báo, hợp nhất tài khoản và dọn QA | `COMPLETED` |
| C36 | Rollout C35 lên Preview và áp migration nhắc lãi trên Supabase dùng chung | `COMPLETED` |
| C37 | Rollout C33/C35 từ stable Preview lên Vercel Production | `COMPLETED` |
| C38 | Hậu kiểm chu kỳ nhắc lãi Production theo lịch thực tế | `IN_PROGRESS` |
| C39 | Tái cấu trúc thao tác khoản vay, Thiết lập và quản trị tài khoản | `APPROVED` |

## 3. Trạng thái kế tiếp

- C33 được người dùng phê duyệt trực tiếp và hoàn tất local ngày 2026-09-14: hai trường ngày
  `Từ`/`Đến` cùng hàng, đồng đều trên mobile; cột dòng tiền xem được bằng tap/click/keyboard và
  tooltip không bị cắt. Toàn bộ gate local đạt; bằng chứng tại
  [C33_FILTER_CHART_INTERACTION_PLAN.md](C33_FILTER_CHART_INTERACTION_PLAN.md).
- C34 hoàn tất ngày 2026-09-14: đúng commit C33 `697bd25` đã lên stable Preview; candidate,
  immutable/stable smoke, mobile/desktop interaction và runtime log đều đạt; C35 không đi kèm.
  Bằng chứng tại
  [C34_C33_PREVIEW_ROLLOUT.md](C34_C33_PREVIEW_ROLLOUT.md).
- C35 hoàn tất local ngày 2026-09-14: nhắc lãi lặp hằng ngày, Push gọn, Tài khoản gộp vào Cài đặt
  và toàn bộ gate đạt. Supabase giữ 29 tài khoản kỹ thuật ở trạng thái vô hiệu hóa/ban theo ngoại
  lệ audit: 3 tài khoản có tham chiếu tài chính; 26 tài khoản không có tham chiếu vẫn bị trigger
  quản trị cấm xóa và transaction đã rollback an toàn. Bằng chứng tại
  [C35_NOTIFICATION_ACCOUNT_SETTINGS_PLAN.md](C35_NOTIFICATION_ACCOUNT_SETTINGS_PLAN.md).
- C36 hoàn tất ngày 2026-09-14: migration nhắc lãi thứ 31 đã active trên Supabase dùng chung;
  candidate/stable Preview đạt public/authenticated smoke, console và runtime log sạch. Tài khoản
  EDITOR tạm đã inactive/banned, không tạo dữ liệu tài chính. Bằng chứng tại
  [C36_C35_PREVIEW_ROLLOUT.md](C36_C35_PREVIEW_ROLLOUT.md).
- C37 hoàn tất ngày 2026-09-14: source C33/C35 đã lên Production; immutable/stable public và
  authenticated smoke, console, runtime log đều đạt. Migration C35 không chạy lại; tài khoản test
  đã inactive/banned và không tạo dữ liệu tài chính. Bằng chứng tại
  [C37_C35_PRODUCTION_ROLLOUT.md](C37_C35_PRODUCTION_ROLLOUT.md).
- C38 được người dùng phê duyệt trực tiếp và đang `IN_PROGRESS`: hậu kiểm read-only chu kỳ nhắc lãi
  Production sau giờ gửi 07:00 ngày 2026-09-15, không chạy worker thủ công hoặc thay dữ liệu. Phạm vi tại
  [C38_PRODUCTION_NOTIFICATION_OBSERVATION.md](C38_PRODUCTION_NOTIFICATION_OBSERVATION.md).
- C39 đã được người dùng phê duyệt trực tiếp và đang `APPROVED`; chỉ bắt đầu sau khi C38 hoàn tất:
  đưa **Tất toán** ra Tổng quan,
  tái cấu trúc tab Thiết lập theo mức độ sử dụng/rủi ro và gom tài khoản vô hiệu hóa khỏi danh sách
  quản trị chính. Phạm vi tại
  [C39_LOAN_ACTION_SETTINGS_ACCOUNT_UX_PLAN.md](C39_LOAN_ACTION_SETTINGS_ACCOUNT_UX_PLAN.md).
- C32 được người dùng phê duyệt trực tiếp và hoàn tất ngày 2026-09-14: C30 đã lên Production qua
  candidate không gán domain; public/authenticated smoke và runtime hậu kiểm stable đều đạt.
  Bằng chứng tại [C32_C30_PRODUCTION_ROLLOUT.md](C32_C30_PRODUCTION_ROLLOUT.md).
- C31 được người dùng phê duyệt trực tiếp và hoàn tất ngày 2026-09-13: migration C30 đã active trên
  Supabase dùng chung; candidate và stable Preview đạt public/authenticated smoke, console cùng
  runtime log sạch. Bằng chứng tại [C31_C30_PREVIEW_ROLLOUT.md](C31_C30_PREVIEW_ROLLOUT.md).
- C30 được người dùng phê duyệt trực tiếp và hoàn tất local ngày 2026-09-13: Push/Notification Center
  dùng nội dung nhiều dòng, notification quá hạn có số ngày; card chưa đọc rõ hơn; control lọc/tìm
  kiếm đồng bộ 44px và dialog form căn giữa, không chồng date input trên mobile. Phạm vi và bằng chứng tại
  [C30_NOTIFICATION_FILTER_UX_PLAN.md](C30_NOTIFICATION_FILTER_UX_PLAN.md).
- C29 được người dùng phê duyệt trực tiếp và hoàn tất ngày 2026-09-13: source C27/C27A đã đạt stable
  Preview được rollout lên Vercel Production theo quy trình candidate không gán domain,
  authenticated/public smoke, promote có rollback và hậu kiểm runtime. Bằng chứng tại
  [C29_C27_PRODUCTION_ROLLOUT.md](C29_C27_PRODUCTION_ROLLOUT.md).
- C28 được người dùng phê duyệt trực tiếp ngày 2026-09-12 và hoàn tất ngày 2026-09-13: C27 đã lên
  stable Preview bằng candidate đúng project/target/region; public/authenticated smoke, alias và
  runtime-log hậu kiểm đều đạt. Bằng chứng tại [C28_C27_PREVIEW_ROLLOUT.md](C28_C27_PREVIEW_ROLLOUT.md).
- C27A được người dùng phê duyệt trực tiếp và hoàn tất local ngày 2026-09-12 theo
  [kế hoạch brand icon](C27A_BRAND_ICON_PLAN.md).
- C27 được người dùng phê duyệt trực tiếp và hoàn tất local ngày 2026-09-12: chuẩn hóa Design
  System, xây dựng UI Primitives (`apps/web/src/components/ui/`), tinh gọn `globals.css`, tối ưu
  Dashboard, danh sách khoản vay và tương tác mobile. Toàn bộ gate local đạt; C28/C29 đã rollout
  Preview và Production.
  Kế hoạch và bằng chứng tại [C27_DESIGN_SYSTEM_UIUX_PLAN.md](C27_DESIGN_SYSTEM_UIUX_PLAN.md).
- Checkpoint hiện tại là C38 và đã được phê duyệt.
- C26 hoàn tất ngày 2026-09-12 theo [kế hoạch C26](C26_C25_ROLLOUT.md): Preview và Production
  đã đạt public/authenticated smoke, stable alias hậu kiểm sạch, token tạm đã thu hồi. Không có
  migration hay thay đổi dữ liệu, Google resources hoặc Git remote.
  [kế hoạch độ chính xác dữ liệu](C23_DATA_CORRECTNESS_PLAN.md): gate local/DB, migration
  Preview, authenticated smoke trên immutable URL và stable alias, cùng runtime log đều đạt.
- C24 hoàn tất ngày 2026-09-11; Production candidate, authenticated smoke, promote, stable
  smoke và runtime log đều đạt. Bằng chứng tại [kế hoạch rollout Production](C24_PRODUCTION_ROLLOUT.md).
- C25 hoàn tất local ngày 2026-09-11: thẻ đã tất toán hiển thị ngày tất toán,
  danh sách mặc định lọc `ACTIVE`, KPI chỉ còn icon và số chênh lệch; tất cả gate đạt.
- C26 hoàn tất ngày 2026-09-12 theo [kế hoạch C26](C26_C25_ROLLOUT.md): Preview và Production
  đã đạt public/authenticated smoke, stable alias hậu kiểm sạch, token tạm đã thu hồi. Không có
  migration hay thay đổi dữ liệu, Google resources hoặc Git remote. Chưa có checkpoint tiếp theo.
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
| 1.0.178 | 2026-09-15 | C39 được phê duyệt và chuyển `APPROVED`; chờ C38 hoàn tất trước khi bắt đầu triển khai. |
| 1.0.177 | 2026-09-15 | Ghi nhận C39 `AWAITING_APPROVAL`: hành động tất toán ở Tổng quan, Thiết lập có thứ bậc và quản trị tài khoản cô đọng; C38 vẫn `IN_PROGRESS`. |
| 1.0.176 | 2026-09-14 | Mở C38 `IN_PROGRESS` sau phê duyệt: chờ chu kỳ 07:00 ngày 2026-09-15 để hậu kiểm read-only nhắc lãi Production. |
| 1.0.175 | 2026-09-14 | Hoàn tất C37: C33/C35 lên Production, authenticated/public smoke và runtime hậu kiểm đạt; mở C38 chờ duyệt. |
| 1.0.174 | 2026-09-14 | Mở C37 `IN_PROGRESS` sau phê duyệt: rollout source C33/C35 từ stable Preview lên Production. |
| 1.0.173 | 2026-09-14 | Hoàn tất C36: migration C35 active, stable Preview đạt toàn bộ gate/smoke; mở C37 chờ duyệt Production rollout. |
| 1.0.172 | 2026-09-14 | Mở C36 `IN_PROGRESS` sau phê duyệt: áp migration nhắc lãi dùng chung và rollout C35 lên Preview. |
| 1.0.171 | 2026-09-14 | Hoàn tất C34: C33 lên stable Preview, authenticated/public smoke và runtime log đạt; mở C36 chờ duyệt. |
| 1.0.170 | 2026-09-14 | Mở C34 `IN_PROGRESS` sau phê duyệt; rollout đúng commit C33, không kèm C35. |
| 1.0.169 | 2026-09-14 | Hoàn tất C35 local; ghi ngoại lệ audit/profile governance sau khi lệnh dọn 26 tài khoản rollback an toàn. |
| 1.0.168 | 2026-09-14 | Mở C35 `IN_PROGRESS`: nhắc lãi lặp lại, tinh gọn Push, hợp nhất Tài khoản/Cài đặt và dọn tài khoản QA. |
| 1.0.167 | 2026-09-14 | Hoàn tất C33 local với toàn bộ gate đạt; mở C34 `AWAITING_APPROVAL` cho Preview rollout. |
| 1.0.166 | 2026-09-14 | Mở C33 `IN_PROGRESS`: cân bằng bộ lọc ngày cùng hàng và sửa tương tác/tooltip biểu đồ dòng tiền. |
| 1.0.165 | 2026-09-14 | Hoàn tất C32: C30 đã lên Production; immutable/stable authenticated smoke và runtime hậu kiểm đạt. |
| 1.0.164 | 2026-09-14 | Mở C32 `IN_PROGRESS` sau phê duyệt: rollout C30 từ stable Preview lên Vercel Production có smoke và rollback. |
| 1.0.163 | 2026-09-13 | Hoàn tất C31: migration C30 active; stable Preview đạt authenticated smoke và runtime hậu kiểm sạch. |
| 1.0.162 | 2026-09-13 | Mở C31 `IN_PROGRESS` sau phê duyệt: rollout C30 lên Preview, gồm migration notification dùng chung và smoke fail-closed. |
| 1.0.161 | 2026-09-13 | Hoàn tất C30 local: copy notification nhiều dòng, trạng thái chưa đọc, control 44px và dialog mobile; toàn bộ gate đạt. |
| 1.0.160 | 2026-09-13 | Mở C30 `IN_PROGRESS` sau phê duyệt: triển khai copy Push/Notification Center và sửa bộ lọc, dialog mobile. |
| 1.0.159 | 2026-09-13 | Tạo C30 `AWAITING_APPROVAL`: tinh gọn Push/Notification Center và chuẩn hóa bộ lọc, dialog mobile. |
| 1.0.158 | 2026-09-13 | Hoàn tất C29: C27/C27A đã lên Production; authenticated/public smoke, alias, region và runtime log đều đạt. |
| 1.0.157 | 2026-09-13 | Mở C29 `IN_PROGRESS` sau phê duyệt: rollout C27/C27A lên Vercel Production bằng candidate, smoke và rollback fail-closed. |
| 1.0.156 | 2026-09-13 | Hoàn tất C28: C27 đã lên stable Preview; authenticated/public smoke, alias, region và runtime log đều đạt. |
| 1.0.155 | 2026-09-12 | Mở C28 `IN_PROGRESS` sau phê duyệt: rollout C27 lên Vercel Preview theo runbook fail-closed. |
| 1.0.154 | 2026-09-12 | Hoàn tất C27 local: UI primitives, trust-blue tokens, Quick Action/BottomSheet/Toast và toàn bộ gate đạt. |
| 1.0.153 | 2026-09-12 | Mở C27 `IN_PROGRESS` sau phê duyệt: Design System, UI Primitives và tối ưu Dashboard/Mobile. |
| 1.0.152 | 2026-09-12 | Hoàn tất C27A local: thay logo/favicon/Apple/PWA icon, quét reference và đạt toàn bộ gate. |
| 1.0.151 | 2026-09-12 | Mở C27A `IN_PROGRESS`: thay logo/icon cục bộ theo mẫu người dùng; giữ C27 chờ duyệt. |
| 1.0.149 | 2026-09-12 | Hoàn tất C26: C25 đã lên stable Preview/Production, smoke và log sạch, credential tạm đã thu hồi. |
| 1.0.148 | 2026-09-11 | Mở C26 `IN_PROGRESS`: rollout C25 lên Preview/Production sau phê duyệt. |
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
