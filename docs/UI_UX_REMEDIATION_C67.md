# C67 — Remediation privacy accessibility, zoom và modal navigation

Ngày hoàn tất local: 01/10/2026. Nguồn: năm phát hiện trong `docs/UI_UX_AUDIT_C66.md`.
Checkpoint không thay đổi công thức tài chính, schema/RPC, quyền, dữ liệu Production hoặc remote.

## Thay đổi

- `PrivacyAccessibleValue` chọn toàn bộ accessible name và tooltip theo privacy state. Dashboard
  vẫn đọc hướng biến động và kỳ so sánh khi đang ẩn, nhưng không còn đưa giá trị tiền thật vào
  `aria-label` hoặc `title`; khi hiện tiền, nhãn đầy đủ được khôi phục.
- Action banner dashboard dùng `h2` cho cả trạng thái đúng hạn, quá hạn và lịch nhắc, tạo outline
  liên tục sau `h1` của trang.
- Bottom navigation dùng grid năm cột co giãn; nhãn được phép xuống dòng trong cell và không thể
  tràn sang mục bên cạnh. Desktop sidebar đặt lại grid một cột.
- Sheet **Thêm** công bố `aria-expanded`/`aria-controls`, có initial focus xác định, giữ
  Tab/Shift+Tab trong dialog và trả focus về trigger sau khi đóng.
- Regression C67 kiểm privacy attributes, modal state/focus loop, reflow ở 500/390/320 CSS px và
  heading outline. Regression privacy C20 được mở rộng cho mọi route ưu tiên.

## Bằng chứng

- Chrome thật, bản local: privacy mode chỉ công bố “số tiền đang ẩn”; heading banner là cấp 2;
  zoom 400% không còn nhãn bottom nav chồng nhau. Shift+Tab từ nút đóng tới link cuối và Tab quay
  về nút đóng; đóng bằng nút trả focus về **Thêm**. Chrome được trả về 100% sau kiểm tra.
- Safari thật, bản local: privacy/heading đúng; ở mức zoom lớn nhất Safari cho phép (`Phóng to` bị
  vô hiệu), bottom nav reflow không chồng hoặc tràn ngang. Safari được trả về **Kích cỡ thực**.
  Safari không cung cấp mức 400%, nên không ghi PASS 400% riêng cho Safari.
- Playwright dùng Chrome system: regression C67 4/4 PASS; full suite 39 PASS + 1 audit harness
  skip có chủ đích. E2E kiểm Escape/backdrop/nút đóng và focus return; Computer Use trên macOS
  không phát sự kiện Escape native ổn định nên bằng chứng Escape dựa trên Playwright Chrome.
- Gate: lint PASS, typecheck PASS, 80/80 unit/script PASS, build 19 route PASS, full E2E PASS.
- Hai tài khoản test synthetic và session local đã được xóa bằng reset database test có guard;
  server local đã dừng. Không ghi hoặc đọc sửa dữ liệu Production trong C67.

## Giới hạn còn lại

VoiceOver spoken output, TalkBack, switch control, bàn phím mềm và safe-area trên thiết bị thật vẫn
`NOT_TESTED` vì không có thiết bị/công nghệ hỗ trợ tương ứng. Accessibility tree của Safari/Chrome
và Playwright không được dùng để thay thế các kiểm tra đó.

## Rollout

Source C67 chỉ tồn tại local. GitHub, Vercel Preview và Production chưa nhận thay đổi; việc đồng bộ,
CI, deploy và smoke thuộc checkpoint riêng C68 sau khi OWNER phê duyệt.
