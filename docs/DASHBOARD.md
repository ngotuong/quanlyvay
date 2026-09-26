# Dashboard C7/C16

## Nguồn số liệu

Dashboard quản trị gọi một lần RPC
`public.get_management_dashboard_bundle_v3(period_start, period_end, previous_start, previous_end, balance_start, balance_end)`.
Bundle dùng một snapshot authoritative chung cho KPI và analytics kỳ hiện tại, một projection
authoritative cho dòng tiền/lãi so sánh và một projection số dư đầu kỳ lấy từ facts đã harden.
Hai projection chỉ tính các chỉ số so sánh mà giao diện sử dụng, tránh lặp lại lịch nhắc, dự báo và
biểu đồ không được hiển thị cho kỳ nền. `get_management_analytics` được giữ làm projection tương
thích ngược. Các hàm yêu cầu người dùng đang hoạt động, nhưng cho
phép cả `OWNER`, `EDITOR` và `VIEWER` đọc số liệu. Frontend chỉ định dạng, tính chênh lệch hiển thị
và trực quan hóa kết quả; mọi phép tổng hợp tiền nằm trong PostgreSQL. RPC C7
`get_dashboard(as_of_date, months)` được giữ để tương thích, không còn là contract của giao diện chính.

Khoảng báo cáo dùng ngày nghiệp vụ `Asia/Ho_Chi_Minh`. Số dư được chốt tại `period_end`; lãi, chi phí,
lợi nhuận và dòng tiền chỉ lấy từ `period_start` đến `period_end`. Giao dịch gốc đã bị đảo trước ngày
cuối kỳ và các giao dịch tổng hợp do onboarding khoản cũ không tham gia dòng tiền trong kỳ. Dữ liệu
được phân loại `is_test_data` chỉ phục vụ QA: vẫn giữ bản ghi và audit append-only nhưng không tham
gia dashboard, danh sách nghiệp vụ hay snapshot Google Sync.

## Định nghĩa chỉ số

- Cho vay đang hoạt động: dư gốc `ACTIVE`/`OVERDUE` tại ngày cuối kỳ, không gồm `BAD_DEBT`.
- Nợ xấu phải thu: dư gốc `LENDING` có trạng thái `BAD_DEBT`, hiển thị riêng.
- Tổng vốn cho vay chưa thu hồi: cho vay đang hoạt động + nợ xấu phải thu.
- Dư nợ đi vay: dư gốc đi vay không phải nợ xấu tại ngày cuối kỳ; contract vẫn trả riêng nợ xấu và
  tổng nghĩa vụ đi vay để không làm mất số liệu nếu phát sinh trường hợp này.
- Lãi đã thu/trả và chi phí: chỉ gồm giao dịch thực tế trong khoảng được chọn.
- Lãi ròng thực thu (cơ sở tiền mặt): lãi đã thu − lãi đã trả − chi phí khác.
- Lãi ròng phát sinh (cơ sở dồn tích): chênh lệch tổng lãi tích lũy tại cuối kỳ và ngày
  trước đầu kỳ, sau đó trừ chi phí trong kỳ. Cách lấy chênh lệch giữ đúng phần kỳ lãi bị cắt bởi bộ lọc.
- Lãi dự kiến kỳ tới: số dư lãi dương tại ngày đóng lãi kế tiếp của các khoản đang hoạt động.
- Cần thu/trả lãi: khoản `ACTIVE` có ngày nhắc trong 30 ngày tính từ ngày chốt **và số dư lãi dự
  kiến tại cuối kỳ tương ứng lớn hơn 0**. Đóng đủ hoặc ứng trước bị loại; đóng một phần chỉ trả số
  dư còn lại. Ngày nhắc và ngày kết thúc kỳ là hai trường riêng.
- Quá hạn gốc: khoản có trạng thái tính toán `OVERDUE`; vẫn hiện cho tới khi xử lý gốc, kể cả lãi
  tại ngày chốt đã đóng đủ. Không áp dụng lãi phạt.
- `SETTLED` và `BAD_DEBT` không tham gia nhắc lãi thường xuyên; nợ xấu nằm trong vùng rủi ro riêng.

## Quy ước dòng tiền

Tiền vào gồm giải ngân của khoản đi vay và các khoản thu lãi/gốc từ cho vay. Tiền ra gồm giải ngân cho vay, thanh toán lãi/gốc của khoản đi vay và chi phí khác. Biểu đồ tạo các cột tháng nằm trong khoảng đã chọn và luôn có bảng số liệu đi kèm. Bộ lọc nhanh gồm tháng này, tháng trước, năm nay và sáu tháng; khi URL không chỉ định kỳ thì mặc định là tháng này. Khoảng tùy chỉnh tối đa năm năm và cập nhật ngay khi hai ngày hợp lệ, không cần bước Áp dụng.

Dashboard còn có ba biểu đồ quản trị: phát sinh so với thanh toán lãi trong kỳ, cơ cấu dư nợ tại
ngày chốt và top 10 mức tập trung dư nợ theo đối tác. Nợ xấu luôn là chuỗi riêng, không bị gộp vào
cho vay hoạt động. First fold giữ bốn KPI ở đầu (desktop một hàng, mobile 2×2), sau đó là card
`Lịch Dự Kiến` trước biểu đồ dòng tiền trong thứ tự đọc. Card dùng một danh sách liên tục, đường kẻ
ngăn từng dòng, icon `HandCoins` xanh cho vay và `Landmark` đỏ cho đi vay; tối đa năm item trước liên
kết xem thêm và không tạo vùng cuộn lồng. Tổng vốn, nợ xấu và ba phân tích phụ nằm trong vùng
`Phân tích chi tiết`.

Banner `Lịch nhắc tháng này` không tính bù trừ. Nó hiển thị tổng số giao dịch trong tháng, số khoản
và tổng tiền phải thu, số khoản và tổng tiền phải trả; đây là hai tổng gross, không phải lãi ròng.

KPI dòng tiền/lãi của `Tháng này` so với cùng số ngày tháng trước; `Năm nay` so với cùng kỳ năm
trước; kỳ khác so với kỳ liền trước cùng độ dài. KPI số dư so với ngày ngay trước đầu kỳ. Mỗi card
chỉ hiển thị icon hướng và số chênh lệch; nhãn truy cập và tooltip vẫn nêu đủ hướng, số tiền
cùng ngày hoặc khoảng ngày so sánh.

## UX và khả năng truy cập

- `/dashboard` là trang mặc định sau đăng nhập; danh sách khoản vay ở `/loans`.
- Bộ lọc nằm trong URL để giữ trạng thái khi tải lại, quay lại hoặc chia sẻ đường dẫn.
- Giao diện được kiểm tra ở 375px, 768px và 1440px, không phát sinh cuộn ngang toàn trang.
- Light/dark mode theo thiết lập hệ điều hành.
- Biểu đồ không chỉ dựa vào màu: hai chuỗi dùng kiểu tô khác nhau, có chú giải, tooltip và bảng số liệu.
- Điều khiển tương tác có vùng chạm tối thiểu 44px và tôn trọng `prefers-reduced-motion`.
