# C92 — Brief và tiêu chí chọn thiết kế đích

Trạng thái: **COMPLETED**, OWNER duyệt C92 và chọn **A** ngày09/10/2026, yêu cầu nhập nhanh **50tr, 100tr, 150tr,…**. Đã khóa đặc tả và gate local; chưa sửa runtime/deploy.

Sản phẩm quản lý cho vay và đi vay cá nhân; OWNER/EDITOR theo dõi dư gốc, lãi, lịch nhắc và ghi giao dịch (nguồn: code và domain hiện hữu). Ba việc chính: xem vị thế vốn/lãi, chọn đúng khoản cần xử lý, nhập giao dịch đúng ngữ cảnh. Mẫu ưu tiên đọc trên điện thoại, đồng thời có bản desktop (ưu tiên mobile là giả định thiết kế từ matrix đã yêu cầu, không phải thống kê sử dụng). Điểm phân biệt là theo dõi hai chiều cho vay/đi vay, kỳ lãi và nghiệp vụ authoritative ở PostgreSQL; frontend không quyết toán tiền.

Brand B được giữ: canvas xanh xám, sidebar navy, KPI cobalt, Inter; KPI dư nợ/lãi trước công việc. Logo/token/font lấy từ runtime hiện tại. C92 dùng HTML độc lập với dữ liệu giả; mọi API/hành vi ghi là phần triển khai sau.

| Bề mặt | Việc chính | Thông tin để quyết định | Hành động | Giới hạn |
| --- | --- | --- | --- | --- |
| Dashboard | Xem vốn/lãi, chọn việc cần xử lý | Dư nợ, lãi ròng, hướng vay, kỳ/ngày nhắc, số tiền | Mở đúng form của khoản | Luồng hiện đã1click→detail+drawer; đích C96 là drawer vẫn tại Dashboard |
| Detail | Xác nhận đúng khoản, kỳ và dư còn lại | Tên/đối tác đầy đủ, hướng vay, dư gốc, lãi, trạng thái | Giao dịch/tất toán/giảm gốc | C92 chỉ mẫu; không thay validation/RPC |
| Drawer | Nhập tiền theo ngữ cảnh, kiểm rồi ghi | Khoản/hướng vay, tiền còn lại, loại/ngày/số tiền/ghi chú | Ghi nhận; hủy an toàn | Quick Amount chỉ một số context, không autosubmit; giá trị là chuỗi integer |
| Bảng dòng tiền/đối tác | Ghép đúng tên hoặc tháng với giá trị khi cuộn | Headers, đơn vị, từng giá trị, tổng, kể cả0 | Đọc/đối chiếu/xem đầy đủ tên | Không bỏ cột hoặc giảm số để vừa màn |
| Thông báo/nhãn phụ | Phân biệt selected/hover và đọc trạng thái | Bộ lọc, chưa đọc/đã đọc, nhãn tỷ trọng/trạng thái | Lọc/xem | Không mark-read hoặc thay tài khoản trong C92 |

Tham chiếu tài liệu sản phẩm: [reports của Actual](https://actualbudget.org/docs/tour/reports/) tách các báo cáo vốn/dòng tiền; [loan accounts](https://support.ynab.com/en_us/loan-accounts-a-guide-HkNSkPHJi) đặt thông tin khoản và hành động thanh toán cùng ngữ cảnh. Đây là tham chiếu cấu trúc, dựa trên tài liệu/kết quả tìm nguồn chính; không phải khảo sát người dùng hoặc lý do để sao chép công thức lãi. Một URL reports-dashboard không mở được, không dùng làm chứng cứ đã quan sát UI.

## Các mẫu đã review — OWNER chọn A, không chọn D/E

- **A — Đọc rõ trên mobile (khuyên dùng):** mobile dùng thẻ nhãn–giá trị; desktop giữ bảng. Task desktop rộng, dòng tiền bên dưới. Drawer desktop bên phải, mobile bottom sheet. Đánh đổi: cuộn dọc dài hơn khi đối chiếu nhiều dòng.
- **B — Bảng để đối chiếu:** bảng có cột nhận diện ghim; mobile cuộn ngang trong khung, tên có disclosure. Task/dòng tiền desktop cạnh nhau, drawer desktop căn giữa. Đánh đổi: ít cột tiền cùng lúc trên mobile, tên trong cột136px có thể hai dòng.
- **D/E — biến thể nội dung của A:** D gọn phần phụ; E đưa mốc so sánh chung ra đầu nhóm. Không đổi giá trị/kỳ; không phải hai hướng bố cục mới.

Wireframe độc lập: `.cache/c92/wireframes/index.html`. Server review chỉ bind127.0.0.1:3192 và chỉ phục vụ thư mục wireframes; không phục vụ env/cookie/backup. Toàn bộ số liệu và tên là giả. Scene có dữ liệu có ảnh baseline cùng fixture/theme/viewport. Empty/error/loading/name-boundary là bổ trợ; trường hợp chưa có baseline tương ứng được nói rõ, không giả ảnh before.

## Hợp đồng control đã chọn

Button dùng classes nội bộ, tối thiểu44px/chữ14; input16px/cao44; tabs14px/cao48; badge14; card padding16mobile/20desktop; tên/value có khoảng cách4px, nhóm8–16px; các thứ bấm được có focus rõ. Unit VND tối thiểu12px là ngoại lệ typography. Giữ native select/date và disclosure của dự án trong mẫu; không tự thay picker hoặc thêm logic nghiệp vụ để hợp gu skill. Mobile giữ4điểm chính +Thêm, desktop giữ cả Nhật ký hệ thống; không xóa đường vào tính năng.

## Mục tiêu đo đã chốt cho checkpoint triển khai

| Trường hợp cụ thể | Baseline thực | Mục tiêu đề xuất | Giai đoạn thực thi |
| --- | --- | --- | --- |
| Dashboard hiện tiền, khoản C92 Minh An,375/1280×900 | 1click mở detail+drawer;1route transition | 1click, vẫn Dashboard, đúng context; không hứa giảm số click vốn đã1 | C96 |
| Amount Tiền gốc trống đã focus, nhập50.000.000 trên khoản Minh An dư gốc1.284.500.000, không paste | Baseline mới đo8phím số; chọn loại/clear/focus chuẩn bị tính riêng; baseline10triệu được giữ | 1chipaction +50tr; +100tr/+150tr/+200tr cũng1action từ trống. Giá trị khác gõ/paste; không vượt giới hạn | C95 |
| Mở hai bảng trên Dashboard mặc định | 3click disclosure, automatic scrolling được ghi | Giữ đủ dữ liệu/nhãn. A: không cần cuộn ngang mobile. B: sau cuộn vẫn thấy nhận diện | C94 |
| G2 expense percentage/managed-user status | 11.2px/11.52px thực tại375/1280 Light/Dark | Nhãn này14px; body/input16; helper thường14, ngoại lệ≥12 có lý do | C94 |
| Tên hợp lệ200ký tự | Fixture có tên200; list/table chụp fresh. Gu detail nhiều dòng có nguồn C89 | Không mất accessible identity; full name đọc được bằng disclosure/keyboard. Không tuyên bố detail-long before mới đã đo | C94 |
| Notification selected/hover | Nguồn CSS/C89 dùng chung fill; scene fresh cùng dữ liệu giả | Background/weight rõ khác nhau và aria-current; focus vẫn rõ | C94 |
| Reflow/zoom | Baseline375/1280×900, không tràn trang; không chứng nhận zoom/phone thật |320CSSpx; text200%;375×667; cả5khổ375/390/768/1024/1440 Light/Dark. Không page overflow; bảng chỉ trong scroller | C94/C98 |
| Loading/pending, delayed2s/10s | App đã có startup/shimmer/SPA progress; C92 không đo lại latency | Skeleton khớp từng vùng, pending giữ draft/focus và có status. Đo CLS≤0.1 trong window defined; reduced-motion giữ feedback tĩnh | C97/C98 |

Mục tiêu là spec dự kiến, chưa phải kết quả runtime. WCAG2.2AA là đích; ratio/text hoặc headless keyboard không chứng nhận toàn bộ WCAG/AT/device. Không budget header≤25% mọi viewport, không hứa60fps mọi thiết bị/zeroCLS toàn app/nhanhgấp3.

Nếu chọn A, việc đổi task/cash-flow từ hai cột desktop sang full-width và hình drawer mới phải được ghi trong scope checkpoint triển khai được duyệt sau. C93 vẫn refactor giữ hình hiện tại; không âm thầm dùng C92 như quyền sửa runtime hoặc phát hành.

OWNER đã chọn A; [đặc tả chốt](selected-design.md) khóa tokens/density/states/focus/scope/budget và nhóm Quick Amount. C93 chỉ bắt đầu sau phê duyệt riêng.
