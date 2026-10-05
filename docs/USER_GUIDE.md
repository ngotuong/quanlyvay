# Hướng dẫn sử dụng Quản Lý Vay Cá Nhân

## Thay đổi giao diện hiện hành

- Đã bỏ VietQR, tạo phiếu văn bản và sao chép phiếu; ghi nhận đóng lãi/gốc vẫn hoạt động.
- Nút hình mắt che tiền và nội dung nhạy cảm trên các trang. Khi chưa chọn, mặc định che; bấm
  “Hiển thị số tiền” trước khi nhập giao dịch. Lựa chọn được giữ khi tải lại trang.
- Đây là chế độ trình bày, không phải phân quyền hoặc bảo vệ dữ liệu trong devtools/network.
  Không che ngược nội dung Web Push đã gửi trên màn hình khóa; kiểm soát preview thông báo trong cài đặt thiết bị.
- Mọi vai trò mở “Thêm” → “Cài đặt” trên mobile để xem tài khoản, đổi mật khẩu hoặc đăng xuất.
- Form tạo khoản cho phép tìm và thêm đối tác ngay tại chỗ. Nhập tiền bằng chữ số hoặc dấu chấm
  hàng nghìn đầy đủ; không dùng số âm, dấu phẩy hay phần thập phân. Bản nháp không lưu bền vững.
- Tất toán hiển thị gốc/lãi/tổng theo ngày chọn. Nếu số liệu thay đổi, tải lại bảng và xác nhận lại.
- Danh sách dùng phân trang; tổng chi phí bao phủ mọi trang và loại chi phí đã đảo. Khi Chi phí
  có nhiều trang, có nút chuyển trang gần đầu danh sách và ở cuối.
- Thông báo có lọc “Chưa đọc”; “Đánh dấu đã đọc” áp dụng toàn bộ thông báo chưa đọc của tài khoản.

## 1. Truy cập và đăng nhập

Mở Production tại:

`https://tindung.vercel.app`

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

- **Tổng quan**: hero cho biết dư gốc, lãi/hạn kế tiếp và trạng thái; các nút **Ghi giao dịch**,
  **Giảm gốc & mở kỳ mới** và nút đỏ **Tất toán** mở đúng biểu mẫu riêng. Số liệu lịch sử nằm ở dải phụ bên
  dưới.
- **Các kỳ lãi**: danh sách kỳ và nút đóng lãi từng kỳ; dưới ba kỳ dùng summary gọn, từ ba kỳ mới
  hiện biểu đồ đối chiếu.
- **Lịch sử**: giao dịch, thay đổi lãi suất, nợ xấu, tất toán và hoàn tác.
- **Thông tin & thiết lập**: điều khoản hiện tại, chỉnh sửa thông tin và các điều chỉnh nghiệp vụ.
  Dữ liệu cũ/sửa sai nằm trong vùng nâng cao; hoàn tác tất toán nằm riêng trong vùng nguy hiểm.

Các thao tác nghiệp vụ gồm:

- **Thanh toán**: chọn tiền lãi hoặc tiền gốc, ngày và số tiền.
- **Giảm gốc & mở kỳ mới**: dùng khi thực trả một phần gốc và muốn chốt kỳ cũ. Chọn ngày D và số
  gốc thực trả; hệ thống tự tính lãi đến D-1, hiển thị tổng tiền thực trả, dư gốc mới và kỳ mới từ D.
  Kiểm tra bản xem trước, đánh dấu xác nhận rồi mới ghi. Không cần tất toán khoản cũ và tạo khoản mới.
- **Chi phí**: nhập ngày, số tiền, nhóm chi phí và ghi chú.
- **Trạng thái/lãi suất**: đổi lãi suất, chuyển nợ xấu/ngừng lãi hoặc bật lại tính lãi.
- **Tất toán**: ở tab **Tổng quan**, chọn nút đỏ **Tất toán**, kiểm tra bản xem trước nghĩa vụ rồi
  xác nhận ngày tất toán.

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

Mở **Phân bổ danh mục chi phí** khi cần xem cơ cấu chi phí. Khi che tiền, ứng dụng cũng che tỷ trọng
và thanh phân bổ. Tỷ trọng hiển thị được làm tròn tới 0,01 điểm phần trăm; khoản rất nhỏ có thể hiện
0% và tổng tỷ trọng làm tròn không nhất thiết bằng 100%. Số tiền gốc không bị thay đổi.

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
- **Lịch Dự Kiến** liệt kê quá hạn gốc và lãi cần thu/trả trong 30 ngày. Khoản đã đóng đủ hoặc ứng
  trước không còn xuất hiện; khoản đóng một phần hiện đúng số tiền còn lại.

Các card dư nợ và lãi ròng nằm trên **Việc cần xử lý**. Bấm **Xem tất cả** ở header để mở
toàn bộ tập công việc; **Thu gọn** quay về năm việc. Chạm một khoản để mở chi tiết và xử lý.

Trang **Khoản vay** cho phép tìm theo tên khoản hoặc đối tác; lọc Cho vay/Đi vay, trạng thái, ngày
giải ngân; và sắp xếp theo ngày, dư nợ hoặc tên. Chỉ các filter đang áp dụng mới hiện thành chip có
thể xóa; bộ lọc được giữ trên URL. Mỗi dòng ưu tiên dư nợ và hành động kế tiếp, còn tổng lãi đã
thu/trả nằm trong chi tiết. Dùng **Xóa tất cả** để quay lại toàn bộ danh sách.

## 5. Thông báo và cài PWA

1. Mở **Thông báo** bằng Chrome hoặc Safari.
2. Bật công tắc **Thông báo trên thiết bị** và cho phép trình duyệt gửi thông báo.
3. Chọn **Giờ nhận thông báo**; thay đổi được lưu ngay.
4. Giữ quyền notification được bật trong cài đặt của trình duyệt/hệ điều hành.

Hệ thống tạo nhắc theo ngày nhắc của kỳ, rồi lặp mỗi ngày từ ngày đến hạn cho tới khi lãi đến hạn
được thanh toán đủ. Khoản quá hạn gốc cũng được nhắc hằng ngày. Mỗi thiết bị có subscription riêng;
thiết bị mới không nhận lại các Push đã phát trước lúc đăng ký. Nếu một ngày có nhiều khoản đến lịch,
mỗi khoản vẫn tạo và gửi một thông báo riêng; hệ điều hành có thể nhóm chúng về mặt trình bày. Trong
Notification Center, bấm **Đánh dấu đã đọc** để xử lý các mục chưa đọc.

Để dùng như ứng dụng:

- Chrome/Edge: dùng **Install app/Cài đặt ứng dụng** trong thanh địa chỉ hoặc menu trình duyệt.
- Safari trên iPhone/iPad: **Chia sẻ** → **Thêm vào Màn hình chính**.

Ứng dụng không lưu cache dữ liệu tài chính để dùng ngoại tuyến. Cần kết nối mạng khi xem hoặc nhập
nghiệp vụ.

## 6. Quản lý tài khoản

Mọi vai trò mở **Cài đặt** để xem tài khoản của mình, đổi mật khẩu và đăng xuất. Riêng OWNER còn có
thể:

- Tạo các tài khoản EDITOR hoặc VIEWER.
- Đổi tên hiển thị và vai trò.
- Vô hiệu hóa/kích hoạt lại tài khoản.
- Cấp mật khẩu tạm mới.

Trong **Giao diện**, chọn **Sáng**, **Tối** hoặc **Theo thiết bị**. Lựa chọn áp dụng ngay, không tải
lại trang và được nhớ trên trình duyệt cho từng địa chỉ web; Preview và Production có lựa chọn
riêng. Theo thiết bị tự cập nhật khi chế độ hệ điều hành thay đổi. Trên mobile, mở **Thêm → Cài đặt**.

Form quản lý tài khoản tự đóng sau khi lưu thành công và trả focus về nút mở. Trong lúc lưu,
hãy chờ kết quả; nếu lỗi, bản nháp được giữ để thử lại. Khi đóng một form đã sửa nhưng chưa lưu,
ứng dụng yêu cầu xác nhận bỏ bản nháp, kể cả form cấp mật khẩu tạm.

Người nhận mật khẩu tạm phải đổi mật khẩu ở lần đăng nhập tiếp theo. Không gửi mật khẩu qua kênh
công khai và không lưu mật khẩu trong GitHub hoặc Google Sheets.

## 7. Audit, Google Sheets và backup

- OWNER mở **Nhật ký hệ thống** để xem lịch sử với phân trang 25 bản ghi.
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
