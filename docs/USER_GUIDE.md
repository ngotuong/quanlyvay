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
| OWNER | Xem và nhập nghiệp vụ, quản lý tài khoản, xem lịch sử chỉnh sửa |
| EDITOR | Xem và nhập nghiệp vụ, không quản lý tài khoản hoặc xem audit log |
| VIEWER | Chỉ xem dữ liệu; không thấy biểu mẫu thay đổi dữ liệu |

OWNER quản lý các tài khoản EDITOR/VIEWER tại **Cài đặt**. Ứng dụng không áp giới hạn số lượng tài khoản.

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

Các ô tiền VND tự chèn dấu chấm phân cách hàng nghìn trong lúc nhập, ví dụ `200000000` sẽ hiển thị
thành `200.000.000`. Khi tạo khoản mới, hệ thống không chọn sẵn **Cho vay** hay **Đi vay**; phải chọn
rõ hướng để tránh đưa khoản đi vay vào nhầm nhóm cho vay.

### Bước 3 — Ghi nhận phát sinh

Mở chi tiết khoản vay. Trang được chia thành bốn tab:

- **Tổng quan**: hero cho biết dư gốc, lãi/hạn kế tiếp, trạng thái và nút ghi giao dịch; số liệu lịch
  sử nằm ở dải phụ bên dưới.
- **Các kỳ lãi**: danh sách kỳ và nút đóng lãi từng kỳ; dưới ba kỳ dùng summary gọn, từ ba kỳ mới
  hiện biểu đồ đối chiếu.
- **Lịch sử**: giao dịch, thay đổi lãi suất, nợ xấu, tất toán và hoàn tác.
- **Thông tin & thiết lập**: điều khoản, chi phí, đổi lãi suất, nợ xấu, tất toán và sửa dữ liệu.

Các thao tác nghiệp vụ gồm:

- **Thanh toán**: chọn tiền lãi hoặc tiền gốc, ngày và số tiền.
- **Chi phí**: nhập ngày, số tiền, nhóm chi phí và ghi chú.
- **Trạng thái/lãi suất**: đổi lãi suất, chuyển nợ xấu/ngừng lãi hoặc bật lại tính lãi.
- **Tất toán**: chọn ngày tất toán khi nghĩa vụ đã kết thúc.

Để nhập nhanh lịch sử chi tiết, tại **Các kỳ lãi** chọn **Ghi nhận đóng lãi**. Hệ thống điền sẵn số
dư lãi còn phải đóng đến cuối kỳ và ngày dự kiến thu; có thể sửa số tiền, ngày thực tế và ghi chú.
Nếu ngày được sửa ra ngoài khoảng của card, giao diện sẽ cảnh báo vì engine luôn hiển thị khoản tiền
ở kỳ chứa ngày giao dịch thực tế. Card có số dư lãi bằng hoặc nhỏ hơn 0 sẽ hiện **Đã đóng đủ**.

Với khoản cũ chỉ cần số dư hiện tại và tổng lãi lịch sử, vẫn nên dùng **Khởi tạo khoản cũ** thay vì
nhập lại từng kỳ. Nút trên card phù hợp khi cần giữ chính xác lịch sử từng lần đóng lãi.

Nếu đã tất toán nhầm, mở lại chi tiết và chọn **Hoàn tác toàn bộ tất toán**. Nhập ngày, lý do, đánh
dấu xác nhận rồi gửi. Hệ thống mở lại khoản vay bằng cách đảo đúng các khoản gốc/lãi do lần tất toán
tạo ra; không xóa lịch sử. Không dùng **Đảo giao dịch** riêng lẻ cho các thành phần này.

Ngày hiệu lực rất quan trọng vì bộ máy tính lãi chia lịch sử theo ngày. Nếu nhập sai giao dịch tài
chính, dùng **Đảo giao dịch** và ghi lý do; không xóa hay sửa trực tiếp giao dịch cũ.

Khoản vay mới mặc định **không đáo hạn**: hệ thống tiếp tục tạo kỳ lãi 15/30 ngày và tính ngày đóng
lãi tiếp theo cho tới khi tất toán. Chỉ bật **Có đáo hạn** khi hai bên đã hẹn ngày hoàn gốc cụ thể;
chỉ các khoản này mới có thể mang trạng thái `Quá hạn` do đã qua ngày đáo hạn.

Khi giảm hoặc đổi lãi suất, các ngày trước ngày hiệu lực vẫn giữ mức cũ. Để bảo toàn trọn vẹn một kỳ
đã đóng, chọn ngày hiệu lực là ngày đầu tiên của kỳ kế tiếp; nếu chọn một ngày nằm trong kỳ cũ thì
phần từ ngày đó trở đi sẽ được tính lại theo mức mới.

Với khoản theo sổ cũ, nhập **Nhắc thu lãi sớm hơn** bằng `1` nếu vẫn thu đủ tiền của kỳ 30 ngày nhưng
nhắc trước ngày cuối kỳ một ngày; khoản mới để `0`. Trang chi tiết hiển thị riêng ngày nhắc và ngày
kết thúc kỳ, nên không đổi chu kỳ thành 29 ngày.

Khoản cũ vừa tạo và chưa có giao dịch có thể mở **Khởi tạo số dư khoản vay cũ / nợ xấu** để nhập một
lần ngày chốt, dư gốc, tổng lãi đã thu và **ngày cuối cùng còn tính lãi**. Ngày này vẫn tính lãi;
hệ thống ngừng phát sinh từ ngày kế tiếp. Vì vậy kỳ cuối chưa đóng nhưng vẫn phải thu đủ lãi cần dùng
ngày kết thúc kỳ làm mốc, không dùng ngày bắt đầu kỳ. Hệ thống tạo số liệu tổng hợp có audit, không
yêu cầu nhập giả từng kỳ và không làm phồng dòng tiền của kỳ đang xem. Nếu cần báo cáo dòng tiền
lịch sử chính xác từng ngày thì vẫn phải nhập các giao dịch chi tiết.

### Bước 4 — Chi phí chung

Mở **Chi phí** để nhập các khoản không gắn riêng với một khoản vay, ví dụ chi phí đi lại hoặc vận
hành. Chi phí nhập sai cũng được sửa bằng thao tác đảo.

## 4. Đọc Dashboard

Dashboard lấy số liệu trực tiếp từ sổ giao dịch. Chọn **Tháng này**, **Tháng trước**, **Năm nay**,
**6 tháng** hoặc nhập khoảng ngày tùy chỉnh. Các chỉ số số dư được tính tại ngày cuối khoảng; các chỉ
số lãi, chi phí và dòng tiền chỉ tính trong khoảng:

- Cho vay đang hoạt động, nợ xấu phải thu và tổng vốn cho vay chưa thu hồi được tách riêng.
- **Lãi ròng thực thu**: tiền lãi đã thực thu trừ lãi đã thực trả và chi phí trong khoảng.
- **Lãi ròng phát sinh**: lãi cho vay phát sinh trừ lãi đi vay phát sinh và chi phí trong khoảng.
- Lãi đã thu, lãi đã trả, chi phí khác và lãi dự kiến kỳ tới.
- Biểu đồ phát sinh/thanh toán lãi, cơ cấu dư nợ và mức tập trung theo đối tác.
- Dòng tiền vào/ra theo tháng trong khoảng đã chọn.
- **Cần xử lý** tách rõ quá hạn gốc và lãi cần thu/trả trong 30 ngày. Khoản đã đóng đủ hoặc ứng
  trước không còn xuất hiện; khoản đóng một phần hiện đúng số tiền còn lại.

Chạm vào một khoản trong danh sách đến hạn để mở chi tiết và xử lý nghiệp vụ.

Trang **Khoản vay** cho phép tìm theo tên khoản hoặc đối tác; lọc Cho vay/Đi vay, trạng thái, ngày
giải ngân; và sắp xếp theo ngày, dư nợ hoặc tên. Chỉ các filter đang áp dụng mới hiện thành chip có
thể xóa; bộ lọc được giữ trên URL. Mỗi dòng ưu tiên dư nợ và hành động kế tiếp, còn tổng lãi đã
thu/trả nằm trong chi tiết. Dùng **Xóa tất cả** để quay lại toàn bộ danh sách.

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

## 6. Quản lý tài khoản

OWNER mở **Cài đặt** để:

- Tạo các tài khoản EDITOR hoặc VIEWER.
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
- Backup database có khả năng phục hồi là logical dump/backup platform riêng, có checksum và kiểm
  thử restore; xem `docs/BACKUP_RESTORE.md`. Không coi Google Sheet là backup Supabase.

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
