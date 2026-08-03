# Hướng dẫn sử dụng Quản Lý Vay Cá Nhân

## 1. Truy cập và đăng nhập

Mở Production tại:

`https://quan-ly-vay-ca-nhan.vercel.app`

Đăng nhập bằng **tên đăng nhập**, không dùng email. Tài khoản OWNER hiện tại là `ngotuong`.
Mật khẩu không được ghi trong repository; nếu quên mật khẩu, OWNER cần dùng quy trình quản trị đã
được cấu hình hoặc yêu cầu vận hành đặt lại an toàn.

Mật khẩu hợp lệ có tối thiểu 6 ký tự và chỉ gồm chữ cái không dấu `A-Z`, `a-z` hoặc chữ số `0-9`.

## 2. Quyền tài khoản

| Vai trò | Khả năng |
|---|---|
| OWNER | Xem và nhập nghiệp vụ, quản lý tài khoản thứ hai, xem lịch sử chỉnh sửa |
| EDITOR | Xem và nhập nghiệp vụ, không quản lý tài khoản hoặc xem audit log |
| VIEWER | Chỉ xem dữ liệu; không thấy biểu mẫu thay đổi dữ liệu |

Hệ thống hỗ trợ tối đa hai tài khoản. OWNER quản lý tài khoản thứ hai tại **Cài đặt**.

## 3. Quy trình nhập dữ liệu khuyến nghị

### Bước 1 — Tạo đối tác

1. Mở **Đối tác**.
2. Nhập tên người vay hoặc người cho bạn vay.
3. Thêm ghi chú nếu cần rồi lưu.

Chỉ OWNER có thể xóa đối tác và chỉ xóa được đối tác chưa từng có khoản vay.

### Bước 2 — Tạo khoản vay

1. Mở **Khoản vay** → **Tạo khoản vay**.
2. Chọn đối tác đã tạo.
3. Có thể để trống **Nhãn phân biệt**. Hệ thống tự đặt nhãn từ đối tác, loại vay, số tiền và ngày
   giải ngân; mỗi khoản vẫn có ID riêng nên một đối tác có thể có nhiều khoản vay.
4. Chọn loại:
   - **Cho vay**: bạn giao tiền cho người khác.
   - **Đi vay**: bạn nhận tiền từ người khác.
5. Nhập số tiền gốc, ngày giải ngân, số ngày vay, chu kỳ đóng lãi 15/30 ngày và lãi suất `%` của
   **cả kỳ**. Ví dụ chu kỳ 30 ngày với lãi 3% thì nhập `3`, không nhập `0,1`.
6. Kiểm tra kỹ rồi lưu. Trang chi tiết hiển thị cả lãi suất mỗi kỳ và số tiền lãi của kỳ đầu đủ ngày.

Nếu dữ liệu khởi tạo bị nhập sai, mở chi tiết → **Sửa dữ liệu ban đầu đã nhập sai**, nhập lại dữ
liệu, lý do và xác nhận. Hệ thống không xóa lịch sử: giải ngân cũ được đảo, giải ngân thay thế được
thêm và toàn bộ lịch lãi được tính lại. Khoản đã tất toán không cho sửa theo cách này. Không nên tạo
lại cùng một khoản nếu trình duyệt phản hồi chậm; hệ thống có khóa idempotency để hạn chế ghi trùng.

### Bước 3 — Ghi nhận phát sinh

Mở chi tiết khoản vay và dùng khu vực **Ghi nhận nghiệp vụ**:

- **Thanh toán**: chọn tiền lãi hoặc tiền gốc, ngày và số tiền.
- **Chi phí**: nhập ngày, số tiền, nhóm chi phí và ghi chú.
- **Trạng thái/lãi suất**: đổi lãi suất, chuyển nợ xấu/ngừng lãi hoặc bật lại tính lãi.
- **Tất toán**: chọn ngày tất toán khi nghĩa vụ đã kết thúc.

Ngày hiệu lực rất quan trọng vì bộ máy tính lãi chia lịch sử theo ngày. Nếu nhập sai giao dịch tài
chính, dùng **Đảo giao dịch** và ghi lý do; không xóa hay sửa trực tiếp giao dịch cũ.

### Bước 4 — Chi phí chung

Mở **Chi phí** để nhập các khoản không gắn riêng với một khoản vay, ví dụ chi phí đi lại hoặc vận
hành. Chi phí nhập sai cũng được sửa bằng thao tác đảo.

## 4. Đọc Dashboard

Dashboard lấy số liệu trực tiếp từ sổ giao dịch và hiển thị:

- Dư nợ cho vay và dư nợ đi vay.
- **Lãi ròng đã thu/chi**: chỉ tính tiền lãi đã thực thu trừ lãi đã thực trả và chi phí.
- **Lãi ròng phát sinh đến hôm nay**: gồm cả lãi đã phát sinh nhưng chưa thanh toán, nên có thể thay
  đổi mỗi ngày.
- Lãi đã thu, lãi đã trả, chi phí khác và lãi dự kiến kỳ tới.
- Dòng tiền vào/ra sáu tháng gần nhất.
- Khoản sắp đến hạn trong 30 ngày và khoản đã quá hạn.

Chạm vào một khoản trong danh sách đến hạn để mở chi tiết và xử lý nghiệp vụ.

## 5. Thông báo và cài PWA

1. Mở **Thông báo** bằng Chrome hoặc Safari.
2. Bấm **Bật thông báo** và cho phép trình duyệt gửi thông báo.
3. Giữ quyền notification được bật trong cài đặt của trình duyệt/hệ điều hành.

Hệ thống tạo nhắc đóng lãi đúng ngày và nhắc quá hạn hằng ngày. Mỗi thiết bị có subscription riêng;
thiết bị mới không nhận lại các Push đã phát trước lúc đăng ký. Trong Notification Center, bấm
**Đánh dấu đã đọc** để xử lý các mục chưa đọc.

Để dùng như ứng dụng:

- Chrome/Edge: dùng **Install app/Cài đặt ứng dụng** trong thanh địa chỉ hoặc menu trình duyệt.
- Safari trên iPhone/iPad: **Chia sẻ** → **Thêm vào Màn hình chính**.

Ứng dụng không lưu cache dữ liệu tài chính để dùng ngoại tuyến. Cần kết nối mạng khi xem hoặc nhập
nghiệp vụ.

## 6. Quản lý tài khoản thứ hai

OWNER mở **Cài đặt** để:

- Tạo một tài khoản EDITOR hoặc VIEWER.
- Đổi tên hiển thị và vai trò.
- Vô hiệu hóa/kích hoạt lại tài khoản.
- Cấp mật khẩu tạm mới.

Người nhận mật khẩu tạm phải đổi mật khẩu ở lần đăng nhập tiếp theo. Không gửi mật khẩu qua kênh
công khai và không lưu mật khẩu trong GitHub hoặc Google Sheets.

## 7. Audit, Google Sheets và backup

- OWNER mở **Lịch sử** để xem 100 thay đổi gần nhất.
- Google Sheets là bản đối chiếu **một chiều** từ Supabase. Không sửa Sheet với kỳ vọng dữ liệu ghi
  ngược về ứng dụng.
- Apps Script đồng bộ Sheet theo giờ và tạo snapshot Drive hằng tuần; hệ thống giữ 12 snapshot mới
  nhất.
- Phục hồi snapshot chỉ khôi phục workbook đối chiếu, không phục hồi ngược dữ liệu Production.

## 8. Checklist kiểm tra nhanh

Sau khi nhập một nghiệp vụ quan trọng:

1. Mở lại chi tiết khoản vay và kiểm tra timeline.
2. Kiểm tra dư nợ gốc, lãi phát sinh và các kỳ lãi.
3. Kiểm tra Dashboard thay đổi đúng hướng tiền vào/ra.
4. OWNER kiểm tra **Lịch sử** nếu cần đối chiếu người thao tác.
5. Với ngày đến hạn, kiểm tra Notification Center và Push trên thiết bị đã đăng ký.

## 9. Xử lý sự cố thường gặp

- **Không đăng nhập được**: dùng username, kiểm tra mật khẩu chỉ gồm chữ/số và tài khoản còn active.
- **Bị yêu cầu đổi mật khẩu**: tài khoản đang dùng mật khẩu tạm; hoàn tất đổi trước khi tiếp tục.
- **Không thấy nút nhập liệu**: tài khoản có thể đang là VIEWER.
- **Không nhận Push**: mở trang Thông báo, kiểm tra trạng thái đã bật, quyền hệ điều hành và kết nối
  mạng; thử tắt/bật lại notification trên đúng thiết bị.
- **Số liệu chưa như mong đợi**: kiểm tra ngày nghiệp vụ và timeline; đảo bản ghi sai thay vì nhập
  thêm một bản bù không rõ lý do.
- **Google Sheet chưa cập nhật**: chờ chu kỳ đồng bộ theo giờ; không chỉnh trực tiếp dữ liệu nguồn
  trong Sheet.

Khi cần can thiệp Production, migration, secret, tài khoản hoặc phục hồi dữ liệu, phải thực hiện qua
quy trình vận hành có xác nhận; không sửa trực tiếp database.
