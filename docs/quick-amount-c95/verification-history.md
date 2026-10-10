# C95 — Lịch sử kiểm tra

Giữ các lượt thất bại để truy vết; không giảm assertion, timeout, retry hoặc skip hiện hữu.
Log đầy đủ và failure traces chỉ trong ignored `.cache/c95/`, không có dữ liệu thật.

- Baseline source `0aa52ac`: production Chrome, fixture C20-test Minh An1.2845b,
  375/1280×900 Light/Dark; từ principal trống đã focus,50triệu cần8phím số,submit0.
- Unit đầu121PASS. Lint phát hiện setState trực tiếp trong effect; tách trạng thái lỗi vào
  child keyed theo context và xử lý clear ở event. Lượt refactor kế tiếp lỗi syntax do block
  cũ còn sót; sửa đúng block. Lint/typecheck sau sửa đạt, không tắt rule.
- Component lab đầu không tải vì syntax; lượt kế tiếp đạt callback/dirty/focus/reset/bounds.
  Lượt mở rộng có server3195 dừng nên connection refused; mở lại server rồi đạt. Lab dùng
  production React19.2.4 và VndInput/Button/helper thực, không thay dependency hoặc app runtime.
- E2E targeted đầu1PASS/3FAIL: lỗi edit sau overflow; test replay dùng note rỗng thay vì null
  đã normalize; hit-target đo lúc animation scale còn chạy. Sửa replay để trùng payload,
  đợi animation kết thúc trước đo, giữ sàn44px; không sửa animation/layout ngoài C95.
- Targeted thứ hai2PASS/2FAIL: microtask chưa giải quyết lỗi edit; query proof dùng nhầm
  tên bảng financial_transactions. Sửa proof đọc bảng transactions hiện hữu.
- Diagnostic production cho thấy native input capture có raw10000000 nhưng bubble đã trở
  lại100.000.000. Native listener clear lỗi cập nhật controlled input trước React onChange;
  microtask cũng có thể chạy giữa listener. Bỏ listener này; đăng ký clear callback để gọi
  trong React onChange và reset của VndInput. Ca tái hiện giữ trong C95 E2E.
- Targeted thứ ba3PASS/1FAIL: app edit sau overflow đã đúng; test caret dùng Home trên
  macOS không đưa cursor về đầu input. Dùng ArrowLeft từ cuối chuỗi1ký tự, giữ assertion51
  và caret1. Submit/retry/pending/idempotency/reset và12responsive states đã đạt.
- Lab cuối mở rộng đạt số16digit vượt Number và17digit thật, max signed-bigint inclusive/
  reject, callback đúng1lần, native formreset về default và callback, invalid draft giữ,
  formatted paste handler cộng thao tác chèn mặc định mô phỏng. Không coi paste mô phỏng
  là chứng nhận clipboard/bàn phím native trên điện thoại.

- Visual/draft gate trên source cuối2PASS2.8m: ca draft/keyboard/reset giữ đầy đủ assertion;
  Evon Light/Dark7widths nguyên rules,0mục máy xếp Hỏng. Focus/native picker warnings giữ
  theo thiết kế đã duyệt, không gỡ focus ring hoặc thay native controls.

- Artifact comparison QA đầu lỗi scope biến browser-side trong harness; truyền width
  vào evaluate làm tham số. Lượt cuối4states/8images đạt, không sửa sản phẩm để chiều harness.

- Full cuối73PASS18SKIP0FAIL14.2m,retries0;4C95 đều đạt,30observations lưu. Lint/typecheck/
  unit121/rootbuild PASS,17C75exact/15generatedrestored,130websrcfreeze giữ, fixture6counts0.
  Secret scoped pinned v8.30.1 redacted0findings. Full server log destination-stream-closed-early
  cũng có ở baselineC94; không gọi toànapp runtimeerrors0.

Gates chốt và giới hạn ở report; không lấy lượt thất bại hoặc historical gate làm PASS hiện tại.
