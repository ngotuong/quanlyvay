# C63 — Vòng đời thao tác và trạng thái tải

Ngày kiểm tra: 2026-09-30. Phạm vi local đã được OWNER phê duyệt; không deploy hoặc push.
Nguồn yêu cầu: C62 UX01–05/UX09 và mục 21 của `IMPLEMENTATION_PLAN.md`.

## Thay đổi

- `use-business-action.ts`, `form-parts.tsx`: phân biệt từng kết quả bằng sequence local;
  giữ input khi lỗi, focus lỗi và reset sau thành công. Busy guard vẫn chặn submit trùng;
  idempotency/RPC và cách quyết toán không đổi.
- `loan-actions.tsx`, `bottom-sheet.tsx`: kết quả server điều khiển đóng/reset payment, giảm
  gốc, tất toán. Dirty guard chung cho Escape, nút đóng, backdrop và drag; pending giữ drawer
  mở, nút lưu báo đang xử lý. Toast thành công phát sau khi đóng và trả focus; reduced-motion
  bỏ thời gian chờ animation. Tất toán trả focus về nội dung khi trigger không còn.
  Form preview chỉ mount khi mở drawer và unmount khi đóng, nên lần mở tiếp lấy số mới.
- `principal-restructure-form.tsx`, `vnd-input.tsx`: rỗng/0/invalid không giữ preview cũ;
  đổi số tiền/ngày hủy request trước; lỗi cho phép tải lại phương án và xác nhận lại.
- `navigation-feedback.tsx`: thao tác bị dirty guard hủy không bật progress; route commit
  kết thúc progress kể cả redirect. Chờ lâu vẫn có thông báo sau 8 giây.
- `layout.tsx`: fallback gốc không chứa thông tin tài khoản/tài chính trong lúc xác minh Auth;
  shell đã mở vẫn được giữ qua điều hướng. Trước sửa, source chờ Auth trước khi trả body;
  không coi đó là số đo thời gian trắng trang trên Production.

### Lỗi bổ sung được regression phát hiện

Ở cả ba viewport, sau trả gốc 1.000 và giảm gốc 20.000 trên fixture 1.000.000, detail đã hiện
979.000 nhưng drawer tất toán lần đầu vẫn hiện preview 1.000.000 được tải lúc component còn ẩn.
Nguyên nhân: `SettlementForm` mount cùng trang và effect chỉ phụ thuộc loan/date/reload, không
phụ thuộc lần mở drawer hoặc mutation của drawer khác. Server có stale guard nên không kết luận
đã ghi sai tiền. C63 sửa lifecycle mount theo trạng thái mở; test giữ kỳ vọng 979.000 và tiếp tục
xác nhận tất toán để kiểm cả read-after-write. Không thay công thức để làm test qua.

## Bằng chứng và giới hạn

Regression nằm trong `apps/web/test/e2e/c63-remediation.spec.ts`, kết hợp bộ business-flow/C20
hiện hữu. Test chỉ dùng `QuanLyVayCaNhan-C20-test`, API loopback 55321/database 55322 qua
guard của `scripts/test-environment.cjs`; reset/setup/teardown không trỏ Production.

| Tiêu chí | Regression |
|---|---|
| Đóng/reset/focus/data mới ở 375/390/1440 | Ba case `all financial drawers commit once and reset`, mỗi case thanh toán → giảm gốc → tất toán |
| Chống submit trùng | Hai `requestSubmit()` liên tiếp, đối chiếu đúng một dòng `PRINCIPAL_PAYMENT` trong DB test |
| Lỗi mạng/validation/stale giữ form | Case payment abort POST; C20 validation, settlement stale confirmation và tải lại |
| Hai lần success cùng message | Case payment lưu liên tiếp; đếm đúng hai event toast, hai lần đóng và focus |
| Toast sau dialog | Matrix đếm ba event/ba tác vụ; tại mỗi event không còn native dialog mở |
| Draft và cách đóng | Cả ba drawer: hủy nút đóng/backdrop/Escape giữ input; kéo bỏ draft hỏi một lần, mở lại rỗng |
| Preview | 0, vượt gốc, input invalid, nhập nhanh, đổi ngày, xác nhận lại và read-after-write |
| Điều hướng | Dirty cancel, delay RSC 10s, feedback sau 8s, back/forward/query-only/same-route |
| Auth | Login cold 2s, deep-link cold 10s, cookie fixture hết hạn, chuyển tab rồi quay lại |
| Accessibility/visual | Tab/Shift+Tab trong dialog, Escape, focus restore, reduced-motion; 390×480 dark và mobile/desktop light |

- Cold auth dùng delay có giới hạn 2/10 giây, chỉ bật qua env E2E và Supabase loopback.
  Đây là mô phỏng server Auth chậm, không phải đo latency Production.
- Hết phiên được mô phỏng bằng cookie fixture hết hạn; resume bằng đổi tab trình duyệt.
  Chưa kiểm OS suspend/PWA resume thực hoặc vòng đời refresh token trên thiết bị thật.
- Viewport thấp mô phỏng vùng nhìn khi bàn phím mở; chưa thay thế kiểm bàn phím iOS/Android.
- Kiểm event toast, focus và live-region DOM không thay thế nghe VoiceOver/TalkBack thật.
  Không tuyên bố toàn ứng dụng đạt WCAG.
- Bố cục/thẩm mỹ rộng UX06–08/10–11 chưa thuộc C63; vẫn dùng mockup C62 làm đầu vào bước sau.

## Gate

Hoàn tất ngày 2026-09-30: `git diff --check`, lint, typecheck, 80 unit/script test và production
build đạt; Playwright đạt 32/32 bài chạy trong 4,0 phút, 1 skip đúng chủ đích là harness audit C62.
