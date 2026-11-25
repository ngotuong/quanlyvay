# C122 — Push và badge iPhone khi app đóng

Trạng thái: `IN_PROGRESS`, ngày 24/11/2026. OWNER đã phê duyệt trực tiếp phạm vi bên dưới.

## Chẩn đoán đã thực hiện

- OWNER dùng webapp đã cài ở Home Screen iPhone; không thấy thông báo trong Notification Center
  và không có badge vào giờ gửi. Khoảng 14:30 mở app mới thấy một mục chưa đọc và badge 1.
- Kiểm tra read-only trên đúng Production: job hourly hoạt động; response worker lúc 12:00 có
  `sent=2`, `failed=0`, `stateUpdateFailed=0`, `queueRemaining=false` cho hai provider hiện có.
  Với thông báo được chỉ định, Apple chấp nhận lúc khoảng 12:00:04, một lần thử, không lỗi.
  Thông báo đã được tạo từ 00:00. Không ghi tên, định danh khoản vay hoặc số tiền thật vào repo.
- SW công khai trên Production trả 200, khớp source local; có cập nhật badge trong push handler.
  Payload hiện chỉ có title/body/url/tag/badgeCount, chưa có fallback declarative.
- Không có receipt từ thiết bị; `SENT` chỉ chứng minh provider chấp nhận. Chưa xác định được Push
  bị chậm/mất trước handler, handler không chạy/thất bại hay hệ điều hành không hiển thị.
  Không có căn cứ quy kết nguyên nhân cụ thể hoặc tuyên bố sửa xong.
- Mở app đọc count và đặt badge là đường đồng bộ riêng, không chứng minh Push nền hoạt động.
- Không chạy runner/gửi thử, đổi Push/quyền/giờ nhận, migration, deploy hoặc ghi dữ liệu remote.

## Phạm vi đề xuất

1. Thêm Declarative Web Push theo tài liệu WebKit, gồm title/body, URL đích đúng Production,
   app badge và tag ổn định theo delivery/revision. Khi nền tảng hỗ trợ, fallback vẫn mô tả đủ
   thông báo và badge nếu JavaScript nền không thể hiển thị. Không hứa khắc phục mọi lỗi APNs.
2. Giữ tương thích SW và payload cũ trong quá trình rollout, cùng Chrome/nền tảng chưa hỗ trợ
   declarative. Một payload chỉ hiển thị một thông báo; không phát fallback và imperative trùng.
   Deep link ở cả hai đường phải mở đúng origin/app và khoản vay; URL receipt/tag không chứa
   secret hay dữ liệu tài chính. Chỉ dùng số chưa đọc authoritative, giữ idempotency/revision.
3. Bổ sung receipt tối thiểu để phân biệt provider accepted, handler chạy, kết quả showNotification
   và kết quả Badging API nếu API có sẵn. Receipt không phải bằng chứng người dùng đã thấy banner;
   không có receipt cũng không chứng minh fallback không hiển thị. Không gọi đó là trạng thái đọc.
   Thiết kế token giới hạn đúng delivery/subscription/revision, hạn dùng và quyền ghi; validate
   schema/kích thước/chống replay, không dùng cookie đăng nhập để nền hoạt động. Không đưa service
   role/CRON_SECRET/raw endpoint/khóa Push vào payload/log. Chỉ ghi metadata tối thiểu, có retention
   cụ thể trước triển khai. Lỗi receipt không được chặn hiển thị hoặc cập nhật badge.
4. Xác minh đăng ký Push của thiết bị và khả năng hỗ trợ tại origin ổn định; không suy nhận dạng
   thiết bị chỉ từ provider Apple. Không tự tắt/bật, đổi quyền hoặc đăng ký lại thiết bị khác.
   Chỉ yêu cầu OWNER thao tác nếu cần khôi phục subscription trên iPhone thật.
5. Không gửi lại khi thiếu receipt một cách tự động/mù, không thay giờ nhận, không tạo nhắc trùng,
   không đổi nghiệp vụ tính lãi, giao dịch, trạng thái đọc hoặc scheduler trong checkpoint này.

## Kiểm thử và phát hành trong phạm vi xin duyệt

- Local: diff-check, lint, typecheck, unit, build, full E2E; `supabase test db` khi có migration.
  Test payload mới/cũ, badge 0/N, thiếu API, lỗi show/badge/receipt độc lập, deep link cùng origin,
  idempotency, không trùng thông báo, token hết hạn/sai target/replay và không lộ secret.
- Push thật không được chứng nhận chỉ bằng browser mock. Giữ source cuối, push/Required CI đúng
  SHA; backup mã hóa và rà migration trước khi áp remote nếu thêm receipt schema. Mutation qua
  Server Action/RPC được validate; không sửa dữ liệu tài chính hoặc dùng tài khoản QA vận hành.
- Preview từ repository root theo runbook; Ready/đúng project/target/sin1, public/Auth/runtime smoke
  trên immutable trước stable alias và hậu kiểm stable. Dùng nhắc thử có nhãn rõ, không ghi dòng
  tiền/nhắc tài chính giả và không gửi sang thiết bị ngoài lượt OWNER nghiệm thu.
- OWNER nghiệm thu trên iPhone Home Screen đúng origin: app đóng và màn hình khóa, nhận banner/
  Notification Center và badge mà chưa mở app, bấm mở đúng app/đích; kiểm tra nhánh fallback trên
  nền tảng hỗ trợ và nhánh SW, lưu rõ điều kiện nào đã kiểm thật và giới hạn không kiểm được.
- Sau Preview đạt và OWNER nghiệm thu: tạo Production candidate, Auth/runtime smoke, promote và
  hậu kiểm hai alias; giữ deployment C121 rollback, xác minh tương thích DB khi quay lại source cũ.
  Kiểm tra tiếp iPhone trên origin Production bằng lượt thử đã thống nhất. Không rollback schema
  hoặc xóa bằng chứng receipt khi chưa có kế hoạch an toàn.
- Chỉ hoàn tất khi đủ gate và nghiệm thu thiết bị; cập nhật context/roadmap/report, dừng checkpoint.
  Không mở rộng thành cam kết Push luôn đúng giờ hoặc xác nhận OS đã hiển thị bằng HTTP 2xx.

## Nguồn kỹ thuật

- [WebKit — Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/):
  fallback khi SW không hiển thị, app_badge, navigate và tương thích nền tảng cũ.
- [WebKit — Badging for Home Screen Web Apps](https://webkit.org/blog/14112/badging-for-home-screen-web-apps/):
  badge trong push handler và quyền hiển thị do người dùng kiểm soát.

OWNER đã phê duyệt phạm vi này; thao tác remote tuân thủ gate và nghiệm thu phía trên.
