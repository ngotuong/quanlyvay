# C41 — Hợp nhất nhắc quá hạn, mở nhanh thanh toán và chuẩn hóa CTA khoản vay

Phê duyệt: người dùng phê duyệt trực tiếp ngày 2026-09-16. Trạng thái: `COMPLETED` local.

## Bối cảnh

Người dùng yêu cầu ngày 2026-09-16:

1. Nhắc lãi/gốc quá hạn không tạo thêm card gây nhầm lẫn; card của cùng nghĩa vụ phải được cập nhật.
2. Chạm thông báo thu/trả lãi phải mở thẳng form giao dịch với số tiền cần thu/trả.
3. Trang Khoản vay chỉ giữ một nút **Tạo khoản vay** màu xanh và dùng cùng kiểu trên mobile.

Rà soát hiện trạng xác nhận `generate_due_notifications()` đang tạo một notification mới mỗi ngày
do idempotency key chứa ngày chạy. Notification Center hiển thị trực tiếp mọi bản ghi; thao tác mở
chỉ điều hướng đến trang khoản vay. Trang Khoản vay đồng thời có CTA trong header responsive và CTA
trong nội dung ở một số breakpoint.

## Phạm vi dự kiến

### 1. Một card đang hoạt động cho mỗi nghĩa vụ nhắc hạn

- Tạo migration để nhận diện một luồng nhắc ổn định theo người dùng, khoản vay, loại nhắc và kỳ
  nghĩa vụ:
  - lãi: ngày kết thúc kỳ lãi;
  - gốc quá hạn: ngày đáo hạn khoản vay.
- Khi chuyển từ đến hạn sang quá hạn hoặc số ngày/số tiền thay đổi, cập nhật card đang hoạt động,
  `notification_date`, nội dung và trạng thái chưa đọc; không tạo thêm card cho cùng nghĩa vụ.
- Khi sang kỳ lãi mới, tạo luồng mới để không ghi đè lịch sử của kỳ đã hoàn tất.
- Backfill dữ liệu cũ theo hướng giữ bản mới nhất làm card hiện hành và đánh dấu các bản cũ là đã
  được thay thế; không xóa lịch sử notification hoặc delivery.
- Web Push vẫn có thể gửi lại theo từng ngày/phiên bản card. Delivery phải có khóa occurrence/version
  riêng để giữ idempotency và lịch sử gửi, không xóa delivery cũ để tái sử dụng khóa.
- Notification Center, bộ đếm chưa đọc, phân trang và đánh dấu đã đọc chỉ tính card hiện hành.

### 2. Mở form thu/trả lãi từ Notification Center và Push

- Khi mở `INTEREST_DUE`, đánh dấu card đã đọc rồi điều hướng tới tab Tổng quan của khoản vay và mở
  BottomSheet **Ghi giao dịch**.
- Chọn sẵn loại **Tiền lãi** và điền số tiền lãi còn phải thu/trả được tính authoritative tại thời
  điểm mở; không parse số tiền từ chuỗi hiển thị và không cho URL quyết định số tiền quyết toán.
- Giữ ngày giao dịch mặc định theo `Asia/Ho_Chi_Minh`; người dùng vẫn phải bấm **Ghi nhận** để tạo
  giao dịch. Không tự động thu/trả khi chỉ chạm thông báo.
- Push `INTEREST_DUE` dùng cùng deep link. `LOAN_OVERDUE`, khoản đã tất toán, số dư bằng 0 hoặc tài
  khoản VIEWER chỉ mở trang chi tiết phù hợp và không tạo form ghi dữ liệu sai quyền/trạng thái.
- Giữ focus, nhãn form, phản hồi submit và nút chạm tối thiểu 44 px cho bàn phím/screen reader/mobile.

### 3. Một CTA Tạo khoản vay trên mọi breakpoint

- Gỡ CTA `header-create-link` khỏi mobile/tablet header và bỏ component chỉ còn phục vụ CTA trùng.
- Giữ CTA màu xanh trong nội dung trang Khoản vay, hiển thị cho OWNER/EDITOR trên cả mobile và
  desktop; VIEWER không thấy CTA.
- Duy trì icon Lucide, focus ring, pressed state, touch target tối thiểu 44 px, không tràn ngang tại
  320/375 px và landscape.
- Empty state vẫn có đường dẫn tạo khoản vay hợp lệ khi danh sách thực sự trống; không tính đây là
  CTA trùng trên trạng thái danh sách thông thường.

## Ngoài phạm vi

- Không tự động ghi giao dịch khi mở notification.
- Không đổi công thức lãi, số tiền authoritative, RPC tài chính hoặc xóa lịch sử tài chính/audit.
- Không thay giờ/scheduler/VAPID/secret, không tạo tài khoản test mới.
- Không chạy migration remote, deploy Preview/Production, thao tác Google resources hoặc Git push
  trong checkpoint local này.
- Không tiếp tục C38; checkpoint quan sát Push vẫn tạm dừng riêng.

## Acceptance criteria

- Cùng một nghĩa vụ quá hạn chỉ có một card hiện hành; card được cập nhật đúng số ngày và số tiền,
  không làm tăng bộ đếm/card mỗi ngày.
- Kỳ nghĩa vụ mới vẫn tạo card mới; lịch sử notification và Push delivery cũ còn truy vết được.
- Push lặp lại đúng idempotency theo occurrence và không gửi trùng trong cùng occurrence.
- Chạm notification lãi trong tab Thông báo hoặc Push mở đúng khoản vay, BottomSheet, loại tiền và
  số tiền authoritative; không tạo giao dịch trước khi xác nhận.
- Trang Khoản vay có đúng một CTA màu xanh ở trạng thái danh sách có dữ liệu trên desktop, tablet và
  mobile; VIEWER không thấy CTA.
- Test database bao phủ due → overdue → cập nhật hằng ngày → thanh toán → kỳ kế tiếp; unit/E2E bao
  phủ deep link, phân quyền, read state, mobile 320/375 px, landscape, dark/light và keyboard.
- Đạt `git diff --check`, lint, typecheck, unit/script tests, build, Auth, E2E, DB lint và pgTAP áp
  dụng cho checkpoint.

## Rủi ro và biện pháp

- Cập nhật cùng card nhưng vẫn Push lặp lại có thể làm mất idempotency nếu dùng lại delivery cũ:
  version/occurrence được đưa vào khóa delivery và lịch sử không bị xóa.
- Số tiền trong notification có thể cũ sau thanh toán một phần: form luôn lấy lại số dư
  authoritative khi mở.
- Backfill có thể làm thay đổi unread count: migration phải xác định duy nhất card mới nhất, đánh dấu
  bản cũ đã thay thế và có pgTAP kiểm chứng trước khi rollout remote.

## Kết quả hoàn tất

- Migration thứ 32 bổ sung khóa luồng nghĩa vụ, revision và trạng thái superseded; backfill giữ card
  mới nhất làm hiện hành, không xóa notification hoặc Push delivery cũ.
- Bộ sinh notification cập nhật card hiện hành và chỉ tăng revision khi nội dung/ngày thay đổi;
  delivery được idempotent theo notification, subscription và revision.
- Notification Center chỉ đọc card hiện hành. Notification lãi và Push tương ứng mở BottomSheet
  giao dịch, chọn sẵn **Tiền lãi** và lấy số dư authoritative tại thời điểm mở; người dùng vẫn phải
  xác nhận **Ghi nhận**.
- Trang Khoản vay chỉ còn một CTA **Tạo khoản vay** màu xanh cho OWNER/EDITOR trên mọi breakpoint;
  touch target tối thiểu 44 px và VIEWER không thấy CTA.
- Gate ngày 2026-09-16 đạt: `git diff --check`, lint, typecheck, 74/74 unit/script tests, build,
  Auth 6/6, E2E 21/21, reset sạch 32 migration, DB lint sạch và pgTAP 455/455.
- Không áp migration lên Supabase dùng chung, không deploy Preview/Production, không thay secret,
  dữ liệu tài chính, tài khoản, Google resources hoặc Git remote/push trong C41.
