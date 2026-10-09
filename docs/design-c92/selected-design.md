# C92 — Thiết kế A đã chọn

OWNER chọn **A** trong hội thoại ngày09/10/2026 và yêu cầu: “các giá trị tiền nhập nhanh nên là 50tr, 100tr, 150tr,..”. Chọn A nguyên bản, giữ thông tin phụ/mốc so sánh; D/E không được chọn. Dữ liệu trong render là giả. Đây là thiết kế đích cho các checkpoint sau, chưa thay runtime.

## Bố cục và phạm vi

- Dashboard giữ KPI dư nợ/lãi trên Việc cần xử lý trong DOM và hình. Desktop: task rộng, dòng tiền bên dưới. Đây là thay đổi hình được chọn cho C94 khi checkpoint đó được phê duyệt; C93 chỉ refactor giữ hình hiện tại.
- Hai bảng Dashboard Dòng tiền/Đối tác dùng thẻ nhãn–giá trị trên mobile dưới1024px, desktop giữ bảng/cột tên224px và scroller khi cần. Giữ từng cột/giá trị0/đơn vị/nhóm và thứ tự/sort. Không áp thẻ lên mọi bảng. Chấp nhận đánh đổi cuộn dọc dài hơn của A.
- Tên dài clamp tối đa2dòng và disclosure “Xem đầy đủ” vùng bấm44px. Accessible identity đầy đủ; không đặt disclosure trong heading/link hoặc expose bản tiền duplicate. C94 xử lý tên200ký tự, G2 và G4.
- Drawer desktop bên phải480px, cách mép16px; mobile bottom sheet cách mép12px, ngang viewport−24px, cao tối đa viewport−24px. Nội dung cuộn, header/footer giữ vị trí, đủ ngữ cảnh khoản/hướng vay/dư gốc/lãi. Hình và mở trực tiếp trên Dashboard thuộc C96; deep-link/lifecycle/RPC vẫn giữ theo roadmap.
- Giữ điều hướng desktop7mục, mobile4mục chính+Thêm; không mất đường vào Chi phí/Nhật ký/Cài đặt. Giữ native select/date, focus ring và privacy.

## Quick Amount — sửa theo OWNER

Mẫu chốt có4nút **+50tr / +100tr / +150tr / +200tr**, trong đó “tr” là triệu đồng. Bốn giá trị đầu là cách triển khai cụ thể của chuỗi50triệu tăng dần OWNER yêu cầu; không sinh dãy vô hạn. Dấu+ giữ nghĩa cộng dồn của mẫu A đã review. Accessible names: “Cộng50triệu đồng”, v.v. Giá trị dùng chuỗi `50000000`, `100000000`, `150000000`, `200000000`; chuỗi integer/BigInt, không Number để cộng tiền.

Mẫu minh họa trên ô **Tiền gốc** khoản giả Minh An dư gốc1.284.500.000. Nhóm50–200triệu chỉ dành cho field/context có validation phù hợp; không mặc định đưa vào mọi ô thu/trả lãi nhỏ. Context lãi trong mock giữ “Theo số còn lại”; chỉ dùng số authoritative được cấp, không tự tính lãi. C95 lập inventory consumer trước khi nối hành vi, không tự mở rộng sang field khác.

Khi triển khai C95: ô trống được coi0; chọn một nút cộng vào giá trị hợp lệ hiện có, cập nhật cả display và normalized value. Nếu vượt giới hạn context/hệ thống thì chặn với thông báo rõ, giữ draft; không âm thầm clamp. Gõ/paste/clear vẫn dùng được cho10triệu hoặc giá trị bất kỳ hợp lệ. Không đổi default của form nghiệp vụ vì chọn mẫu. Nút `type=button`, không autosubmit; sau click focus về amount/cursor cuối. Pending khóa thao tác, form reset xóa trạng thái đúng lifecycle, callback giữ chuẩn. Mẫu C92 chỉ trình bày và chuyển scene/context, chưa thực hiện phép cộng hoặc gửi API.

Mục tiêu thay tiêu chí10triệu/≤2chips trước đây: **từ Tiền gốc trống đã focus,50triệu bằng1chipaction**;100/150/200triệu cũng1action từ trống. Baseline mới đo cùng khoản/375 và1280×900/LightDark:8phím số để nhập50.000.000. Chọn loại tiền/clear/focus là chuẩn bị, ghi riêng và không tính vào cả hai bên. Không hứa tốc độ theo thời gian hoặc nhanhgấp3.10triệu vẫn được gõ/paste, không thêm nút10triệu trái lựa chọn OWNER.

## Tokens, chữ và mật độ

Nguồn đầy đủ: [tokens](reference/tokens.css), [primitives hiện tại](reference/primitives-source.css), [CSS mẫu](reference/proposal.css). Phong cách flat cho card/control, shadow chỉ cho overlay; giữ brand B/Inter và status có nghĩa.

| Vai trò | Light | Dark |
| --- | --- | --- |
| Canvas | #eaf0f8 | #0b1220 |
| Surface | #ffffff | #172235 |
| Surface phụ | #e6edf7 | #1d3150 |
| Text | #142238 | #f1f5fc |
| Text phụ | #52647c | #b3c2d7 |
| Primary | #1d4ed8 | #93c5fd |
| Sidebar | #152c4c | #152c4c |
| KPI | #1d4ed8, chữ trắng | #1d4ed8, chữ trắng |

Token gốc được giữ trong palette; component dùng semantic token. Control border dùng `color-mix(in srgb,var(--foreground-muted)80%,var(--surface))`; `error-text` trộn95%error+foreground để nhãn nhỏ đạt tỷ lệ đã đo. Đây là màu đích C94; C93 không đổi màu/border hiện tại khi refactor. Dark/System phải giữ native-color-scheme và preference hiện hành.

- Inter400/500/600; body/input16px, helper/label/badge14px; heading trang24desktop/20mobile, section20/18. KPI24desktop/18mobile; hero chi tiết30/26, số dài vẫn đầy đủ theo giới hạn C90. Unit VND≥12px là ngoại lệ, bottom navigation12px là ngoại lệ nhãn ngắn; không lan ngoại lệ sang metadata nghiệp vụ.
- Button/icon/input≥44×44px, tabs48px cao/chữ14; nút phụ viền nhẹ. Card16mobile/20desktop, khoảng cách nhãn–giá trị4px, trong nhóm8px, giữa nhóm16–24px. Radius8/12/16 theo control/card, sheetmobile20px.
- Full VND số và unit cùng dòng, không làm tròn/ký hiệu “tr” cho số dư/ledger; “tr” chỉ trên nút nhập nhanh. Số lớn được hàng đầy ngang; không giảm chữ dưới ngưỡng để vừa thẻ.

## Trạng thái và focus

| Trạng thái | Hình và hành vi đích |
| --- | --- |
| Có dữ liệu | Tên, hướng, trạng thái và số đủ; selected dùng primary fill/chữ tương phản/weight600, hover dùng surface-muted; aria-current giữ đúng |
| Rỗng | Phân biệt chưa có dữ liệu/search không có kết quả/chưa đọc rỗng; mô tả và hành động đúng ngữ cảnh, không tạo dữ liệu giả trên app |
| Đang tải | Skeleton tại đúng vùng/geometry; giữ startup, shimmer và SPA progress hiện có; có status, không dùng animation thay feedback |
| Pending form | Giữ draft/context, status “Đang ghi nhận”, khóa submit/chip; không đóng hoặc ghi thành công giả |
| Lỗi | Thông báo đọc được, aria-invalid/aria-describedby ở field; giữ draft/focus, hành động thử lại; không dùng màu riêng để truyền nghĩa |
| Privacy | Ẩn tiền trong DOM/AX theo guard hiện hữu; muốn nhập thì yêu cầu hiển thị, không leak qua chip/suggestion/context |
| Keyboard | Focus-visible2px offset3px; Tab trong drawer, Escape theo dirty/pending guard, trả focus về trigger hoặc mục hợp lý; native pickers giữ nguyên |

## Matrix và budget nghiệm thu sau

C94/C98:375/390/768/1024/1440×LightDark, reflow320CSSpx, text200%, viewport thấp375×667. Không page overflow/clipping tiền; scroller chỉ trong bảng được định nghĩa. C95 thêm mô phỏng viewport bàn phím, không gọi là chứng nhận phone thật. C96:1click taskinterest,0route transition để mở drawer đúng context, không render form mọi task vô điều kiện.

C97/C98: delayed response2s/10s trên local fixture, browser/build/viewport và network condition ghi trong report; CLS≤0.1 cho từng vùng loading→content. Window từ navigation/action bắt đầu tới2animation frames sau content ổn định; phân biệt entries `hadRecentInput` và shift liên quan layout, không hứa zeroCLS toànapp. Motion giữ token150/220/320ms, shimmer1.8s; reduced-motion tắt chuyển động nhưng còn feedback tĩnh. Latency/60fps toànthiết bị chưa được xác nhận.

AT/phone thật/SafariFirefox authenticated/OS-theme/PWA trướcHTML/remote save là NOT_TESTED. Contrast và headless geometry/focus chỉ là bằng chứng có phạm vi, không phải chứng nhận WCAG toànapp. Chi tiết baseline/lượt lỗi giữ ở [report](report.md) và [evidence](evidence.json).
