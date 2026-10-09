# C92 static reference

OWNER chọn A ngày09/10/2026, Quick Amount +50tr/+100tr/+150tr/+200tr. Các mẫu B/D/E được giữ làm bằng chứng lựa chọn, không phải thiết kế đích. Toàn bộ dữ liệu là giả. Không kết nối API, không ghi tài chính, không có phép cộng chip.

Từ repository root chạy `python3 -m http.server 3192 --bind 127.0.0.1 --directory docs/design-c92/reference`; mở `http://127.0.0.1:3192/index.html?v=a&mau=mau&kho=mobile&theme=light&scene=drawer&kind=principal&tt=empty`. Nếu server cache đang chạy, dùng URL đó trực tiếp; không khởi động server khác cùng port.

Tokens/font/logo/primitives là snapshot hiện tại dùng cho review; proposal.css chứa hình đích, không import vào app. Before ảnh32samples cùng fixture/theme/viewport lấy từ baseline final; drawer baseline nhập50triệu/Tiền gốc, các state bổ trợ không giả ảnh before. Fixture JSON/app.js giữ data snapshot trước lựa chọn, các số dư không đổi; baseline.json có thêm journey50triệu.

Đặc tả chốt ở ../selected-design.md; baseline/QA có phạm vi riêng, không chứng nhận AT/phone thật/remote behavior.
