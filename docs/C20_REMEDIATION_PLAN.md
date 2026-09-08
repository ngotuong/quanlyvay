# C20 — Khắc phục audit và nâng cấp UI/UX

Trạng thái: `COMPLETED` (nghiệm thu local ngày 2026-09-08).
Ngày lập: 2026-09-07. Last completed: C20. Chưa có checkpoint kế tiếp.

## 1. Mục tiêu và quyết định sản phẩm

Khắc phục các lỗi đã biết trong audit 2026-09-06, làm các thao tác tiền rõ ràng và chính xác,
hoàn thiện quyền riêng tư, điều hướng mobile, accessibility và trải nghiệm biểu mẫu.

Theo yêu cầu mới nhất của người dùng, **loại bỏ toàn bộ VietQR/tạo phiếu**, gồm QR, phiếu văn
bản, nút sao chép phiếu và request đến dịch vụ tạo QR. Không xây lại hoặc thay bằng tính năng
thanh toán khác. Giữ form ghi nhận lãi/gốc và lịch sử nghiệp vụ.

Giữ phong cách fintech hiện tại, tiếng Việt, Inter, phân biệt cho vay/đi vay bằng chữ và icon,
bốn tab chi tiết khoản vay và filter theo URL. Nâng cấp ưu tiên thao tác và khả năng đọc,
không thay thương hiệu hay thêm dashboard/biểu đồ không có nhu cầu nghiệp vụ.

## 2. Phạm vi và cổng thực hiện

- Khi được duyệt C20, chuyển context/roadmap sang `IN_PROGRESS` đồng thời trước khi sửa code.
- Được sửa web, domain contract, SQL migration mới, Apps Script source, test và tài liệu trong
  repository để đạt các tiêu chí dưới đây. Không sửa migration lịch sử để thay đổi schema đã áp.
- Được chuẩn bị/chạy môi trường test local, tạo tài khoản và dữ liệu giả qua test harness.
  Chỉ reset database đã xác minh dành riêng cho test; phải có kiểm tra fail-closed target local,
  không dùng dữ liệu thật hoặc reset instance local hiện hữu chưa rõ mục đích. Nếu cần cách ly,
  dùng cấu hình project/container/port riêng, thư mục cấu hình trong repository và không commit secret.
- Được dùng công cụ/skill UI/UX để thiết kế và QA các màn hình trong phạm vi. Không tự thuê agent
  song song khi chưa có yêu cầu riêng.
- **Không thuộc C20:** migration remote, deploy Preview/Production, đổi alias/domain/secret,
  clasp push/deploy, thay Google Sheet/Drive/trigger thật, git push hoặc PR. Kế hoạch bàn giao phải
  liệt kê thứ tự migration/deploy/Apps Script cần thiết; thực thi remote cần phê duyệt riêng.
- Không đổi công thức tính lãi, chính sách mật khẩu, vai trò, dữ liệu tài chính thật, nền tảng
  database hoặc hướng sync. Nếu phát hiện cần thay kiến trúc/nghiệp vụ, trình phạm vi mới.

## 3. Tiêu chí nghiệm thu các lỗi đã biết

| ID audit | Phạm vi sửa | Điều kiện nghiệm thu |
|---|---|---|
| F01, F03 | Gỡ VietQR/tạo phiếu | Không còn component, import, CTA, clipboard phiếu hoặc request QR trong code chạy; form đóng lãi vẫn nhập/sửa/ghi đúng tiền; tài liệu audit lịch sử có thể giữ tên VietQR. |
| F02 | Quyền riêng tư xuyên giao diện | Che tiền trên dashboard, danh sách, bốn tab khoản vay, chi phí, thông báo trong app và audit có dữ liệu tiền; không lộ qua title, tooltip hay accessible name; reload và chuyển route không chớp số tiền khi đã bật privacy. |
| F04 | Tài khoản cá nhân trên mobile | OWNER/EDITOR/VIEWER đều tìm được đổi mật khẩu và đăng xuất trên mobile/desktop; quyền quản trị tài khoản vẫn chỉ OWNER; đăng xuất kết thúc phiên test và quay login. |
| F05 | Tương phản và semantic tokens | Chữ nút đang hoạt động đạt 4,5:1 với chữ thường, 3:1 với chữ lớn; kiểm tra primary/danger/link/badge ở light/dark và hover/focus; không dùng màu chữ trạng thái làm nền nút mà thiếu on-color phù hợp. |
| F06 | Tổng chi phí và dữ liệu nhiều trang | Tổng/phân bổ do PostgreSQL trả cho toàn bộ phạm vi lọc; độc lập page đang xem; reversal xác định ở server kể cả khác page. Danh sách chi phí, đối tác và lịch sử không mất bản ghi do giới hạn API. |
| F07 | Contract tiền/rate chính xác | Money/bigint và decimal cần chính xác được serialize dạng text từ DB/API; hiển thị, form mặc định và tổng không đi qua Number làm mất chữ số; test trên safe integer đến giới hạn hợp lệ từng nghiệp vụ. |
| F08 | Validation và phản hồi form | Mọi field error server có vị trí hiển thị liên kết với input; aria-invalid/describedby, focus lỗi đầu, thông báo nguyên nhân/hướng sửa; form giữ giá trị khi submit lỗi và có pending state. |
| F09 | Xóa đối tác có phản hồi | Xử lý RPC error, pending, thành công và trường hợp đối tác có lịch sử; không báo thành công im lặng hay xóa lịch sử vay. Test chỉ dùng đối tác giả. |
| F10 | Xác nhận tất toán theo ngày | Preview gốc/lãi/tổng/ngày lấy từ RPC; đổi ngày phải cập nhật preview; không submit khi preview lỗi/đang tải. Server khóa và tính lại, yêu cầu xác nhận lại nếu số tiền khác preview đã xác nhận. |
| F11 | Truy cập toàn bộ thông báo | Có phân trang/xem thêm và lọc chưa đọc; unread cũ ngoài 100 mục đầu vẫn truy cập/xử lý được; badge và action đánh dấu đọc dùng scope rõ ràng, nhất quán. |
| F12 | Phục hồi lỗi tải/phiên/mạng | Phân biệt không tồn tại với lỗi truy vấn; UI tiếng Việt có thử lại/quay lại; xử lý mất phiên rõ ràng; lỗi không lộ raw DB error/secret; không giả thông báo thành công khi request thất bại. |

Quyền riêng tư là chế độ trình bày, không phải phân quyền và không hứa xóa dữ liệu khỏi network
hay devtools. Khi đang che, muốn nhập/xem số tiền để ghi nghiệp vụ phải có thao tác chủ động
hiện tiền và trạng thái rõ; không âm thầm lộ số tiền trong input/dialog. Nội dung text tự do
có thể chứa tiền nên che nguyên khối nhạy cảm khi cần, không dựa vào regex đoán số tiền.
Không sửa nội dung Web Push đã gửi trên màn hình khóa; làm rõ giới hạn này trong hướng dẫn.

## 4. Nâng cấp UI/UX

1. **Login mobile:** rút intro, bỏ tiêu đề lặp, đưa form lên sớm; ở 375×667 với bàn phím đóng,
   input và CTA chính truy cập được không bị fixed UI che. Có hướng dẫn liên hệ OWNER khi quên
   mật khẩu, giữ mô hình tài khoản được cấp sẵn.
2. **Tạo/chỉnh khoản vay:** ưu tiên hướng → đối tác → gốc → ngày → lãi; nhãn/ghi chú/tùy chọn
   ít dùng ở nhóm phụ. Chỉ hiện và yêu cầu số ngày khi có đáo hạn; đổi lựa chọn không giữ lỗi
   của field đang ẩn. Chu kỳ lãi và giới hạn ngày nhắc luôn đồng bộ.
3. **Đối tác:** tìm/chọn bằng bàn phím và mobile; thêm nhanh ngay luồng tạo khoản, chọn đối tác
   vừa tạo và giữ form khoản vay. Không lưu bản nháp tài chính bền vững trên localStorage nếu
   chưa có thiết kế riêng; giữ state trong luồng và cảnh báo rời form có thay đổi.
4. **VND input:** paste/chỉnh giữa chuỗi không nhảy con trỏ ngoài ý muốn; từ chối chuỗi âm hoặc
   định dạng mơ hồ có thể đổi nghĩa; server kiểm tra cùng quy tắc chuẩn hóa.
5. **Navigation và dialog:** mobile giữ tối đa 5 mục chính gồm “Thêm”; menu đóng khi chọn route,
   click ngoài hoặc Escape; dialog có focus đúng, đóng/trả focus, vùng scroll và cảnh báo dữ liệu
   chưa lưu. Loading không cho ghi trùng và thành công có phản hồi rõ.
6. **Typography/layout:** input/select tối thiểu 16px, vùng chạm hành động chính tối thiểu 44×44px,
   nhãn dễ đọc, khoảng cách theo token; không tràn toàn trang ở 375/768/1024/1440 và landscape.
   Bảng rộng có vùng scroll riêng; không dùng clip để che mất hành động/nội dung.
7. **Primitive và CSS:** thống nhất Field, button, dialog, privacy amount; loại override/màu trực
   tiếp gây lệch ở component sửa; tách CSS playground/vùng độc lập khi phù hợp, không rewrite
   toàn bộ CSS nếu không cần. Giữ responsive, tabular numbers và reduced-motion.

## 5. Rủi ro bổ sung của audit

Các mục này cũng phải có kết luận bằng chứng trong C20; không được bỏ qua vì không có mã F.

- **List RPC:** phân trang server và sort ổn định, tránh trả tất cả calculation periods cho card;
  giữ số đếm/filter đúng. Đo baseline và sau sửa với 1.000 khoản giả, gồm khoản dài hạn/nhiều
  giao dịch; ghi dữ liệu test, thời gian và payload. Không thêm cache làm số liệu stale hoặc
  đổi nguồn tính lãi. Tối ưu trong kiến trúc hiện tại; thay kiến trúc phải được duyệt riêng.
- **Export đồng thời:** thêm cơ chế phát hiện snapshot đổi trong khi đọc, retry có giới hạn
  hoặc snapshot nhất quán; không trả payload mixed-version như một bản đối chiếu hoàn chỉnh.
  Kiểm thử mutation giữa dataset/page, lỗi giữa chừng và cursor unchanged. Tối ưu lượt unchanged
  chỉ khi vẫn phát hiện được mọi thay đổi liên quan; schema contract đổi phải tương thích client.
- **Snapshot/Sync Apps Script:** dùng cùng khóa cho sync/snapshot/restore có thể đụng workbook;
  snapshot chỉ từ sync hoàn chỉnh. LAST_SYNC_AT phản ánh lần thành công, không tiến lên khi ghi
  sheet lỗi. Test bằng mocks local, không gọi Google services thật.
- **Push worker:** timeout mỗi lần gửi và giới hạn thời gian/batch có thể kiểm thử; concurrency
  hữu hạn nếu cần, bảo toàn claim/lease/idempotency và retry. Mô phỏng endpoint chậm/lỗi,
  complete_delivery lỗi và queue còn tồn; không gửi Web Push thật từ bài test.
- **Tài liệu/test:** sửa drift navigation/port, cập nhật design system, workflow, Auth, Push,
  Sync và hướng dẫn liên quan; bổ sung regression vào các suite đang có. Không xem giới hạn
  runtime Production chưa đo là lỗi đã được tái hiện.

Mỗi mục phải được ghi là đã sửa + bằng chứng, không tái hiện + lý do, hoặc còn mở. Không đánh
dấu C20 COMPLETED khi lỗi trong phạm vi còn mở; muốn hoãn phải được người dùng chấp thuận đổi
phạm vi và cập nhật context/roadmap.

## 6. Thứ tự thực hiện trong C20

1. Xác minh lại phát hiện trên code hiện tại; chuẩn bị môi trường test riêng và ghi baseline.
2. Gỡ VietQR/phiếu; chuẩn hóa money contract, privacy và xử lý input.
3. Migration/RPC aggregate, pagination và preview tất toán; sửa thông báo/error handling.
4. Hoàn thiện mobile account, form/dialog, token tương phản và UI/UX ở mục 4.
5. Củng cố export/snapshot/Push và hiệu năng trong phạm vi mục 5; cập nhật docs/test.
6. Chạy đầy đủ gate, QA runtime có đăng nhập local với dữ liệu giả, lập bảng đóng phát hiện.

Đây là các bước trong cùng C20, không phải checkpoint tự động phê duyệt tiếp nối.

## 7. Test gate và bằng chứng bắt buộc

Chạy các gate đang tồn tại: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
`pnpm test:auth`, `pnpm test:e2e`, `supabase db lint --level warning`, `supabase test db`,
`git diff --check`. Auth/DB/E2E phải trỏ test local riêng; kiểm tra target trước mọi reset.

Ma trận nghiệm thu:

- OWNER/EDITOR/VIEWER: quyền xem/ghi, account menu, lỗi thiếu quyền, đăng xuất và đổi mật khẩu
  bằng tài khoản giả trong test harness; không dùng credential thật.
- Login, dashboard, loans/list/new/detail bốn tab, counterparties, expenses, notifications,
  account/settings, audit: desktop/mobile; light/dark; keyboard/focus; reduced motion;
  text zoom 200%; mobile landscape; form với bàn phím không che CTA.
- Snapshot/ảnh QA trước–sau trên dữ liệu giả, kiểm tra contrast bằng màu computed và không
  tràn ngang. Kiểm thử browser có sẵn; ghi rõ mô phỏng viewport khác kiểm thử iOS/PWA thật.
  Thiết bị thật chưa kiểm tra phải ghi là giới hạn, không suy ra đã PASS.
- Dữ liệu: trên 1.000 expense/reversal và đối tác; history nhiều page; trên 100 notifications
  với unread cũ; bigint > 2^53; settlement preview đổi ngày và concurrent mutation.
- Resilience: lỗi DB/network/clipboard không còn liên quan sau gỡ phiếu; form retry,
  privacy trước hydration, export concurrent changes, snapshot lock và Push lease/timeout.

Không dùng bộ gate cũ trong audit làm kết quả C20; test bắt buộc chưa chạy hoặc chưa đạt thì
không COMPLETED. Bổ sung test hành vi có ý nghĩa cho regression, không chỉ so khớp source.

## 8. Bàn giao và hoàn tất

- Cập nhật PROJECT_CONTEXT và roadmap cùng thay đổi: C20 COMPLETED, last completed C20,
  next NONE nếu chưa có checkpoint mới; ghi test counts, hạn chế QA, recent changes và blocker.
- Bảng đóng F01–F12 và rủi ro bổ sung kèm file/test/evidence; F01/F03 ghi “loại bỏ chức năng
  theo yêu cầu” thay vì tuyên bố đã sửa QR. Giữ audit gốc là bằng chứng lịch sử.
- Nêu rõ migration mới và thay đổi contract/Apps Script/worker; thứ tự rollout và rollback dự
  kiến, không thực thi remote. “Hoàn tất C20” chỉ có nghĩa nghiệm thu local, chưa lên Production.
- Có thể tạo local commit `C20: khắc phục audit và nâng cấp UI/UX` khi mọi gate đã đạt; không push.
- Báo kết quả tiếng Việt và dừng để người dùng quyết định rollout/checkpoint kế tiếp.
