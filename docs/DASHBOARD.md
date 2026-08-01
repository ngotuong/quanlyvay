# Dashboard C7

## Nguồn số liệu

Dashboard gọi duy nhất RPC `public.get_dashboard(as_of_date, months)`. Hàm yêu cầu người dùng đang hoạt động, nhưng cho phép cả `OWNER`, `EDITOR` và `VIEWER` đọc số liệu. Frontend chỉ định dạng và trực quan hóa kết quả; mọi phép tổng hợp tiền nằm trong PostgreSQL.

Ngày chốt số liệu dùng ngày nghiệp vụ `Asia/Ho_Chi_Minh`. Giao dịch đảo và giao dịch gốc đã bị đảo trước ngày chốt đều không tham gia tổng hợp.

## Định nghĩa chỉ số

- Dư nợ cho vay/đi vay: tổng dư nợ gốc tại ngày chốt theo từng hướng.
- Lãi đã thu: tổng giao dịch lãi của các khoản `LENDING`.
- Lãi đã trả: tổng giao dịch lãi của các khoản `BORROWING`.
- Lợi nhuận tiền mặt: lãi đã thu − lãi đã trả − chi phí khác.
- Lợi nhuận dồn tích: lãi phát sinh cho vay − lãi phát sinh đi vay − chi phí khác.
- Lãi dự kiến kỳ tới: số dư lãi dương tại ngày đóng lãi kế tiếp của các khoản đang hoạt động.
- Sắp đến hạn: khoản đang hoạt động có ngày đóng lãi kế tiếp trong 30 ngày tính từ ngày chốt.
- Quá hạn: khoản có trạng thái tính toán `OVERDUE`; không áp dụng lãi phạt.

## Quy ước dòng tiền

Tiền vào gồm giải ngân của khoản đi vay và các khoản thu lãi/gốc từ cho vay. Tiền ra gồm giải ngân cho vay, thanh toán lãi/gốc của khoản đi vay và chi phí khác. Biểu đồ hiển thị sáu tháng gần nhất theo thứ tự thời gian và luôn có bảng số liệu đi kèm.

## UX và khả năng truy cập

- `/dashboard` là trang mặc định sau đăng nhập; danh sách khoản vay ở `/loans`.
- Giao diện được kiểm tra ở 375px, 768px và 1440px, không phát sinh cuộn ngang toàn trang.
- Light/dark mode theo thiết lập hệ điều hành.
- Biểu đồ không chỉ dựa vào màu: hai chuỗi dùng kiểu tô khác nhau, có chú giải, tooltip và bảng số liệu.
- Điều khiển tương tác có vùng chạm tối thiểu 44px và tôn trọng `prefers-reduced-motion`.
