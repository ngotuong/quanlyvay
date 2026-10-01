# C66 — Hậu kiểm UI/UX trên trình duyệt thật và công nghệ hỗ trợ

Ngày audit: 01/10/2026. Phạm vi: hậu kiểm đọc-only sau C62–C65; không sửa code sản phẩm, không
ghi dữ liệu nghiệp vụ, không deploy và không push runtime. Mọi giá trị tài chính, tên đối tác,
định danh khoản vay và thông tin tài khoản quan sát được đều bị loại khỏi tài liệu này.

## Phương pháp và giới hạn

- Safari thật trên macOS: kiểm `/login` ở stable Preview bằng accessibility tree của hệ điều hành,
  thứ tự focus bằng bàn phím và zoom 200%. Đây là kiểm semantic/focus trên Safari, không thay thế
  việc nghe đầu ra VoiceOver.
- Chrome thật trên macOS: kiểm dashboard Production với chế độ riêng tư bật, thứ tự focus, sheet
  **Tiện ích khác** và zoom trình duyệt 200%/400%. Sau kiểm tra đã trả zoom về 100% và giữ chế độ
  riêng tư bật. Không mở hoặc xác nhận form tài chính.
- Playwright Chrome trên Supabase local cô lập: chạy toàn bộ `pnpm test:e2e`; 35 PASS, 1 audit
  fixture SKIP có chủ đích. Suite bao phủ cold auth 2/10 giây, hết phiên/resume, offline/retry,
  pending/navigation, drawer tài chính ở 375/390/1440 px, dirty state, focus và thông báo.
- Máy audit không có iPhone/iOS Simulator, Android SDK hoặc thiết bị Android kết nối. VoiceOver
  không được bật và TalkBack không khả dụng. Vì vậy đầu ra đọc thật, switch control, bàn phím mềm,
  safe-area/cỡ chữ hệ thống/xoay màn hình trên điện thoại thật được ghi `NOT_TESTED`, không suy diễn
  từ viewport giả lập.
- Không lưu screenshot Production vì ảnh có thể chứa dữ liệu riêng tư. Bằng chứng tái hiện trong
  báo cáo chỉ gồm hành vi đã khử dữ liệu, vị trí source và kết quả test cô lập.

Thang mức độ: `HIGH` cản trở bảo mật riêng tư hoặc tác vụ điều hướng chính; `MEDIUM` gây mất focus,
khó hiểu cấu trúc hoặc tăng đáng kể công thao tác; `LOW` thiếu trạng thái semantic nhưng chưa chặn
tác vụ. Không có phát hiện `CRITICAL`.

## Phát hiện

Tổng: 2 `HIGH`, 2 `MEDIUM`, 1 `LOW`.

### C66-01 — HIGH · privacy/accessibility · Chế độ riêng tư vẫn đọc số tiền qua accessible name

**Tái hiện trên Chrome Production.** Bật chế độ ẩn số tiền. UI nhìn thấy hiển thị ký tự che, nhưng
accessibility tree của bốn chỉ số dashboard vẫn chứa chênh lệch tiền thật trong tên của container.
Tooltip `title` cũng giữ cùng giá trị. Người dùng screen reader hoặc người có quyền đọc accessibility
tree vẫn nhận được số tiền mà chế độ riêng tư cam kết che.

Nguyên nhân: `apps/web/src/app/dashboard/page.tsx:104–110` dựng `aria-label` và `title` từ số tiền
thật ở component cha, trong khi `apps/web/src/components/app/privacy-provider.tsx:64–83` chỉ thay
nội dung nhìn thấy của `PrivacyAmount`.

Khắc phục: làm accessible label/title phụ thuộc trực tiếp vào privacy state; khi đang ẩn chỉ công bố
hướng biến động và kỳ so sánh, không chứa giá trị tiền. Audit toàn bộ accessible name/title/canvas
fallback có thể chứa tiền và thêm regression đọc accessibility tree khi bật/tắt privacy.

### C66-02 — HIGH · reflow/navigation · Điều hướng dưới chồng chữ ở zoom 400%

**Tái hiện trên Chrome Production ở zoom browser 400%.** Nội dung chính phóng to và còn cuộn dọc,
nhưng năm nhãn của thanh điều hướng cố định dưới cùng chồng lên nhau. Người thị lực kém không thể đọc
ổn định nhãn điều hướng; bố cục cũng chiếm phần lớn chiều cao khả dụng. 200% chưa tái hiện lỗi này.

Nguyên nhân: `apps/web/src/app/globals.css:514–522` ép năm mục vào một hàng bằng flex chia đều,
giữ `white-space: nowrap` và cố định thanh dưới mà không có biến thể cho viewport CSS hẹp sinh ra
bởi zoom lớn.

Khắc phục: thêm chiến lược reflow ở 400% như nhãn rút gọn có accessible name đầy đủ, điều hướng có
thể cuộn/thu gọn hợp lý hoặc chuyển thành menu; không để chữ chồng, không che nội dung và vẫn giữ
target/focus nhìn thấy. Gate phải dùng zoom trình duyệt thật 200/250/300/400%, không chỉ đổi
`font-size` hay viewport.

### C66-03 — MEDIUM · keyboard/modal · Focus rời sheet Tiện ích khác

**Tái hiện trên Chrome Production bằng bàn phím.** Khi mở **Thêm**, focus ban đầu vào nút đóng và
đi qua ba liên kết trong sheet. Tab tiếp theo rời dialog sang chrome của trình duyệt thay vì quay
vòng trong modal. Khi focus đã rời tài liệu, Escape không còn tác động lên dialog. Nút đóng vẫn đóng
sheet và trả focus về trigger. E2E cô lập xác nhận Escape/backdrop hoạt động khi focus còn trong
trang, nên báo cáo không kết luận handler Escape luôn hỏng.

Nguyên nhân cần sửa ở `apps/web/src/components/app/app-nav.tsx:31–45,74–84` và
`apps/web/src/components/ui/bottom-sheet.tsx:35–44`: native `showModal()` được dùng nhưng không có
focus-loop/fallback rõ ràng khi trình duyệt macOS chuyển focus ra browser chrome.

Khắc phục: đặt initial focus xác định, giữ Tab/Shift+Tab trong tập control của dialog, đóng bằng
Escape khi focus trong modal và khôi phục focus về trigger. Thêm regression trên Chrome/Safari thật;
giữ test native dialog hiện có để kiểm backdrop/Escape.

### C66-04 — MEDIUM · screen-reader navigation · Dashboard nhảy từ heading cấp 1 sang cấp 3

**Tái hiện trong accessibility tree Chrome.** Sau `h1` **Tổng quan**, banner hành động công bố
`h3`, rồi các khu vực sau mới dùng `h2`. Điều hướng theo heading làm mất cấp cấu trúc và khiến banner
quan trọng khó hiểu trong outline.

Nguyên nhân: ba nhánh của `ActionHeroBanner` dùng `h3` tại
`apps/web/src/app/dashboard/page.tsx:65,79,93` dù banner là section trực tiếp dưới heading trang.

Khắc phục: dùng `h2` hoặc cấu trúc section/heading tương đương; kiểm outline cho cả trạng thái sạch,
quá hạn và lịch nhắc, không chọn cấp heading theo kích thước chữ.

### C66-05 — LOW · semantics · Trigger Thêm không công bố trạng thái mở

`apps/web/src/components/app/app-nav.tsx:74–76` có `aria-haspopup="dialog"` nhưng không có
`aria-expanded` và `aria-controls`. Screen reader biết control mở dialog nhưng không nhận trạng thái
đang mở/đóng hoặc quan hệ tới sheet.

Khắc phục: quản lý trạng thái mở bằng React state, cấp `id` ổn định cho dialog, đồng bộ
`aria-expanded`/`aria-controls` và kiểm accessible state trước/sau mở/đóng.

## Ma trận kiểm chứng

| Môi trường / hành trình | Kết quả | Bằng chứng và giới hạn |
|---|---|---|
| Safari macOS · login · semantic và focus | PASS | Skip link, `h1`/`h2`, username/password có label, toggle và CTA có tên; Option+Tab đi qua control theo thứ tự hợp lý. |
| Safari macOS · login · zoom 200% | PASS | Reflow một cột, CTA còn tiếp cận bằng cuộn dọc; không quan sát tràn ngang. |
| Chrome macOS · dashboard · keyboard cơ bản | PASS có lỗi riêng | Focus qua preset, CTA và lịch; privacy leak C66-01 và heading C66-04 vẫn tồn tại. |
| Chrome macOS · sheet Tiện ích khác | FAIL | Focus thoát khỏi modal: C66-03. Nút đóng và focus return đạt. |
| Chrome macOS · zoom 200% | PASS | Dashboard reflow một cột; nav còn đọc và dùng được. |
| Chrome macOS · zoom 400% | FAIL | Nhãn bottom navigation chồng nhau: C66-02. |
| Chrome local · cold auth, resume, hết phiên, query tab | PASS | E2E C63 đạt; fallback riêng tư ở delay 2/10 giây. |
| Chrome local · offline/error/retry | PASS | E2E C20 đạt; trạng thái offline rõ và retry phục hồi. |
| Chrome local · drawer/pending/dirty/focus/toast | PASS | E2E C63 đạt ở 375/390/1440 px; không đại diện screen reader thật. |
| VoiceOver Safari/macOS và iPhone | NOT_TESTED | VoiceOver không được bật; AX tree không được ghi thành screen-reader PASS. Không có iPhone/Simulator. |
| TalkBack Chrome/Android | NOT_TESTED | Không có Android SDK hoặc thiết bị kết nối. |
| Bàn phím mềm, safe-area, xoay và cỡ chữ hệ thống trên điện thoại thật | NOT_TESTED | Chỉ có coverage viewport/landscape/font 200% trong E2E; không thay thế thiết bị thật. |
| Switch Control / bàn phím ngoài trên mobile | NOT_TESTED | Không có thiết bị/công nghệ hỗ trợ tương ứng. |

## Checkpoint remediation đề xuất

`C67 — Sửa privacy accessibility, reflow zoom và modal navigation`.

Phạm vi:

1. Loại mọi số tiền thật khỏi accessible name/title khi privacy mode bật và audit các bề mặt có dữ
   liệu tiền tương tự.
2. Sửa bottom navigation để không chồng/che ở zoom trình duyệt thật đến 400%.
3. Hoàn thiện focus containment, initial/return focus và semantic open state của sheet **Thêm**.
4. Sửa outline heading dashboard; bổ sung regression accessibility cho các trạng thái banner.
5. Không đổi công thức tài chính, schema/RPC, dữ liệu Production hoặc quyền người dùng.

Acceptance criteria:

1. Khi privacy mode bật, snapshot accessibility và tooltip của dashboard/loan/detail/notification
   không chứa bất kỳ giá trị tiền thật nào; khi tắt vẫn đọc đúng số tiền và ngữ cảnh.
2. Chrome và Safari ở zoom 200/250/300/400% không có chữ chồng, tràn ngang hai chiều hoặc CTA/nav
   bị che; focus indicator luôn nhìn thấy và thao tác chính vẫn tới được bằng bàn phím.
3. Sheet **Thêm** giữ Tab/Shift+Tab trong dialog, Escape/backdrop/nút đóng đều hoạt động, focus trả
   về trigger; trigger công bố đúng `aria-expanded` và `aria-controls`.
4. Dashboard có outline heading liên tục cho cả ba trạng thái banner; tên/role/state không phụ thuộc
   icon hoặc CSS.
5. Test mới thất bại trên baseline C66 và đạt sau sửa; `pnpm lint`, `pnpm typecheck`, `pnpm test`,
   `pnpm build`, `pnpm test:e2e` và `git diff --check` đều đạt. Kiểm trên thiết bị thật nào không có
   sẵn phải giữ `NOT_TESTED` và không được quảng bá thành PASS.

C67 chỉ được thực hiện sau khi OWNER phê duyệt checkpoint đó.
