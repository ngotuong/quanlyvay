# C72 — Remediation UI/UX local

Ngày: 01/10/2026. OWNER đã phê duyệt C72 trong hội thoại. Trạng thái: COMPLETED local; gate cuối đã đạt. Production chưa nhận thay đổi này.

## Phạm vi và cách sửa

| Phát hiện C71 | Vị trí chính | Thay đổi C72 |
| --- | --- | --- |
| C71-01 HIGH, mất draft khi Back SPA | `src/components/app/dirty-navigation-guard.tsx`, root layout, `business/form-parts.tsx` | Guard được gắn ngoài Suspense xác thực, trong layout effect trước listener của router. Giữ state Next, đánh số history, khôi phục traversal bị từ chối; một registry DOM dùng chung cho form. Link/beforeunload được bảo vệ, không ghi draft vào storage. |
| C71-02 MEDIUM, thiếu pending/error thông báo | `src/app/actions/notifications.ts`, `components/notifications/notification-action.tsx` | Pending tức thời, busy/disabled và khóa submit, error/retry; kiểm tra RPC error trước revalidate/redirect. Giữ unread khi thất bại. |
| C71-03 MEDIUM, vùng bấm nhỏ | `globals.css`, `styles/ui-primitives.css` | Disclosure, filter, quick payment, custom period và tab cao tối thiểu 44 px; badge khoản vay được xuống dòng khi phóng chữ. |
| C71-04 MEDIUM, form chi phí chiếm phần đầu | `src/app/expenses/page.tsx`, `business/expense-create-sheet.tsx`, `general-expense-form.tsx` | Danh sách và tổng hợp xuất hiện trước; CTA mở sheet. Lưu đóng/reset/toast/trả focus, thất bại giữ draft và mã idempotency. |
| C71-05 MEDIUM, filter thông báo không có active | `src/app/notifications/page.tsx` | Một active theo URL và `aria-current="page"`; hỗ trợ Back/Forward/reload. |
| C71-06 LOW, task mobile nằm quá thấp | `src/app/dashboard/page.tsx`, `globals.css` | Task trước KPI trên mobile, giảm khoảng cách và phần chọn kỳ; desktop giữ KPI và chart đối chiếu. |

Đường dẫn `src/…` trong bảng thuộc `apps/web/`. Các bất biến tính lãi/VND, RPC/schema,
ledger, stale preview, quyền và đồng bộ một chiều không đổi. Các thay đổi C70/C71 sẵn có được
bảo toàn; source và bằng chứng C70–C72 vẫn chưa push.

## Bằng chứng và acceptance

Harness mới: `apps/web/test/e2e/c72-remediation.spec.ts`; cập nhật thao tác mở sheet trong
`business-flow.spec.ts`. Dùng Chrome thật, viewport giả lập và Supabase disposable
`QuanLyVayCaNhan-C20-test`, API `127.0.0.1:55321`. Guard project/host/port chạy trước reset.
Khi chạy full suite, C72 reset fixture của bài volume trước đó rồi bootstrap lại trong chính
DB disposable, vì AC yêu cầu hai chi phí và 13 task; không đụng DB dùng chung :54321 hay remote.
Một worker, file C72 chạy cuối; marker fixture ngăn reset lại giữa các test C72.

- Loan-new: Back/Forward chọn ở lại giữ field/URL/focus/scroll, bỏ đi đến route đúng, Forward
  quay lại form sạch; link bị hủy giữ draft và reload có beforeunload. Không history loop/progress treo.
- Editor đối tác: Back giữ draft; đóng bị từ chối giữ form, đồng ý bỏ thì lần mở sau sạch.
  Expense sheet: Back/Escape có xác nhận; retry mạng giữ draft, submit lặp ghi đúng một row,
  lưu hai lần đóng/reset/toast/focus. Mặc định tạo chi phí: mở sheet, nhập tiền, nhập nhóm, lưu
  = bốn primitive actions; ngày mặc định, ghi chú không bắt buộc.
- Thông báo: read-one và mark-all delay POST 1200 ms, pending/disabled trong 200 ms, nhiều
  requestSubmit chỉ một POST; read-one đánh dấu rồi đến đúng loan. Mark-all có lỗi mạng/retry,
  success và active filter qua Back/Forward/reload. Timeout RPC thật bằng SELECT FOR UPDATE
  một notification synthetic, rollback sau 12 giây: timeout authenticated 8 giây được hiện là
  lỗi, read_at vẫn null, retry sau giải phóng khóa thành công. Không đổi function/role/schema.
  Test khóa dòng chỉ chạy local; CI bỏ qua test này và vẫn chạy lỗi transport.
- Ma trận năm route × năm width 375/390/768/1024/1440 × light/dark × text100/200%.
  Đo bounding boxes các control đang visible, bỏ control trong details đóng; không tràn ngang.
  Kiểm focus đại diện từng nhóm ở các viewport/theme bằng Tab/focus và computed outline.
  Ngưỡng task y<650 đo ở chữ100%, không áp dụng nhầm lên layout chữ200%.
- Regression đầy đủ gồm quyền, privacy tiền/free text/reload/pre-hydration, giao dịch đảo,
  pagination/export volume; cold auth2s/10s, route10s, tab1800ms, payment/settlement/restructure,
  idempotency và stale preview. Không coi ảnh là bằng chứng mutation thành công.

Ảnh sau và đo hình học: `docs/remediation-c72/`; ảnh trước giữ nguyên tại `docs/audit-c71/`.
Mở `docs/remediation-c72/review.html` để đối chiếu mobile light/dark và desktop1440.
Snapshot ngày/fixture giữa C71/C72 khác nhau; không đối chiếu số tiền giữa hai lượt như dữ liệu thật.

Checklist hình ảnh: task trước KPI mobile; CTA chi phí ở đầu trang, sheet không che lịch sử khi
đóng; khoảng cách card/heading nhất quán; desktop vẫn đối chiếu KPI và chart; màu semantic và
brand giữ nguyên; nhãn đọc được, target/focus được đo; danh sách cuộn và xem tất cả vẫn truy cập.
Contrast toàn bộ không được chứng nhận lại bằng ảnh; các regression contrast hiện có vẫn chạy.

## Gate cuối và giới hạn

- `git diff --check`, `pnpm lint`, `pnpm typecheck`: PASS phiên bản cuối.
- `pnpm test`: 80/80 PASS (domain11, Google Sync18, web29, script22).
- `pnpm build`: PASS; build độc lập sau E2E, ngoài build trong webServer.
- `C72_EVIDENCE=true pnpm test:e2e`: 45 PASS, 3 SKIP audit opt-in C62/C71, 6 phút.
  Cả sáu test C72 đạt, gồm timeout RPC thật; 16 regression C63/C64/C67 đạt trong full suite.
- Geometry100 samples: overflow0, target dưới44px0; focus đại diện PASS.
  Dashboard390: CTA/task bottom648,03 px cả light/dark; 13 công việc.
  Expense390 với hai fixture: list top436,86 px; duplicate submit1 row; mặc định4 actions.
- Teardown+hậu kiểm read-only đúng test container: profiles/loans/transactions `0|0|0`.
- Secret-pattern scan file thay đổi/untracked PASS; không SQL/dump/env trong file thay đổi.
  `.cache`, `.next`, test-results được ignore. 20 ảnh synthetic, geometry và lifecycle JSON.
  Không đưa raw log/env/token vào artifact Git. Không chạy DB suite vì không đổi contract/schema.
- C72 chỉ hoàn tất local. C73 rollout được đề xuất AWAITING_APPROVAL trong roadmap.

Các lượt đầu giúp phát hiện/sửa thứ tự đăng ký listener history, Forward liên tiếp, badge tràn
ở text200%, và nhiễm fixture volume. Một assertion task sau vòng zoom được chuyển sang đo ở
chữ100% trước zoom đúng AC; không bỏ assertion overflow/target chữ200%. Lỗi có chủ đích
(network abort, RPC timeout/revoke) có thể tạo log stream closed/query failed trong môi trường test.

VoiceOver/TalkBack, Safari/Firefox và mobile vật lý vẫn NOT_TESTED. Không yêu cầu OWNER tự dùng
screen reader. C72 không tuyên bố cross-browser/AT certification, CI mới hoặc rollout thành công.
Không thêm splash delay, không thay schema/remote secret, không sửa dữ liệu tài chính thật,
không commit/push/deploy/alias trong checkpoint này.
