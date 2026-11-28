# C122 — Bằng chứng triển khai

Trạng thái: `COMPLETED` ngày 28/11/2026; OWNER đã phê duyệt trực tiếp ngày 24/11/2026.

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

Tại mốc lập report ban đầu ngày 24/11, chưa push, migration remote, deploy hoặc gửi thử trên thiết
bị; Production/Preview còn C121 và chưa có bằng chứng iPhone đóng app/khóa màn hình. Trạng thái này
đã được thay thế bởi đối chiếu và nghiệm thu ngày 28/11 bên dưới. Không tuyên bố Push luôn đúng giờ.

### Đối chiếu tiếp ngày 28/11/2026

- Source local đã fast-forward sạch tới `ca88440e776ebf37a54600a05ba3f73a96b5cef5`, trùng
  `origin/main`. Required CI `45569166930` trên đúng SHA đạt. Root Preview gate được chạy lại trên
  source này và đạt full E2E `107 PASS / 18 SKIP / 0 FAIL` trên 125 ca; không tăng timeout/retry/skip.
- Backup mới `qlv-prod-20261128T091217Z` đạt 6 tệp mã hóa, GCM/SQL-shape/checksum và ghi migration
  `20261124100000`; retention chỉ dry-run. Remote migration history đã có C122. Dump schema read-only
  xác nhận `push_receipts`, `app_origin`, `record_push_receipt` và grants C122 hiện hữu; remote db
  lint public/private sạch. Không áp lại migration.
- Đối chiếu Vercel read-only phát hiện remote đã mới hơn context ngày 24/11: stable Preview đang trỏ
  `dpl_4L4iJP2y8EvdsP5cS57vDYknk4iS` tại
  `quan-ly-vay-ca-nhan-47uhkp66o-ngotuong2105.vercel.app` (Preview, Ready, Functions `sin1`, tạo
  25/11/2026); Production đang trỏ `dpl_5YNAdxrxHVuNkgHMuxF8deBFKmxW` tại
  `quan-ly-vay-ca-nhan-ebkiz2f72-ngotuong2105.vercel.app` (Production, Ready, Functions `sin1`, tạo
  26/11/2026). Không tạo candidate hoặc promote trùng.
- Immutable/stable Preview và immutable/alias Production cùng trả root 200, connectivity 204 có
  marker/no-store, CSP nonce không có `script-src 'unsafe-inline'`; `sw.js` ở cả bốn origin có SHA-256
  `1484462a577cb7fc409423a79751bc49d7cb2a46dd465d47f1884bf5e9aba469`, trùng source local.
  Receipt body rỗng trả 400/no-store, không cookie/CORS wildcard. Runtime một giờ kiểm tra không có
  level-error, fatal hoặc HTTP 500.
- Root Preview pipeline lần đầu dừng trước deploy vì pnpm mới tạo metadata `.pnpm-store` trong repo;
  cache đã được chuyển vào `.cache` được upload guard loại trừ. Lượt tiếp theo bị ngắt cùng chat sau
  khi bắt đầu E2E; không có deployment mới. Web server mồ côi được dừng có mục tiêu. Repository sạch.
- Computer-use browser không khả dụng trong chat này nên Auth/device smoke không thể tự thực hiện.
  Trước xác nhận của OWNER, C122 được giữ `IN_PROGRESS` và không suy completion từ public smoke hoặc
  provider accepted. OWNER sau đó đã thực hiện probe Home Screen iPhone và cung cấp bằng chứng bên dưới.
- OWNER xác nhận ngày 28/11/2026 đã thực hiện đúng chuỗi thao tác trên iPhone. Kết quả trong app:
  `Dịch vụ Push đã chấp nhận. Thiết bị đã chạy xử lý nền. Đã để hệ điều hành hiển thị thông báo và
  số trên icon. Kết quả này không xác nhận bạn đã nhìn thấy thông báo.` Bằng chứng này xác nhận
  provider accepted, handler nền đã chạy và nhánh declarative được giao cho hệ điều hành. OWNER sau
  đó xác nhận trực tiếp đủ bốn acceptance: thấy banner/Notification Center, thấy badge trên icon khi
  app đóng và màn hình khóa, chạm thông báo mở đúng app/trang Thông báo. C122 hoàn tất; bằng chứng
  không được diễn giải thành cam kết Push luôn đúng giờ hoặc HTTP receipt chứng minh người dùng đã
  nhìn thấy trong mọi lần gửi.
