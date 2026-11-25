# C122 — Bằng chứng triển khai

Trạng thái: `IN_PROGRESS`, OWNER đã phê duyệt trực tiếp ngày 24/11/2026.

## Thay đổi local

- Payload WebKit declarative có app_badge/navigate/tag, giữ trường legacy trong rollout/rollback.
  Nhắc thường `mutable:false` tránh chạy SW cũ trên iOS hỗ trợ; browser cũ vẫn dùng imperative.
  SW mới xử lý riêng event.notification/data null, không ghi đè đề xuất iOS bằng thông báo chung.
- Hiển thị, badge và receipt độc lập; lỗi một bước không ngăn bước còn lại. URL click chỉ cùng
  origin. Provider accepted khác handler received/completed; DEFERRED khác hiển thị thành công.
- Migration mở rộng push_receipts và subscription app_origin, RPC có phân quyền; receipt capability
  random 256 bit/hash-only, 48 giờ, first-write-wins, ràng buộc target/revision/active profile.
  Retention 30 ngày, không xóa delivery history; schema tương thích source C121.
- Endpoint tối đa 512 byte/3 giây đọc, không Auth/cookie, không CORS wildcard; token ở body,
  invalid/expired/replay không tiết lộ tồn tại. Không lưu nội dung thông báo/endpoint/keys trong receipt.
- Nút kiểm tra gửi sau 20 giây tới đúng subscription của người gọi, giới hạn một probe/phút;
  xác minh SW version trước khi dùng mutable probe. Chỉ ghi metadata, không tạo notification
  tài chính, không đổi trạng thái đọc, giờ nhận hoặc scheduler.

## Gate và phát hiện trong kiểm thử

- Database local source cuối: 617/29 tệp PASS, db lint public/private sạch. Không áp remote.
- Lint/typecheck/build và 145 unit (11 domain + 20 sync + 79 web + 35 scripts) đạt. Prod audit 0
  advisory, full audit giữ 1 moderate dev minimatch, 0 high/critical. CI policy/diff-check đạt.
- Unit mới kiểm tra payload mới/cũ, badge 0/N, URL ngoài origin, lỗi từng tác vụ, WebKit proposed
  notification với data null, schema/giới hạn receipt. Không coi mock là nghiệm thu iPhone.
- Targeted browser lần đầu: endpoint cơ bản đạt, Push event đã gọi receipt nhưng Origin bị từ
  chối do Next Node adapter dùng hostname bind trong request.url. Đã sửa so sánh cả Host thực và
  thêm regression với Origin đúng; chạy lại targeted 2/2 đạt. Không tăng timeout/retry hoặc skip test.
- Lượt gọi root `pnpm test:e2e -- ...` không lọc được file nên đã dừng trước khi coi là full gate;
  dùng filter workspace + Playwright trực tiếp cho targeted. Full gate vẫn phải chạy source cuối.
- Các lượt full gate trước source cuối đã dừng khi bổ sung timeout chẩn đoán và bảo đảm nút
  kiểm tra đủ rộng trên mobile; không tính là PASS. Full E2E source cuối đạt
  `107 PASS / 18 SKIP / 0 FAIL` trên 125 ca trong 27,5 phút, retries 0.

## Remote và nghiệm thu

Backup `qlv-prod-20261124T100208Z` đủ 6 tệp mã hóa, checksum/GCM/SQL-shape đạt; migration history
trong backup đến `20261112130000`. Retention chỉ dry-run, không xóa candidate cũ. Đã re-inspect
Production C121 `dpl_DHfobW9VBsc4BacejizJ1MkDkE8z` và Preview C121
`dpl_FKFHCRhT4czN6pfi9Bpb2NqFu7MV`: đúng target/Ready, giữ làm rollback.

Chưa push, migration remote, deploy hoặc gửi thử trên thiết bị. Production/Preview vẫn C121.
Chưa có bằng chứng iPhone đóng app/khóa màn hình. Chưa xác định được nguyên nhân cuối của sự cố
đã báo; không tuyên bố C122 khắc phục hoàn toàn hoặc Push luôn đúng giờ.
