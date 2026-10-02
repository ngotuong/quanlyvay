# C70 — Hậu kiểm accessibility Production

Trạng thái: `COMPLETED` theo phạm vi điều chỉnh. OWNER đã phê duyệt C70 trong phiên ngày 01/10/2026.
Ngày 01/10/2026, OWNER đồng ý chốt C70 với phạm vi điều chỉnh: tổng hợp các phép kiểm đã thực
hiện, giữ VoiceOver/TalkBack và mobile thật chưa kiểm là `NOT_TESTED`, không yêu cầu OWNER vận
hành screen reader. Không dùng việc đóng checkpoint để công bố accessibility toàn diện đạt.

## Môi trường và phương pháp

- Đích: `https://tindung.vercel.app`, Production sau C69. Source local bắt đầu ở
  `aeff2ee265edbefe62f7c3af6a724ef9cc87a53a`, `main...origin/main`, working tree sạch.
- macOS 26.6.2, build 25G83. Safari thật được thao tác qua native accessibility API và bàn phím.
  Chrome headless dùng channel Chrome qua Playwright trên Production, tài khoản kỹ thuật VIEWER.
- `command -v adb` không tìm thấy executable; `xcrun simctl list devices` báo không tìm thấy
  `simctl`. Không có môi trường Android/iOS được xác minh có thể dùng trong phiên này.
- Trước khi bật, `pgrep -x VoiceOver` không tìm thấy tiến trình. OWNER đã xác nhận bật VoiceOver
  cùng phụ đề ở lượt tiếp theo; công tắc hệ thống nay `on`, `ps` xác nhận tiến trình VoiceOver.
  Tiện ích → Hình ảnh → Bảng và menu có “Hiển thị bảng chú thích” = 1; không đổi tùy chọn này
  vì đã bật sẵn. OWNER xác nhận có lời đọc và bảng phụ đề khi dùng Control+Option+Right trên máy.
- Giới hạn công cụ: bind ứng dụng `com.apple.VoiceOver` và đường dẫn VoiceOver.app đều timeout
  `-10005: timeoutReached`; ảnh/AX của Safari không chứa bảng chú thích. Lệnh VO-Shift-C qua
  công cụ chưa thu được câu đọc vào textarea capture local. Không coi việc tiến trình chạy hay
  người dùng xác nhận có âm thanh là PASS cho các hành trình chưa có nội dung lời đọc.
- OWNER cho biết không biết dùng VoiceOver và không thực hiện được các bước được yêu cầu.
  Đã bỏ yêu cầu cung cấp mẫu lời đọc: việc vận hành screen reader không phải trách nhiệm OWNER.
  Chưa xác minh audio/rotor/announcement sau login, chuyển tab hoặc dialog. C70 bị chặn bởi
  khả năng quan sát/điều khiển của công cụ; không dùng kết quả AX/DOM để thay thế lời đọc thực.
  Không đổi cỡ chữ hệ thống/modifier; VoiceOver đã bật ở lượt trước, chưa thực hiện thao tác tắt.
- Không lưu screenshot Production vào repository. Cache credential/evidence nằm ở `.cache/c70-audit`
  bị Git ignore; credential có quyền `0600`. Báo cáo không chứa tên đối tác, số tiền hay ID khoản vay.
- Áp dụng checklist accessibility/interaction của skill `ui-ux-pro-max`; không tạo design system
  hoặc sửa giao diện vì C70 chỉ audit.

## Ma trận bằng chứng hiện có

| Kiểm tra | Kết quả | Bằng chứng và giới hạn |
|---|---|---|
| Safari thật · login semantic | PASS | AX tree có H1 Đăng nhập an toàn, H2 Chào mừng trở lại, label username/password, toggle Hiện mật khẩu và CTA Đăng nhập. |
| Safari thật · login keyboard/focus | PASS | Option+Tab từ username → password → toggle → CTA; screenshot quan sát viền focus password và CTA. Không dùng autofill tài khoản OWNER. |
| Chrome Production · dashboard privacy | PASS giới hạn | Khi đang ẩn, không có thuộc tính `aria-label/title` chứa `₫` trong main; metric comparison công bố số tiền đang ẩn. Không phải kiểm đầy đủ mọi kênh rò dữ liệu. |
| Chrome Production · dashboard heading | PASS | Outline trong main ở desktop là H1 → H2, không nhảy H3 trước H2 như C66. |
| Chrome Production · sheet Thêm | PASS | Initial focus nút đóng; Tab cuối → đầu, Shift+Tab đầu → cuối; `aria-expanded=true`; Escape đóng và focus trả trigger. Chưa kiểm lời đọc VoiceOver. |
| Chrome Production · reflow 500/390/320 px | PASS | Dashboard không tràn ngang; nhãn bottom nav không bị clip. Đây là viewport desktop thu hẹp, không phải zoom thật hoặc điện thoại thật. |
| Chrome Production · loans/notifications privacy | PASS giới hạn | Main không có `aria-label/title` chứa `₫` khi privacy bật ở 320 px; không tràn ngang. |
| Chrome Production · loan detail bốn tab | PASS giới hạn | Chờ URL và `aria-current` sau commit cho overview/interest/history/settings; không có thuộc tính tiền `₫` hoặc tràn ngang. Không có mutation tài chính. |
| Chrome Production · landscape 812×375 | PASS giới hạn | Login/dashboard/loans không tràn ngang; viewport giả lập không đại diện xoay màn hình hay safe-area thiết bị. |
| VoiceOver Safari/macOS · sẵn sàng | PASS thiết lập | Công tắc on, tiến trình chạy, bảng chú thích bật; OWNER xác nhận có lời đọc/phụ đề. Không phải PASS hành trình. |
| VoiceOver Safari/macOS · toàn bộ hành trình | NOT_TESTED | Công cụ không truy cập được đầu ra; không yêu cầu OWNER tự vận hành screen reader để hoàn tất audit. |
| TalkBack Android và VoiceOver iPhone | NOT_TESTED | Chưa có thiết bị/emulator phù hợp được xác minh. |
| Mobile · bàn phím mềm/safe-area/cỡ chữ hệ thống/xoay/focus | NOT_TESTED | Không suy diễn từ viewport Chrome hoặc CSS. |

## Quan sát cần xác minh bằng công nghệ hỗ trợ

Chưa có phát hiện mới được kết luận FAIL trên screen reader. Không gán severity cho giả thuyết.

- Ở mobile, heading module nằm ngoài `main`; heading chi tiết khoản vay vẫn là H1 trong main,
  nên detail có hai H1 nhìn thấy. Source: `apps/web/src/components/app/mobile-module-title.tsx:24`,
  `apps/web/src/components/app/app-shell.tsx:40–47`, `apps/web/src/app/loans/[id]/page.tsx:124`.
  Cần kiểm rotor/skip link và thứ tự đọc để đánh giá tác động, không tự coi nhiều H1 là lỗi WCAG.
- Title các route dùng tên ứng dụng chung tại `apps/web/src/app/layout.tsx:27`. Cần kiểm lời
  announcement sau chuyển route/tab; DOM trống ở route announcer không đủ để kết luận screen reader
  không nhận được thông báo. Sau khi chờ commit, shadow DOM announcer là “Chi tiết khoản vay”
  ở overview và “Quản lý vay cá nhân” ở interest/history/settings; đây là dữ liệu DOM, chưa phải lời
  VoiceOver đọc. Đề xuất chỉ mở remediation sau khi tái hiện và ghi đúng lời đọc.

## Kết luận theo phạm vi điều chỉnh

1. Bằng chứng trong ma trận phân biệt Safari native, Chrome headless trên Production và viewport
   giả lập. Những phép kiểm có kết quả được giữ nguyên; không nâng kết quả DOM/AX thành screen-reader PASS.
2. VoiceOver đã bật nhưng công cụ không thu được đầu ra; lời đọc, rotor, announcement chưa được
   kiểm. TalkBack, VoiceOver iPhone, bàn phím mềm, safe-area, cỡ chữ hệ thống và xoay màn hình
   thật giữ `NOT_TESTED`. Đây là giới hạn kiểm chứng còn mở, không phải phát hiện lỗi của webapp.
   Chỉ hậu kiểm khi có môi trường công cụ phù hợp; không cần OWNER học hoặc dùng VoiceOver.
3. Không có phát hiện mới đủ bằng chứng để kết luận FAIL/severity trên screen reader. Hai quan sát
   source/DOM phía trên giữ trạng thái cần xác minh, không tạo remediation dựa trên giả thuyết.
4. Tài khoản kỹ thuật đã inactive/banned và hậu kiểm đọc-only đạt. Cache/helper/credential bị Git
   ignore, credential `0600`; evidence không chứa tên đối tác, ID khoản vay hoặc số tiền thật.
5. Gate phù hợp cho thay đổi chỉ tài liệu: `git diff --check`; không có gate Markdown riêng trong
   package scripts. Không chạy lại full runtime suite vì không đổi code/harness/schema.
6. Checkpoint đề xuất kế tiếp là C71 audit sâu UI/UX thông thường, phạm vi/acceptance criteria
   tại `docs/IMPLEMENTATION_PLAN.md`. Không yêu cầu screen-reader PASS để thực hiện C71; C71
   không được ghi là hoàn tất các giới hạn công nghệ hỗ trợ còn mở của C70.

Không sửa runtime, deploy, migration, secret, push hoặc ghi giao dịch tài chính trong phiên này.

Nguồn lệnh VoiceOver: [Apple — bảng phụ đề](https://support.apple.com/en-kw/guide/voiceover/unac078/mac),
[Apple — lệnh orientation và copy câu vừa đọc](https://support.apple.com/guide/voiceover/orientation-commands-cpvokys03/mac).
Các nguồn này mô tả cơ chế công cụ hỗ trợ, không thay thế bằng chứng kiểm Production.
